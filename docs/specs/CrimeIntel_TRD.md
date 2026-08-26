
TECHNICAL REQUIREMENTS DOCUMENT
CrimeIntel
System Architecture & Zoho Catalyst-Native Technical Design
26 / 26 applicable Catalyst capabilities mapped to real subsystems — zero functionality traded away for platform purity
Document Version: 1.0
Companion to: CrimeIntel Product Requirements Document (PRD)

Document Control
Version
Date
Author
Summary of Changes
0.1
Draft
Engineering Team
Architecture skeleton pulled from 26-phase blueprint, Part 0
1.0
Current
Engineering Team
Full TRD: architecture, Catalyst service mapping, data, security, deployment

Table of Contents
TOC \h \o "1-2"


1. Architecture Overview
CrimeIntel is built as a standing intelligence substrate with a hybrid retrieval layer and a multi-agent reasoning pipeline sitting underneath the chat and dashboard UI — not a thin wrapper that calls an LLM per request. Nothing is computed for the first time at query time: a precomputation engine keeps hotspot, gang, offender-risk, similarity, and embedding indices warm ahead of any user question.
1.1 Layered Architecture
Precomputation Engine — nightly + event-driven jobs computing hotspots, risk scores, graph snapshots, embeddings, summaries
Crime Intelligence Layer — always-on layer sitting directly on the data store, read-only for everything above it
Hybrid Retrieval — parallel fan-out across SQL, Graph, Vector, OCR, and Analytics retrievers, merged and deduplicated
Evidence Ranking — recency, relevance, confidence, and graph-proximity scoring before anything reaches an agent
Multi-Agent Coordinator — SQL / OCR / Analytics / Graph / Forecast agents → Summarizer → Verifier
Chat / Dashboard UI — with Semantic Memory carrying conversational context forward
Human Feedback & Learning — supervisor review, correction capture, prompt/re-ranker improvement
Observability, Knowledge Versioning, Security-Beyond-RBAC, and Data & Application Security wrap around every layer above rather than living in only one of them.
1.2 Request Lifecycle (Single Query, Start to Finish)
1. Investigator submits a question via chat or voice. 2. API Gateway validates the request shape and rate limit before Authentication validates the token, role, and MFA state. 3. Semantic Memory merges prior conversational context. 4. The Retrieval Orchestrator fans the enriched query out in parallel to SQL, Graph, Vector, OCR, and Analytics retrievers. 5. Results are merged, deduplicated, and passed through the Security layer for masking/redaction before ranking. 6. Evidence Ranking scores the masked evidence set. 7. The Multi-Agent Coordinator synthesises a narrative with citations (Summarizer), then checks every claim against the evidence (Verifier) — unsupported claims are flagged for human review rather than presented as fact. 8. The query, evidence returned, and masking decisions are all audit-logged. 9. The final answer, Reasoning Block, and citations render in the UI with graph/map highlighting and an "as of" data-freshness footer.
2. Design Principles
Catalyst-first: every capability Catalyst provides is used for that capability before reaching for an external service (Section 4).
No functionality is compromised for platform purity: where Catalyst has a genuine capability gap, an external dependency is used and explicitly labelled — never silently substituted or hidden (Section 6).
Standing computation, not on-demand: precompute what is expensive and reusable; never trigger a cold, from-scratch computation inline on a user request.
Evidence before language: the hybrid retrieval layer runs before the LLM ever sees the question; the LLM synthesises over retrieved, masked evidence — it never freelances.
Masking and encryption are independent, stacked controls, not one control wearing two names.
Every retrieval is audited, not only every UI action.
Cost is a first-class design constraint, tracked from day one, not reconciled after the fact.

