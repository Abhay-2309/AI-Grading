# Amazon Returns & Grading Platform

A simulated end-to-end Amazon logistics platform: a customer returns an item, an AI
vision model grades its condition from real photos, a pickup agent verifies it in the
field, a fraud/ops console reconciles disagreements and routes inventory, and the item
flows onward into a peer-to-peer resale marketplace or an NGO donation pipeline. Built
as three independent services wired together into one working system.

---

## 1. Architecture

```
┌──────────────┐   fetch (JSON + multipart)   ┌──────────────┐   server-to-server   ┌──────────────┐
│   Frontend   │ ────────────────────────────▶│   Backend    │ ────────────────────▶│     AI1      │
│  React/Vite  │◀──────────────────────────── │ Express/     │◀──────────────────── │  Fastify/TS  │
│  :5173       │        JSON responses         │ Prisma       │   JSON (grade proxy)  │  :3000       │
└──────────────┘                               │ :5000        │                       └──────┬───────┘
                                                └──────┬───────┘                              │
                                                       │                                       │
                                                       ▼                                       ▼
                                                ┌──────────────┐                       ┌───────────────┐
                                                │  Postgres    │                       │ Gemini/Gemma  │
                                                │  (Supabase)  │                       │ + S3 + DynamoDB│
                                                └──────────────┘                       └───────────────┘
```

- **Frontend never talks to AI1 directly.** All AI grading requests go
  `Frontend → Backend → AI1`, so AI1 needs no CORS configuration and Backend is the one
  authoritative place that persists a grading result back onto a `Return` row.
