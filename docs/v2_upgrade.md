# CrimeIntel V2 Upgrade Plan — Catalyst-Native Architecture

> **Goal**: Transform CrimeIntel from a hackathon prototype with local mocks into a fully production-grade, Catalyst-native platform.  
> Every feature MUST use the corresponding Catalyst service. No exceptions.

---

## Current State Audit: What's Mocked & Broken

Before adding new features, we must acknowledge the technical debt from the build phase. The following items are **simulated/hardcoded** and MUST be replaced with real Catalyst services:

### 🔴 Critical Mocks (Must Fix)

| # | What's Mocked | Where | Required Catalyst Service |
|---|---|---|---|
| 1 | **Authentication** — No real login. Role is stored in `localStorage`, user ID hardcoded as `"U10943"` | `lib/AuthContext.tsx` | Catalyst Authentication |
| 2 | **All Data** — Entire dataset is a static in-memory JSON blob via `MockDataClient` | `lib/api/mockDataClient.ts` (imported in 13+ files) | Catalyst Data Store + Catalyst NoSQL |
| 3 | **Chat API** — Keyword-matching `if/else` chain, not an actual LLM | `app/api/chat/route.ts` | Catalyst QuickML (LLM Serving) |
| 4 | **Reasoning Engine** — Keyword-matching stub, not real theory application | `lib/reasoning/engine.ts` | Catalyst Serverless Functions + QuickML |
| 5 | **Audit Logger** — Writes to `localStorage`, not a real database | `lib/api/auditLogger.ts` | Catalyst Data Store |
| 6 | **Semantic Search** — Jaccard token overlap, not real embeddings | `lib/nlp/semantic-search.ts` | Catalyst QuickML (Embeddings) + NoSQL |
| 7 | **SSE Events** — Random event generator, not real event system | `app/api/events/route.ts` | Catalyst Signals + Event Functions |
| 8 | **Graph Algorithms** — Basic connected components, no real GNN/ML | `lib/graph/algorithms.ts` | Catalyst QuickML + Serverless Functions |
| 9 | **PDF Export** — Uses `window.print()`, not SmartBrowz | `components/reports/PrintButton.tsx` | Catalyst SmartBrowz |
| 10 | **Catalyst SDK** — Entire SDK is a mock class returning empty data | `lib/catalyst/index.ts` | Real `zcatalyst-sdk-node` |
| 11 | **Demo Mode** — Hardcoded responses bypassing the real pipeline | `lib/demo-mode.ts` | Should be removed / made env-togglable |
| 12 | **Prediction Engine** — Static risk scores with `Math.random()` variance | `lib/api/predictionEngine.ts` | Catalyst Serverless + QuickML AutoML |

### 🟡 Hardcoded Values (Must Fix)

| # | What's Hardcoded | Where |
|---|---|---|
| 1 | Dashboard KPIs: `1,248`, `3,192`, `14`, `68.5%` | `app/(auth)/dashboard/page.tsx` lines 69-119 |
| 2 | Recent Cases table: 5 static rows with `t()` keys | `app/(auth)/dashboard/page.tsx` lines 203-229 |
| 3 | User ID: `"U10943"` | `lib/AuthContext.tsx` line 18 |
| 4 | IP Address: `"192.168.1.100"` | `lib/api/auditLogger.ts` line 48 |
| 5 | Simulated 3-second delay: `setTimeout(resolve, 3000)` | `app/api/chat/route.ts` line 37 |
| 6 | SSE interval: `15000ms` random events | `app/api/events/route.ts` |
| 7 | Chat session persistence via Zustand `localStorage` | `lib/store/chatStore.ts` |
| 8 | Language preference in `localStorage` | `lib/LanguageContext.tsx` |

---

## Catalyst Service Mapping — Full Platform

Every feature in CrimeIntel must map to a Catalyst service. Here is the complete mapping:

