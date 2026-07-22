# Product Requirements Document
## CrimeIntel — AI Investigator Copilot for Karnataka State Police
### Challenge Track: 01 — Intelligent Conversational AI for KSP Crime Database

---

## 1. Executive Summary

CrimeIntel is a conversational crime-intelligence platform that lets investigators query the state crime database in natural language (English + Kannada) and get back not just data, but **investigative reasoning** — hypotheses, evidence, and ruled-out alternatives, grounded in established criminological theory rather than a black-box confidence score.

The core differentiator: every non-trivial answer the system gives is backed by a named criminological/sociological mechanism (Routine Activity Theory, Crime Pattern Theory, Rational Choice Theory, Social Disorganization Theory), with the specific evidence that supports it and the alternative explanations the system considered and rejected. This is what separates CrimeIntel from a generic "LLM + SQL + charts" submission: it reasons like a senior investigator, not a search engine.

Built end-to-end on Zoho Catalyst, deployed via Catalyst AppSail/Web Client Hosting, satisfying the hackathon's mandatory-deployment constraint while still allowing a modern Next.js frontend and a fast, Antigravity-generated development workflow.

---

## 2. Problem Statement (Recap)

SCRB manages crime data from 1,100+ police stations. Current tooling is static dashboards and manual SQL — no conversational access, no cross-entity reasoning, no explainable predictive intelligence. Investigators cannot ask follow-up questions, cannot see criminal networks, and get no "why" behind any pattern the system surfaces.

---

## 3. Goals

1. Natural-language, multi-turn, bilingual (English/Kannada) conversational access to crime records.
2. Criminal network analysis that produces **investigative leads**, not just a pretty graph.
3. Explainable, theory-grounded reasoning for every prediction, risk score, and behavioral claim.
4. A working, demoable, end-to-end deployed system on Catalyst — not slideware.
5. A single unmistakable "wow" moment: live, on-stage, the AI reasons through a case the way a detective would, and shows its work.

### Non-Goals (explicitly out of scope for hackathon timeline)
- Full production-grade data ingestion pipeline from 1,100+ real police stations (use realistic synthetic/seed data matching the provided ERD).
- Full mobile app (web-responsive only).
- Multi-language support beyond English + Kannada.
- Real financial-institution integration for transaction tracing (simulate with seed data).

---

## 4. The Novel Differentiator — Theory-Driven Reasoning Engine

This is the centerpiece. Do not treat it as a "nice-to-have module" — it is the product.

### 4.1 Concept
Instead of a black-box model outputting "Risk: 91%," the reasoning engine works like a structured investigative argument:

```
CLAIM: District X is high-risk for vehicle theft in the next 2 weeks.

MECHANISM (Routine Activity Theory):
  - Motivated offender: 2 repeat offenders released in last 30 days, prior MO = vehicle theft
  - Suitable target: Festival season → increased unattended vehicles near venues
  - Absent guardian: Night patrol coverage in this district down 22% vs. last month

EVIDENCE:
  - [FIR #4521, #4589] Two-wheeler theft near festival grounds, similar MO, last year same period
  - [Offender graph] Both released offenders' "activity nodes" (Crime Pattern Theory —
    home/work/frequent locations) overlap with the festival venue's 2km radius

ALTERNATIVE HYPOTHESES CONSIDERED AND REJECTED:
  - Organized gang activity: rejected — no shared associates/phone/vehicle links found
    between the two offenders in the network graph
  - Random seasonal noise: rejected — pattern matches same period last year (Chi-sq test)

CONFIDENCE: Moderate-High — mechanism + historical precedent + network evidence all align
```

