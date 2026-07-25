# CrimeIntel — Sub-Implementation Plan (Parallel Track)

> **Context**: Another team member is fixing the Catalyst bucket upload + NoSQL integration. This plan covers work we can do **independently and in parallel** — purely frontend UI, local logic, and features that don't depend on the Catalyst upload pipeline.

> [!IMPORTANT]
> **What's already done**: Tables created in Catalyst, OCR pipeline partially working, Data Ingestion page functional, Analytics connected to Catalyst ZCQL, Dashboard/Offenders/Cases/FIRs/Chat/Network pages all exist with seed data. The blocker is specifically **file upload to Catalyst Stratus bucket** and **NoSQL writes**.

---

## Current State Audit

| Feature Area | Status | Notes |
|---|---|---|
| Auth / RBAC / Shell | ✅ Working | Login, role selector, sidebar, header all functional |
| Dashboard (Command Center) | ✅ Working | KPI cards, incident trends, live feed. Connected to Catalyst |
| Data Ingestion | 🟡 Partial | OCR + entity extraction work, but upload to Catalyst bucket fails |
| Chat (Intelligence Chat) | ✅ Basic | Chat UI exists, connected to Gemini/QuickML |
| Criminal Network Graph | ✅ Basic | React Flow graph renders from seed data |
| Analytics & Trends | ✅ Working | 3 analytics tabs all connected to Catalyst ZCQL |
| Cases | ✅ Basic | Case list + detail page exist |
| Offenders (Profiles) | ✅ Basic | List page with search/filter, profile detail page |
| Early Warnings / Alerts | 🔴 Stub | Page exists but minimal content |
| Financial Links | 🔴 Stub | Page exists but needs money trail visualization |
| Audit & Governance | 🟡 Partial | Audit log API exists, UI needs work |
| Settings | 🔴 Stub | Minimal settings page |
| PDF/Report Export | 🔴 Not started | No export functionality |
| Bilingual (Kannada) | ✅ Basic | Translation file exists, language toggle works |

---

## Proposed Work Streams (No Catalyst Upload Dependency)

### Stream A: Offender Profiles — Full Phase 8 Build
**Why now**: This is entirely frontend + existing Catalyst ZCQL reads. Zero upload dependency.

#### A1. Offender Profile Detail Page Enhancement
- **Criminal History Timeline**: Vertical timeline of all linked FIRs for a person, chronological, color-coded by crime severity
- **Behavioral Profile Cards** (Rational Choice Theory — Module C):
  - ⏰ Preferred Time Window (clock visualization from FIR time data)
  - 🎯 Target Profile summary
  - 🔧 MO Consistency Score (how predictable is this offender)
  - 📍 Geographic Range (mini-map with radius overlay)
  - 📈 Escalation Trend line chart
- **Network Connections Mini-Graph**: Inline React Flow showing this person's 1-hop connections, with "View Full Network" link
- **Linked Entities Tables**: Vehicles, Phones, Bank Accounts, Weapons associated with this person

#### A2. Risk Score Computation (Client-Side from Catalyst Data)
- Compute risk score from real data: `(FIR count × 15) + (recency factor) + (severity escalation) + (network centrality proxy)`
- Display as animated gauge/meter on the profile page
- Top Offenders ranked list on the Offenders page

**Files to create/modify**:
- `app/(auth)/profiles/[id]/page.tsx` — Full profile detail page
- `components/profiles/CriminalTimeline.tsx` — NEW
- `components/profiles/BehavioralProfile.tsx` — NEW  
- `components/profiles/LinkedEntities.tsx` — NEW
- `components/profiles/RiskGauge.tsx` — NEW
- `lib/analytics/riskScoring.ts` — NEW risk computation logic

---

### Stream B: Cases Detail Page — Full Phase 8.3/8.4 Build
**Why now**: Pure read from Catalyst Data Store via ZCQL. No uploads.

