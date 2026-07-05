# Amazon Returns & AI Grading Platform — PPT Diagrams

---

## 0. Complete Solution Flow — The Whole Story in One Diagram

> Use this one as the "Our Solution" / "How We Solve This" slide — it's the narrative flow, not the tech stack. The detailed technical diagrams below back it up.

```mermaid
flowchart TB
    subgraph ENTRY["Three People This Has To Work For"]
        direction LR
        BUY["🛍️ Shopper<br/>wants safe, honest pre-owned items"]
        SELL["📦 Returner / Seller<br/>wants an easy return or fair resale"]
        AMZ["🏢 Amazon<br/>wants lower cost + recovered value"]
    end

    SELL --> TRY

    subgraph PREVENT["Step 0 — Prevent It Before It Happens"]
        TRY["👗 Virtual Try-On +<br/>Shoe Size Finder"]
        NUDGE["📊 Your Own Return-Risk<br/>shown before you buy"]
        TRY --> NUDGE
    end

    NUDGE --> REASON

    subgraph CAPTURE["Step 1 — Guided Capture"]
        REASON["Select Return Reason"]
        SUBCAT["Select Item Type"]
        PHOTOS["📸 Guided Photos<br/>(exact angles, per category)"]
        REASON --> SUBCAT --> PHOTOS
    end

    PHOTOS --> AI

    subgraph GRADE["Step 2 — Instant AI Grade"]
        AI["🤖 AI Vision Grading<br/>Gemini → Gemma fallback"]
        CONF["Grade + Confidence Score<br/>+ Refund Estimate"]
        AI --> CONF
    end

    CONF --> AGENT

    subgraph VERIFY["Step 3 — Field Verification"]
        AGENT["🚚 Pickup Agent<br/>checks the real item in person"]
        MATCH{"Matches<br/>the AI?"}
        AGENT --> MATCH
    end

    subgraph DISPUTE["Step 4 — Resolve Disagreements"]
        HUB["🛡️ Operations Hub<br/>AI read vs Agent read, side-by-side"]
        DECIDE["Approve / Deny / Escalate"]
        HUB --> DECIDE
    end

    RISK["🛡️ Quiet Return-Risk Trust Score<br/>watches account patterns in background"]
    RISK -.-> HUB

    MATCH -->|Agrees| ROUTEDECISION
    MATCH -->|Disagrees| HUB
    DECIDE --> ROUTEDECISION

    subgraph ROUTE["Step 5 — Nothing Graded Ever Just Sits There"]
        ROUTEDECISION{"Route by Grade"}
        RESTOCK["♻️ Restock — Like New"]
        REFURB["🔧 Refurbish & Resell"]
        MARKET["🛒 MarketConnect — P2P Resale"]
        DONATE["💚 Cares Portal — NGO Donation"]
        ROUTEDECISION --> RESTOCK
        ROUTEDECISION --> REFURB
        ROUTEDECISION --> MARKET
        ROUTEDECISION --> DONATE
    end

    subgraph VALUE["Value Flows Back to Everyone"]
        REFUND["💰 Fast, Honest Refund"]
        CREDITS["🌱 Green Credits"]
        SAVINGS["📉 Lower Cost + Recovered<br/>Revenue + Real Sustainability"]
    end

    DECIDE --> REFUND
    MARKET --> CREDITS
    DONATE --> CREDITS
    MARKET --> BUY
    RESTOCK --> SAVINGS
    REFURB --> SAVINGS
    REFUND --> SELL
    CREDITS --> SELL
    SAVINGS --> AMZ

    style ENTRY fill:#232F3E,stroke:#FF9900,color:#fff
    style BUY fill:#0073BB,stroke:#333,color:#fff
    style SELL fill:#FF9900,stroke:#333,color:#000
    style AMZ fill:#131A22,stroke:#FF9900,color:#fff
    style AI fill:#8E24AA,stroke:#333,color:#fff
    style HUB fill:#DD2C00,stroke:#333,color:#fff
    style MATCH fill:#FFC107,stroke:#333,color:#000
    style ROUTEDECISION fill:#FFC107,stroke:#333,color:#000
    style MARKET fill:#4CAF50,stroke:#333,color:#fff
    style DONATE fill:#2E7D32,stroke:#333,color:#fff
    style CREDITS fill:#FFD600,stroke:#333,color:#000
    style RISK fill:#616161,stroke:#333,color:#fff
```