3. Technology Stack Summary
Layer
Technology
Notes
Frontend
Next.js (React), TypeScript, Tailwind CSS
SSR hosted on Catalyst AppSail
Backend / Business Logic
Node.js on Catalyst Serverless Functions
Least-privilege service identity per Function
Orchestration
Catalyst Circuits
Multi-agent fan-out, branching, parallel steps
Relational Data
Catalyst Data Store
System of record — CaseMaster and all FIR relational tables
Semi-structured Data
Catalyst NoSQL
Embeddings, chat sessions, reasoning outputs, case narratives
Object Storage
Catalyst Stratus
Scanned FIRs, photos, audio evidence, exported PDFs
Caching
Catalyst Cache
Sub-50ms reads for hot indices and dashboard aggregations
AI / ML
Catalyst QuickML (LLM Serving, RAG), Catalyst Zia AutoML, Catalyst Zia Services
Embeddings, reasoning synthesis, tabular risk models, OCR/voice/vision
Identity
Catalyst Authentication
5-role RBAC, MFA, token rotation
Edge / API
Catalyst API Gateway
Rate limiting, schema validation, replay protection
Automation Docs/Reports
Catalyst SmartBrowz
Headless-browser PDF/report generation
Integrations
Catalyst Connections
OAuth-token-managed access to Zoho/KSP/3rd-party systems
Scheduling
Catalyst Cron
Nightly precomputation, retention/purge, backup verification
Eventing
Catalyst Signals
Cross-service event bus for real-time updates
Notifications
Catalyst Mail, Catalyst Push Notifications
Supervisor approvals, alert delivery, incident notices
CI/CD
Catalyst Pipelines
Build, test, dependency/secret scanning, deploy
Graph / Visualization (client)
React Flow, D3.js
Non-Catalyst client libraries — see Section 6
Map tiles
External mapping provider
Non-Catalyst — see Section 6

