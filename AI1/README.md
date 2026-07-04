# AI Grading Microservice

An AI-powered condition grading service for product returns. A customer (or a returns-desk
operator) photographs a returned item; the service validates the photos are actually usable,
sends them to a vision-language model against an explicit, auditable rubric, applies deterministic
business rules on top of whatever the model says, and returns a defensible grade (`A+` … `F`) with
a full damage list, a numeric condition score, a confidence rating, and a complete audit trail —
every image, every raw model response, every rule that fired, all retrievable later.

It exists to answer, for every single graded return: **"why did the system say this?"** — with a
real, reproducible answer, not "the AI said so."

---

## 1. What this actually does, end to end

1. A customer uploads photos of a returned item (front/back/left/right/top/bottom, plus optional
   close-ups) along with the return reason and any notes.
2. The service checks — **before spending a cent on AI** — that the photos are actually usable:
   correct file types, not corrupted, not too blurry/dark/bright/low-contrast/low-resolution, and
   not duplicates of each other (someone submitting the same photo as "front" and "back").
3. Photos that pass are archived to S3 in three variants (original, a downscaled version for the
   AI, and a thumbnail); photos that fail are archived too, under `rejected/`, so a customer
   appeal ("your system said my photo was blurry, it wasn't") has evidence to check.
4. The service asks a vision-language model (Gemini, primary) to assess the item strictly against
   a written rubric — not "grade this," but "here is exactly what A+ through F mean, point to what
   you actually see." If Gemini is unavailable, over quota, or returns something unusable, the
   service automatically and transparently falls back to a second model (Gemma) — repairing minor
   formatting problems locally first, so a stray markdown fence doesn't waste an expensive retry or
   silently switch which model graded the item.
5. The model's raw output is **never** trusted as the final word. Deterministic code applies hard
   business rules on top of it: certain damage types force a grade ceiling regardless of what the
   model said (water damage always caps to F, a high-severity crack always caps to D, and so on),
   a numeric `overallScore` is computed from a weighted damage table (not invented by the model),
   and a confidence score is computed as the *weakest* link across every component, not an average
   — so one uncertain damage detection can't be diluted by nine confident ones.
6. The customer polls a status endpoint and, once complete, retrieves the final report plus
   presigned, time-limited URLs to every photo.

The guiding principle behind every design decision here: **the model perceives, the code decides.**
The model's job is to look at photos and describe what's there. Every judgment call that has real
business consequences — what grade that damage deserves, whether a photo is good enough to trust,
whether two models disagree meaningfully — is deterministic, testable TypeScript, not a prompt.

---

## 2. Architecture

```
Client → POST /grade (fast, synchronous structural + quality + duplicate checks)
              │
              ├─ fail  → status=FAILED, rejected images archived to S3, 202 response with reason
              └─ pass  → images uploaded (original/analysis/thumb variants), status=VALIDATED
                              │
                              ▼ (async — in-process today, a one-line swap to an SQS consumer later)
                         status=ANALYZING
                              │
                         FallbackOrchestrator: Gemini (primary)
                              │  ├─ repair ladder (fence-strip → extract last JSON object → coerce
                              │  │   types → one re-prompt with the model's own validation errors)
                              │  ├─ sanity checks (does the grade match the damage list? does every
                              │  │   damage reference a view that was actually uploaded?)
                              │  └─ circuit breaker (skip Gemini entirely after N consecutive
                              │      failures, for a cooldown window, instead of paying a timeout
                              │      on every request during a real outage)
                              │
                              ▼ on quota/outage/bad-output only (never on a formatting hiccup)
                         Gemma (fallback) — same repair ladder, same sanity checks
                              │
                         applyGradingRules():
                              │  ├─ grade caps (business rules the model isn't trusted with)
                              │  ├─ overallScore (weighted damage table + hard ceilings for
                              │  │   catastrophic damage — see §5)
                              │  ├─ overallConfidence (min of every component, × image quality)
                              │  └─ grade↔score consistency check (diagnostic, logs — never
                              │      auto-corrects; see §5)
                              │
                         status=GRADED → status=COMPLETED

Client polls GET /status/:id, then GET /result/:id for the final report + fresh presigned image
URLs. A sweeper daemon marks anything stuck in ANALYZING past a threshold as FAILED, so a crashed
worker can't leave a request polling forever.
```

**One schema, one choke point.** `src/schemas/grading-report.schema.ts` is the single source of
truth for what the model must return. It drives Gemini's constrained-decoding `responseSchema`,
validates every raw model response in the repair layer, and types everything downstream. A
malformed model response can never reach a customer — see `services/ai/repair.ts`.

