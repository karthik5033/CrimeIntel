
PRODUCT REQUIREMENTS DOCUMENT
CrimeIntel
AI Investigator Copilot & Analytics Platform for Karnataka State Police
Built natively on Zoho Catalyst — Datathon 2026, Challenge 01 & Challenge 02
Document Version: 1.0
Status: Draft for Build — Companion to the Technical Requirements Document (TRD)
Owner: CrimeIntel Product & Engineering Team

Document Control
Version
Date
Author
Summary of Changes
0.1
Draft
Product Team
Initial scope pulled from 26-phase development blueprint
1.0
Current
Product Team
Full PRD: requirements, personas, RBAC, NFRs, KPIs, roadmap

Table of Contents
TOC \h \o "1-2"


1. Executive Summary
CrimeIntel is an AI-native investigator copilot and crime analytics platform built for the Karnataka State Police (KSP), designed to answer two Datathon 2026 challenge briefs from a single, shared intelligence substrate: a conversational AI copilot that lets an investigator interrogate case data in natural language (English and Kannada), and an analytics/visualization platform that turns siloed FIR data into proactive, explainable intelligence.
Today, FIR data across 1,100+ KSP stations is siloed, dashboards are static and backward-looking, and there is no standing layer that surfaces risk, linkages, or emerging patterns before an investigator has to go looking for them. CrimeIntel replaces this with a standing precomputation and retrieval substrate, a multi-agent reasoning layer that cites its evidence, and a governance layer that treats caste, religion, juvenile-victim and informant data as first-class sensitive fields rather than an afterthought.
The platform is built Catalyst-first: every capability in Zoho Catalyst's service catalogue — compute, data, AI/ML, events, workflow, security, and delivery — is mapped to a concrete feature in this product (see the companion Technical Requirements Document, Section 4, for the full 26-service inventory). Where Catalyst has no native capability — for example, map-tile rendering or Kannada-specific speech models beyond Zia's coverage — an external, clearly labelled dependency is used instead, so no functionality is ever sacrificed to stay "Catalyst-native."
2. Problem Statement & Background
2.1 The Problem
FIR data is captured consistently at the station level but is not usable as intelligence — it sits in silos with no cross-station or cross-district correlation.
Existing dashboards are static: they report what already happened, with no standing computation of hotspots, gang activity, or offender risk ahead of time.
Investigators lack a natural-language way to ask cross-cutting questions ("why is Whitefield flagged this month?") and get a cited, verifiable answer instead of a raw LLM guess.
Network and financial-crime linkages between accused, victims, and cases are not visualised; they must be reconstructed manually, case file by case file.
Sensitive attributes (caste, religion, juvenile-victim identity) are not consistently protected at the field level, creating both an ethical and a compliance risk.
Kannada-speaking officers and the wider public-facing use case are not well served by English-only tooling.
2.2 Why Now
KSP's Datathon 2026 defines two connected challenge briefs — a conversational AI investigator copilot (Challenge 01) and an analytics/visualisation platform with predictive risk scoring (Challenge 02). Building both on one shared intelligence substrate, rather than as two disconnected apps, is both more efficient to build and more convincing to demonstrate: the same evidence that answers a chat question also drives the dashboard, the network graph, and the forecast.
2.3 Source Data
The system is built against the KSP Police FIR ER schema (23 tables spanning Case Core, Legal Classification, Socio-Demographic Lookups, Case Metadata, Org/Geo Structure, and Personnel domains), with CaseMasterID as the spine every subsystem joins through. Full schema-to-subsystem mapping and sensitivity classification live in the TRD, Section 5.
3. Goals & Objectives
3.1 Business / Mission Goals
Give every investigator a single place to ask a question and get a cited, trustworthy answer — not a black-box AI guess.
Move KSP from reactive, static dashboards to a standing intelligence layer that computes hotspots, gang activity, and offender risk continuously.
Make criminal network and financial-crime linkages visible and explorable, not something reconstructed manually per case.
Build in data governance (masking, field-level encryption, audit) as a first-class design constraint, not a bolt-on.
Serve KSP officers in both English and Kannada, including voice, without a second-class experience in either language.
Demonstrate a credible, cost-aware, production path from hackathon build to a genuine pilot deployment.
3.2 Success Definition
The product succeeds if an Inspector can hold a multi-turn conversation about a real investigative question, receive an answer with clickable evidence citations, see that evidence highlighted live on a network graph and a map, and export the whole exchange as a professional report — all within a role-appropriate, audited, and masked view of the underlying data. Section 10 (Success Metrics) defines the quantitative bar.
4. Target Users & Personas
CrimeIntel implements a 5-role RBAC model. Each role sees the same underlying platform through a progressively wider, and independently audited, lens.
Role
Profile
Core Needs
Notes
Constable
Frontline duty officer, station level
Look up case status, log basic queries, view district-level (not cross-district) data
Narrowest data scope; no reveal permission on Restricted/Highly Restricted fields
Investigator (SI/PSI)
Investigating officer assigned to active cases
Ask multi-turn investigative questions, explore network graph, view reasoning & evidence, request masked-field reveal with justification
Primary persona for Challenge 01's conversational copilot
Inspector
Station house officer / case supervisor
All Investigator capabilities + cross-case comparison, dashboard drilldowns, offender profiling
Primary persona for the Phase 15/26 flagship demo flow
Supervisor (DySP / higher)
District/range-level oversight
Approve reveal requests, review "needs review" AI flags, access district-wide analytics and forecast alerts
Human-in-the-loop approver for Phase 0.14's feedback loop
Administrator
IT/platform administrator
User & role management, audit log review, cost/credit monitoring, anomaly-access alerts, system configuration
Only role with visibility into the Admin Panel and Catalyst cost dashboard
5. Scope
5.1 In Scope (Build Phases 1–15)
Conversational AI investigator copilot with multi-turn context, bilingual (EN/KN) and voice support
Hybrid retrieval (SQL + Graph + Vector + OCR + Analytics) feeding a multi-agent reasoning pipeline with citations and a Verifier check
Criminal network graph with auto-surfaced leads and link-analysis algorithms
Theory-driven reasoning engine (four investigative theories, confidence scoring, alternative explanations)
Analytics dashboard: hotspot heatmap, 7+ charts, cross-filtering, time slider, district drilldowns
Offender profiling, case management, and similar-case retrieval
Financial crime / money-trail analysis with mule detection and circular-flow visualisation
Crime forecasting, early-warning scoring, and alerting
Explainability, audit trail, and data governance (masking, field-level encryption)
PDF/report export and conversation export
Sociological insights module (socio-demographic correlations, anomaly detection)
5.2 In Scope (Upgrade Phases 16–25 — Enterprise Hardening)
Advanced NLP/RAG with production-grade embeddings and semantic search
Real-time event processing and live dashboard/graph updates
Graph neural network (GNN)-based community evolution and influence propagation
Mobile-optimised PWA with offline support and push notifications
OCR document intelligence for scanned FIRs with auto-linking
Multi-agent orchestration via Catalyst Circuits at scale
Advanced, customisable visualisation and report builder
Security hardening, penetration testing, and compliance sign-off
Performance engineering, load testing, and full observability
Extensibility: plugin architecture, public API docs, multi-tenancy
5.3 Out of Scope (this release)
Direct write-back or integration into KSP's production CCTNS/ICJS systems (read/ingest-oriented for the pilot; write-back is a future-phase decision requiring KSP sign-off)
Predictive policing decisions that trigger automated field action without human review — every forecast/alert routes to a human Supervisor
Languages beyond English and Kannada in this release
Native iOS/Android app store builds (PWA only; Section 5.2 covers install-to-homescreen)

