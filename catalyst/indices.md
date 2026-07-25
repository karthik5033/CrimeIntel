Catalyst Indices — models & storage

Overview
This file defines the canonical index models used by the intelligence-layer (Phase 0.1). Each index is stored in Catalyst NoSQL (durable) and populated into Catalyst Cache (hot) for low-latency reads.

1) hotspot-index (grid / rolling)
- Purpose: spatiotemporal hotspot scores for district → station → beat
- Key fields:
  - id (string): "hotspot:<grid_cell_id>:<date>"
  - grid_cell_id (string)
  - level (enum): district|station|beat
  - score (float)
  - counts: {total: int, by_crime_type: {"vehicle_theft": int, ...}}
  - computed_at (ISO8601)
  - snapshot_version (string)
  - metadata: {source_window: {from, to}, params}

2) gang-score-index
- Purpose: per-cluster organized-crime score
- Key fields: id, cluster_id, members_count, centrality_score, risk_score, top_edges[], computed_at, snapshot_version

3) offender-score-index
- Purpose: per-person recidivism/risk score
- Key fields: person_id, risk_score (0-100), features: {freq, recency, mo_consistency, network_influence}, evidence_refs[], computed_at

4) similarity-index
- Purpose: precomputed case-to-case and person-to-person similarity vectors (lightweight)
- Key fields: id ("sim:case:<case_id>"), neighbors: [{id, score}], computed_at

5) embedding-index
- Purpose: vector embeddings for narratives, profiles, OCR text
- Key fields: doc_id, vector (float[]), doc_type, text_snippet (for quick preview), computed_at, model_version
- Storage note: store vector metadata in NoSQL and vectors in the platform-supported vector field; ensure model_version is recorded

6) graph-index
- Purpose: precomputed adjacency snapshot for fast subgraph extraction
- Key fields: snapshot_id, nodes: [{id, type, attrs}], edges: [{src, dst, type, weight}], centrality_map, community_labels, computed_at
- Keep initial load size bounded; provide an API to request N-hop expansion against the snapshot

Index operations & rules
- Atomic publish: write new snapshot to NoSQL under new snapshot_id, then update cache pointer to latest snapshot_id
- Freshness: include computed_at and display in UI footers
- Rollback: keep last 3 snapshots per index by default
- Changelog: add human-readable changelog entry to catalyst/indices/CHANGELOG.md on major snapshot updates

Access patterns
- Query APIs should accept snapshot_version or default to latest_snapshot
- Retrieval orchestrator must never compute these indices on-demand; always read the intelligence-layer

(See RULES.md for naming and CI requirements.)