---

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20+, TypeScript (strict mode) | Type safety through the whole pipeline, no `any` |
| HTTP framework | Fastify | Fast multipart handling, native schema hooks |
| Validation | Zod | One schema definition, three consumers (requests, env, AI output) |
| Image processing | Sharp | Prebuilt binaries — no OpenCV toolchain, small Docker images |
| Perceptual hashing | sharp-phash | DCT-based, survives re-compression/minor crops (unlike dHash) |
| Vision AI | Google Gemini (primary) + Gemma (fallback) | `@google/generative-ai` SDK |
| Object storage | AWS S3 | Presigned URLs only, private bucket |
| Database | AWS DynamoDB | Single-table design, conditional writes for state-machine safety |
| Logging | Pino | Structured JSON logs, request-scoped child loggers |
| Testing | Vitest | Fast, native ESM/TS support |

---

## 4. Project layout

```
src/
├── config/            env loading + Zod validation, category/view rules, quality & duplicate
│                       thresholds (with reasoning comments, not magic numbers)
├── api/
│   ├── routes/         route registration
│   ├── controllers/     request/response handling — grade, quality-check, status, result
│   └── middleware/      request-id propagation, centralized error handling
├── services/
│   ├── intake/          structural validation, idempotency store, per-customer rate limiting
│   ├── validation/       image quality (blur/brightness/contrast/resolution/integrity) +
│   │                     duplicate detection (perceptual hashing)
│   ├── storage/          S3 wrapper — original/analysis/thumbnail variants, presigned URLs
│   ├── db/               DynamoDB repository — conditional-write state machine, status history
│   ├── ai/                prompt builder, Gemini/Gemma clients, thought-part extraction, the
│   │                      repair ladder, semantic sanity checks, circuit breaker, the fallback
│   │                      orchestrator that ties them all together
│   └── grading/           the deterministic rules engine (grade caps, damage-weighted scoring,
│                           score ceilings, confidence aggregation, grade↔score consistency
│                           checks), the async pipeline, the stuck-request sweeper
├── schemas/          Zod schemas — the single source of truth for every data shape in the system
└── utils/            structured logger, typed error hierarchy
tests/
├── fixtures/images/          synthetic fixture images (deterministically generated — blurry,
│                              dark, bright, low-contrast, low-res, corrupted, rotated, duplicate
│                              pairs) plus a script to regenerate them
├── fixtures/model-outputs/   a growing corpus of real malformed-model-output shapes for the
│                              repair layer (fenced JSON, prose-wrapped, truncated, string-typed
│                              numbers, out-of-range values, bad bounding boxes)
├── services/                 unit tests, one directory per service area
├── intake.test.ts            full HTTP round-trip tests via Fastify's inject
└── integration/              tests against local DynamoDB/MinIO — skip cleanly without Docker
scripts/
├── local-setup.ts     creates the DynamoDB table (PK/SK + GSI1/GSI2) — works against local
│                       Docker infra or real AWS, same script either way
docker-compose.yml      local DynamoDB + MinIO (S3-compatible) for offline development
Dockerfile              multi-stage: dev (hot reload) / build / runtime (slim, non-root)
```

---

## 5. The deterministic grading engine, in detail

This is the part of the system actually responsible for the "trustworthy" claim, so it's worth
explaining properly rather than leaving it as a black box.

**Grade caps** (`services/grading/rules.ts`) — hard business rules the model is never trusted to
apply itself: water damage of any severity caps the grade to F; a high-severity crack caps to D;
tampering or signs of repair cap to D; a customer-reported functional issue caps to C; image
quality below 0.7 caps to B (can't certify what you can't clearly see). Every cap that actually
fires is recorded in `capReasons`, alongside the model's original, uncapped grade in `rawGrade` —
so you can always see both what the model said and what the business rules did about it.

**Damage-weighted scoring** (`services/grading/scoring.ts`, `damageTable.ts`) — `overallScore` is
computed from a table of per-damage-type weights × severity multipliers, never taken from the
model. This was real-world tested and found wanting: an item with a fully shattered screen (graded
F, "Unusable" by the model) initially scored **82/100** under pure additive deduction — a
contradictory result nobody should ship. The fix was **score ceilings**: certain catastrophic
damage types (a high-severity crack, water damage, tampering) now hard-cap the score after the
additive pass, the same way grade caps work, so one severe defect can't be diluted by an otherwise
clean item. Re-tested against the same real photo: the score dropped to **35/100**, correctly
consistent with the F grade. `scoreCeilingApplied` and `ceilingReasons` record exactly which
ceiling fired and why — same audit-trail philosophy as grade caps.