6. Functional Requirements
Requirements are grouped by product module. Priority: P0 = required for the flagship demo and MVP pilot; P1 = required for enterprise upgrade; P2 = stretch / extensibility.
6.1 Conversational AI Investigator Copilot  (Blueprint Phase 4, 0.2, 0.4, 0.5, 0.11)
ID
Requirement
Priority
Acceptance Criteria
FR-1.1
User can ask free-text investigative questions in a chat interface and receive a natural-language answer.
P0
Answer returned in <3s p50 for cached retrieval paths; includes at least one evidence citation when evidence exists.
FR-1.2
System retains conversational context across turns (district, crime type, timeframe) without the user repeating it.
P0
A follow-up question like "show only repeat offenders" correctly narrows the prior result set.
FR-1.3
Every answer includes clickable citations linking to the underlying SQL row, graph node, document span, or aggregate that produced it.
P0
100% of factual claims in a sampled answer set trace to a real evidence item; unsupported claims are flagged, not presented as fact.
FR-1.4
System supports voice input/output in English and Kannada.
P1
Spoken Kannada query returns a spoken Kannada answer with equivalent accuracy to the English path.
FR-1.5
A "needs review" flag is shown, and answer is routed to a Supervisor, when the Verifier agent cannot confirm a claim against evidence.
P0
Flagged answers are visibly distinguished in the UI and appear in the Supervisor review queue.