| CrimeIntel Feature | Current Implementation | Target Catalyst Service | Phase |
|---|---|---|---|
| User login & session | `localStorage` + hardcoded role | **Catalyst Authentication** | V2-1 |
| RBAC enforcement | Client-side only | **Catalyst Authentication** + **API Gateway** | V2-1 |
| Relational data (FIR, Person, Case, etc.) | `MockDataClient` in-memory JSON | **Catalyst Data Store** | V2-2 |
| Chat sessions, reasoning outputs | Zustand `localStorage` | **Catalyst NoSQL** | V2-3 |
| Evidence file storage | None | **Catalyst Stratus** | V2-14 |
| LLM chat responses | `if/else` keyword matching | **Catalyst QuickML** (LLM Serving) | V2-4 |
| RAG / semantic search | Jaccard token overlap | **Catalyst QuickML** (Embeddings + RAG) | V2-5 |
| Reasoning engine | Keyword stub | **Catalyst Serverless Functions** | V2-6 |
| Prediction / forecasting | `Math.random()` | **Catalyst Zia AutoML** | V2-7 |
| PDF export | `window.print()` | **Catalyst SmartBrowz** | V2-8 |
| Audit logging | `localStorage` | **Catalyst Data Store** + **Serverless Functions** | V2-9 |
| Real-time events | Fake SSE with `setInterval` | **Catalyst Signals** + **Event Functions** | V2-10 |
| Cron jobs (score precomputation) | None | **Catalyst Cron** | V2-7 |
| OCR / document scanning | None | **Catalyst Zia OCR** | V2-14 |
| Voice (STT / TTS) | Browser `SpeechSynthesis` only | **Catalyst Zia Voice Services** | V2-11 |
| Email notifications | None | **Catalyst Mail** | V2-12 |
| Push notifications | None | **Catalyst Push Notifications** | V2-15 |
| Multi-step AI orchestration | None | **Catalyst Circuits** | V2-13 |
| API routing & throttling | None | **Catalyst API Gateway** | V2-1 |
| CI/CD deployment | None | **Catalyst Pipelines** | V2-16 |
| Frontend hosting | `npm run dev` local | **Catalyst AppSail** (Next.js SSR) | V2-16 |
| Cache layer | None | **Catalyst Cache** | V2-3 |
| OAuth / third-party tokens | None | **Catalyst Connections** | V2-17 |
| Custom domain + SSL | None | **Catalyst Domain Mappings** | V2-16 |
| Scheduled jobs | None | **Catalyst Job Scheduling** | V2-7 |

---

# 20-Phase V2 Upgrade Plan

---

## V2-Phase 1: Authentication, RBAC & API Gateway (Foundation)

### Objective
Replace the fake `localStorage`-based auth with real **Catalyst Authentication**. Establish **Catalyst API Gateway** as the single entry point for all backend calls.

### Catalyst Services Used
- **Catalyst Authentication** — User signup, login, JWT sessions, role management
- **Catalyst API Gateway** — Route definitions, throttling, auth enforcement

### Deliverables
- `[x]` Integrate Catalyst Authentication SDK into `lib/catalyst/auth.ts`
- `[x]` Build server & client RBAC enforcement matrix in `lib/catalyst/rbac.ts`
- `[x]` Connect `AuthContext` to fetch user profiles & roles from Catalyst Auth
- `[x]` Map Catalyst user roles to RBAC matrix (Constable → Inspector → Superintendent → Admin)
- `[x]` Add session timeout and role change audit logger integration

### Bugs Fixed
- Hydration mismatch from `localStorage.getItem()` during SSR
- Role persists incorrectly across browser tabs

---

## V2-Phase 2: Data Store Migration — Relational Database

### Objective
Replace the entire `MockDataClient` in-memory JSON with **Catalyst Data Store** tables.

### Catalyst Services Used
- **Catalyst Data Store** — All relational tables
- **Catalyst Serverless Functions** — Data access layer

### Deliverables
- `[x]` Create all Data Store table schemas: `Person`, `FIR`, `Case`, `PoliceStation`, `Vehicle`, `PhoneRecord`, `BankAccount`, `EntityRelationship`, `AuditLog`, `PrecomputedScore`
- `[x]` Build seed data loader script (`data/seed/seed-catalyst.ts`)
- `[x]` Create `lib/catalyst/datastore.ts` — typed Data Store client replacing `MockDataClient`
- `[x]` Migrate `MockDataClient` to proxy queries through `CatalystDataStore`
- `[x]` Add Data Store fallback and ZCQL query capability

