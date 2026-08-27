# Chatbot Catalyst Integration Bugfix Design

## Overview

This design addresses the complete failure of Zoho Catalyst service integration in the CrimeIntel Intelligence Chat system. The bug manifests as a cascade of authentication failures starting with Catalyst SDK initialization, causing all downstream services (Data Store, QuickML/GLM, NoSQL, Reasoning Engine) to silently fall back to mock implementations despite `USE_MOCK_CATALYST=false`. The fix implements a centralized OAuth authentication strategy, shared SDK instance management, parameterized database queries, and proper error handling to restore real Catalyst cloud service integration across all 7 architectural layers.

## Glossary

- **Bug_Condition (C)**: The system state where Catalyst SDK is not authenticated OR using mock implementations despite `USE_MOCK_CATALYST=false` OR QuickML/GLM returns hardcoded responses OR Reasoning Engine returns fallback outputs OR NoSQL session persistence fails
- **Property (P)**: The desired behavior where all Catalyst services authenticate successfully and operate against real cloud infrastructure with LLM-generated responses, structured reasoning output, and persistent session context
- **Preservation**: Existing functionality that must remain unchanged including seed data structure, API contracts, UI component compatibility, translation service, and environment configuration patterns
- **getCatalystApp()**: The singleton function in `lib/catalyst/index.ts` that initializes and returns the Catalyst SDK instance
- **CatalystQuickML**: The service in `lib/catalyst/quickml.ts` that wraps Catalyst GLM API for LLM response generation
- **ReasoningEngine**: The criminological analysis service in `lib/reasoning/engine.ts` that generates structured investigative insights
- **OAuth Token Flow**: The authentication process using Client ID/Secret + Refresh Token to obtain time-limited access tokens from Zoho
- **ZCQL**: Zoho Catalyst Query Language - SQL-like syntax for querying Catalyst Data Store
- **Mock Fallback**: The behavior on line 148 of `index.ts` where authentication failure silently returns `createMockCatalystInstance()` instead of throwing an error

## Bug Details

### Bug Condition

The bug manifests when the application attempts to use real Catalyst services but lacks proper authentication credentials. The `getCatalystApp()` function tries 4 authentication strategies sequentially (local .catalystrc, CLI auth, Client ID/Secret, Token), and when all fail, it catches the error and silently returns a mock Catalyst instance regardless of the `USE_MOCK_CATALYST=false` setting.

**Formal Specification:**
```
FUNCTION isBugCondition(SystemState)
  INPUT: SystemState containing {
    catalyst_authenticated: boolean,
    using_mock: boolean,
    quickml_functional: boolean,
    reasoning_engine_functional: boolean,
    nosql_persistent: boolean
  }
  OUTPUT: boolean
  
  RETURN (
    NOT SystemState.catalyst_authenticated OR
    SystemState.using_mock = TRUE OR
    NOT SystemState.quickml_functional OR
    NOT SystemState.reasoning_engine_functional OR
    NOT SystemState.nosql_persistent
  )
END FUNCTION
```

### Examples

**Example 1: Hello Query**
- **Input**: `{ message: "hello", language: "en", sessionId: "sess-123" }`
- **Current (Buggy) Output**: `"Hello Officer. I am ready to assist with your investigation."` (hardcoded string from line 112 of mock quickml.predict())
- **Expected (Fixed) Output**: GLM-generated contextual greeting such as `"Hello! I'm your CrimeIntel Assistant, powered by Karnataka State Police intelligence databases. I can help you search for FIRs, analyze crime patterns, investigate connections between suspects and cases, and identify crime hotspots. What would you like to explore?"`

**Example 2: Murder Query with Reasoning**
- **Input**: `{ message: "show murder cases in Bengaluru", language: "en", sessionId: "sess-123" }`
- **Current (Buggy) Output**: 
  - Text: Heuristic template `"I found X incident records..."` with `*(Note: Catalyst QuickML is currently unconfigured or unavailable...)*` appended
  - Reasoning: `{ claim: "Analysis complete based on provided context.", confidence: { level: "Low", score: 30 }, mechanisms: [], evidence: [], alternatives: [] }`
- **Expected (Fixed) Output**:
  - Text: GLM-generated analysis such as `"I found 12 murder cases in Bengaluru over the past 6 months. Analysis reveals a concentration in areas with high nighttime economic activity. Three cases share similar MO involving sharp weapons. District-level breakdown shows Whitefield PS with highest incidence."`
  - Reasoning: Real criminological analysis with identified mechanisms (e.g., Routine Activity Theory), evidence linked to FIR IDs like `["FIR-2024-001", "FIR-2024-003"]`, confidence score of 72 based on data completeness

**Example 3: Follow-Up Query**
- **Input**: `{ message: "what about last year?", language: "en", sessionId: "sess-123" }` (following Example 2)
- **Current (Buggy) Output**: No context available, treats as new query, returns empty results or generic response
- **Expected (Fixed) Output**: Uses persisted session context showing `{ entities: { crime_type: "Murder", district: "Bengaluru" }, temporal_window: { from: "2023-01-01", to: "2023-12-31" } }`, applies time filter to previously identified parameters, returns GLM analysis: `"Last year (2023) saw 18 murder cases in Bengaluru, showing a 33% decrease compared to current period..."`