6.2 Criminal Network Graph  (Blueprint Phase 5, 0.3)
ID
Requirement
Priority
Acceptance Criteria
FR-2.1
Interactive network graph renders accused/victim/complainant relationships derived from shared case membership.
P0
Graph renders 500+ node synthetic dataset without visible lag on interaction.
FR-2.2
System auto-surfaces candidate leads (e.g., activity/node overlap) without the user having to search for them.
P0
At least one auto-surfaced lead is present for the seeded gang-cluster demo scenario.
FR-2.3
Entity resolution merges aliases, duplicate names, and shared vehicle/phone identifiers into a canonical person record.
P0
Seeded alias pairs resolve to one canonical node with a reviewable merge decision.
FR-2.4
Clicking a graph node/edge highlights the same entity in chat citations and the map, and vice versa.
P1
Cross-highlighting verified across chat → graph → map in the demo flow.

6.3 Theory-Driven Reasoning Engine  (Blueprint Phase 6)
ID
Requirement
Priority
Acceptance Criteria
FR-3.1
System proposes up to four investigative theories for a flagged case/area with supporting evidence per theory.
P0
Each theory lists at least one distinct evidence citation and a confidence score.
FR-3.2
System explicitly surfaces alternative explanations, not only its top theory.
P0
UI displays at least one alternative theory alongside the primary one.
FR-3.3
Every reasoning output is logged for audit with the evidence snapshot version used.
P0
Audit log entry exists and is retrievable per reasoning output (ties to FR-9.x).

6.4 Analytics Dashboard & Geospatial Intelligence  (Blueprint Phase 7)
ID
Requirement
Priority
Acceptance Criteria
FR-4.1
Dashboard shows a crime hotspot heatmap at district → station → beat granularity.
P0
Heatmap renders from CaseMaster.latitude/longitude with correct point-level accuracy where present, district-level fallback elsewhere.
FR-4.2
Dashboard includes 7+ interactive charts (trend, category mix, comparison) with cross-filtering.
P0
Selecting a filter on one chart updates all others on the same view within 500ms.
FR-4.3
A time slider lets the user scrub historical trend data.
P1
Slider updates the heatmap and charts in sync.

6.5 Offender Profiling & Case Management  (Blueprint Phase 8)
ID
Requirement
Priority
Acceptance Criteria
FR-5.1
System generates an offender profile with a computed recidivism/risk score and case history.
P0
Profile score recalculates automatically as new cases link to the person.
FR-5.2
System surfaces similar past cases by outcome and MO similarity.
P1
Top-5 similar cases ranked by a documented similarity metric.
FR-5.3
Case management view tracks status, assigned officer, and chargesheet outcome.
P0
Status updates are reflected in the profile and dashboard without manual resync.