### 4.2 Theoretical Frameworks to Implement (hard commitments)
| Theory | Drives | Implementation |
|---|---|---|
| **Routine Activity Theory** (offender + target + no guardian, converging in space/time) | Hotspot prediction, early warning | Rule-engine + ML scoring combining offender-release data, patrol/guardianship proxy, target density (festivals, crowding, unattended-asset signals) |
| **Crime Pattern Theory** (offenders operate near their "activity nodes": home, work, routes) | Network analysis, lead generation | Graph traversal: for any open case, find offenders whose known nodes (address, workplace, prior FIR locations) fall within a geo-radius of the crime location |
| **Rational Choice Theory** (offender weighs effort/reward/risk) | Behavioral profiling | Structured profile generation: preferred time windows, target vulnerability pattern, MO consistency, escalation/de-escalation over time |
| **Social Disorganization Theory** (crime linked to community/economic instability) | Socio-demographic correlation module | Correlate crime density with (seed) socio-economic indicators: unemployment proxy, population density, migration indicators — presented as *correlation with named mechanism*, never as unqualified causation |

### 4.3 Why This Wins
- Directly answers the brief's explicit, repeated asks: "explainable AI," "reasoning paths," "investigative decision support," "criminology," "sociology" — most teams will skim past these words; you're building the product around them.
- Reuses your team's actual strength (graph/GNN work from FraudShield) instead of building unfamiliar ML from scratch.
- Nearly impossible for another team to improvise in a hackathon window — it requires a designed reasoning structure, not just a bigger prompt.

---

## 5. Feature Set

### 5.1 Conversational Crime Intelligence Interface (Core)
- Natural language chatbot, English + Kannada (typed + voice)
- Multi-turn context retention ("show only repeat offenders" referring to prior result set)
- Query types supported:
  - Direct retrieval: FIRs, accused, victims, case status, criminal history
  - Aggregate/analytical: trends, comparisons across districts/time
  - Reasoning queries: "why is this district flagged," "what connects these two suspects"
- Conversation history exportable as PDF (via Catalyst SmartBrowz)
- Voice input/output (Catalyst Zia Speech-to-Text / Text-to-Speech)

### 5.2 Criminal Network & Relationship Analysis
- Graph model over: Person, Vehicle, Phone, Bank Account, Location, Weapon, FIR, Case, Police Station
- Relationship edges: called, visited, owns, uses, accused_in, victim_of, same_address, same_phone, same_vehicle
- Interactive graph visualization (React Flow / D3) with node expansion
- **Lead generation, not just visualization**: automatic surfacing of "activity node overlap" leads per Crime Pattern Theory (Section 4.2)
- Organized-crime / repeat-offender cluster detection (community detection on the graph)

### 5.3 Crime Pattern & Trend Analytics
- Hotspot detection (spatiotemporal clustering)
- Seasonal/festival-linked trend analysis
- District/station-level drilldowns
- Emerging-cluster alerts

### 5.4 Sociological Crime Insights
- Correlation views: crime type vs. age/gender/socio-economic proxy (seed data)
- Explicit "mechanism, not just correlation" framing tied to Social Disorganization Theory
- Never presents correlation as proof — UI always shows confidence + alternative explanations (this is also an ethical/responsible-AI signal to judges)

### 5.5 Criminology-Based Offender Profiling
- Repeat offender identification + risk scoring (frequency, recency, severity)
- Behavioral profile generation per Rational Choice Theory (Section 4.2)
- MO consistency scoring across cases

### 5.6 Investigator Decision Support ("Copilot")
- Auto-generated case summary + timeline from linked FIR data
- Similar historical case retrieval (semantic search over case narratives)
- Recommended investigative leads (network overlap + behavioral match)

### 5.7 Financial Crime & Transaction Link Analysis
- Node type: Bank Account / UPI in the graph
- Money-trail path-finding between entities (graph shortest-path / flow analysis)
- Flagging of suspicious transaction clusters (simulated dataset)

### 5.8 Crime Forecasting & Early Warning
- Theory-grounded early warning alerts (Section 4.1 format) for hotspots, repeat-offender risk, organized activity
- Configurable alert thresholds by role

### 5.9 Explainable AI & Transparent Analytics
- Every AI output carries: mechanism → evidence → alternatives considered → confidence
- Full audit trail: who queried what, when, what data was used, what reasoning path was followed

