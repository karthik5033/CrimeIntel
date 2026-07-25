Intelligence-layer architecture (concise)

Sequence (one-query flow)

```mermaid
sequenceDiagram
    participant U as Investigator
    participant GW as API Gateway
    participant AUTH as Auth
    participant SM as Semantic Memory
    participant RET as Retrieval Orchestrator
    participant IDX as Intelligence Layer
    participant AGT as Multi-Agent Coordinator
    participant UI as Chat/UI

    U->>GW: query
    GW->>AUTH: validate
    GW->>SM: fetch context
    GW->>RET: dispatch
    RET->>IDX: read indices (hotspot, graph, embeddings)
    RET->>AGT: evidence bundle
    AGT->>AGT: compose & verify
    AGT-->>UI: response + citations
```

Key design points
- Precompute and cache indices (hot) and keep durable snapshots (NoSQL)
- Retrieval orchestrator fans out to SQL/Graph/Vector/OCR/Analytics and merges results
- Evidence ranking must tag source retriever and confidence
- Human feedback loop and versioning wrap updates to canonical data

Where to find more
- RULES.md — development rules
- indices.md — index models
- security.md — sensitivity & encryption

(Keep this file short; use implementation_plan for full spec.)