**Example 4: SQL Injection Edge Case**
- **Input**: Database query with malicious input: `getPersonById("'; DROP TABLE Persons; --")`
- **Current (Buggy) Output**: String interpolation on line 30 of `datastore.ts` creates query `` `SELECT * FROM Persons WHERE ROWID = ''; DROP TABLE Persons; --'` `` which could execute against real database
- **Expected (Fixed) Output**: Parameterized query safely escapes the input, treats entire string as literal ROWID value, returns no results

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Seed data structure and schema (FIRs, Persons, Vehicles, EntityRelationships, Districts) must continue to match existing JSON seed file format
- API endpoint `/api/chat` must continue to accept request format `{ message, language, sessionId }` and return response structure `{ text_summary, data_table, rag_context, reasoning_block }`
- UI components expecting `reasoning_block` with fields `claim`, `mechanisms`, `evidence`, `alternatives`, `confidence` must continue to render correctly
- Translation service behavior for Kannada queries must continue to work unchanged (uses external API, not Catalyst)
- Frontend UI rendering logic must remain unchanged
- Existing environment variables (CATALYST_PROJECT_ID, QUICKML_ENDPOINT_KEY) must continue to be used for their current purposes
- File upload flow via `/api/firs/upload` must continue to work with authenticated Catalyst SDK
- Error handling for temporary service unavailability must continue to return user-friendly messages
- Intent types (DIRECT_RETRIEVAL, AGGREGATE_ANALYTICAL, REASONING_QUERY, RELATIONSHIP_QUERY, CONVERSATIONAL, FOLLOW_UP) must continue to be recognized

**Scope:**
All inputs that do NOT involve Catalyst authentication or service initialization should be completely unaffected by this fix. This includes:
- Frontend React components and UI state management
- Translation API integration
- Crime type mappings and entity extraction patterns
- Intent classification heuristic algorithms (improvements allowed, but basic functionality preserved)
- Seed data JSON file contents and loading mechanisms

## Hypothesized Root Cause

Based on the bug requirements analysis, the root causes are:

1. **Missing OAuth Credentials**: The environment lacks `CATALYST_CLIENT_ID`, `CATALYST_CLIENT_SECRET`, and `CATALYST_REFRESH_TOKEN` variables required for OAuth authentication. The existing `.env.local` only contains project ID.

2. **Silent Mock Fallback**: Line 148 of `index.ts` catches authentication failures and returns `createMockCatalystInstance()` without checking the `USE_MOCK_CATALYST` flag, violating the explicit directive to use real services.

3. **Fragmented SDK Initialization**: Multiple modules (`quickml.ts`, `engine.ts` line 21) perform independent Catalyst SDK initialization instead of using the shared `getCatalystApp()`, leading to inconsistent authentication state.

4. **Missing OAuth Token Sharing**: `quickml.ts` line 26-31 attempts `app.credential.getToken()` which fails on mock instances. The existing `getAccessToken()` in `direct-api.ts` is not shared with other modules.

5. **String Interpolation SQL Injection**: Line 30 of `datastore.ts` uses `` `SELECT * FROM Persons WHERE ROWID = '${id}'` `` instead of parameterized queries, creating security vulnerability.

6. **NoSQL Insert-Only Logic**: `nosql.ts` line 189 uses `insertItems` which fails on duplicate session_id keys. Session updates require upsert (update-or-insert) logic.

7. **Unbounded Context Size**: `quickml.ts` line 48 sends full `JSON.stringify(contextData)` to GLM API, potentially exceeding token limits when RAG context contains many records.

## Correctness Properties

Property 1: Bug Condition - Real Catalyst Service Integration

_For any_ system initialization where authentication credentials are properly configured, the fixed `getCatalystApp()` function SHALL successfully authenticate using OAuth Client ID/Secret/Refresh Token, return a real Catalyst SDK instance, and all downstream services (ZCQL, NoSQL, QuickML, FileStore) SHALL operate against real Catalyst cloud infrastructure instead of mock implementations.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - API Contract Stability

_For any_ HTTP request to the `/api/chat` endpoint, the fixed implementation SHALL continue to accept the same request format `{ message, language, sessionId }` and return the same response structure `{ text_summary, data_table, rag_context, reasoning_block }` with identical field names and types as the original implementation, preserving UI component compatibility.

**Validates: Requirements 3.3, 3.4**

## Fix Implementation

### Layer 1: Centralized OAuth Authentication

**File**: `lib/catalyst/auth.ts` (NEW)

**Purpose**: Create a shared authentication module that manages OAuth token lifecycle and provides token access to all Catalyst services.

**Implementation Details**:

```typescript
// Singleton token cache
let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

export async function getSharedAccessToken(): Promise<string> {
  // Return cached token if valid (expires in > 60 seconds)
  if (cachedAccessToken && Date.now() < tokenExpiry - 60000) {
    return cachedAccessToken;
  }
  
  // Fetch new token using refresh token flow
  const clientId = process.env.CATALYST_CLIENT_ID;
  const clientSecret = process.env.CATALYST_CLIENT_SECRET;
  const refreshToken = process.env.CATALYST_REFRESH_TOKEN;
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('OAuth credentials not configured: CATALYST_CLIENT_ID, CATALYST_CLIENT_SECRET, CATALYST_REFRESH_TOKEN required');
  }
  
  const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  if (!response.ok) {
    throw new Error(`OAuth token generation failed: ${await response.text()}`);
  }
  
  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  
  return cachedAccessToken;
}
```

**Key Decisions**:
- Uses Refresh Token grant type (not client_credentials) because Catalyst requires user-scoped access
- Caches token globally to minimize OAuth API calls
- Throws explicit errors when credentials missing instead of silent fallback
- Separates auth logic from SDK initialization for reusability

### Layer 2: SDK Initialization with Strict Mode

**File**: `lib/catalyst/index.ts`

**Changes Required**:

1. **Respect USE_MOCK_CATALYST flag**: Modify catch block on line 148 to check environment variable before falling back:

```typescript
} catch (error) {
  console.warn('⚠️ Catalyst initialization failed:', (error as Error).message);
  
  // STRICT MODE: If mock is disabled, throw error instead of silent fallback
  if (process.env.USE_MOCK_CATALYST === 'false') {
    throw new Error(
      `Catalyst SDK initialization failed and USE_MOCK_CATALYST is false. ` +
      `Please configure OAuth credentials or set USE_MOCK_CATALYST=true. ` +
      `Error: ${(error as Error).message}`
    );
  }
  
  console.warn('⚠️ Falling back to MOCK mode for development');
  catalystInstance = createMockCatalystInstance();
  return catalystInstance;
}
```

2. **Add OAuth strategy with refresh token**: Insert new strategy before Strategy 4 (Token-based):

```typescript
// Strategy 3.5: OAuth with Refresh Token
const clientId = process.env.CATALYST_CLIENT_ID;
const clientSecret = process.env.CATALYST_CLIENT_SECRET;
const refreshToken = process.env.CATALYST_REFRESH_TOKEN;

if (clientId && clientSecret && refreshToken) {
  try {
    console.log('🔑 Using OAuth Refresh Token authentication');
    const { getSharedAccessToken } = require('./auth');
    const accessToken = await getSharedAccessToken();
    
    catalystInstance = catalyst.initialize({
      type: 'token',
      token: accessToken,
      project_id: catalystConfig.projectId,
      environment: catalystConfig.environment
    });
    console.log('✅ OAuth Refresh Token authentication successful');
    return catalystInstance;
  } catch (oauthError) {
    console.warn('⚠️ OAuth authentication failed:', (oauthError as Error).message);
  }
}
```

3. **Extract orgId to environment variable**: Replace hardcoded `60078981781` throughout codebase with `process.env.CATALYST_ORG_ID || '60078981781'`

**Rationale**: This ensures authentication failure is visible during development rather than silently degrading functionality. Production deployments must have credentials configured or explicitly enable mock mode.

### Layer 3: QuickML/GLM Integration with Shared OAuth

**File**: `lib/catalyst/quickml.ts`

**Changes Required**:

1. **Use shared OAuth token** (lines 26-31): Replace `app.credential.getToken()` with shared auth module:

```typescript
// Import at top of file
import { getSharedAccessToken } from './auth';

// Inside generateResponse() method, replace lines 26-31:
try {
  const token = await getSharedAccessToken();
  const orgId = process.env.CATALYST_ORG_ID || '60078981781';
  
  response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'CATALYST-ORG': orgId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });
}
```

2. **Optimize context size** (line 48): Cap RAG context to prevent token overflow:

```typescript
// Function to summarize RAG context before sending to LLM
function summarizeRagContext(contextData: any, maxRecords: number = 15): string {
  const ragContext = contextData?.ragContext || [];
  let summary = '';
  let recordCount = 0;
  
  for (const source of ragContext) {
    if (!source.data || !Array.isArray(source.data)) continue;
    
    for (const item of source.data) {
      if (recordCount >= maxRecords) break;
      
      // Extract only key fields
      const essentials: any = {};
      const keyFields = ['fir_no', 'crime_type_en', 'district_id', 'date', 'status_en', 'description'];
      keyFields.forEach(field => {
        if (item[field]) essentials[field] = item[field];
      });
      
      summary += JSON.stringify(essentials) + '\n';
      recordCount++;
    }
    if (recordCount >= maxRecords) break;
  }
  
  return summary || 'No context data available';
}

// Use in generateResponse:
const contextSummary = summarizeRagContext(contextData, 15);
const userMessage = `Query: ${prompt}\n\nContext: ${contextSummary}`;
```