### 5.10 Secure Role-Based Access & Governance
- Roles: Constable, Inspector, ACP, DCP, Administrator — differentiated data visibility
- Catalyst Authentication + row/field-level access rules
- Audit logs, traceability, and data-protection compliance framing

### 5.11 Command Center Dashboard (supporting, not headline)
- Interactive heatmaps (Leaflet/Mapbox)
- District/station drilldown charts (Recharts)
- Live stats + predictive alert feed
- Deliberately positioned as secondary to the conversational/reasoning experience in the demo flow, while still fully satisfying Challenge 02-style requirements as a bonus

---

## 6. Tech Stack

### 6.1 Frontend
- **Next.js 15** (App Router), TypeScript
- **Tailwind CSS** + **shadcn/ui** — white/light theme, clean investigator-console aesthetic (no dark "hacker" cliché — clarity and trust over drama)
- **React Flow** — criminal network graph visualization
- **Leaflet** or **Mapbox GL** — geospatial hotspot maps
- **Recharts** — trend/analytics charts
- **Framer Motion** — subtle transitions (reasoning-engine "thinking" reveal is a good motion moment)

### 6.2 Backend / Infra (Catalyst-native per mandatory requirement)
| Need | Catalyst Service |
|---|---|
| Backend logic / API | Catalyst Serverless Functions |
| Relational data (FIRs, persons, cases) | Catalyst Data Store |
| Semi-structured data (case narratives, chat logs) | Catalyst NoSQL |
| File/object storage (uploaded FIR docs, evidence) | Catalyst Stratus |
| Caching (hot query results, session context) | Catalyst Cache |
| LLM serving / RAG | Catalyst QuickML |
| Tabular ML (risk scoring models) | Catalyst Zia AutoML |
| OCR (scanned FIRs) | Catalyst Zia Services |
| Speech-to-text / text-to-speech / Kannada translation | Catalyst Zia Services |
| PDF export of conversations/reports | Catalyst SmartBrowz |
| Auth / login | Catalyst Authentication |
| API routing/throttling | Catalyst API Gateway |
| Scheduled jobs (nightly pattern recompute) | Catalyst Cron |
| Event reactions (new FIR → recompute graph) | Catalyst Signals + Event Functions |
| Multi-step AI workflow orchestration (query → retrieval → graph → reasoning → response) | Catalyst Circuits |
| Transactional email (alerts to supervisors) | Catalyst Mail |
| Frontend hosting | Catalyst Slate / Web Client Hosting |
| Full app runtime (if Next.js SSR needed beyond static hosting) | Catalyst AppSail |
| CI/CD | Catalyst Pipelines |

### 6.3 Graph Layer — the one gap in Catalyst's table
Catalyst has no native graph database. Two viable approaches:
1. **Model the graph in Catalyst Data Store** as adjacency tables (`entities`, `relationships`) and do traversal in Serverless Functions — keeps you fully Catalyst-native, safest for submission validity, sufficient for hackathon-scale data.
2. If graph query complexity demands it, a lightweight **in-memory graph structure built at function runtime** from Data Store rows (load subgraph, run traversal/community detection in-process) — still Catalyst-native, no external graph DB dependency.
**Recommendation: Option 1.** Avoids any "third-party alternative" risk with the mandatory-Catalyst rule, and hackathon data volumes won't need a dedicated graph DB's performance.

---

## 7. System Architecture

```
                         Investigator (Web, English/Kannada, Voice)
                                       │
                        Next.js Frontend (Catalyst Web Client Hosting / AppSail)
                                       │
                          Catalyst API Gateway (auth, routing, throttling)
                                       │
                    Catalyst Circuits — Orchestration Workflow
                                       │
        ┌──────────────────────┬──────────────────┬───────────────────────┐
        │                      │                  │                       │
        ▼                      ▼                  ▼                       ▼
Query Understanding      Retrieval Layer     Graph Engine          Reasoning Engine
(QuickML LLM/RAG)     (Data Store / NoSQL)  (Data Store adjacency  (Theory rules +
                                              + traversal fn)       Zia AutoML scoring)
        │                      │                  │                       │
        └──────────────────────┴──────────────────┴───────────────────────┘
                                       │
                         Explainability & Audit Layer
                     (mechanism + evidence + alternatives + confidence,
                          logged to Data Store for audit trail)
                                       │
                    Response Composer (text / voice via Zia TTS / PDF via SmartBrowz)
                                       │
                                Investigator (answer + "why")
```