**How to read it:** start top-left with the three people the whole system has to satisfy. Follow the return down through prevention, guided capture, instant AI grading, and field verification. Most items agree and go straight to routing; anything that disagrees goes to the Operations Hub first. Every item ends up somewhere useful — never landfill — and the value (refund, green credits, recovered cost) flows back up to all three people at the bottom.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        FE["🖥️ Frontend<br/>React 19 + Vite 8 + Tailwind 4<br/>Port :5173"]
    end

    subgraph "API Gateway Layer"
        BE["⚙️ Backend<br/>Express.js + Prisma ORM<br/>Port :5000"]
    end

    subgraph "AI Microservice Layer"
        AI["🤖 AI1 Service<br/>Fastify + TypeScript<br/>Port :3000"]
    end

    subgraph "Cloud Infrastructure"
        DB[("🐘 PostgreSQL<br/>Supabase<br/>Connection Pooler")]
        S3["📦 AWS S3<br/>Image Archive"]
        DDB["📋 AWS DynamoDB<br/>Grading Records"]
        GEM["✨ Google Gemini<br/>Primary Vision AI"]
        GEMMA["🔮 Google Gemma<br/>Fallback Vision AI"]
    end

    FE -->|"REST API<br/>JSON + Multipart"| BE
    BE -->|"Prisma Client<br/>SQL"| DB
    BE -->|"Server-to-Server<br/>HTTP Proxy"| AI
    AI -->|"putObject / getObject<br/>Presigned URLs"| S3
    AI -->|"put / get / update<br/>Status Tracking"| DDB
    AI -->|"generateContent<br/>Vision Analysis"| GEM
    AI -.->|"Fallback when<br/>Gemini quota exhausted"| GEMMA

    style FE fill:#61DAFB,stroke:#333,color:#000
    style BE fill:#68A063,stroke:#333,color:#fff
    style AI fill:#FF6B6B,stroke:#333,color:#fff
    style DB fill:#336791,stroke:#333,color:#fff
    style S3 fill:#FF9900,stroke:#333,color:#000
    style DDB fill:#4053D6,stroke:#333,color:#fff
    style GEM fill:#8E24AA,stroke:#333,color:#fff
    style GEMMA fill:#AB47BC,stroke:#333,color:#fff
```

---

## 2. Seven-Portal User Interface Map

```mermaid
graph TB
    GW["🏠 Gateway Screen<br/>Role Selection"]

    GW --> CP["👤 Customer Portal<br/>Return an item, upload photos,<br/>AI grading, refund estimate"]
    GW --> PA["🚚 Pickup Agent Portal<br/>Daily pickups, field verification,<br/>AI vs. agent grade comparison"]
    GW --> OH["🛡️ Operations Hub (FraudGuard)<br/>Manual review queue, risk scoring,<br/>routing board, agent leaderboard"]
    GW --> FT["👗 Fitting & Try-On<br/>Virtual try-on, shoe size finder<br/>(return prevention tools)"]
    GW --> MC["🛒 MarketConnect (P2P)<br/>Peer-to-peer resale marketplace<br/>for graded returns"]
    GW --> DC["💚 MarketConnect Cares<br/>Donate to NGO campaigns,<br/>earn & redeem Green Credits"]
    GW --> ND["🏛️ NGO Dashboard<br/>Post needs, track fulfillment,<br/>manage campaigns"]

    style GW fill:#232F3E,stroke:#FF9900,color:#fff,stroke-width:3px
    style CP fill:#0073BB,stroke:#333,color:#fff
    style PA fill:#FF9900,stroke:#333,color:#000
    style OH fill:#DD2C00,stroke:#333,color:#fff
    style FT fill:#E91E63,stroke:#333,color:#fff
    style MC fill:#4CAF50,stroke:#333,color:#fff
    style DC fill:#2E7D32,stroke:#333,color:#fff
    style ND fill:#1565C0,stroke:#333,color:#fff