3. **Domain-specific system prompt**: Replace generic prompt on line 47 with Karnataka State Police context:

```typescript
const systemPrompt = `You are an AI intelligence assistant for Karnataka State Police CrimeIntel system.

Your role:
- Analyze FIR (First Information Report) data from Karnataka State Police databases
- Identify crime patterns, suspect connections, and investigative leads
- Summarize complex intelligence data in clear, actionable insights
- Apply criminological frameworks (Routine Activity Theory, Crime Pattern Theory) when relevant

Guidelines:
- Be concise but thorough - officers need quick actionable intelligence
- Highlight key FIR numbers, suspect names, and location patterns
- When data is incomplete, state confidence level and what's missing
- Use professional law enforcement terminology
- For Kannada queries, ensure cultural and linguistic accuracy

Current query context: ${contextData?.intent || 'general inquiry'}`;
```

4. **Add Groq fallback configuration**: Ensure `GROQ_API_KEY` is checked as backup when Catalyst GLM unavailable (existing code on line 517 already supports this, just needs env var configured)

**Rationale**: Shared OAuth eliminates duplication and ensures consistent authentication across services. Context optimization prevents token limit errors while preserving essential intelligence data. Domain-specific prompting improves response quality for law enforcement use case.

### Layer 4: Reasoning Engine with Shared SDK

**File**: `lib/reasoning/engine.ts`

**Changes Required**:

1. **Replace independent SDK init** (line 21): Use shared `getCatalystApp()`:

```typescript
// Remove: const catalystApp = require('zcatalyst-sdk-node').initialize();
// Replace with:
import { getCatalystApp } from '../catalyst';

// Inside processQuery():
const catalystApp = getCatalystApp();
```

2. **Use shared OAuth for LLM API** (line 79): Replace direct fetch with shared token:

```typescript
import { getSharedAccessToken } from '../catalyst/auth';

// Replace lines 79-95:
const token = await getSharedAccessToken();
const orgId = process.env.CATALYST_ORG_ID || '60078981781';

const response = await fetch(endpointUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'CATALYST-ORG': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'glm-4-9b', // Verify model ID in Catalyst console
    messages: [
      { role: 'system', content: reasoningPrompt },
      { role: 'user', content: `Query: ${query}\n\nContext: ${JSON.stringify(context)}` }
    ],
    response_format: { type: 'json_object' } // Request JSON mode if supported
  })
});
```

3. **Improve JSON parsing robustness** (line 98): Handle cases where LLM wraps JSON in markdown:

```typescript
let reasoningData;
try {
  let responseText = await response.text();
  
  // Strip markdown code blocks if present
  if (responseText.includes('```json')) {
    const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) responseText = match[1];
  }
  
  reasoningData = JSON.parse(responseText);
} catch (parseError) {
  console.error('Failed to parse reasoning response:', parseError);
  return fallbackReasoning();
}
```

4. **Schema for ReasoningOutputs NoSQL table**:

```typescript
// Document structure for NoSQL storage:
interface ReasoningOutput {
  id: string;                    // Partition key: `res-${timestamp}-${hash}`
  query: string;
  timestamp: string;             // ISO 8601 format
  user_id?: string;
  session_id: string;
  claim: string;
  mechanisms: Array<{
    name: string;
    description: string;
    theory: string;
    factors: string[];
  }>;
  evidence: Array<{
    id: string;
    type: 'FIR' | 'Statistic' | 'Pattern' | 'Witness';
    description: string;
  }>;
  alternatives: Array<{
    hypothesis: string;
    status: 'Considered' | 'Rejected' | 'Possible';
    reasoning: string;
  }>;
  confidence: {
    level: 'Low' | 'Medium' | 'High';
    score: number;
    factors: string[];
  };
  metadata: {
    processing_time_ms: number;
    model_used: string;
  };
}
```

**Rationale**: Eliminates duplicate SDK initialization and ensures reasoning engine uses authenticated instance. JSON mode enforcement improves structured output reliability. NoSQL schema enables audit trail and reasoning history analysis.

### Layer 5: Parameterized Database Queries

**File**: `lib/catalyst/datastore.ts`

**Changes Required**:

1. **Create parameterized query helper** (new utility function):

```typescript
// Add at top of file
function buildParameterizedQuery(
  baseQuery: string,
  params: Record<string, string | number>
): string {
  let query = baseQuery;
  
  // Escape single quotes in string parameters
  const escaped: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Escape single quotes by doubling them (ZCQL standard)
      escaped[key] = value.replace(/'/g, "''");
    } else {
      escaped[key] = String(value);
    }
  }
  
  // Replace placeholders
  for (const [key, value] of Object.entries(escaped)) {
    const placeholder = `{${key}}`;
    query = query.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return query;
}
```

2. **Fix SQL injection vulnerability** (line 30 in getPersonById):

```typescript
// BEFORE (vulnerable):
const query = `SELECT * FROM Persons WHERE ROWID = '${id}'`;