6.6 Financial Crime & Transaction Analysis  (Blueprint Phase 9)
ID
Requirement
Priority
Acceptance Criteria
FR-6.1
System visualises money-trail flows between entities as a Sankey diagram.
P1
Seeded circular-flow scenario renders correctly and is visually distinguishable from a linear flow.
FR-6.2
System flags potential mule-account patterns.
P1
Seeded mule scenario is flagged with a documented rule/score basis.

6.7 Forecasting & Alerts  (Blueprint Phase 10)
ID
Requirement
Priority
Acceptance Criteria
FR-7.1
System forecasts near-term crime-risk trends by area/category.
P0
Forecast heatmap generated on a documented cadence (nightly + event-triggered).
FR-7.2
System raises an alert to the relevant Supervisor role when a risk threshold is crossed.
P0
Alert delivered via in-app + push notification within a defined SLA of threshold breach.

6.8 Bilingual Support (English + Kannada)  (Blueprint Phase 11)
ID
Requirement
Priority
Acceptance Criteria
FR-8.1
Every user-facing screen and the chat/voice interface has full English–Kannada parity.
P1
No untranslated UI strings in a full-screen audit; Kannada chat answers are grammatically coherent, not machine-literal.

6.9 Explainability, Audit & Governance  (Blueprint Phase 12, 0.15, 0.16)
ID
Requirement
Priority
Acceptance Criteria
FR-9.1
Every AI answer displays an explainability badge indicating which retrievers and evidence contributed.
P0
Badge present on 100% of AI-generated answers.
FR-9.2
Every data retrieval — not only UI navigation — is captured in an audit log with who/what/when/which rows.
P0
Audit log entry verified for a sampled query against a crafted cross-district access attempt.
FR-9.3
Sensitive fields (caste, religion, juvenile/sensitive-crime victim identity, informant identity) are masked by default and require an explicit, logged reveal action.
P0
Masked field cannot be read from the API response or UI without a successful, audited reveal.

6.10 Reports & Export  (Blueprint Phase 13)
ID
Requirement
Priority
Acceptance Criteria
FR-10.1
User can export a chat conversation or case summary as a formatted PDF report.
P0
Exported PDF matches an approved KSP-style template and includes citations.

6.11 Sociological Insights  (Blueprint Phase 14)
ID
Requirement
Priority
Acceptance Criteria
FR-11.1
System surfaces socio-demographic correlations (with sensitive-field protections applied) and seasonal/festival crime-pattern analysis.
P2
Correlation output never displays a raw Highly Restricted field value without a reveal action.

6.12 Mobile Experience  (Blueprint Phase 19)
ID
Requirement
Priority
Acceptance Criteria
FR-12.1
Platform is usable as an installable Progressive Web App with offline read access to recently viewed cases.
P1
App is installable to homescreen; core chat/dashboard views degrade gracefully offline.

6.13 OCR Document Intelligence  (Blueprint Phase 20, 0.8)
ID
Requirement
Priority
Acceptance Criteria
FR-13.1
Scanned FIRs and evidence documents are OCR'd, field-extracted, and auto-linked to the relevant CaseMaster record.
P1
Sampled scanned document's extracted fields match source with a documented accuracy threshold.

6.14 Administration & Extensibility  (Blueprint Phase 25)
ID
Requirement
Priority
Acceptance Criteria
FR-14.1
Administrator can manage users/roles, review audit logs, and monitor Catalyst credit/cost consumption from one panel.
P1
Cost widget reflects actual Function/Circuit/QuickML/Cron consumption, not an estimate.