4. Zoho Catalyst Service Mapping — Full Inventory
This is the single source of truth judges and reviewers are shown when asked "what does Catalyst actually do here?" Every one of the 26 platform capabilities is mapped to a concrete CrimeIntel subsystem — none are included decoratively.
#
Capability
Catalyst Service
Used By / Purpose in CrimeIntel
1
Serverless functions / backend logic
Catalyst Functions
Every subsystem's business logic: chat-handler, query-engine, graph-engine, reasoning-engine, audit-logger, retrieval orchestrator agents, cron-job handlers. Nearly every phase depends on this.
2
Docker image deployment
Catalyst AppSail (custom OCI runtime)
Containerised services with dependencies Functions can't host natively — e.g. a custom OCR/graph-analytics runtime image used by the OCR Document Intelligence and GNN modules.
3
Full web app in a managed runtime
Catalyst AppSail (managed runtime)
Hosts the production Next.js SSR frontend end to end.
4
Frontend / SPA / Next.js static site
Catalyst Slate / Web Client Hosting
Static marketing/login shell and any statically-exportable admin views.
5
Custom domain + SSL
Catalyst Domain Mappings
Production KSP-branded domain with managed SSL for the pilot deployment.
6
Relational database
Catalyst Data Store
System of record for CaseMaster and all 23 relational FIR tables; row-level enforcement point for RBAC masking.
7
Unstructured / semi-structured data
Catalyst NoSQL
Embeddings, chat sessions, case narratives, reasoning outputs, semantic-memory context objects.
8
Object / blob storage (S3-style)
Catalyst Stratus
Scanned FIRs, evidence photos/audio, exported PDF reports, backup video for the demo fallback.
9
Cache
Catalyst Cache
Hot hotspot/gang/offender-score indices and dashboard aggregations, sub-50ms reads.
10
Full-text search (within Data Store)
Catalyst Data Store full-text search
Free-text search over BriefFacts and other narrative fields for the SQL/text retriever path, before falling back to vector search for semantic matches.
11
Text LLMs / RAG / knowledge bases
Catalyst QuickML (LLM Serving, RAG)
GraphRAG pipeline, reasoning synthesis, Summarizer and Verifier agents, chat answer generation.
12
No-code ML pipelines
Catalyst QuickML
Rapid iteration on the similarity-index and embedding-index pipelines without hand-rolled training infrastructure.
13
Automated model training (tabular)
Catalyst Zia AutoML
Offender recidivism/risk scoring and crime-forecast models trained on tabular FIR-derived features.
14
OCR / Face / Text Analytics / Image Mod / Object Recognition / Barcode / ID Scanner
Catalyst Zia Services
OCR of scanned FIRs and evidence documents (Phase 20); image moderation on uploaded evidence photos; ID/barcode scanning for evidence intake.
15
Voice services (speech-to-text, text-to-speech, translation)
Catalyst Zia Services
Primary engine for the bilingual EN/KN voice interface; see Section 6 for the fallback path if Kannada coverage proves insufficient.
16
PDF / image-based report generation, screenshots, headless browser, scraping
Catalyst SmartBrowz
Conversation-to-PDF export, case report generation, and rendering print-quality dashboard/graph snapshots into reports.
17
User auth / login / signup
Catalyst Authentication
5-role RBAC identity, MFA for Investigator/Supervisor/Administrator, session-timeout policy, token rotation.
18
API routing, throttling, auth in front of Functions / Web Client Hosting
Catalyst API Gateway
Public edge for every Function and the hosted frontend: rate limiting, schema validation, replay-attack protection before any request reaches business logic.
19
OAuth tokens for Zoho / 3rd-party services
Catalyst Connections
Managed OAuth credentials for the external mapping/tile provider, any Kannada NLU fallback service, and future KSP CCTNS/ICJS integration — least-privilege, never a shared "god credential."
20
Scheduled jobs / cron / job pools
Catalyst Cron
Nightly precomputation refresh, data retention/purge jobs, backup-verification jobs, forecast-model retraining cadence.
21
Reacting to in-project events (DB inserts, file uploads, signups)
Catalyst Signals + Event Functions
New-FIR-insert triggers incremental hotspot/graph index update; new evidence upload triggers OCR/Zia pipeline; new user signup triggers RBAC provisioning.
22
Cross-app event bus / event routing
Catalyst Signals
Backbone for Phase 17's real-time event processing — routes case updates to the dashboard, graph, and alerting subsystems without polling.
23
Multi-step workflow / orchestration with branches and parallel steps
Catalyst Circuits
Multi-Agent Coordinator's SQL/OCR/Analytics/Graph/Forecast fan-out and Summarizer → Verifier chain; reveal-request approval workflow (request → Supervisor branch → audit log).
24
Transactional email
Catalyst Mail
Reveal-request notifications, "needs review" escalations to Supervisors, incident-response alerts, weekly digest to Administrators.
25
Push notifications (web / Android / iOS)
Catalyst Push Notifications
Forecast/alert delivery to the Mobile PWA (Phase 19) and desktop web sessions when a risk threshold is crossed.
26
CI / CD
Catalyst Pipelines
Build, dependency/secret scanning, mandatory code-review gate, test, and deploy automation for every merge to a protected branch.

4.1 Catalyst Service Inventory by Phase
Catalyst Service
Used By (Blueprint Phases)
Purpose
Data Store
0.0, 1.3, 3, 0.15
System of record for CaseMaster and all relational FIR tables; row-level enforcement
NoSQL
0.1, 0.4, 0.11
Embeddings, chat sessions, case narratives, reasoning outputs
Cache
0.1, 0.9, 15.2
Sub-50ms reads for hotspot/gang/offender scores and hot aggregations
Stratus
0.8, 20
Scanned FIRs, photos, audio evidence, exported PDFs
Functions
Nearly every phase
All backend business logic; least-privilege per 0.16.2
Circuits
0.5, 21
Multi-Agent Coordinator fan-out; approval workflows
Authentication
2, 0.16.2
Identity, 5-role RBAC, MFA enforcement
API Gateway
1.3, 0.16.2
Public edge — first line of defense before any Function runs
QuickML / LLM Serving
0.4, 0.5, 6, 16
Embeddings, summarization, reasoning synthesis
Zia AutoML
8, 10
Tabular offender-risk and crime-forecast model training
Zia Services
11, 20
OCR, image moderation, ID/barcode scan, voice STT/TTS/translation
SmartBrowz
13, 26
PDF/report export, print-quality dashboard snapshots
Pipelines
1.3, 0.16.2
Build, test, and deploy automation; dependency/secret scanning
Cron
0.9, 0.16.1
Scheduled index refresh, backup verification, data anonymization
Signals
17, 21
Event-driven incremental updates; cross-service event routing
Connections
0.16.2, 19 (mapping/Kannada fallback)
OAuth-managed access to external and future KSP systems
Mail
0.14, 0.16.2
Reveal-request and review-queue notifications, incident alerts
Push Notifications
10, 19
Forecast/alert delivery to PWA and web sessions
AppSail
15.5, 26
Hosts the Next.js SSR frontend; custom OCI runtime for containerised OCR/GNN workloads
Domain Mappings
15.5, 26
Production custom domain with managed SSL

