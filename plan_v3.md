# CrimeIntel — Plan V3: The Reality Check & Path Forward

> **Date:** August 27, 2026
> **Status:** Dashboard is broken with a `Catalyst Data Store Error` because `CATALYST_REFRESH_TOKEN` is missing from `.env.local`. The app tries to use real Catalyst APIs, fails auth, then crashes instead of falling back to mock mode gracefully.

---

## What Actually Exists Right Now

### ✅ Working
| Component | Evidence |
|---|---|
| **Next.js 15 scaffold** | App Router, TypeScript, Tailwind, shadcn/ui |
| **Full sidebar + auth shell** | Login, RBAC roles, sidebar nav, header |
| **1,006 FIR seed data** | `data/seed/FIRs.json` + 2,461 Persons + 150 Vehicles + 2,572 Relationships |
| **Bilingual framework** | English + Kannada toggle, translation file exists |
| **Chat UI** | Full-page layout, message bubbles, conversation history (Zustand) |
| **Multi-agent coordinator** | `coordinator.ts` — SQLAgent, GraphAgent, VectorAgent, AnalyticsAgent, FinancialAgent |
| **Intent classifier** | `intentClassifier.ts` — LLM-based with heuristic fallback |
| **Catalyst SDK wrapper** | `index.ts` — 4-strategy auth + mock fallback |
| **20+ API routes** | chat, search, graph, analytics, financial, predictions, admin/seed, etc. |
| **Leaflet + Recharts + XY Flow** | All installed in `package.json` |

### 🔴 Broken RIGHT NOW
| Problem | Root Cause | File |
|---|---|---|
| **Dashboard shows "Catalyst Data Store Error"** | `USE_MOCK_CATALYST=false` in `.env.local` but no `CATALYST_REFRESH_TOKEN` → `direct-api.ts:27` throws → Dashboard catches error → renders error UI | `dashboard/page.tsx:120-141` |
| **Chat returns hardcoded strings** | QuickML calls mock → no `GROQ_API_KEY` → falls to template strings | `quickml.ts` |
| **Reasoning always shows 30% / Low** | `ReasoningEngine.processQuery()` requires real LLM → `fallbackReasoning()` always returns static values | `engine.ts` |
| **Network graph empty** | No graph engine backend, just a placeholder page | `/network` route |
| **Financial links stub** | Page exists, no Sankey, no transaction data | `/financial` route |
| **Alerts mocked** | Random generation, no prediction engine | `/alerts` route |
| **Map shows raw translation keys** | `t('map.spot.DIST_1.name')` → keys don't exist in translation file | `LiveMap.tsx` |

### 🟡 Partially Working
| Component | What Works | What Doesn't |
|---|---|---|
| **Analytics** | 3 tabs connected to ZCQL (mock) | No heatmap, limited charts, no cross-filtering |
| **Cases** | List + detail pages | No AI summary, no timeline, no similar case retrieval |
| **Profiles** | List with search, detail page | No behavioral profile, no risk score, no timeline |
| **Dashboard** | KPI cards, incident trends | Hardcoded stats (`94.2%`, `CRITICAL`), no real-time feed |
| **Audit** | Page + log table structure | No real audit events captured |

---

## The Immediate Fix (5 Minutes)

The **Catalyst Data Store Error** in the screenshot is caused by a simple env var issue. Two options:

### Option 1: Enable Mock Mode (Instant)
```env
# .env.local — change this one line:
USE_MOCK_CATALYST=true
```
This loads the 1,006 FIRs from seed JSON into memory. Dashboard, chat, analytics, all work.

### Option 2: Add the Missing Refresh Token (If You Have It)
```env
# .env.local — add these:
CATALYST_REFRESH_TOKEN=1000.xxxxxx.yyyyyy
```
Generate via: Zoho API Console → Self-Client → Generate Token with scope `ZohoCatalyst.projects.ALL,ZohoCatalyst.filestore.ALL,ZohoCatalyst.datastore.ALL`

> **IMPORTANT:** For development and demo purposes, use Option 1. The mock mode with 1,006 FIRs is functionally identical to real Catalyst for everything the judges will see. Fix real auth later.

---

## Prioritized Action Plan

### 🔥 Tier 0: Unblock the App (30 min)

| # | Task | Impact |
|---|---|---|
| 0.1 | Set `USE_MOCK_CATALYST=true` in `.env.local` | Dashboard loads immediately |
| 0.2 | Fix the `getCatalystApp()` fallback — when `USE_MOCK_CATALYST=false` and auth fails, it should throw a clear error, not silently call `createMockCatalystInstance()` then have downstream code throw | Prevents confusing error states |
| 0.3 | Fix map translation keys — use `selectedSpot.name` directly instead of `t('map.spot.DIST_1.name')` | No more raw key rendering |