**Grade↔score consistency bands** — a diagnostic invariant added after the mismatch above: every
final grade has an expected score range (F → 0-35, A+ → 95-100, etc.). If a report ever produces a
grade and score that don't agree, it's logged as a structured `GRADE_SCORE_MISMATCH` warning
(`gradeScoreMismatch: true` on the report) — **not auto-corrected**, because forcing agreement
would hide real mistuning instead of surfacing it. Every mismatch is free calibration data for the
next tuning pass.

**Confidence aggregation** (`services/grading/confidence.ts`) — `overallConfidence` is the
*minimum* of the model's stated confidence, every individual damage's confidence, and the image
quality score — multiplied together, not averaged. One weak, uncertain damage detection drags the
whole report's confidence down, because the grade depends on it. Below a floor (0.65),
`requiresHumanReview` is set — an honest "this needs a human" beats a confident wrong grade.

**Calibration status, honestly:** the weight table and thresholds above are reasoned starting
points, not a full calibration — that requires a golden set of 30-50 real, human-graded items,
which this project doesn't have yet. What it does have is one real, adversarially-tested example
(the cracked-phone case above) that already caught and fixed a genuine scoring bug. Every image
quality score and duplicate-pair distance is logged in production specifically so this calibration
can happen from real data later (see §9).

---

## 6. Setup

### Local, no AWS account needed (structural/quality testing only)

```bash
npm install
cp .env.example .env

docker compose up -d dynamodb-local minio minio-init
npx tsx scripts/local-setup.ts      # creates the DynamoDB table + GSIs

npm run build
npm test           # full suite — integration tests auto-skip cleanly without Docker
npm run dev         # hot-reload dev server on :3000
```

### Against real AWS + real AI (full functionality)

1. Create a dedicated IAM user with a policy scoped to exactly one S3 bucket and one DynamoDB
   table (see `.env.example` for the exact env vars needed) — never reuse credentials from another
   project's AWS account.
2. Create the S3 bucket yourself (bucket names are globally unique, so this can't be automated
   blindly); run `npx tsx scripts/local-setup.ts` against real AWS to create the DynamoDB table.
3. Get a `GEMINI_API_KEY` from Google AI Studio. **Free tier is capped at ~20 requests/day per
   model** — this is a real operational constraint, not a bug; verified directly against Google's
   API during development. Budget for billing before any real usage volume.
4. Fill in `.env` with all of the above, leave `S3_ENDPOINT`/`DYNAMODB_ENDPOINT` blank (those are
   only for the local Docker path), then `npm run build && node dist/server.js`.
5. **Restart the process after any `.env` change** — config and the AI client singletons are only
   read once, at process startup, not per-request.

---

## 7. Environment variables

See `.env.example` for the full, current, commented list — server limits, AWS credentials/region/
bucket/table names, Gemini/Gemma API keys and model names, model call timeout, circuit-breaker
threshold/cooldown, and sweeper interval/stuck-threshold. Every variable is validated at boot via
Zod (`src/config/config.ts`) — the process refuses to start with a clear error rather than booting
into a broken state and failing on the first request.

---

## 8. API reference

### `POST /grade` — multipart/form-data

| Field | Type | Notes |
|---|---|---|
| `front`, `back`, `left`, `right`, `top`, `bottom` | file | Category-dependent required set |
| `closeup_1`…`closeup_6` | file | Optional |
| `customerId` | string | Required, 1–128 chars |
| `sku` | string | Optional |
| `category` | enum | `electronics`, `apparel`, `books`, `home`, `toys`, `sports`, `other` |
| `returnReason` | string | Required |
| `customerNotes` | string | Optional, max 2000 chars — treated as **untrusted**: can report a hidden functional issue the photos can't show, can never improve the grade, sanitized against prompt-injection |
| `idempotencyKey` | string | Optional, 8–128 chars — replays the same `requestId` within 24h instead of double-grading |

Required views by category: `electronics`/`home`/`toys`/`sports`/`other` need all six angles;
`books`/`apparel` need only `front`+`back`.

Returns `202 { success, requestId, status }` immediately after synchronous structural + image
quality + duplicate checks — the customer hears about a blurry photo right away, not after
polling. If those checks fail, `status` is already `FAILED` with a `failureReason`. Otherwise
`status` is `VALIDATED` and AI grading proceeds in the background.