5. Data Architecture
5.1 Source Schema
Built against the KSP Police FIR ER Diagram: 23 tables across six domains, with CaseMasterID as the spine every retriever joins through. Only CaseMaster carries point-level geolocation — arrests, courts, and units carry district/state-level geo only, so any "arrest location" view is district-level by design, not a gap.
Domain
Tables
Notes
Case Core
CaseMaster, ComplainantDetails, Victim, Accused, ArrestSurrender, ActSectionAssociation, ChargesheetDetails
CaseMasterID is the spine every other case-core table joins through
Legal Classification
Act, Section, CrimeHead, CrimeSubHead, CrimeHeadActSection
Feeds crime-type trend analytics and reasoning-theory matching
Socio-Demographic Lookups
CasteMaster, ReligionMaster, OccupationMaster
Most sensitive linkage data in the schema; lookups themselves are Internal, per-person linkage is Highly Restricted
Case Metadata Lookups
CaseCategory, GravityOffence, CaseStatusMaster
Operational classification, Internal sensitivity
Org / Geo Structure
State, District, Unit, UnitType, Court
District/state-level geo only outside CaseMaster
Personnel
Employee, Rank, Designation
Personnel PII fields are Restricted

5.2 Data Sensitivity Classification
Every column is tagged Public / Internal / Restricted / Highly Restricted before it is wired into any retriever, dashboard, or export. This table is the authoritative source for both the RBAC masking layer (Section 8.1) and field-level encryption (Section 8.2).
Field / Category
Classification
Control
Caste / religion linkage (ComplainantDetails.CasteID / ReligionID)
Highly Restricted
Field-level encryption + masked reveal, both audited
Juvenile / sensitive-crime victim identity
Highly Restricted
Field-level encryption + masked reveal, both audited
Complainant / Accused / Victim PII (name, age, gender)
Restricted
RBAC masking with logged reveal
CaseMaster.latitude/longitude, BriefFacts
Restricted (Highly Restricted if linked to a sensitive-crime category)
RBAC masking; precise location can re-identify a residence
Employee PII (DOB, KGID)
Restricted
RBAC masking with logged reveal
Operational fields (CrimeNo, CaseStatusID, UnitID, etc.)
Internal
Standard RBAC scoping, no reveal workflow required
Legal/organizational reference data (Act, Section, District, Court, etc.)
Public / Internal
No PII, freely joinable

5.3 Known Schema Gaps (documented, not silently patched)
inv_arrestsurrenderaccused — appears in the relationship matrix (ArrestSurrender ↔ Accused, one-to-many via junction) but has no column definition in the source table list; a reasonable-assumption schema is used and flagged pending KSP confirmation.
Inv_OccuranceTime — listed as a one-to-one child of CaseMaster but never defined; CaseMaster's own IncidentFromDate/IncidentToDate are treated as authoritative until confirmed otherwise.
No explicit informant-identity table exists; ComplainantDetails is used as the closest analog for the field-level encryption requirement, pending KSP confirmation of whether informants are modelled separately in production.
5.4 Storage Mapping
Relational FIR data (all 23 tables) → Catalyst Data Store, with row-level RBAC enforcement
Embeddings, chat sessions, reasoning outputs, semantic-memory context → Catalyst NoSQL
Scanned documents, evidence media, exported PDFs → Catalyst Stratus (encrypted at rest)
Hot precomputed indices (hotspot, gang, offender-risk, similarity, graph snapshot, embedding) → Catalyst Cache (hot) + Catalyst NoSQL (durable), each with a computed_at and snapshot_version field