7. Non-Functional Requirements
Category
Requirement
Blueprint Ref.
Performance
Cached retrieval answers return in <3s (p50) / <6s (p95); precomputed indices readable in <50ms from cache.
Phase 0.1, 15, 24
Scalability
Standing precomputation (not inline recomputation) so cost/latency does not scale linearly with concurrent investigators; multi-tenant-ready by Phase 25.6.
Phase 0.9, 24, 25
Availability
Target 99.5% during pilot; documented RPO/RTO with at least one tested restore drill.
Phase 0.16.1
Security & Privacy
Field-level encryption + independent RBAC masking on Highly Restricted data; MFA for Investigator/Supervisor/Administrator; least-privilege service identities.
Phase 0.15, 0.16, 23
Auditability
Every retrieval (not just UI action) is logged; every AI answer traces to a knowledge-version snapshot.
Phase 0.12, 0.13, 12
Accessibility & Language
Full English–Kannada parity across UI, chat, and voice.
Phase 11
Explainability
No AI answer is presented without a citation trail; unverified claims are flagged, never silently presented as fact.
Phase 0.5, 12
Cost Governance
Every Function/Circuit/QuickML/Cron invocation is tracked against a credit budget from Phase 1 onward.
Phase 0.17.3
Compliance readiness
Sensitivity-tagged data dictionary maintained for every new column before it is wired into any retriever, dashboard, or export.
Phase 0.0.2, 0.16
8. Role-Based Access Control Matrix
Capability
Constable
Investigator
Inspector
Supervisor
Administrator
Own-district case data
View only
View + query
View + query (own + cross-case)
View all districts
View all + manage
Cross-district case data
No
No
With justification
Yes
Yes
Restricted-field reveal
No
Request only
Request only
Approve requests
Approve + audit
Highly Restricted field reveal
No
No
No (Supervisor approval required)
Approve, logged
Approve, logged
Network graph / reasoning engine
No
Yes
Yes
Yes
Yes
Forecast & alert review
No
View
View
Approve / dismiss
View
Audit log access
No
No
No
Own-district log
Full system log
User & role management
No
No
No
No
Yes
Cost / credit monitoring
No
No
No
No
Yes