---

### 🥇 Tier 1: The 4 "Wow" Moments (2-3 days)

These are the features that win hackathons. Without them, CrimeIntel is just a pretty CRUD dashboard.

#### 1.1 — Intelligence Chat That Actually Works
**Current:** Hardcoded template responses, 30% confidence, empty reasoning.
**Target:** Real LLM-powered answers grounded in the 1,006 FIR dataset.

| Step | Detail |
|---|---|
| Wire QuickML to the real Zoho QuickML endpoint | The `QUICKML_ENDPOINT_KEY` is already in `.env.local`. Make `CatalystQuickML.generateResponse()` use it via Direct API instead of requiring full SDK auth. |
| OR: Use Google Gemini API directly | Add `GEMINI_API_KEY` to `.env.local`, create a `lib/ai/gemini.ts` wrapper, swap out the `CatalystQuickML` calls. Gemini Flash is free tier, fast, and works. |
| Fix intent classification | When LLM is available, `IntentClassifier.classify()` already uses it properly. The heuristic fallback is the problem — it misclassifies ambiguous queries. |
| Fix reasoning engine | Pass retrieved evidence to LLM with a structured prompt → get real theory-grounded analysis (RAT, CPT, RCT) instead of `fallbackReasoning()` returning static 30%. |
| Add citations | Every claim in the LLM response should link back to specific FIR IDs / Person IDs from the evidence. |

**Key files:**
- `lib/catalyst/quickml.ts`
- `lib/ai/chat/intentClassifier.ts`
- `lib/ai/agents/coordinator.ts`
- `lib/reasoning/engine.ts`
- `app/api/chat/route.ts`

---

#### 1.2 — Criminal Network Graph (Visual Centerpiece)
**Current:** Empty placeholder page.
**Target:** Interactive force-directed graph showing suspect → FIR → vehicle → accomplice relationships.

| Step | Detail |
|---|---|
| Graph data API | Create `/api/graph/network` that reads `EntityRelationships` seed data, builds adjacency lists, returns nodes + edges JSON |
| XY Flow rendering | `@xyflow/react` is already installed. Build `components/network/CriminalNetworkGraph.tsx` |
| Node types | Person (circle), FIR (diamond), Vehicle (hexagon), each with color coding by role (accused=red, victim=blue, witness=gray) |
| Interaction | Click node → sidebar with details. 1-hop expansion. Search by name/FIR. |
| Demo story | Pre-seed a "vehicle theft ring" subgraph — 3 accused sharing 2 vehicles across 5 FIRs — that the demo can walk through |

**Key files to create:**
- `app/api/graph/network/route.ts`
- `components/network/CriminalNetworkGraph.tsx`
- `components/network/GraphSidebar.tsx`
- `app/(auth)/network/page.tsx` (rewrite)

---

#### 1.3 — Geospatial Crime Heatmap
**Current:** Map component exists but shows broken translation keys.
**Target:** Interactive Leaflet map with crime density heatmap and district drill-down.

| Step | Detail |
|---|---|
| Fix existing map | Replace `t('map.spot.DIST_1.name')` with `station.name`. Fix all broken translation lookups. |
| Add heatmap layer | `leaflet.heat` is already installed. Plot lat/lng from all 1,006 FIRs as heat points. |
| District boundaries | Add Karnataka district GeoJSON overlay |
| Click interaction | Click district → filter dashboard charts + show district stats sidebar |
| Time slider | Filter heatmap by date range (month/quarter) |

**Key files:**
- `components/dashboard/LiveMap.tsx` (fix)
- `components/dashboard/CrimeHeatmap.tsx` (new)
- `app/api/analytics/map/route.ts` (fix hardcodings)

---

#### 1.4 — Theory-Driven Reasoning (The Differentiator)
**Current:** Always shows `Confidence: Low 30%`, empty mechanism and evidence.
**Target:** Structured criminological analysis with evidence chains.

| Step | Detail |
|---|---|
| Reasoning prompt engineering | Build structured prompts for Routine Activity Theory (RAT), Crime Pattern Theory (CPT), Rational Choice Theory (RCT), Social Disorganization Theory (SDT) |
| Evidence chain building | Given a query + retrieved FIR data, construct a chain: Claim → Supporting Evidence (FIR IDs) → Mechanism (which theory explains it) → Confidence (based on evidence count and consistency) |
| ReasoningBlock component | The UI component exists but renders empty fields. Wire it to real reasoning output. |
| Demo query | "Why is Whitefield flagged as high-risk?" → RAT analysis showing motivated offenders + suitable targets + lack of capable guardians, with specific FIR citations |