6. Non-Catalyst Dependencies (Explicitly Called Out)
Every phase document must be able to say precisely what is Catalyst-native and what is not — nothing is described as "Catalyst" that is actually an external wrapper. The following are the only capabilities in this build that fall outside Catalyst's native service catalogue, each with the reason and the specific, minimal external component used in its place. No functional requirement in the PRD is dropped or degraded because of a Catalyst gap.
Capability Needed
Why Catalyst Doesn't Cover It
What Is Used Instead
Map tile rendering for the geospatial layer
Catalyst does not natively provide map tiles.
A standard external map-tile provider (e.g. Mapbox/OpenStreetMap-compatible), integrated via a Catalyst Connection so the OAuth/API key is centrally managed and least-privilege, never embedded client-side.
Kannada speech-to-text / text-to-speech, if Zia Services' native coverage is insufficient
Zia Services (item 15) is the primary voice engine; this is a documented fallback only if Kannada accuracy falls short in testing.
A supplementary Kannada ASR/TTS service, integrated via a Catalyst Connection, invoked only for the Kannada voice path — English and Kannada-text-only paths remain fully on Zia Services.
Kannada NLU / entity-extraction tokenization, if QuickML's native language coverage is insufficient
Documented fallback only, evaluated during Phase 11 build.
A supplementary Kannada NLU service behind the same retrieval interface, so the rest of the pipeline is language-agnostic to the swap.
Client-side graph and chart rendering (React Flow, D3.js)
These are frontend rendering libraries, not backend services — Catalyst has no equivalent and none is needed; they render data Catalyst-side services already computed.
Used purely as presentation libraries inside the Next.js frontend hosted on Catalyst AppSail; never described as "Catalyst" in the service inventory or the pitch.
GNN training framework for community-evolution / influence-propagation (Phase 18 upgrade)
Catalyst Zia AutoML covers tabular model training; graph-neural-network training is a specialised workload outside that scope.
A standard GNN framework run as a batch job, packaged into a Docker image and deployed via Catalyst AppSail's custom OCI runtime so it stays inside the Catalyst deployment surface even though the training library itself is external.

7. Core Subsystem Design
7.1 Crime Intelligence Layer (Standing Computation)
A dedicated Catalyst Functions group, intelligence-layer/, runs as a long-lived, cache-backed service rather than a request/response handler. It maintains six indices — hotspot, gang-score, offender-score, similarity, embedding, and graph — each stored in Catalyst Cache (hot) and Catalyst NoSQL (durable) with computed_at and snapshot_version fields. Chat, Dashboard, and Agents only read from this layer; none of them trigger a full recomputation inline.
7.2 Hybrid Retrieval Architecture
A Retrieval Orchestrator runs SQL (Catalyst Data Store, including full-text search), Graph, Vector (Catalyst QuickML embeddings), OCR (Zia Services output indexed in Data Store full-text search), and Analytics retrievers in parallel via Catalyst Circuits, merging results into a single deduplicated evidence set tagged by source retriever for citation and versioning. A retriever timeout degrades gracefully — for example, proceeding with SQL + Vector if Graph is slow — rather than blocking the whole response.
7.3 Entity Resolution Engine
Canonical person records are built by merging aliases, duplicate names, and shared vehicle/phone identifiers, backed by a review queue in Catalyst Data Store for merge decisions that fall below a confidence threshold — these are surfaced to a Supervisor rather than auto-merged silently.
7.4 GraphRAG Pipeline
Vector search (QuickML embeddings) locates semantically similar narratives, expands through the precomputed graph index for relationship context, re-ranks the combined set through Evidence Ranking (7.6), and only then passes the masked, ranked evidence to the LLM (QuickML LLM Serving) for synthesis.
7.5 Multi-Agent Architecture
A Catalyst Circuit orchestrates SQL, OCR, Analytics, Graph, and Forecast agents in parallel, feeding a Summarizer agent that drafts a cited narrative, followed by a Verifier agent that checks every claim against the evidence set and flags anything unsupported for the human feedback loop (7.9) instead of surfacing it as fact.
7.6 Evidence Ranking
Every evidence item is scored on recency, textual/semantic relevance, source confidence, and graph proximity to the query's subject entity before it reaches an agent — so the LLM is always working from a ranked, not merely concatenated, evidence set.
7.7 Semantic Memory
Structured conversational context (district, crime type, timeframe, active entity focus) is persisted per session in Catalyst NoSQL, so a follow-up question like "show only repeat offenders" correctly narrows the prior result set without the investigator repeating context.
7.8 Precomputation Engine
Catalyst Cron drives nightly full refreshes and Catalyst Signals drives event-driven incremental refreshes (e.g., on new FIR insert) of every index in 7.1, so query-time computation is always a cache read, never a cold start.
7.9 Continuous Learning & Human Feedback Loop
Wrong / correct / needs-review flags captured from the UI, plus every Verifier-flagged answer, route into a Supervisor review queue (Catalyst Circuits approval workflow, Catalyst Mail notification). Approved corrections feed prompt and re-ranker improvements — this is explicitly a feedback loop for prompts and ranking weights, not a claim of live model retraining.

