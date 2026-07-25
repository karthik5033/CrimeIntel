Catalyst usage rules — CrimeIntel (concise)

Purpose
This document lists mandatory rules and conventions for all Catalyst functions, indices, and precomputation jobs in this repo.

1. Naming
- Catalyst functions: catalyst/functions/<kebab-name>/
- Function handler file: index.ts or handler.js
- Precomputation jobs: catalyst/jobs/<kebab-name>/
- Indices: catalyst/indices/<index-name>.md (index metadata lives here)

2. Index versioning
- Each index must include: snapshot_version (semver-like), computed_at (ISO8601), source_commit (git SHA)
- When rebuilding an index, increment snapshot_version and write a changelog entry to catalyst/indices/CHANGELOG.md

3. Storage pattern
- Hot store: Catalyst Cache (short TTL) for queryable indices
- Durable store: Catalyst NoSQL for full snapshots and history
- Always write to durable store first, then populate cache atomically

4. Security & Data Handling
- Consult catalyst/security.md for sensitivity tiers and field-level encryption rules
- No PII in logs unless explicitly allowed; mask/unmask operations must generate audit log entries
- LLM calls: include data-boundary tag in request metadata, do not send Highly Restricted fields to external models

5. Observability
- All functions must implement a /health endpoint and structured JSON logs with correlation_id
- Emit metrics: execution_ms, cache_hit (boolean), result_count

6. Testing & CI
- Unit tests for retrieval logic and ranking must exist under catalyst/tests/<function-name>/
- Deploy pipeline must run unit tests and a smoke-test (health-check) before publishing

7. Human-in-loop & Versioning
- Any entity-resolution merge must create a revision entry and push a supervisor-approval ticket (see Phase 0.14)

8. Commit messages
- Use terse, imperative commits. Include Co-authored-by trailer if assisted by Copilot App.

Enforcement
- CI checks will validate naming, presence of /health, and index metadata fields on PRs.

(See indices.md and security.md for technical definitions.)