Catalyst function template (copy to catalyst/functions/<name>/)

Purpose
A minimal, production-oriented skeleton every function must follow.

Files
- index.ts (handler)
- package.json
- .env.example
- README.md (function purpose, inputs, outputs)

index.ts (pseudo)

```ts
// index.ts
import { Handler } from 'catalyst-sdk'; // replace with actual runtime import

export async function handler(req, res) {
  const correlation_id = req.headers['x-correlation-id'] || generateId();
  const start = Date.now();

  try {
    // validate auth / RBAC (delegate to shared auth helper)
    // perform retrieval or computation
    // redact/mask fields per sensitivity
    // write audit log entry (async)

    const result = { success: true };
    res.json(result);
  } catch (err) {
    console.error({ correlation_id, err });
    res.status(500).json({ error: 'internal_error' });
  } finally {
    const duration = Date.now() - start;
    // emit metric: execution_ms
  }
}

export function health(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

Guidelines
- Use shared helpers for auth, caching, logging
- Do not include secrets in code; read from Catalyst secrets
- Include unit tests under catalyst/tests/<function-name>/

(See RULES.md for CI and naming rules.)