8. Security Architecture
8.1 RBAC & Query-Level Governance (Security Beyond RBAC)
Field masking: Restricted/Highly Restricted fields are masked by default; an explicit, audited reveal action is required to view them
Row-level permissions: enforced at the Catalyst Data Store query layer, verified so a crafted query cannot bypass a role's district/case scope
Query auditing: every retrieval — not only UI navigation — is logged with who, what, when, and which rows were returned
Anomaly detection for misuse: unusual access-volume patterns are flagged for Administrator review
Sensitive-entity redaction: configurable, override-only redaction for categories such as juvenile victims, applied regardless of role unless explicitly and auditably overridden
8.2 Data & Application Security
8.2.1 Data Security
Encryption at rest and in transit across Data Store, NoSQL, and Stratus; TLS enforced on every internal hop, not just the public API Gateway edge
Field-level encryption for Highly Restricted columns, independent of and stacked on top of RBAC masking — an authorized reveal still triggers a separately audited decryption step
Retention & purge policy for raw OCR scans, voice recordings, and chat transcripts via a scheduled Catalyst Cron job, not indefinite retention by default
Backup & disaster recovery with documented RPO/RTO targets and at least one tested restore drill
Sensitivity tagging is a required step of adding any new field — classified before it is wired into any retriever, dashboard, or export
8.2.2 Application Security
Secure SDLC: dependency and secret scanning wired into Catalyst Pipelines, with a mandatory code-review gate before merge to a protected branch
API Gateway hardening: rate limiting, request schema validation, and replay-attack protection enforced at the Catalyst API Gateway, before any Function is reached
Authentication hardening: MFA for Investigator/Supervisor/Administrator roles, defined session-timeout policy, token rotation via Catalyst Authentication
Least-privilege service identities: every Function and Circuit is granted only the specific Connections/permissions it needs — no shared credential across the backend
Incident response plan: documented runbook wired to Observability (Section 9) and anomaly detection (8.1), rehearsed as a tabletop exercise
LLM data-boundary statement: a written, verifiable statement of exactly what leaves the Catalyst environment on a QuickML call — evidence is always masked/redacted per 8.1 before it is included in a prompt, and no raw Highly Restricted field is ever sent to a model call
8.3 Identity & Access Summary
Catalyst Authentication is the single identity provider for all five roles (Constable, Investigator, Inspector, Supervisor, Administrator). MFA is enforced for the three roles with reveal or approval capability. Every Function and Circuit authenticates to its downstream Catalyst services with a scoped, least-privilege identity rather than a shared service account.
9. Observability, Knowledge Versioning & Cost Governance
9.1 Observability
Tracks AI latency, OCR failure rate, cache hit ratio, and retrieval accuracy, feeding both the Administrator panel and the incident-response runbook (Section 8.2.2).
9.2 Knowledge Versioning
Every AI answer is tied to a snapshot_version across the FIR data, OCR index, graph index, and embedding index used to produce it — so any answer can be reproduced or audited against exactly the evidence state that generated it, even after nightly reindexing.
9.3 Cost & Credit Awareness
Every Function/Circuit invocation, QuickML call, and Cron job consumes Catalyst credits, tracked from the first phase of the build rather than reconciled retroactively. This feeds the Administrator panel's cost-monitoring widget, and any phase whose design would blow the credit budget at scale (e.g., inline recomputation instead of the standing intelligence layer in Section 7.1) is flagged during design review, not after deployment.