```

---

## 3. End-to-End Return & Grading Data Flow

```mermaid
sequenceDiagram
    actor Customer
    participant FE as Frontend<br/>(React)
    participant BE as Backend<br/>(Express)
    participant AI as AI1 Service<br/>(Fastify)
    participant S3 as AWS S3
    participant DDB as DynamoDB
    participant Vision as Gemini / Gemma

    Customer->>FE: 1. Select return reason
    Customer->>FE: 2. Upload product photos<br/>(multi-angle)
    FE->>BE: POST /api/grading/:returnId/submit<br/>(multipart: photos + metadata)
    BE->>AI: POST /grade<br/>(forwarded multipart)
    
    AI->>AI: Validate images<br/>(file-type, size, duplicates)
    AI->>S3: Archive originals +<br/>analysis-optimized copies
    AI->>DDB: Create record (VALIDATED)
    AI-->>BE: { requestId, status: VALIDATED }
    BE->>BE: Store aiRequestId on Return row
    BE-->>FE: { requestId, status }

    Note over AI: Async Processing Begins
    AI->>DDB: Status → ANALYZING
    
    loop N voting runs (default 3)
        loop Each photo view
            AI->>S3: Fetch analysis image
            AI->>Vision: Send image + rubric prompt
            Vision-->>AI: Raw detection JSON
            AI->>AI: Repair & validate output
        end
    end
    
    AI->>AI: Vote-merge damages across runs
    AI->>AI: Deduplicate cross-view damages
    AI->>AI: Compute grade (deterministic engine)
    AI->>DDB: Status → COMPLETED + report

    loop Polling every ~2.5s
        FE->>BE: GET /api/grading/:returnId/status
        BE->>AI: GET /status/:requestId
        AI->>DDB: Read status
        AI-->>BE: { status }
        BE-->>FE: { status }
    end

    FE->>BE: GET /api/grading/:returnId/result
    BE->>AI: GET /result/:requestId
    AI->>S3: Generate presigned URLs
    AI-->>BE: Full report + image URLs
    BE->>BE: Persist grade summary<br/>on Return row (Postgres)
    BE-->>FE: Full AI report

    FE->>Customer: 5. Display grade, damages,<br/>confidence, refund estimate
    Customer->>FE: 6. Confirm & Submit Return
    FE->>BE: POST /api/returns/submit
    BE->>BE: Finalize Return (status → Pending)
```

---

## 4. AI Grading Pipeline — Internal Architecture

```mermaid
flowchart TB
    subgraph "Intake & Validation"
        A["POST /grade<br/>Multipart Upload"] --> B["Image Validation<br/>(file-type, size, pHash dedup)"]
        B --> C["Archive to S3<br/>(original + analysis copy)"]
        C --> D["Create DynamoDB Record<br/>(status: VALIDATED)"]
    end

    subgraph "Detection Phase"
        D --> E["Load images from S3"]
        E --> F["Per-View Detection<br/>(concurrent Promise.allSettled)"]
        F --> G{"Primary: Gemini<br/>Circuit Breaker?"}
        G -->|Closed| H["Gemini Vision API<br/>+ Rubric Prompt"]
        G -->|Open / Quota Error| I["Gemma Fallback<br/>Vision API"]
        H --> J["Repair & Validate<br/>(JSON parse, Zod schema)"]
        I --> J
        J -->|Invalid| K["Re-prompt Model<br/>(with error feedback)"]
        K --> J
        J -->|Valid| L["DetectionResult<br/>(damages, quality, match)"]
    end

    subgraph "Voting & Dedup (N=3 runs)"
        L --> M["Run N detection passes"]
        M --> N["Vote-Merge Damages<br/>(majority voting)"]
        N --> O["Cross-View Dedup<br/>(same damage, different angles)"]
    end

    subgraph "Deterministic Grading Engine"
        O --> P["Vision Score<br/>(weighted damage table)"]
        P --> Q["Reason Score<br/>(return reason analysis)"]
        Q --> R["Question Score<br/>(condition answers)"]
        R --> S["Blend Scores<br/>(photo-quality-weighted)"]
        S --> T["Map to Grade<br/>(A+ → F bands)"]
        T --> U["Apply Grade Caps<br/>(water damage→F, crack→D, etc.)"]
        U --> V["Confidence Calc<br/>(min across components)"]
        V --> W{"Near Band Edge?<br/>(±3 points)"}
        W -->|Yes, N=1| X["Re-run with N=3"]
        X --> N
        W -->|No| Y["Final Report"]
        Y --> Z["Human Review Flags<br/>(wrong item, mismatch,<br/>low confidence, band edge)"]
    end

    Z --> AA["DynamoDB: COMPLETED<br/>+ Final Report"]

    style A fill:#4CAF50,stroke:#333,color:#fff
    style G fill:#FF9800,stroke:#333,color:#000
    style H fill:#8E24AA,stroke:#333,color:#fff
    style I fill:#AB47BC,stroke:#333,color:#fff
    style N fill:#1976D2,stroke:#333,color:#fff
    style U fill:#D32F2F,stroke:#333,color:#fff
    style AA fill:#2E7D32,stroke:#333,color:#fff