#### B1. Case Detail Page
- **Auto-Generated Case Summary**: LLM-generated summary from linked FIR data (via existing chat API)
- **Case Timeline**: Visual timeline — FIR filed → Investigation → Evidence → Charge sheet → Trial → Verdict
- **Linked Entities Panel**: Accused, Victims, Witnesses, Evidence, Vehicles/Weapons
- **Similar Case Retrieval**: Find cases with matching `crime_type_en`, district, MO pattern — display with similarity score
- **Mini Network Graph**: Case-centric subgraph (all entities linked to this case's FIRs)

#### B2. FIR Detail View Enhancement
- Full FIR info display with map pin for lat/lng
- "Ask AI About This FIR" button → opens chat with pre-filled context
- Linked persons clickable → navigate to offender profile

**Files to create/modify**:
- `app/(auth)/cases/[id]/page.tsx` — Enhanced case detail
- `components/cases/CaseTimeline.tsx` — NEW
- `components/cases/CaseSummary.tsx` — NEW
- `components/cases/SimilarCases.tsx` — NEW
- `app/(auth)/firs/[id]/page.tsx` — Enhanced FIR detail
- `app/api/cases/[id]/summary/route.ts` — NEW API for LLM case summary

---

### Stream C: Financial Crime Module — Phase 9 Build
**Why now**: Transaction data already exists in seed JSON. Reads from Catalyst via ZCQL. The Sankey/flow visualization is all frontend.

#### C1. Transaction Analysis Engine (API Routes)
- `app/api/financial/flow/route.ts` — Money trail traversal (forward + backward from an account)
- `app/api/financial/circular/route.ts` — Circular transaction detection (cycle finding in transaction graph)
- `app/api/financial/flagged/route.ts` — Return flagged/suspicious transactions
- All read from `Transactions` + `BankAccounts` tables via Catalyst ZCQL

#### C2. Financial Flow Visualization (Frontend)
- **Sankey Diagram**: Source accounts → Destination accounts, flow width = amount, color = risk level
- **Transaction Timeline**: Chronological waterfall per account with running balance
- **Financial Dashboard Cards**: Total suspicious txns, flagged accounts, total flagged amount

#### C3. Financial Links Page Build
- Replace the existing stub with the full financial crime dashboard
- Integrate with the Criminal Network graph (financial edges highlighted)
- "Investigate" button → opens graph view filtered to financial edges only

**Files to create/modify**:
- `app/api/financial/flow/route.ts` — NEW
- `app/api/financial/circular/route.ts` — NEW
- `app/api/financial/flagged/route.ts` — NEW
- `app/(auth)/financial/page.tsx` — Full rewrite
- `components/financial/SankeyDiagram.tsx` — NEW
- `components/financial/TransactionTimeline.tsx` — NEW
- `components/financial/FinancialDashboard.tsx` — NEW

---

### Stream D: Early Warnings & Alert System — Phase 10 Build
**Why now**: Prediction scores are computed from existing FIR data. Alert rules are client-side config. No upload dependency.

#### D1. Predictive Scoring Engine
- `app/api/predictions/hotspot/route.ts` — Per-district risk score for next 7/14/30 days
- `app/api/predictions/offender/route.ts` — Per-offender recidivism probability score
- `app/api/predictions/anomaly/route.ts` — Current-period anomaly flags vs historical baseline
- All computed from FIRs, Persons, SocioEconomicData via Catalyst ZCQL

#### D2. Alert Management UI
- Alert configuration panel (define threshold rules)
- Alert feed with severity badges (🔴 Critical, 🟡 Warning, 🔵 Info)
- Each alert includes a mini reasoning block: What happened, Why, Recommended action
- Alert map: pins on Karnataka map showing alert locations

#### D3. Early Warning Cards on Dashboard
- Inject "Early Warning" section into Command Center dashboard
- Top 5 highest-risk districts with mechanism explanation
- Top 5 highest-risk offenders with recidivism score
- Active anomalies with mini trend charts

**Files to create/modify**:
- `app/api/predictions/hotspot/route.ts` — NEW
- `app/api/predictions/offender/route.ts` — NEW
- `app/(auth)/alerts/page.tsx` — Full rewrite
- `components/alerts/AlertFeed.tsx` — NEW
- `components/alerts/AlertCard.tsx` — NEW
- `components/alerts/AlertMap.tsx` — NEW
- `components/dashboard/EarlyWarningSection.tsx` — NEW

---

### Stream E: Audit & Governance UI — Phase 12 Build
**Why now**: Audit logging API already exists. This is pure frontend build.

#### E1. Audit Trail Dashboard
- Searchable, filterable audit log table
- Filter by: user, event type, date range, severity
- Log detail panel: click row → full JSON detail
- User activity summary chart
- Export audit logs as CSV

#### E2. Explainability Badges Enhancement
- Ensure every AI-generated element has the `ExplainabilityBadge` component
- "View Reasoning" expand → full trace
- "Data Sources Used" section
- "Report Issue" button → flags output for review

**Files to create/modify**:
- `app/(auth)/audit/page.tsx` — Enhanced audit dashboard
- `components/audit/AuditLogTable.tsx` — NEW
- `components/audit/AuditDetailPanel.tsx` — NEW
- `components/audit/UserActivityChart.tsx` — NEW

---

### Stream F: UI Polish & Demo Readiness — Phase 15 Prep
**Why now**: All frontend. These changes make every existing page look more polished for demo.

#### F1. Dashboard Enhancements
- Add **Time-of-Day Heatmap** (Days × Hours grid)
- Add **Crime Type Distribution Donut Chart**
- Add **Offender Recidivism Funnel** visualization
- Add **Case Resolution Timeline** chart
- Cross-filtering: click chart element → filters other charts

#### F2. Global Command Palette (⌘K)
- Search across FIRs, persons, cases, stations
- Quick navigation to any page
- Recent searches
- Keyboard navigable (already have search bar in header — enhance it)

#### F3. Notification Center
- Slide-out panel from bell icon
- Alert categories: Critical, Warning, Info
- Mark as read, clear all
- Link to source (alert → relevant page)

#### F4. Empty States & Error Boundaries
- Beautiful empty states for every page when no data matches filters
- Consistent error boundaries with retry buttons
- Loading skeletons across all pages (consistent shimmer pattern)

**Files to create/modify**:
- `components/dashboard/TimeOfDayHeatmap.tsx` — NEW
- `components/dashboard/CrimeTypeDonut.tsx` — NEW
- `components/dashboard/RecidivismFunnel.tsx` — NEW
- `components/shared/CommandPalette.tsx` — NEW or enhance existing
- `components/layout/NotificationCenter.tsx` — NEW
- `components/shared/EmptyState.tsx` — NEW
- `components/shared/ErrorBoundary.tsx` — NEW or enhance existing

---

## Execution Priority

| Priority | Stream | Estimated Effort | Impact |
|---|---|---|---|
| 🥇 **1** | **Stream A** — Offender Profiles | 3-4 hours | High — major "wow" page, demo-critical |
| 🥈 **2** | **Stream C** — Financial Crime | 3-4 hours | High — Sankey diagram is a visual showstopper |
| 🥉 **3** | **Stream D** — Early Warnings | 2-3 hours | High — theory-grounded predictions are the differentiator |
| **4** | **Stream B** — Cases Detail | 2-3 hours | Medium — completes the investigation workflow |
| **5** | **Stream F** — UI Polish | 2-3 hours | Medium — makes everything feel premium |
| **6** | **Stream E** — Audit UI | 1-2 hours | Medium — governance requirement |

> [!TIP]
> **Streams A, C, D can all start immediately** — they have zero dependencies on each other or on the Catalyst upload fix. Stream B depends slightly on A (profile links) but can proceed in parallel.

---

## What This Does NOT Touch (Blocked by Catalyst Fix)

- ❌ File upload to Catalyst Stratus bucket
- ❌ NoSQL document writes (chat session persistence to NoSQL)
- ❌ New FIR ingestion → auto-link pipeline (needs bucket + DataStore write)
- ❌ OCR pipeline's final "save to Catalyst" step
- ❌ Embedding storage to Catalyst NoSQL

These remain with the other team member and will be integrated after the Catalyst connection issues are resolved.