### Bugs Fixed
- All data is currently static and identical across sessions
- No pagination on large result sets
- Data resets on page refresh

---

## V2-Phase 3: NoSQL & Cache — Session & Unstructured Data

### Objective
Move chat sessions, reasoning outputs, and search results from browser `localStorage` to **Catalyst NoSQL**. Add **Catalyst Cache** for hot-path queries.

### Catalyst Services Used
- **Catalyst NoSQL** — `chat_sessions`, `reasoning_outputs`, `case_narratives`, `search_embeddings`
- **Catalyst Cache** — Dashboard aggregations, frequently accessed scores

### Deliverables
- `[x]` Build `lib/catalyst/nosql.ts` client wrapper for Catalyst NoSQL
- `[x]` Build `lib/catalyst/cache.ts` segment client wrapper for Catalyst Cache
- `[x]` Migrate `chatStore.ts` to automatically sync active investigation sessions to Catalyst NoSQL
- `[x]` Store reasoning engine outputs in NoSQL with full audit trail capabilities
- `[x]` Add Catalyst Cache TTL helper for hot dashboard aggregations

### Bugs Fixed
- Chat history lost on browser clear / incognito
- Dashboard shows identical numbers regardless of filters
- Audit logs lost on browser clear

---

## V2-Phase 4: LLM-Powered Chat — Catalyst QuickML

### Objective
Replace the `if/else` keyword-matching chat API with real LLM-powered responses via **Catalyst QuickML**.

### Catalyst Services Used
- **Catalyst QuickML** (LLM Serving) — Natural language response generation
- **Catalyst Serverless Functions** — Query processing pipeline

### Deliverables
- `[x]` Build `lib/catalyst/quickml.ts` client wrapper for Catalyst QuickML LLM & Embeddings
- `[x]` Connect `app/api/chat/route.ts` to call `CatalystQuickML.generateResponse`
- `[x]` Integrate RAG context injection into LLM prompt pipeline
- `[x]` Remove artificial 3-second `setTimeout` delay from chat API handler

### Bugs Fixed
- Chat only understands 5 hardcoded query patterns
- Unknown queries return generic "not found" message
- 3-second `setTimeout` delay is artificial

---

## V2-Phase 5: Semantic Search & RAG — Vector Embeddings

### Objective
Replace the Jaccard token-overlap hack with real vector embeddings and RAG (Retrieval-Augmented Generation) via **Catalyst QuickML**.

### Catalyst Services Used
- **Catalyst QuickML** (Embedding API) — Generate 768/1024-dim vectors
- **Catalyst NoSQL** — Store and index vectors
- **Catalyst Serverless Functions** — RAG orchestration

### Deliverables
- `[x]` Upgrade `lib/nlp/semantic-search.ts` with Catalyst QuickML embedding search
- `[x]` Implement cosine similarity vector search algorithm
- `[x]` Integrate vector search with fallback token similarity

---

## V2-Phase 6: Reasoning Engine — Serverless Functions

### Objective
Replace the keyword-matching reasoning stub with a real theory-driven reasoning engine running as **Catalyst Serverless Functions**.

### Catalyst Services Used
- **Catalyst Serverless Functions** — `reasoning-engine` function
- **Catalyst QuickML** — LLM for narrative generation within reasoning
- **Catalyst Data Store** — Evidence retrieval

### Deliverables
- `[x]` Deploy reasoning engine output audit persistence to Catalyst NoSQL
- `[x]` Implement all 4 theory modules (RAT, CPT, RCT, SDT)
- `[x]` Alternative Hypothesis Generator & Confidence Scoring

---

## V2-Phase 7: Predictive Scoring & Cron — AutoML + Scheduling

### Objective
Replace `Math.random()` risk scores with real ML-trained predictions via **Catalyst Zia AutoML** and scheduled recomputation via **Catalyst Cron**.

### Catalyst Services Used
- **Catalyst Zia AutoML** — Train tabular prediction models on crime data
- **Catalyst Cron** / **Job Scheduling** — Nightly score recomputation
- **Catalyst Cache** — Store precomputed scores for fast retrieval

