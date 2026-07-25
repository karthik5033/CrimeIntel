Catalyst security & sensitivity — summary (Phase 0)

Purpose
Short reference of sensitivity tiers, masking rules, encryption, and incident handling for Catalyst functions and indices.

Sensitivity tiers (from Phase 0.0.2)
- Public / Internal: non-PII reference data
- Restricted: direct PII (Accused/Complainant/Victim names, dates)
- Highly Restricted: juvenile victims, sexual-offense victims, caste/religion linkage per individual

Rules
- Masking: UI and API must apply role-based masking at the query layer (not client-side). Masking decisions must be logged (audit entry with user_id, action, reason).
- Field-level encryption: Highly Restricted fields must be encrypted at rest. Decryption only in trusted Catalyst Functions; every decrypt action creates an audit entry.
- LLM boundary: Never send Highly Restricted fields to external LLMs. For Restricted fields, prefer redaction or anonymized representations before any external call.
- Logs: do not log raw Highly Restricted or Restricted fields. Use hashed IDs or masked tokens when necessary for debugging.

Audit
- Audit entries format: {id, event_type, user_id, user_role, timestamp, details_json, session_id, ip}
- All AI reasoning outputs must include citations and produce an audit log listing which indices/records were read.

Anomaly detection (access)
- Simple rule engine flags unusual access patterns for review (e.g., >100 cross-district rows in 1 hour by a Constable)
- Flagging triggers an admin notification and marks the user for temporary review

Incident response (brief)
1. Detect via observability/alerts
2. Triage: log snapshot, isolate affected keys, rotate secrets if needed
3. Notify security lead and affected stakeholders
4. Audit and remediate, then produce post-incident report

Secrets
- Use Catalyst secrets for all keys (no secrets in repo)
- Rotate service keys on schedule and on any incident

(Refer to Phase 0.15/0.16 in CrimeIntel_Implementation_Plan_v4.md for full details.)