```

---

## 5. Database Schema (Entity Relationship Diagram)

```mermaid
erDiagram
    Profile {
        uuid id PK
        string email UK
        string fullName
        int greenCredits
        int treesPlanted
        int causesHelped
        int totalOrdersPlaced
        datetime createdAt
    }
    
    Return {
        string id PK
        uuid customerId FK
        string customerName
        string itemName
        string category
        decimal price
        string reason
        string status
        string userGrade
        string userConfidence
        json defects
        string agentGrade
        int disagreementCount
        string routing
        string riskTier
        string aiRequestId
        string aiStatus
        string subcategory
        json conditionAnswers
        boolean aiNotesContradict
        boolean aiRequiresHumanReview
    }

    P2pProduct {
        uuid id PK
        string title
        decimal price
        string category
        uuid sellerId FK
        string sellerName
        boolean verified
        string condition
        decimal rating
        string image
        json thumbnails
    }

    P2pChat {
        uuid id PK
        string category
        string itemTitle
        decimal itemPrice
    }

    P2pMessage {
        uuid id PK
        uuid chatId FK
        string senderName
        string text
        boolean isMe
    }

    NgoCampaign {
        uuid id PK
        string title
        string ngoName
        string urgency
        string category
        int progress
        decimal received
        decimal target
        string unit
        string location
    }

    DonationHistory {
        uuid id PK
        uuid userId FK
        string ngo
        string action
        int credits
        boolean isMe
    }

    PurchaseHistory {
        uuid id PK
        uuid userId FK
        string itemName
        string category
        string size
    }

    Leaderboard {
        int rank PK
        string name
        int verifiedCount
        string accuracy
        int score
    }

    Profile ||--o{ Return : "creates"
    Profile ||--o{ P2pProduct : "sells"
    Profile ||--o{ DonationHistory : "donates"
    Profile ||--o{ PurchaseHistory : "purchases"
    P2pChat ||--o{ P2pMessage : "contains"
```

---

## 6. API Route Architecture

```mermaid
graph LR
    subgraph "Frontend :5173"
        SPA["React SPA<br/>useGlobalState() Hook"]
    end

    subgraph "Backend API :5000"
        direction TB
        R1["/api/returns<br/>GET / PUT / POST submit"]
        R2["/api/grading/:returnId<br/>POST submit / GET status / GET result"]
        R3["/api/p2p/products<br/>GET / POST / POST reveal-phone"]
        R4["/api/p2p/chats<br/>GET / POST / POST messages"]
        R5["/api/donations/campaigns<br/>GET / POST need / PATCH"]
        R6["/api/donations/donate<br/>POST donate / POST redeem"]
        R7["/api/profile<br/>GET / GET leaderboard"]
        R8["/api/config<br/>GET subcategories"]
        R9["/api/tryon<br/>POST analyze / POST size-finder"]
    end

    subgraph "AI1 API :3000"
        A1["POST /grade"]
        A2["GET /status/:id"]
        A3["GET /result/:id"]
    end

    SPA --> R1
    SPA --> R2
    SPA --> R3
    SPA --> R4
    SPA --> R5
    SPA --> R6
    SPA --> R7
    SPA --> R8
    SPA --> R9

    R2 -->|"Proxy"| A1
    R2 -->|"Proxy"| A2
    R2 -->|"Proxy"| A3

    style SPA fill:#61DAFB,stroke:#333,color:#000
    style R2 fill:#FF6B6B,stroke:#333,color:#fff
    style A1 fill:#8E24AA,stroke:#333,color:#fff
    style A2 fill:#8E24AA,stroke:#333,color:#fff
    style A3 fill:#8E24AA,stroke:#333,color:#fff
```

---

## 7. Customer Return User Journey Flow

```mermaid
flowchart TB
    A["🏠 Gateway Screen"] --> B["👤 Customer Portal"]
    B --> C["Select Return Reason<br/>(defective, wrong size, etc.)"]
    C --> D["Select Subcategory<br/>(camera, laptop, shoes, etc.)"]
    D --> E["Answer Condition Questions<br/>(powers on? original parts? etc.)"]
    E --> F["📸 Upload Product Photos<br/>(multi-angle: front, back,<br/>left, right, top, bottom)"]
    F --> G["Submit for AI Grading"]
    G --> H["⏳ Grading In Progress<br/>(polling every 2.5s)"]
    H --> I["📊 AI Report Displayed<br/>Grade, Damage List, Confidence,<br/>Bounding Boxes on Photos"]
    I --> J["💰 Refund Estimate Shown<br/>max(50%, score/100) × price"]
    J --> K{"Confirm Return?"}
    K -->|Yes| L["✅ Return Submitted<br/>(Status → Pending)"]
    K -->|No| M["🔄 Edit or Cancel"]
    
    L --> N["🚚 Pickup Agent<br/>Field Verification"]
    N --> O{"Agent Agrees<br/>with AI Grade?"}
    O -->|Yes| P["✓ Verified<br/>Item Routed"]
    O -->|No| Q["⚠️ Disagreement Flagged<br/>→ Manual Review Queue"]
    Q --> R["🛡️ Operations Hub<br/>Human Review + Routing"]
    P --> S["📦 Routing Decision"]
    R --> S
    
    S --> S1["Restock"]
    S --> S2["Refurbish"]
    S --> S3["🛒 MarketConnect<br/>(P2P Resale)"]
    S --> S4["💚 NGO Donation"]

    style A fill:#232F3E,stroke:#FF9900,color:#fff
    style G fill:#4CAF50,stroke:#333,color:#fff
    style I fill:#8E24AA,stroke:#333,color:#fff
    style L fill:#2E7D32,stroke:#333,color:#fff
    style Q fill:#FF6B00,stroke:#333,color:#fff
    style R fill:#DD2C00,stroke:#333,color:#fff
```

---

## 8. Technology Stack Overview

```mermaid
graph TB
    subgraph "Frontend"
        F1["React 19"]
        F2["Vite 8"]
        F3["Tailwind CSS 4"]
        F4["Vanilla JS (SPA)"]
    end

    subgraph "Backend"
        B1["Node.js ≥ 20"]
        B2["Express.js"]
        B3["Prisma ORM"]
        B4["Multer (file upload)"]
    end

    subgraph "AI Microservice"
        A1["Node.js ≥ 20"]
        A2["Fastify + TypeScript"]
        A3["Sharp (image processing)"]
        A4["Zod (schema validation)"]
        A5["Pino (structured logging)"]
    end

    subgraph "AI / ML Models"
        M1["Google Gemini<br/>(Primary Vision)"]
        M2["Google Gemma<br/>(Fallback Vision)"]
    end

    subgraph "Cloud Services"
        C1["PostgreSQL (Supabase)"]
        C2["AWS S3"]
        C3["AWS DynamoDB"]
    end

    subgraph "DevOps"
        D1["Docker / Docker Compose"]
        D2["Vitest (Unit Testing)"]
        D3["Git / GitHub"]
    end

    style F1 fill:#61DAFB,stroke:#333,color:#000
    style B2 fill:#68A063,stroke:#333,color:#fff
    style A2 fill:#FF6B6B,stroke:#333,color:#fff
    style M1 fill:#8E24AA,stroke:#333,color:#fff
    style C1 fill:#336791,stroke:#333,color:#fff
    style C2 fill:#FF9900,stroke:#333,color:#000
    style D1 fill:#2496ED,stroke:#333,color:#fff
```

---

## 9. Grading Scale & Deterministic Rules

```mermaid
graph LR
    subgraph "Score → Grade Mapping"
        S1["95-100 → A+ (New)"]
        S2["88-94 → A (Excellent)"]
        S3["78-87 → B+ (Good)"]
        S4["68-77 → B (Good)"]
        S5["50-67 → C (Fair)"]
        S6["30-49 → D (Poor)"]
        S7["0-29 → F (Unusable)"]
    end

    subgraph "Hard Cap Rules (override)"
        R1["🚫 Water Damage → F"]
        R2["🚫 Critical Crack → D"]
        R3["🚫 Tampering / Repair → D"]
        R4["🚫 Admitted Repair → D"]
        R5["🚫 Core Function Fail → C"]
        R6["🚫 Missing Parts → C"]
        R7["🚫 Low Photo Quality → B"]
    end

    subgraph "Human Review Triggers"
        H1["❓ Wrong item suspected"]
        H2["❓ Vision vs. Reason mismatch"]
        H3["❓ Insufficient evidence"]
        H4["❓ Confidence < 65%"]
        H5["❓ Score near band edge (±3)"]
    end

    style R1 fill:#D32F2F,stroke:#333,color:#fff
    style R2 fill:#E64A19,stroke:#333,color:#fff
    style R3 fill:#E64A19,stroke:#333,color:#fff
    style H1 fill:#FF9800,stroke:#333,color:#000
    style S1 fill:#4CAF50,stroke:#333,color:#fff
    style S7 fill:#B71C1C,stroke:#333,color:#fff
```

---

## 10. Circular Economy / Sustainability Flow

```mermaid
flowchart LR
    A["📦 Customer Return"] --> B["🤖 AI Grading"]
    B --> C{"Routing<br/>Decision"}
    
    C -->|"Grade A+/A"| D["♻️ Restock<br/>(Sell as 'Like New')"]
    C -->|"Grade B+/B"| E["🔧 Refurbish<br/>(Repair & Resell)"]
    C -->|"Grade C/D"| F["🛒 MarketConnect<br/>(P2P Resale at Discount)"]
    C -->|"Grade D/F<br/>or NGO-suitable"| G["💚 NGO Donation<br/>(Campaigns)"]
    
    F --> H["Buyer purchases<br/>Graded Return"]
    G --> I["NGO receives items<br/>Campaign progress updates"]
    
    H --> J["🌱 Green Credits<br/>Awarded to Seller"]
    I --> K["🌱 Green Credits<br/>Awarded to Donor"]
    
    J --> L["🎁 Redeem Perks<br/>(Marketplace discounts,<br/>priority access)"]
    K --> L

    style A fill:#232F3E,stroke:#FF9900,color:#fff
    style B fill:#8E24AA,stroke:#333,color:#fff
    style D fill:#4CAF50,stroke:#333,color:#fff
    style E fill:#FF9800,stroke:#333,color:#000
    style F fill:#2196F3,stroke:#333,color:#fff
    style G fill:#2E7D32,stroke:#333,color:#fff
    style L fill:#FFD600,stroke:#333,color:#000
```

---

## 11. Deployment Topology

```mermaid
graph TB
    subgraph "Local Development"
        T1["Terminal 1<br/>cd AI1 && npm run dev<br/>:3000"]
        T2["Terminal 2<br/>cd Backend && npm run dev<br/>:5000"]
        T3["Terminal 3<br/>cd Frontend && npm run dev<br/>:5173"]
    end

    subgraph "Supabase (Managed)"
        PG["PostgreSQL<br/>Connection Pooler<br/>(IPv4 dual-stack)"]
    end

    subgraph "AWS Cloud"
        S3B["S3 Bucket<br/>Image Archive"]
        DDBT["DynamoDB Table<br/>Grading Records"]
    end

    subgraph "Google AI Platform"
        GEX["Gemini API<br/>(~20 req/day free tier)"]
        GMX["Gemma API<br/>(fallback)"]
    end

    T3 -->|":5173 → :5000"| T2
    T2 -->|":5000 → :3000"| T1
    T2 -->|"Prisma"| PG
    T1 --> S3B
    T1 --> DDBT
    T1 --> GEX
    T1 -.->|"quota fallback"| GMX

    style T1 fill:#FF6B6B,stroke:#333,color:#fff
    style T2 fill:#68A063,stroke:#333,color:#fff
    style T3 fill:#61DAFB,stroke:#333,color:#000
    style PG fill:#336791,stroke:#333,color:#fff
    style S3B fill:#FF9900,stroke:#333,color:#000
    style GEX fill:#8E24AA,stroke:#333,color:#fff
```

---

## 12. AI Model Resilience — Circuit Breaker Pattern

```mermaid
stateDiagram-v2
    [*] --> Closed
    
    Closed --> Closed : Success → recordSuccess()
    Closed --> Open : Failures ≥ threshold → recordFailure()
    
    Open --> HalfOpen : Cooldown timer expires
    
    HalfOpen --> Closed : Test request succeeds
    HalfOpen --> Open : Test request fails
    
    note right of Closed
        Primary model (Gemini) active.
        All requests go to Gemini first.
    end note
    
    note right of Open
        Primary model bypassed.
        All requests go to Gemma fallback.
        Waiting for cooldown.
    end note
    
    note right of HalfOpen
        One test request sent to Gemini.
        If passes → close breaker.
        If fails → reopen breaker.
    end note
```

---

> [!TIP]
> **For your PPT**: Each diagram above is rendered as a Mermaid diagram. You can:
> 1. **Screenshot** them directly from this preview
> 2. Copy the Mermaid code into [mermaid.live](https://mermaid.live) to export as PNG/SVG
> 3. Use the Mermaid CLI (`mmdc`) to batch-export all diagrams