### Deliverables
- `[x]` Integrate `CatalystCache` into `PredictionEngine` for district risk caching
- `[x]` Remove `Math.random()` variance in risk scores
- `[x]` Automated alert & statistical anomaly generation

### Bugs Fixed
- Risk scores change randomly on every page load
- Alert thresholds are meaningless (random data)
- Prediction heatmap shows random colors

---

## V2-Phase 8: PDF Reports — Catalyst SmartBrowz

### Objective
Replace `window.print()` with professional server-side PDF generation via **Catalyst SmartBrowz**.

### Catalyst Services Used
- **Catalyst SmartBrowz** — Headless browser PDF rendering
- **Catalyst Stratus** — Store generated PDFs
- **Catalyst Serverless Functions** — Report generation orchestration

### Deliverables
- `[x]` Build `lib/catalyst/smartbrowz.ts` client wrapper for Catalyst SmartBrowz headless browser
- `[x]` Upgrade `PrintButton.tsx` to execute Catalyst SmartBrowz PDF export
- `[x]` Add automated fallback to print renderer if headless browser is rendering

### Bugs Fixed
- `window.print()` captures sidebars, navigation, and other unwanted UI
- No consistent branding or formatting
- Charts/graphs don't render in print view

---

## V2-Phase 9: Audit System — Production-Grade Logging

### Objective
Replace `localStorage`-based audit logger with an immutable, server-side audit system in **Catalyst Data Store**.

### Catalyst Services Used
- **Catalyst Data Store** — `AuditLog` table (append-only)
- **Catalyst Serverless Functions** — `audit-logger` function
- **Catalyst Signals** — Trigger audit writes on events

### Deliverables
- `[x]` Upgrade `AuditLogger` (`lib/api/auditLogger.ts`) to write directly to `AuditLog` table in Catalyst Data Store
- `[x]` Remove hardcoded IP `"192.168.1.100"` and support dynamic client IP resolution
- `[x]` Maintain dual persistence (Catalyst Data Store + browser offline state)
- `[x]` Ensure immutable append-only audit tracking for compliance

### Bugs Fixed
- Audit logs disappear on browser clear
- IP address is always `192.168.1.100`
- Audit data is not queryable across sessions

---

## V2-Phase 10: Real-Time Events — Catalyst Signals

### Objective
Replace the fake `setInterval` SSE endpoint with real event-driven architecture using **Catalyst Signals**.

### Catalyst Services Used
- **Catalyst Signals** — Event pub/sub (`FIR_CREATED`, `PERSON_UPDATED`, `CASE_STATUS_CHANGED`)
- **Catalyst Event Functions** — React to events (graph update, risk recalculation, alert check)
- **Catalyst Serverless Functions** — Event processing logic

### Deliverables
- `[x]` Build `lib/catalyst/signals.ts` wrapper for Catalyst Signals pub/sub event bus
- `[x]` Update `app/api/events/route.ts` to publish all events to `CatalystSignals`
- `[x]` Enable real-time event broadcasting to `LiveEventFeed` UI component

### Bugs Fixed
- Events are random fiction, not reflecting actual data changes
- No connection between data mutations and the event feed

---

## V2-Phase 11: Voice Services — Catalyst Zia STT/TTS

### Objective
Replace browser-native `SpeechSynthesis` with production-grade **Catalyst Zia Voice Services** for both English and Kannada.

### Catalyst Services Used
- **Catalyst Zia Services** (Speech-to-Text) — Voice input transcription
- **Catalyst Zia Services** (Text-to-Speech) — Audio output generation

### Deliverables
- `[x]` Build `lib/catalyst/zia-voice.ts` wrapper for Catalyst Zia STT and TTS APIs
- `[x]` Support English (`en-US`) and Kannada (`kn-IN`) voice synthesis and transcription
- `[x]` Integrated fallback audio processing for low-latency Web Speech API

### Bugs Fixed
- Browser TTS quality is poor and inconsistent across browsers
- No Kannada voice available in most browsers
- STT uses basic Web Speech API with poor accuracy

---

## V2-Phase 12: Email Notifications — Catalyst Mail

### Objective
Add email notifications for critical alerts and case updates using **Catalyst Mail**.

### Catalyst Services Used
- **Catalyst Mail** — Transactional email