```bash
curl -X POST http://localhost:3000/grade \
  -F "front=@front.jpg" -F "back=@back.jpg" -F "left=@left.jpg" \
  -F "right=@right.jpg" -F "top=@top.jpg" -F "bottom=@bottom.jpg" \
  -F "customerId=cust-001" -F "category=electronics" \
  -F "returnReason=Screen flickering" -F "customerNotes=Charging is slow"
```

### `POST /quality-check` — same validation, no AI, nothing persisted

Lets a frontend pre-validate photos as the customer selects them, so bad photos get fixed *before*
the customer ever hits submit.

### `GET /status/:id`

```json
{ "success": true, "requestId": "...", "status": "ANALYZING", "progress": 60, "statusHistory": [...] }
```

Status machine: `UPLOADED → VALIDATED → ANALYZING → GRADED → COMPLETED`, with `FAILED` reachable
from any state.

### `GET /result/:id`

Once `COMPLETED`:

```json
{
  "success": true,
  "requestId": "...",
  "status": "COMPLETED",
  "report": {
    "grade": "F", "rawGrade": "F", "condition": "Unusable",
    "damages": [ { "type": "crack", "view": "FRONT", "severity": "High", "confidence": 1, "source": "visual", "description": "..." } ],
    "overallScore": 35, "scoreCeilingApplied": true,
    "ceilingReasons": [ { "type": "crack", "severity": "High", "ceiling": 35 } ],
    "gradeCapApplied": false, "capReasons": [],
    "overallConfidence": 0.665, "requiresHumanReview": false,
    "gradeScoreMismatch": false, "modelUsed": "gemini"
  },
  "images": [ { "view": "front", "originalUrl": "https://...", "thumbnailUrl": "https://..." } ]
}
```

Image URLs are presigned fresh on every read (never stored — they expire).

### `GET /health` / `GET /ready`

`/health` = the process is up. `/ready` = S3 and DynamoDB are actually reachable (503 otherwise) —
point a load balancer's readiness probe at `/ready`, not `/health`, so traffic never routes to an
instance that can't reach its dependencies.

### Error envelope

```json
{ "success": false, "error": { "code": "MISSING_REQUIRED_VIEWS", "message": "...", "details": {} } }
```

See `src/utils/errors.ts` for the full `ErrorCode` union.

---

## 9. Testing

- **Unit** (`tests/services/**`): image quality and duplicate detection against real synthetic
  fixture images; the repair ladder against a corpus of real malformed-model-output shapes;
  grading rules/scoring/confidence including the score-ceiling regression case; the fallback
  orchestrator's every branch (quota error, timeout, bad output, circuit-breaker open) via fake
  clients — no real API calls, no cost.
- **Intake** (`tests/intake.test.ts`): full HTTP round-trip via `fastify.inject` against real
  multipart payloads.
- **Integration** (`tests/integration/storage.test.ts`): the DynamoDB conditional-write state
  machine and S3 round-trip against local Docker infra — skips cleanly (not a failure) without it.
- **Real-world validation** (not an automated suite — see §10): the system has been run
  end-to-end, for real, against actual damaged-phone photos, real AWS, and a real Gemini call.

```bash
npm test                 # everything — currently 99 passing
npm run test:coverage
npx tsx tests/fixtures/images/generate-fixtures.ts   # regenerate synthetic fixtures
```

**Golden set — not yet built.** A real accuracy regression suite needs 30-50 real product photos
with human-assigned ground-truth grades, run through the full pipeline to measure exact-grade and
within-one-grade match rates, and run against both Gemini and Gemma to quantify how much they
disagree. This is the thing that actually tells you whether a prompt change improved accuracy or
just felt like it should have.

---

## 10. Real-world validation — what's actually been proven, not just written

Everything above is design intent until it's been run against reality. Here's what has:

- **Real AWS.** A dedicated IAM user, S3 bucket, and DynamoDB table were provisioned (not reused
  from another project) and verified reachable end-to-end via `/ready`.
- **A real Gemini call, on a real damaged phone.** Four real photos (shattered screen, scuffed
  back panel, one side view) were submitted through the actual `/grade` → `/status` → `/result`
  flow. The system correctly identified a High-severity crack and Moderate scratches, and returned
  `grade: F`, `condition: Unusable`.