Supporting async path: **Catalyst Signals + Cron** trigger nightly/event-driven recomputation of hotspot scores, offender risk scores, and graph community clusters, so live queries read pre-computed results (fast) rather than recomputing on every request.

---

## 8. Data Model (pending official ERD — this is the working draft to adapt)

### Core relational entities (Catalyst Data Store)
- `Person` (id, name, dob, gender, address, occupation, role: accused/victim/witness)
- `FIR` (id, station_id, date, crime_type, description, status, location_lat_lng)
- `Case` (id, fir_ids[], status, investigating_officer_id, summary)
- `PoliceStation` (id, name, district, jurisdiction_geo)
- `Vehicle` (id, reg_no, owner_person_id)
- `PhoneRecord` (id, number, owner_person_id)
- `BankAccount` / `UPIHandle` (id, holder_person_id)
- `Weapon` (id, type, linked_case_id)

### Relationship / graph table (adjacency model in Data Store)
- `EntityRelationship` (id, source_entity_type, source_entity_id, target_entity_type, target_entity_id, relationship_type, weight, evidence_ref, created_at)
  - relationship_type ∈ {called, visited, owns, uses, accused_in, victim_of, same_address, same_phone, same_vehicle}

### Semi-structured (Catalyst NoSQL)
- Chat conversation logs (per session, multi-turn context)
- Case narrative text (for semantic/similar-case search)
- Reasoning-engine output objects (mechanism/evidence/alternatives/confidence, for audit)

### Precomputed / cached (Catalyst Cache + scheduled jobs)
- District/station risk scores
- Offender risk scores
- Hotspot cluster results

---

## 9. Non-Functional Requirements
- **Explainability by default**: no prediction or flagged risk is shown without its reasoning chain.
- **Auditability**: every query + response + data touched is logged with investigator ID and timestamp.
- **Role-based data visibility**: enforced at the Function layer, not just UI-hidden.
- **Bilingual parity**: English and Kannada both fully supported for chat and voice, not English-only with translated labels.
- **Latency**: conversational responses should feel interactive (<3–4s for retrieval queries; reasoning-engine queries can show a visible "thinking" state, which also becomes a demo strength if designed well).
- **Data protection**: no real PII in the hackathon build — all seed/synthetic data clearly labeled as such.

---

## 10. Demo Strategy (this is part of the PRD, not an afterthought)
The single highest-leverage moment: live, unscripted-feeling Q&A where a judge asks "why," and the system answers with the mechanism → evidence → alternatives structure in real time, ideally with the network graph visually highlighting the exact nodes/edges cited as evidence. Design the UI so the reasoning trace and the graph visualization are visually linked (clicking a piece of evidence highlights it on the graph). That single interaction communicates the entire value proposition better than any slide.

Secondary demo beats, in order:
1. Multi-turn conversational query (shows context retention)
2. Network graph exploration → auto-surfaced lead (Crime Pattern Theory in action)
3. The "why" moment (reasoning engine, described above) — climax of the demo
4. Quick dashboard glance (proves Challenge 02 breadth without making it the focus)
5. Voice + Kannada query (proves accessibility requirement is real, not decorative)

---

## 11. Open Items / Dependencies
- Official ERD from organizers — needed to finalize exact schema field names/types.
- Confirm Catalyst QuickML's actual support for custom RAG/embeddings vs. boxed LLM serving — affects whether retrieval-augmented reasoning is fully native or needs a workaround.
- Confirm Zia Speech Services' Kannada STT/TTS quality — affects whether voice is a full feature or a scoped-down demo-only path.
- Seed dataset generation plan (volume/realism target) since real 1,100-station data won't be available.