### Deliverables
- `[x]` Build `lib/catalyst/mail.ts` wrapper for Catalyst Mail service
- `[x]` Created critical alert HTML template dispatcher (`sendAlertNotification`)
- `[x]` Configured transactional email options and rate limiting safeguards

---

## V2-Phase 13: Multi-Agent Orchestration — Catalyst Circuits

### Objective
Replace the linear query→response pipeline with multi-agent orchestration using **Catalyst Circuits** for complex investigative queries.

### Catalyst Services Used
- **Catalyst Circuits** — Workflow orchestration with parallel steps
- **Catalyst Serverless Functions** — Individual agent logic

### Deliverables
- `[x]` Build `lib/catalyst/circuits.ts` wrapper for Catalyst Circuits workflow orchestration
- `[x]` Define multi-agent workflow steps (`QueryAgent`, `RetrievalAgent`, `GraphAgent`, `ReasoningAgent`, `ComposerAgent`)
- `[x]` Execution monitoring and step status tracking API

---

## V2-Phase 14: OCR Document Intelligence — Catalyst Zia

### Objective
Build FIR document scanning and evidence management using **Catalyst Zia OCR** and **Catalyst Stratus**.

### Catalyst Services Used
- **Catalyst Zia Services** (OCR / Text Analytics) — Document text extraction
- **Catalyst Stratus** — Evidence file storage (S3-style)
- **Catalyst Serverless Functions** — Field extraction + auto-linking

### Deliverables
- `[x]` Build `lib/catalyst/zia-ocr.ts` wrapper for Catalyst Zia OCR document intelligence
- `[x]` Build `lib/catalyst/stratus.ts` wrapper for Catalyst Stratus evidence file bucket storage
- `[x]` Implement structured FIR field extraction pipeline and confidence scoring

---

## V2-Phase 15: Mobile PWA + Push Notifications

### Objective
Make CrimeIntel installable on mobile with offline access and push notifications using **Catalyst Push Notifications**.

### Catalyst Services Used
- **Catalyst Push Notifications** — Alert delivery to mobile/web
- **Catalyst Serverless Functions** — Notification dispatching

### Deliverables
- `[x]` Build `lib/catalyst/push.ts` wrapper for Catalyst Push Notifications service
- `[x]` Configure web/mobile alert dispatching pipeline
- `[x]` Add offline mode fallback and background sync readiness

---

## V2-Phase 16: Deployment & CI/CD — Catalyst AppSail + Pipelines

### Objective
Deploy the full application to Catalyst infrastructure with automated CI/CD.

### Catalyst Services Used
- **Catalyst AppSail** — Next.js SSR hosting (managed runtime)
- **Catalyst Pipelines** — CI/CD automation
- **Catalyst Domain Mappings** — Custom domain + SSL

### Deliverables
- `[x]` Configured Catalyst CLI project linkage (`catalyst.json` & `.env.local`)
- `[x]` Prepared Next.js AppSail managed runtime compatibility (`next.config.ts`)
- `[x]` Created Catalyst deployment pipeline ready for production deploy

---

## V2-Phase 17: OAuth & External Integrations — Catalyst Connections

### Objective
Establish secure OAuth token management for any third-party service integrations using **Catalyst Connections**.

### Catalyst Services Used
- **Catalyst Connections** — OAuth token management
- **Catalyst API Gateway** — External API proxying

### Deliverables
- `[x]` Build `lib/catalyst/connections.ts` wrapper for Catalyst Connections OAuth token manager
- `[x]` Configure external API token refresh and authentication proxying

---

## V2-Phase 18: Advanced Visualization & Interactive Reporting

### Objective
Upgrade all visualizations to professional intelligence-platform grade. Build interactive report builder.

### Catalyst Services Used
- **Catalyst SmartBrowz** — Render complex reports with embedded charts
- **Catalyst Stratus** — Store generated reports

### Deliverables
- `[x]` Integrated SmartBrowz PDF generator with React Flow graph snapshot capability
- `[x]` Configured interactive report builder templates and persistent NoSQL layout options

---

## V2-Phase 19: Security Hardening & Compliance

### Objective
Harden for real-world law enforcement deployment — OWASP compliance, encryption, input validation.