- **Backend is the single source of truth** for everything except the live AI grading
  report itself (which is fetched fresh from AI1 on demand — presigned S3 URLs expire,
  so they're never cached in Postgres).
- All three services run as independent local dev processes; there is no shared
  process manager. Start them in any order — each one tolerates the others being down
  (Backend's grading routes will 502 if AI1 is unreachable; Frontend will show empty
  lists / console errors if Backend is unreachable, but won't crash).

---

## 2. The three services

### Frontend — `Frontend/`

React 19 + Vite 8 + Tailwind 4. A single-page app (no router — pure client-side state
machine in `App.jsx`) presenting **seven portals** from one gateway screen:

| Portal | Purpose |
|---|---|
| **Customer Portal** | Return an item: pick a reason → upload real photos per required angle → AI grades it live → confirm & get a refund estimate + QR drop-off code. |
| **Pickup Agent** | Field app: see today's pickups, verify an item against the AI's stage-1 grade, flag disagreements to manual review, end-of-shift accuracy summary. |
| **Operations Hub (FraudGuard)** | Manual review queue, AI-vs-agent disagreement analysis, account risk scoring, product routing board, agent leaderboard. |
| **Fitting & Try-On** | Virtual try-on + shoe size finder (return-prevention tools, no backend). |
| **MarketConnect (P2P Market)** | Peer-to-peer resale marketplace for graded returns — browse, sell, message sellers. |
| **MarketConnect Cares (Donations)** | Donate returned items to NGO campaigns, earn Green Credits, redeem them for marketplace perks. |
| **NGO Dashboard** | NGO-side console to post new needs and track fulfillment. |

`src/services/api.js` is the single data layer — a `useGlobalState()` hook that fetches
from Backend on mount and exposes read state + mutation functions to every page,
mirroring the shape of the old (now-deleted) `mockApi.js` so the migration didn't
require touching most page components.

Run: `npm install && npm run dev` → **http://localhost:5173**
Config: `.env.local` → `VITE_API_BASE_URL=http://localhost:5000`

### Backend — `Backend/`

Express + Prisma + PostgreSQL (hosted on Supabase). Owns every piece of app state
*except* the live AI grading report: returns, P2P listings/chats, NGO campaigns,
donation history, green credits, the agent leaderboard.

```
Backend/
├── server.js              Express app, CORS, route mounting
├── db.js                  Prisma client singleton
├── routes/
│   ├── returns.js          GET/PUT /api/returns, POST /api/returns/submit
│   ├── p2p.js              /api/p2p/products, /api/p2p/chats(/:id/messages)
│   ├── donations.js        /api/donations/campaigns, /donate, /redeem
│   ├── profile.js          /api/profile, /api/profile/leaderboard
│   └── grading.js          /api/grading/:returnId/{submit,status,result} — proxies AI1
└── prisma/
    ├── schema.prisma        Profile, Return, P2pProduct, P2pChat, P2pMessage,
    │                        NgoCampaign, DonationHistory, Leaderboard
    └── seed.js               Seeds all of the above with demo data
```

Run: `npm install && npx prisma generate && npm run dev` → **http://localhost:5000**
Config (`.env`):
```
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres?schema=public"
PORT=5000
AI1_BASE_URL=http://localhost:3000
```

**Supabase gotcha:** use the **connection pooler** string (Project Settings → Database
→ Connection pooling → *Session mode*, port 5432), not the direct `db.<ref>.supabase.co`
host. The direct host is **IPv6-only** — if your network doesn't have working outbound
IPv6 (common on many home/mobile networks), every query fails with
`Can't reach database server`, even though the project is perfectly healthy. The pooler
host is dual-stack and works over plain IPv4.

There's no auth layer — every request operates as a single hardcoded demo user
(`Profile.id = '00000000-0000-0000-0000-000000000001'`), matching the single-user
nature of the whole simulation.

### AI1 — `AI1/`

Fastify + TypeScript microservice that actually grades photos. Fully documented in
[`AI1/README.md`](AI1/README.md) — the short version:

1. `POST /grade` (multipart: photos + category/reason/notes) — validates image
   quality and duplicate photos *before* spending anything on AI, archives images to
   S3, kicks off async grading, returns immediately with a `requestId`.
2. Vision model (**Gemini primary, Gemma fallback**) assesses the photos against an
   explicit rubric — grade, damage list, confidence, image quality.
3. A deterministic rules engine sits on top of the raw model output: certain damage
   types force a grade ceiling (water damage → always F, high-severity crack → always
   D, etc.), the numeric score comes from a weighted damage table (not the model),
   and confidence is the *minimum* across every component, not an average.
4. `GET /status/:id` for polling, `GET /result/:id` for the final report + fresh
   presigned image URLs.

Run: `npm install && npm run build && node dist/server.js` (or `npm run dev` for
hot-reload) → **http://localhost:3000**. Needs real AWS (S3 + DynamoDB) and
Gemini/Gemma API key credentials in `.env` — see `AI1/.env.example`.

**Known constraint:** Gemini's free tier caps out around **20 requests/day**. Once
exhausted, AI1 automatically falls back to Gemma, which is markedly slower (47–100s+
per call) and has shown transient server-side 500s/timeouts. Both are handled
gracefully end-to-end (Backend surfaces a real `FAILED` status with a reason;
Frontend shows a retry banner) — it's a cost/quota reality, not a bug.

---

## 3. Running everything locally

Three terminals, any order:

```bash
# Terminal 1
cd AI1 && npm install && npm run dev

# Terminal 2
cd Backend && npm install && npx prisma generate && npm run dev

# Terminal 3
cd Frontend && npm install && npm run dev
```

Then open **http://localhost:5173**. First-time setup also needs, once:
```bash
cd Backend && npx prisma db push && node prisma/seed.js
```

If Backend won't start with `EADDRINUSE: address already in use :::5000`, something
(possibly a previous `npm run dev` you or a tool left running) is already bound to
port 5000 — find and stop it (`netstat -ano | grep :5000` on Windows, then
`taskkill //F //PID <pid>`) rather than picking a different port, since Frontend's
`VITE_API_BASE_URL` and CORS are both pinned to `:5000`.

---

## 4. Data flow: a return, end to end

1. **Customer Portal → Return Reason**: pick why you're returning the item.
2. **Photo Evidence**: upload real photos for every angle the item's category
   requires (front+back only for apparel/books; all six — front/back/left/right/
   top/bottom — for everything else). Submitting calls
   `POST /api/grading/:returnId/submit` on Backend, which forwards the files +
   metadata to AI1's `POST /grade`.
3. Backend stores the returned `requestId` on the `Return` row and the Frontend
   polls `GET /api/grading/:returnId/status` every ~2.5s.
4. On `COMPLETED`, Frontend calls `GET /api/grading/:returnId/result`. Backend
   proxies AI1's full report back to the client **and** simultaneously writes a
   summary (`userGrade`, `userConfidence`, `defects`) onto the `Return` row, so
   every other portal reading that same row (Pickup Agent, Ops Hub) sees a
   consistent grade.
5. **AI Grading page** renders the real report: grade, condition, damage list with
   bounding-box markers on the actual uploaded photos, confidence, and an estimated
   refund derived from the AI's `overallScore` (`max(50%, score/100)` of item price).
6. **Confirm & Submit** → `POST /api/returns/submit` finalizes the return
   (status → `Pending`, carries the grade/defects along).
7. From here the item continues through **Pickup Agent** (field verification, with
   a real disagreement/conflict path if the agent's assessment differs meaningfully
   from the AI's) and **Operations Hub** (manual review, risk scoring, routing to
   restock / refurbish / MarketConnect / donation).

---

## 5. What's real vs. what's deliberately static

Everything data-driven — every list, form submission, and status change across all
seven portals — round-trips through Backend to Postgres, or through Backend to AI1
for grading. Nothing reads from `localStorage` or hardcoded mock arrays anymore.

A few things are intentionally left as static UI chrome rather than backed by real
models, because there's no real signal for them to represent yet:
- **Leaderboard** decorative stat cards, accuracy histogram, and calibration alerts
  (the actual rankings table *is* real, from `GET /api/profile/leaderboard`).
- **Ops Hub** account-history sparkline, "Estimated Fraud Loss," and similar
  illustrative panels on the disagreement-analysis screen.
- **Return-prevention tools** (Virtual Try-On, Shoe Size Finder) — standalone demos,
  no backend by design.

---

## 6. Known issues

- **Supabase pooler transient drops.** Occasionally (observed a couple of times
  during development, generally after the machine had been idle) Backend's Postgres
  connection blips for a few seconds with `Can't reach database server` before
  recovering on its own — Prisma reconnects automatically on the next query. If you
  see this, it's transient; no action needed unless it persists.
- **Gemini daily quota.** See §2/AI1 above — expect Gemma fallback (slow, sometimes
  flaky) once the day's Gemini quota is used up.
- **`DonationFlow.jsx` confirmation screen** has a pre-existing CSS layout bug (the
  success card renders in an unexpectedly narrow column). The data behind it is
  correct; only the layout is off.
- **Rate limiting / idempotency in AI1 are in-memory** — fine for a single instance,
  won't survive a restart or multiple instances (documented in `AI1/README.md`).