**Key files:**
- `lib/reasoning/engine.ts`
- `lib/reasoning/theories/*.ts` (create RAT, CPT, RCT, SDT modules)

---

### 🥈 Tier 2: Complete the Feature Set (2-3 days)

#### 2.1 — Offender Profiles (Full Build)
- Criminal history timeline (from linked FIRs)
- Risk score gauge (computed from FIR count × severity × recency)
- Behavioral profile cards (preferred time window, geographic range, MO consistency)
- 1-hop network mini-graph
- Linked entities (vehicles, phones, accounts)

#### 2.2 — Financial Crime Module
- Money trail Sankey diagram
- Circular transaction detection
- Suspicious transaction flagging
- Integration with network graph (financial edges)

#### 2.3 — Early Warnings & Alerts
- Per-district risk scoring from FIR data
- Per-offender recidivism probability
- Anomaly detection (current vs baseline comparison)
- Alert feed with severity badges

#### 2.4 — Cases Detail Enhancement
- LLM-generated case summary
- Case timeline visualization
- Similar case retrieval
- "Ask AI About This Case" button

---

### 🥉 Tier 3: Polish & Demo Prep (1-2 days)

| Task | Detail |
|---|---|
| Fix ALL hardcodings from `fix.md` | Dashboard `94.2%`, `CRITICAL`, `SYS-CORE ONLINE`, fake officer counts, fake trends |
| Audit trail | Wire real audit event capture to every API route |
| Command palette (⌘K) | Search across FIRs, persons, cases from header |
| Loading skeletons | Consistent shimmer across all pages |
| Error boundaries | Graceful error handling with retry buttons |
| Demo mode toggle | Pre-cached queries and responses for reliable demo |
| Demo script | Timed walkthrough: Landing → Login → Dashboard → Chat → Network → Map → Profile → Financial |

---

## Architecture: What Actually Needs to Happen

```
Current State:                          Target State:
┌─────────────┐                         ┌─────────────┐
│  Dashboard   │                         │  Dashboard   │
│  (broken)    │                         │  (live data) │
└──────┬──────┘                         └──────┬──────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────────┐
│ Catalyst SDK │                         │   LLM Gateway   │
│ (auth fails) │                         │ (Gemini/QuickML)│
└──────┬──────┘                         └────────┬────────┘
       │                                         │
       ▼                                         ▼
┌─────────────┐                         ┌─────────────────┐
│    CRASH     │                         │  Multi-Agent    │
│              │                         │  Coordinator    │
└─────────────┘                         │  (SQL + Graph   │
                                        │   + Vector +    │
                                        │   Analytics)    │
                                        └────────┬────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │  Mock Catalyst   │
                                        │  (1,006 FIRs)   │
                                        │  OR Real Catalyst│
                                        └─────────────────┘
```

The critical insight: **The mock data layer with 1,006 FIRs is sufficient for a winning demo.** The intelligence comes from the LLM reasoning ON TOP of the data, not from the data storage layer. Focus on making the AI pipeline real, not on fixing Catalyst OAuth.

---

## File Inventory: What Exists vs What's Needed

### Exists & Working
- `lib/ai/agents/` — coordinator, sqlAgent, graphAgent, vectorAgent, analyticsAgent, financialAgent
- `lib/ai/chat/` — intentClassifier, contextManager
- `lib/catalyst/` — 19 service wrappers (datastore, quickml, stratus, nosql, cache, etc.)
- `lib/reasoning/` — engine (needs LLM connection)
- `lib/financial/` — transaction analysis logic
- `lib/analytics/` — risk scoring, trend computation
- `app/api/` — 25 API route directories

### Needs Creation
| File | Purpose |
|---|---|
| `lib/ai/gemini.ts` | Direct Gemini API wrapper (bypass Catalyst QuickML auth issues) |
| `lib/reasoning/theories/rat.ts` | Routine Activity Theory module |
| `lib/reasoning/theories/cpt.ts` | Crime Pattern Theory module |
| `lib/reasoning/theories/rct.ts` | Rational Choice Theory module |
| `components/network/CriminalNetworkGraph.tsx` | Interactive XY Flow graph |
| `components/network/GraphSidebar.tsx` | Node detail panel |
| `components/dashboard/CrimeHeatmap.tsx` | Leaflet heat layer |
| `components/profiles/CriminalTimeline.tsx` | FIR history timeline |
| `components/profiles/RiskGauge.tsx` | Animated risk score meter |
| `components/financial/SankeyDiagram.tsx` | Money flow visualization |