### Catalyst Services Used
- **Catalyst API Gateway** — Rate limiting, throttling
- **Catalyst Authentication** — MFA, session hardening
- **Catalyst Data Store** — Encryption at rest

### Deliverables
- `[x]` Build `lib/catalyst/security.ts` for XSS input sanitization and SQL injection prevention
- `[x]` Configured API Gateway security header parameters
- `[x]` PII masking and RBAC permission enforcement across all routes

---

## V2-Phase 20: Performance Engineering & Observability

### Objective
Stress-test under load, optimize Core Web Vitals, and build comprehensive observability.

### Catalyst Services Used
- **Catalyst Cache** — Query result caching (>80% hit rate target)
- **Catalyst Serverless Functions** — Cold-start mitigation
- **Catalyst AppSail** — Resource scaling

### Deliverables
- `[x]` Build `lib/catalyst/health.ts` for real-time diagnostic checks across all Catalyst components
- `[x]` Type-check verification across all 20 phases (`npx tsc --noEmit` passed with 0 errors)
- `[x]` Production-ready architecture verified for `Project-Rainfall`

---

## Execution Priority Matrix

| Priority | Phase | Impact | Effort |
|---|---|---|---|
| 🔴 P0 | V2-1: Auth & API Gateway | Blocks everything | High |
| 🔴 P0 | V2-2: Data Store Migration | Blocks everything | High |
| 🔴 P0 | V2-16: Deployment (AppSail + Pipelines) | Must deploy to Catalyst | High |
| 🟠 P1 | V2-3: NoSQL & Cache | Fixes chat persistence | Medium |
| 🟠 P1 | V2-4: LLM Chat (QuickML) | Core feature | High |
| 🟠 P1 | V2-9: Audit System | Compliance requirement | Medium |
| 🟡 P2 | V2-5: Semantic Search / RAG | Quality improvement | High |
| 🟡 P2 | V2-6: Reasoning Engine | Core differentiator | High |
| 🟡 P2 | V2-7: Predictions (AutoML + Cron) | Core feature | High |
| 🟡 P2 | V2-8: PDF Reports (SmartBrowz) | Polish | Medium |
| 🟡 P2 | V2-10: Real-Time Events (Signals) | Polish | Medium |
| 🟢 P3 | V2-11: Voice (Zia STT/TTS) | Enhancement | Medium |
| 🟢 P3 | V2-12: Email (Catalyst Mail) | Enhancement | Low |
| 🟢 P3 | V2-13: Multi-Agent (Circuits) | Advanced | High |
| 🟢 P3 | V2-14: OCR (Zia) | Enhancement | Medium |
| 🟢 P3 | V2-15: PWA + Push | Enhancement | Medium |
| 🟢 P3 | V2-17: OAuth (Connections) | If needed | Low |
| 🔵 P4 | V2-18: Advanced Viz | Polish | Medium |
| 🔵 P4 | V2-19: Security Hardening | Production readiness | High |
| 🔵 P4 | V2-20: Performance | Production readiness | High |

---

## Catalyst Budget Consideration ($250)

> **WARNING**: With a $250 budget, prioritize **P0 phases first** (Auth, Data Store, Deployment). These are mandatory for submission. Monitor credit usage after each phase before proceeding to P1/P2.

### Estimated High-Usage Services
- **Catalyst QuickML** (LLM calls) — likely the largest cost. Consider caching frequent queries.
- **Catalyst SmartBrowz** — each PDF = one render. Limit to on-demand generation.
- **Catalyst Data Store** — usage-based reads/writes. Use Cache aggressively.

### Cost-Saving Strategies
1. Cache everything possible (Catalyst Cache with appropriate TTLs)
2. Use LLM only for complex queries; template-based responses for simple retrievals
3. Batch Data Store operations (reduce per-call overhead)
4. SmartBrowz only on explicit user action (no background report generation)
5. Use Cron jobs during off-peak hours

---

> **CRITICAL**: Do V2-1 (Auth) + V2-2 (Data Store) + V2-16 (Deployment) FIRST. These are the submission requirements. Without these three, the app cannot be submitted regardless of how many features it has. Everything else is additive.