// AFTER (safe):
const query = buildParameterizedQuery(
  "SELECT * FROM Persons WHERE ROWID = '{id}'",
  { id }
);
```

3. **Apply to all query methods**: Update `getFIRs`, `getVehicles`, `getEntityRelationships`, etc. to use parameterized approach:

```typescript
// Example for getFIRs with district filter:
const query = buildParameterizedQuery(
  "SELECT * FROM FIRs WHERE district_id = '{district}' LIMIT {limit}",
  { district: districtId, limit: 100 }
);
```

4. **Dynamic district mapping**: Replace hardcoded district map in `sqlAgent.ts` lines 18-27:

```typescript
// In sqlAgent.ts, replace hardcoded mapping with database query:
async function getDistrictMapping(): Promise<Record<string, string>> {
  const { CatalystDataStore } = require('../../catalyst/datastore');
  const districts = await CatalystDataStore.getDistricts(); // New method
  
  const mapping: Record<string, string> = {};
  for (const district of districts) {
    // Map both English and Kannada names to district_id
    mapping[district.name_en.toLowerCase()] = district.id;
    if (district.name_kn) {
      mapping[district.name_kn.toLowerCase()] = district.id;
    }
  }
  
  return mapping;
}

// Add getDistricts method to datastore.ts:
static async getDistricts() {
  const app = getCatalystApp();
  const result = await app.zcql().executeZCQLQuery('SELECT * FROM Districts');
  return result.map((row: any) => row.Districts);
}
```

**Rationale**: Parameterized queries eliminate SQL injection risk by properly escaping special characters. Dynamic district mapping ensures data consistency and removes hardcoded coupling. The query builder uses placeholder substitution rather than string concatenation for safety.

### Layer 6: Session Persistence with Upsert Logic

**File**: `lib/catalyst/nosql.ts`

**Changes Required**:

1. **NoSQL schema for ChatSessions table**:

```typescript
interface ChatSession {
  session_id: string;           // Partition key
  updated_at: number;           // Sort key (Unix timestamp)
  user_id?: string;
  data: {
    entities: {
      crime_types: string[];
      districts: string[];
      person_names: string[];
      vehicle_numbers: string[];
      date_ranges: Array<{ from: string; to: string }>;
    };
    conversation_history: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    }>;
    active_context: {
      last_intent: string;
      last_query: string;
      accumulated_filters: Record<string, any>;
    };
  };
  ttl: number;                  // Epoch timestamp for auto-deletion (30 days)
}
```

2. **Implement upsert logic** (replace line 189):

```typescript
static async saveChatSession(sessionId: string, sessionData: any) {
  const app = getCatalystApp();
  const table = app.nosql().table('ChatSessions');
  
  const ttl = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days from now
  const item = {
    session_id: sessionId,
    updated_at: Date.now(),
    data: sessionData,
    ttl
  };
  
  try {
    // Try update first
    await table.updateItems({
      keys: { session_id: sessionId },
      update_attributes: {
        data: sessionData,
        updated_at: Date.now(),
        ttl
      }
    });
    console.log(`✅ Updated session: ${sessionId}`);
  } catch (updateError) {
    // If update fails (session doesn't exist), insert new
    try {
      await table.insertItems({ item });
      console.log(`✅ Created new session: ${sessionId}`);
    } catch (insertError) {
      console.error('Failed to save session:', insertError);
      throw insertError;
    }
  }
}
```

3. **Implement session retrieval with fallback** (update `getChatSession`):

```typescript
static async getChatSession(sessionId: string) {
  const app = getCatalystApp();
  const table = app.nosql().table('ChatSessions');
  
  try {
    const result = await table.fetchItem({
      keys: { session_id: sessionId }
    });
    
    if (result && result.length > 0) {
      return result[0].data;
    }
    
    // Return empty session template if not found
    return {
      entities: {
        crime_types: [],
        districts: [],
        person_names: [],
        vehicle_numbers: [],
        date_ranges: []
      },
      conversation_history: [],
      active_context: {
        last_intent: '',
        last_query: '',
        accumulated_filters: {}
      }
    };
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return null; // Return null to signal error vs empty session
  }
}
```

**Rationale**: Update-first upsert pattern is more efficient for existing sessions (majority case after initial creation). TTL field enables automatic cleanup via Catalyst NoSQL TTL policy. Fallback to empty session template ensures graceful degradation if fetch fails.

### Layer 7: Agent Query Optimization

**File**: `lib/ai/agents/graphAgent.ts`

**Changes Required**:

1. **Server-side WHERE filtering** (replace client-side filter loop):

```typescript
// BEFORE: Fetches all rows then filters in JavaScript
const allRelationships = await CatalystDataStore.getEntityRelationships();
const filtered = allRelationships.filter(rel =>
  rel.source.includes(entityName) || rel.target.includes(entityName)
);