### Needs Fixing
| File | Issue |
|---|---|
| `.env.local` | Add `USE_MOCK_CATALYST=true` or `CATALYST_REFRESH_TOKEN` |
| `lib/catalyst/quickml.ts` | Connect to real LLM (Gemini or QuickML Direct API) |
| `lib/reasoning/engine.ts` | Replace `fallbackReasoning()` with real LLM analysis |
| `components/dashboard/LiveMap.tsx` | Fix broken translation keys |
| `app/api/analytics/map/route.ts` | Fix hardcoded stations, fake officers, fake trends |
| `components/charts/CrimeTrendChart.tsx` | Fix hardcoded `94.2%`, `CRITICAL`, node statuses |

---

## Execution Order

```
Day 0 (Now):
  └─ Fix .env.local → Dashboard loads ✅

Day 1:
  ├─ Wire LLM (Gemini API or QuickML Direct API)
  ├─ Fix intent classifier to use real LLM
  ├─ Fix reasoning engine to produce real analysis
  └─ Chat returns intelligent, data-grounded responses ✅

Day 2:
  ├─ Build criminal network graph (XY Flow)
  ├─ Fix geospatial map (broken translations + heatmap layer)
  └─ Two visual centerpieces working ✅

Day 3:
  ├─ Build offender profile enhancements
  ├─ Build financial Sankey diagram
  └─ Complete feature pages ✅

Day 4:
  ├─ Fix all hardcodings
  ├─ Build early warnings
  ├─ Polish loading states, error boundaries
  └─ Demo-ready ✅

Day 5:
  ├─ Demo script rehearsal
  ├─ Fallback plan for live demo failures
  └─ Ready to present ✅
```

---

## What NOT to Waste Time On

| Don't Do | Why |
|---|---|
| Fix Catalyst OAuth / Stratus uploads | OAuth `invalid_client` error is a platform limitation. Mock mode with seed data is functionally identical for demo. |
| Build real-time WebSocket / Catalyst Signals | Simulated events are fine for demo. Real-time adds complexity with zero visual payoff. |
| Implement voice input/output (STT/TTS) | Browser Speech API is flaky. Skip for demo. Add post-hackathon. |
| Build CI/CD pipeline | Not demoed. Not scored. |
| Implement entity resolution / deduplication | Data quality improvement, not a demo feature. |
| Security hardening (Phase 0.15/0.16) | Judges won't test security. |
| Catalyst Circuits / multi-step orchestration | The current coordinator pattern is sufficient. |
| PDF export via SmartBrowz | Browser print works. SmartBrowz integration is overhead for zero demo impact. |

---

## Success Criteria (What Judges See)

1. **Ask a question in chat** → Get an intelligent, data-grounded response with reasoning and citations
2. **Open network graph** → See an interactive criminal network with expandable nodes
3. **View the map** → See a crime heatmap with district drill-down
4. **Click an offender** → See risk score, criminal timeline, behavioral profile
5. **Open financial** → See money flow Sankey with flagged transactions
6. **Switch to Kannada** → Everything renders in Kannada
7. **Every AI output** → Has an explainability badge with confidence, sources, mechanism

> **TIP:** The demo script should walk through these 7 moments in exactly this order. Each one builds on the last. Total time: 8-10 minutes. Leave 5 minutes for Q&A.

---

## Existing Documentation Reference

| Document | Location | What It Covers |
|---|---|---|
| 25-Phase Blueprint (v4) | `docs/specs/CrimeIntel_Implementation_Plan_v4.md` | Comprehensive but massive (2,874 lines). Phases 0.0-0.18 + 1-26. |
| V2 Upgrade Plan | `docs/specs/v2_upgrade.md` | 20-phase plan to replace ALL mocks with Catalyst services. Post-hackathon scope. |
| Implementation Status Audit | `docs/audits_and_status/IMPLEMENTATION_STATUS.md` | Phase-by-phase completion percentages. 11.5% complete, 61.5% pending. |
| Chatbot Fix Diagnosis | `chatbot_fix.md` | 7-layer breakdown of why chat is broken. Layer 1 (auth) is the root cause. |
| Hardcoding Audit | `fix.md` | Every hardcoded value, fake metric, and missing translation identified. |
| Parallel Work Streams | `docs/specs/implementation_plan.md` | 6 streams (Profiles, Cases, Financial, Alerts, Audit, Polish) that don't need Catalyst. |

> **CAUTION:** This plan_v3 supersedes all of the above for prioritization. The other documents are reference material. Don't try to execute them in order — follow this plan's Tier 0 → 1 → 2 → 3 sequence.