- **Two real production bugs were found and fixed by this test, not by inspection:**
  1. *Score/grade contradiction* — the item above initially scored `82/100` while graded F. Root
     cause and fix are described in §5. Re-verified on the same photos afterward: `35/100`,
     consistent.
  2. *Gemma silently reading its own reasoning as the answer* — the Gemini SDK's `response.text()`
     concatenates every response part, including ones the API explicitly flags `"thought": true"`
     for reasoning models. Gemma's output looked like unstructured prose-wrapped JSON; it was
     actually structured correctly, just misread. Fixed by extracting only non-thought parts at
     the source (`services/ai/clients/extractFinalText.ts`). Re-verified: Gemma now returns
     schema-valid JSON on the first attempt, no repair or re-prompt needed.
- **The fallback orchestrator was proven against two genuine real-world failures**, not mocks:
  once when the Gemini API key hit its actual daily quota (`429 RESOURCE_EXHAUSTED`), once when
  Gemma itself returned a real `500` from Google's backend. Both times the system fell back
  correctly and either graded successfully on the fallback or failed the request honestly with a
  clear reason — never a silent wrong answer.

---

## 11. Known limitations — the honest current-state list

Not bugs — known gaps, listed so nobody discovers them the hard way:

1. **Frontend is not wired up.** The AI-grading UI already exists in the frontend
   (`AiGrading.jsx`, `GuidedPhotoCapture.jsx`) but currently reads from a mock API with hardcoded
   fake grades, not this service. Needs the mock calls replaced with real ones, plus CORS enabled
   on this service (currently not configured at all).
2. **Gemini free-tier quota (~20 req/day/model) is a real constraint**, not a code problem —
   needs a billing decision before any meaningful usage volume.
3. **Gemma is reliable at the JSON level now, but still slow** (47-100+ seconds per call) and has
   shown a transient server-side `500` — fine as an occasional fallback, not ideal as a primary.
4. **Calibration is thin** — one real photo set has been tested; the weight table has 12 damage
   types and only 2 have been exercised against real data.
5. **Docker build has not actually been run** in this development environment (Docker wasn't
   available) — the Dockerfile exists and follows the multi-stage pattern described in §12, but
   verify it builds before relying on it for deployment.
6. **Not deployed anywhere** — only ever run locally via `node dist/server.js`.
7. **Rate limiter and idempotency store are in-memory** — correct for a single instance, silently
   incorrect the moment you run more than one instance or restart mid-window.

---

## 12. Deployment

- `Dockerfile` is multi-stage: `dev` (hot reload, used by `docker-compose.yml`), `build` (compiles
  + prunes dev deps), `runtime` (slim `node:20-slim`, non-root `node` user). Sharp ships prebuilt
  binaries for this platform, so no native toolchain is needed in the runtime image.
- Graceful shutdown on `SIGTERM`/`SIGINT`: stops the sweeper, lets `app.close()` drain in-flight
  requests before exiting — deploys won't strand `ANALYZING` requests.
- All config via env vars; never bake secrets into the image.
- The async AI-analysis phase is a standalone function of just `requestId`
  (`services/grading/pipeline.ts: processRequest`), invoked in-process via `setImmediate` today.
  Swapping to an SQS consumer for real production scale is a call-site change, not a rewrite — do
  this before a spike of concurrent returns would otherwise stampede your Gemini quota.

---

## 13. Security notes

- `.env` is git-ignored. Never commit real AWS/Gemini credentials — rotate immediately if one ever
  leaks into a commit, log, or chat transcript.
- Customer notes are treated as untrusted input: sanitized against prompt-injection patterns
  before reaching the model, and structurally incapable of improving a grade
  (`sanitizeCustomerNotes` in `services/ai/promptBuilder.ts`).
- Rate limiting is per-`customerId` — Gemini calls are the dominant cost; this stops one client
  from draining quota for everyone else.
- The AWS IAM user backing this service should be scoped to exactly one S3 bucket and one
  DynamoDB table, never broader account access — this was set up deliberately during development
  specifically to avoid any blast radius into other systems sharing the same AWS account.

---

## 14. Roadmap (in rough priority order)

1. Wire the frontend to this service; add CORS.
2. Decide on Gemini billing / quota strategy for real usage.
3. Build the 30-50 item golden set and run the accuracy regression suite it enables.
4. Verify the Docker build; deploy somewhere real (Render for a demo, ECS + SQS for production
   scale).
5. Move rate limiting / idempotency to a shared store (DynamoDB or Redis) before running more than
   one instance.