// AFTER: Server-side filtering via ZCQL WHERE clause
async function getRelationshipsForEntity(entityName: string) {
  const app = getCatalystApp();
  
  // Use parameterized query with LIKE for partial matching
  const query = buildParameterizedQuery(
    "SELECT * FROM EntityRelationships " +
    "WHERE source LIKE '%{entity}%' OR target LIKE '%{entity}%' " +
    "LIMIT 100",
    { entity: entityName }
  );
  
  const result = await app.zcql().executeZCQLQuery(query);
  return result.map((row: any) => row.EntityRelationships);
}
```

**File**: `lib/ai/agents/vectorAgent.ts`

**Changes Required**:

1. **Disable agent until embeddings ready**:

```typescript
export class VectorAgent implements Agent {
  async search(query: ExtractedQuery): Promise<Evidence[]> {
    // Phase 1: Disable vector search until real embeddings configured
    if (!process.env.QUICKML_EMBEDDING_ENDPOINT_KEY) {
      console.log('⚠️ VectorAgent disabled: embeddings not configured');
      return [];
    }
    
    // Phase 2: Implement with real Catalyst QuickML embeddings
    // ... (future implementation)
  }
}
```

**File**: `lib/ai/agents/sqlAgent.ts`

**Changes Required**:

1. **Add aggregate query support**:

```typescript
async function getHotspotAnalysis(crimeType?: string): Promise<any[]> {
  const app = getCatalystApp();
  
  let query = "SELECT district_id, COUNT(*) as incident_count " +
              "FROM FIRs ";
  
  if (crimeType) {
    query += buildParameterizedQuery(
      "WHERE crime_type_en = '{crime_type}' ",
      { crime_type: crimeType }
    );
  }
  
  query += "GROUP BY district_id ORDER BY incident_count DESC LIMIT 10";
  
  const result = await app.zcql().executeZCQLQuery(query);
  return result.map((row: any) => row.FIRs);
}
```

**Rationale**: Server-side filtering reduces network transfer and improves performance with large datasets. Disabling VectorAgent prevents displaying fake similarity scores until real embedding infrastructure is ready. Aggregate queries leverage Catalyst's GROUP BY support for analytics use cases.

### Layer 8: Data Seeding Endpoint

**File**: `app/api/admin/seed/route.ts` (NEW)

**Purpose**: One-time endpoint to load seed data from JSON files into real Catalyst Data Store.

**Implementation**:

```typescript
import { NextResponse } from 'next/server';
import { getCatalystApp } from '@/lib/catalyst';
import { CatalystDataStore } from '@/lib/catalyst/datastore';
import firsSeed from '@/data/seed/FIRs.json';
import personsSeed from '@/data/seed/Persons.json';
import vehiclesSeed from '@/data/seed/Vehicles.json';
import relationshipsSeed from '@/data/seed/EntityRelationships.json';
import districtsSeed from '@/data/seed/Districts.json';