Masking (role-based visibility) and field-level encryption (Phase 0.16) are independent, stacked controls: an approved reveal action still triggers a separately audited decryption step. See TRD Section 8 for the security architecture.
9. Challenge Requirement Traceability
Every official Datathon 2026 Challenge 01 / Challenge 02 requirement maps to a concrete module in this PRD, so nothing on the judging checklist is left unaddressed.
Challenge Requirement
CrimeIntel Module
Chatbot with context retention
Chat Core + Semantic Memory (Phase 4, 0.11)
Explainable AI with audit trails
Reasoning Engine + Explainability/Audit (Phase 6, 12)
Network & link analysis
Criminal Network Graph + Entity Resolution (Phase 5, 0.3)
Bilingual, voice-enabled
Bilingual Support (Phase 11)
Dashboards, geospatial maps, hotspot detection
Analytics Dashboard (Phase 7)
Predictive risk scoring
Forecasting & Alerts + Precomputed Offender/Gang Score (Phase 10, 0.1, 0.9)
10. Success Metrics & KPIs
Metric
Definition
Target
Blueprint Ref.
Citation accuracy
% of AI answer claims that trace to real evidence
≥ 95%
Phase 0.18
Answer latency
p50 / p95 response time for a cached-path query
<3s / <6s
Phase 15, 24
Verifier catch rate
% of unsupported claims correctly flagged before reaching the user
≥ 90%
Phase 0.5, 0.14
Masking integrity
Crafted cross-role/cross-district query returns zero unauthorized rows
100%
Phase 0.15
Bilingual parity
UI strings with a missing/incorrect Kannada translation
0
Phase 11
Pilot adoption (post-hackathon)
Active weekly Investigator users during pilot window
KPI set with KSP POC
Phase 0.18.5
11. Assumptions, Dependencies & Constraints
11.1 Assumptions
The KSP FIR ER schema as provided (23 tables) is authoritative; three known gaps (informant-identity modelling, an under-specified arrest–accused junction table, and a possibly-duplicate occurrence-time table) are documented as explicit assumptions pending KSP technical point-of-contact confirmation.
Only CaseMaster carries point-level geolocation; all other geo references (arrests, courts, units) are district/state-level only, and dashboards must not assume otherwise.
A synthetic dataset (500+ persons, 200+ FIRs, 2,000+ relationship edges) stands in for production data during build and demo.
11.2 Dependencies
KSP technical point of contact for schema-gap confirmation and eventual production data access.
Zoho Catalyst platform availability and credit allocation (tracked per TRD Section 9.3).
External map-tile provider and, if Zia's native language coverage proves insufficient for Kannada, a supplementary Kannada NLU/ASR service (see TRD Section 6 for the full non-Catalyst dependency list).
11.3 Constraints
No production write-back to CCTNS/ICJS in this release.
All AI-generated output must be citation-backed or explicitly flagged as unverified — never presented as fact without evidence.
Every new data field must be sensitivity-classified before it is wired into any retriever, dashboard, or export.
11.4 Risk Register
Risk
Impact
Likelihood
Mitigation
AI answer states an unsupported claim as fact
High
Medium
Verifier agent + mandatory citation trail (FR-9.1) + human review queue (0.14)
Sensitive attribute (caste/religion/juvenile) leaks via an unmasked path
High
Low
Independent stacked controls: RBAC masking (0.15) + field-level encryption (0.16), both audited
Kannada language quality lags English
Medium
Medium
Dedicated Phase 11 parity testing; escalate to non-Catalyst Kannada NLU if Zia coverage is insufficient
Precomputation cost exceeds Catalyst credit budget at scale
Medium
Medium
Cost/credit tracking from Phase 1 (0.17.3); standing precomputation instead of inline recomputation
Schema gaps (informant identity, arrest–accused junction) block downstream phases
Medium
Medium
Explicit documented assumptions (0.0.4) + early KSP POC engagement
Live demo failure during judging
Medium
Low
Three-tier fallback: cached demo mode → local build → recorded video (Phase 26.3)
12. Release Plan & Roadmap
Phase Range
Purpose
Description
0.0 – 0.18
Intelligence Architecture
Standing substrate: schema, retrieval, entity resolution, GraphRAG, agents, security, Catalyst service mapping — built before Phase 1 so later phases have something to read from.
1 – 15
Build
Zero to fully deployed, demo-ready platform across all functional modules in Section 6.
16 – 25
Upgrade
Hackathon-grade → enterprise-grade: real-time events, GNN graph analytics, mobile PWA, OCR intelligence, security hardening, performance engineering, extensibility.
26
Present
Deployment checklist, timed demo script, fallback plan, anticipated judge Q&A, executive summary generated from Sections 4/9 of the TRD.

Recommended build order: the Intelligence Architecture minimum viable subset (0.1 Crime Intelligence Layer, 0.2 Hybrid Retrieval, 0.9 Precomputation) first, since Phases 1–15 assume it exists; fold 0.16's data/application security in alongside 0.15 rather than deferring it, since it is one continuous governance story; then Phases 1–15 sequentially; Phases 16–25 prioritised by deployment value.
13. Appendix
13.1 Related Documents
Technical Requirements Document (TRD) — CrimeIntel — system architecture, full Zoho Catalyst service mapping, data architecture, security architecture
CrimeIntel 25-Phase Development Blueprint (source planning document)
13.2 Glossary
Term
Meaning
FIR
First Information Report — the initiating crime record in the Indian criminal justice system
RBAC
Role-Based Access Control
RAG
Retrieval-Augmented Generation
GraphRAG
RAG variant that expands retrieval through a relationship graph before ranking
GNN
Graph Neural Network
PWA
Progressive Web App
KSP
Karnataka State Police
POC
Point of Contact