10. Deployment Architecture
Component
Catalyst Service
Notes
Frontend (Next.js SSR)
Catalyst AppSail — managed runtime
Production hosting behind Domain Mappings + API Gateway
Static/admin shell
Catalyst Slate / Web Client Hosting
Statically-exportable views
Backend business logic
Catalyst Serverless Functions
One Function group per subsystem; least-privilege identity each
Containerised workloads (OCR runtime, GNN batch jobs)
Catalyst AppSail — custom OCI runtime
Docker image deployment for workloads Functions can't host natively
CI/CD
Catalyst Pipelines
Scan → test → review gate → deploy, on every merge to a protected branch
Domain & SSL
Catalyst Domain Mappings
Production KSP-branded domain, managed certificate

10.1 Environments
Development — individual Catalyst project environment per engineer, synthetic dataset only
Staging — shared Catalyst environment, full synthetic dataset (500+ persons, 200+ FIRs, 2,000+ edges), used for the rehearsed demo and integration testing
Production / Pilot — KSP-branded domain, hardened per Section 8, real or KSP-approved data only after sign-off
11. Performance & Scalability Targets
Target
Threshold
Notes
Precomputed index read (Cache)
<50ms
Hotspot/gang/offender score reads
Chat answer, cached retrieval path
<3s p50 / <6s p95
End-to-end, including masking + ranking
Dashboard cross-filter update
<500ms
Chart-to-chart interaction on one view
Graph render, 500+ node dataset
No visible interaction lag
Synthetic demo-scale dataset
Nightly precomputation window
Completes before business-hours query load
Catalyst Cron scheduled job
API Gateway rejection of malformed/replayed requests
Before reaching any Function
Verified in load/security testing

12. Representative API Surface
All endpoints sit behind Catalyst API Gateway (rate limiting, schema validation, replay protection) and Catalyst Authentication (RBAC + MFA where applicable). The list below is representative, not exhaustive; the full OpenAPI specification is maintained alongside the codebase per Phase 25's public API documentation deliverable.
Endpoint
Purpose
Minimum Role
POST /api/chat/query
Submit an investigator question; returns cited answer + reasoning block
Investigator+
GET /api/graph/network
Fetch network graph for a case/person/cluster
Investigator+
GET /api/dashboard/hotspots
Precomputed hotspot heatmap data
Investigator+
POST /api/reveal/request
Request masked-field reveal with justification
Investigator+, approval by Supervisor
GET /api/audit/log
Query the audit log
Supervisor (own district), Administrator (all)
POST /api/export/report
Generate a PDF report via SmartBrowz
Investigator+
GET /api/forecast/alerts
Active forecast/risk alerts
Investigator+, approval action for Supervisor
GET /api/admin/cost
Catalyst credit/cost dashboard data
Administrator only
13. Appendix
13.1 Related Documents
Product Requirements Document (PRD) — CrimeIntel — functional requirements, personas, RBAC, KPIs, roadmap
CrimeIntel 25-Phase Development Blueprint (source planning document)
13.2 Traceability
Every Catalyst service in Section 4 and every non-Catalyst dependency in Section 6 is traceable to a specific blueprint phase; this table is regenerated from the blueprint's own Phase 0.17 chapter, not maintained as a separate, divergent source of truth.