export async function POST(request: Request) {
  try {
    // Security: Check for admin token or restrict to localhost
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SEED_TOKEN}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify Catalyst is authenticated (not mock)
    const app = getCatalystApp();
    const isMock = process.env.USE_MOCK_CATALYST === 'true';
    if (isMock) {
      return NextResponse.json(
        { error: 'Cannot seed: running in mock mode' },
        { status: 400 }
      );
    }
    
    console.log('🌱 Starting data seeding...');
    
    // Seed FIRs
    await CatalystDataStore.insertFIRs(firsSeed);
    console.log(`✅ Seeded ${firsSeed.length} FIRs`);
    
    // Seed Persons
    await CatalystDataStore.insertPersons(personsSeed);
    console.log(`✅ Seeded ${personsSeed.length} Persons`);
    
    // Seed Vehicles
    await CatalystDataStore.insertVehicles(vehiclesSeed);
    console.log(`✅ Seeded ${vehiclesSeed.length} Vehicles`);
    
    // Seed Relationships
    await CatalystDataStore.insertEntityRelationships(relationshipsSeed);
    console.log(`✅ Seeded ${relationshipsSeed.length} Relationships`);
    
    // Seed Districts
    await CatalystDataStore.insertDistricts(districtsSeed);
    console.log(`✅ Seeded ${districtsSeed.length} Districts`);
    
    return NextResponse.json({
      success: true,
      seeded: {
        firs: firsSeed.length,
        persons: personsSeed.length,
        vehicles: vehiclesSeed.length,
        relationships: relationshipsSeed.length,
        districts: districtsSeed.length
      }
    });
    
  } catch (error) {
    console.error('Seeding failed:', error);
    return NextResponse.json(
      { error: 'Seeding failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
```

**Security considerations**:
- Requires `ADMIN_SEED_TOKEN` environment variable for authentication
- Should be disabled in production after initial seeding
- Could alternatively be restricted to `NODE_ENV=development` or localhost only

**Rationale**: One-time HTTP endpoint is simpler than CLI migration script for Next.js serverless environment. Token-based auth prevents unauthorized data manipulation. Idempotent inserts (where Catalyst supports them) allow re-running if needed.

## Testing Strategy

### Validation Approach

The testing strategy follows a four-phase approach: first, verify authentication and infrastructure layer works correctly, then validate LLM pipeline produces intelligent responses, then ensure data retrieval accuracy, and finally test conversation flow persistence. Each phase builds on the previous layer's successful operation.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the current system falls back to mock implementations and produces hardcoded responses. Document the exact authentication failure paths.

**Test Plan**: Run tests against the UNFIXED codebase with `USE_MOCK_CATALYST=false` but no OAuth credentials configured. Observe where each service falls back to mock mode. Capture the exact error messages and mock response patterns.

**Test Cases**:
1. **SDK Init Test**: Call `getCatalystApp()` without credentials - should silently return mock instance (line 148) instead of throwing error (will fail on unfixed code)
2. **QuickML Auth Test**: Call `CatalystQuickML.generateResponse("hello")` - should attempt `app.credential.getToken()` and fail, falling back to mock predict() with hardcoded "Hello Officer..." string (will fail on unfixed code)
3. **Reasoning Engine Init Test**: Call `ReasoningEngine.processQuery()` - should perform independent SDK init on line 21, fail authentication, and return fallbackReasoning() with confidence=30 (will fail on unfixed code)
4. **NoSQL Session Test**: Call `CatalystNoSQL.getChatSession("test-123")` - should call mock nosql().table().fetchItem() which always returns empty array (will fail on unfixed code)
5. **SQL Injection Test**: Call `getPersonById("'; DROP TABLE Persons; --")` - should create injectable query string `` `SELECT * FROM Persons WHERE ROWID = ''; DROP TABLE Persons; --'` `` (will fail on unfixed code)

**Expected Counterexamples**:
- Authentication fails silently and returns mock instances despite `USE_MOCK_CATALYST=false`
- QuickML responses are hardcoded strings instead of GLM-generated natural language
- Reasoning outputs always show confidence=30 with empty mechanisms array
- Session context is never retrieved from NoSQL, always starts blank
- String interpolation queries are vulnerable to SQL injection

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (authentication configured correctly), the fixed implementation produces the expected behavior (real Catalyst services).

**Pseudocode:**
```
FOR ALL system_states WHERE hasValidOAuthCredentials(system_state) DO
  app := getCatalystApp_fixed()
  ASSERT app.isRealCatalystInstance = TRUE
  ASSERT app.isMockInstance = FALSE
  
  response := CatalystQuickML.generateResponse_fixed("hello")
  ASSERT NOT response.includes("Hello Officer...")
  ASSERT response.length > 50 AND isNaturalLanguage(response)
  
  reasoning := ReasoningEngine.processQuery_fixed("analyze murder cases")
  ASSERT reasoning.confidence.score != 30
  ASSERT reasoning.mechanisms.length > 0
  
  session := CatalystNoSQL.getChatSession_fixed("sess-123")
  ASSERT session != NULL OR session = emptySessionTemplate
END FOR
```

**Test Plan**: Configure OAuth credentials (CATALYST_CLIENT_ID, CATALYST_CLIENT_SECRET, CATALYST_REFRESH_TOKEN) in `.env.local`, run system with `USE_MOCK_CATALYST=false`, verify all services use real Catalyst endpoints.

**Test Cases**:
1. **Authentication Success Test**: Verify `getCatalystApp()` successfully authenticates and returns real SDK instance (not mock)
2. **GLM Response Test**: Send "hello" query, verify response is NOT hardcoded template, contains >50 chars of natural language
3. **Reasoning Output Test**: Send investigative query, verify confidence score is NOT 30, mechanisms array is populated
4. **ZCQL Query Test**: Execute query against FIRs table, verify results come from real Catalyst Data Store (check for ROWID format that doesn't start with "MOCK_")
5. **Session Persistence Test**: Create session, save data, fetch in new request, verify data persists

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (e.g., UI rendering, translation service, seed data structure), the fixed implementation produces the same result as the original implementation.

**Pseudocode:**
```
FOR ALL api_requests WHERE isUnaffectedByAuthFix(request) DO
  response_original := chatAPI_original(request)
  response_fixed := chatAPI_fixed(request)
  
  ASSERT response_fixed.structure = response_original.structure
  ASSERT response_fixed.field_names = response_original.field_names
  ASSERT response_fixed.field_types = response_original.field_types
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it generates many test cases automatically across the input domain, catches edge cases that manual unit tests might miss, and provides strong guarantees that behavior is unchanged for all non-buggy inputs.

**Test Plan**: Run test suite that validates API contracts, UI component props, and data structures before and after fix. Use snapshot testing for response structures.

**Test Cases**:
1. **API Contract Preservation**: Send POST request to `/api/chat` with standard format, verify response has same fields `{ text_summary, data_table, rag_context, reasoning_block }`
2. **Intent Classification Preservation**: Verify all 6 intent types (DIRECT_RETRIEVAL, AGGREGATE_ANALYTICAL, REASONING_QUERY, RELATIONSHIP_QUERY, CONVERSATIONAL, FOLLOW_UP) are still recognized
3. **Seed Data Structure Preservation**: Load FIRs.json, verify schema has same fields before and after fix
4. **Translation Preservation**: Send Kannada query `{ message: "ಕೊಲೆ ಪ್ರಕರಣಗಳು", language: "kn" }`, verify translation still works
5. **UI Component Preservation**: Render ReasoningBlock component with fixed backend data, verify it displays without errors

### Unit Tests

- Test `getSharedAccessToken()` with valid/invalid credentials, verify token caching behavior
- Test `buildParameterizedQuery()` with SQL injection payloads, verify proper escaping
- Test `summarizeRagContext()` with large context arrays, verify output stays under 2000 chars
- Test `saveChatSession()` upsert logic for new and existing sessions
- Test `getCatalystApp()` strict mode throws error when `USE_MOCK_CATALYST=false` and auth fails

### Property-Based Tests

- Generate random chat queries (crime types, districts, person names), verify all produce valid response structure
- Generate random ZCQL WHERE clauses with special characters, verify parameterized query builder escapes correctly
- Generate random session data of varying sizes, verify NoSQL upsert succeeds for all valid inputs
- Test that for any context size up to 100 records, summarizeRagContext produces valid output under token limit

### Integration Tests

- Test full chat flow: authenticate → query database → generate LLM response → persist session → follow-up query uses context
- Test reasoning pipeline: authenticate → retrieve evidence → call GLM reasoning endpoint → parse structured output → persist to NoSQL
- Test file upload flow: authenticate → upload to Stratus → OCR processing → update FIR record via parameterized ZCQL
- Test analytics workflow: authenticate → run aggregate ZCQL query → generate GLM summary → return to frontend

## Implementation Phases

### Phase 1: Authentication & Infrastructure (Must complete first)
**Dependencies**: None
**Estimated effort**: 1-2 days

Tasks:
1. Create `lib/catalyst/auth.ts` with shared OAuth token management
2. Update `lib/catalyst/index.ts` to respect `USE_MOCK_CATALYST=false` and add OAuth strategy
3. Configure environment variables: `CATALYST_CLIENT_ID`, `CATALYST_CLIENT_SECRET`, `CATALYST_REFRESH_TOKEN`, `CATALYST_ORG_ID`
4. Test `getCatalystApp()` successfully authenticates with real credentials
5. Verify ZCQL queries return data from real Catalyst Data Store

**Exit criteria**: 
- ✅ `getCatalystApp()` returns real authenticated SDK instance
- ✅ ZCQL query to FIRs table returns real data (not seed JSON)
- ✅ System throws clear error when auth fails and mock disabled

### Phase 2: LLM Pipeline (Unlocks intelligent responses)
**Dependencies**: Phase 1 complete
**Estimated effort**: 2-3 days

Tasks:
1. Update `lib/catalyst/quickml.ts` to use `getSharedAccessToken()` from auth module
2. Implement context summarization to cap RAG data size
3. Replace generic system prompt with domain-specific Karnataka State Police prompt
4. Update `lib/reasoning/engine.ts` to use shared `getCatalystApp()` and OAuth
5. Improve JSON parsing robustness in reasoning engine
6. Test GLM generates natural language responses (not hardcoded templates)

**Exit criteria**:
- ✅ QuickML generates real GLM responses for "hello" query
- ✅ Reasoning Engine returns structured output with confidence >30 and populated mechanisms
- ✅ No hardcoded fallback strings appear in responses

### Phase 3: Data Security & Quality (Improves accuracy and security)
**Dependencies**: Phase 1 complete
**Estimated effort**: 2 days

Tasks:
1. Implement `buildParameterizedQuery()` helper in `datastore.ts`
2. Update all query methods to use parameterized queries
3. Replace hardcoded district mapping in SQLAgent with dynamic database query
4. Add `getDistricts()` method to datastore
5. Update GraphAgent to use server-side WHERE filtering
6. Disable VectorAgent until embeddings configured
7. Create and test `/api/admin/seed` endpoint for data loading

**Exit criteria**:
- ✅ SQL injection test fails (query treats malicious input as literal value)
- ✅ District mapping updates automatically from database
- ✅ GraphAgent uses server-side filtering
- ✅ Seed endpoint successfully loads all JSON data to Catalyst

### Phase 4: Session Persistence (Enables conversation flow)
**Dependencies**: Phase 1 complete
**Estimated effort**: 1 day

Tasks:
1. Implement upsert logic in `nosql.ts` `saveChatSession()`
2. Update `getChatSession()` with empty template fallback
3. Configure ChatSessions table TTL policy in Catalyst console
4. Test session data persists across requests
5. Test follow-up queries use accumulated context

**Exit criteria**:
- ✅ Session context persists to Catalyst NoSQL
- ✅ Follow-up query "what about last year?" uses previous context
- ✅ Active Context sidebar displays accumulated entities
- ✅ Sessions auto-delete after 30 days via TTL

### Total Estimated Timeline: 6-8 days
