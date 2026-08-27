# Bugfix Requirements Document

## Introduction

The CrimeIntel Intelligence Chat system is currently non-functional due to a complete failure in Zoho Catalyst service integration. Despite `USE_MOCK_CATALYST=false` being set, every layer of the pipeline—from SDK authentication to LLM response generation—falls back to hardcoded mock responses or in-memory seed data. Users receive templated strings like "Hello Officer..." instead of real natural language responses from Catalyst GLM, and all reasoning outputs show empty evidence with fixed 30% confidence scores. This bug affects 100% of chat functionality, rendering the intelligence assistant useless for Karnataka State Police operations.

The root cause is a cascade of authentication failures starting with Catalyst SDK initialization, which silently falls back to a mock instance, causing all downstream services (Data Store ZCQL, QuickML LLM, NoSQL session persistence, and Reasoning Engine) to operate against mock implementations instead of real Catalyst cloud services.

## Bug Analysis

### Current Behavior (Defect)

**1.1 Catalyst SDK Authentication**
1.1 WHEN the application attempts to initialize the Catalyst SDK using `getCatalystApp()` in `lib/catalyst/index.ts` THEN the initialization tries 4 authentication strategies (local .catalystrc, CLI auth, Client ID/Secret, Token) and all fail because none of the required credentials are configured

1.2 WHEN all 4 authentication strategies fail THEN the code catches the error on line 148 and silently returns `createMockCatalystInstance()` despite `USE_MOCK_CATALYST=false`

1.3 WHEN `USE_MOCK_CATALYST=false` is explicitly set in environment variables THEN the system ignores this flag and falls back to mock mode anyway

**1.2 Database Layer (ZCQL)**
1.4 WHEN any component queries the database using `app.zcql().executeZCQLQuery()` THEN the query executes against an in-memory Map loaded from seed JSON files instead of the real Catalyst Data Store cloud database

1.5 WHEN the mock ZCQL parser encounters complex queries (JOINs, GROUP BY, sub-queries) THEN it returns incorrect results or falls back to returning generic seed rows

1.6 WHEN SQLAgent constructs ZCQL queries using string interpolation (e.g., line 30 in `datastore.ts`: `` `SELECT * FROM Persons WHERE ROWID = '${id}'` ``) THEN the queries are vulnerable to SQL injection attacks

**1.3 QuickML LLM Response Generation**
1.7 WHEN `CatalystQuickML.generateResponse()` is called with the configured endpoint `https://api.catalyst.zoho.in/quickml/v1/project/55949000000013025/glm/chat` THEN it attempts to get a Bearer token via `app.credential.getToken()` which fails because `app` is the mock instance with no `.credential` method

1.8 WHEN the OAuth token retrieval fails THEN the code falls back to sending requests with only the `CATALYST-ORG: 60078981781` header without authentication, causing Catalyst to reject the request with 401 Unauthorized

1.9 WHEN the Catalyst GLM API call fails THEN the catch block on line 58 falls through to the mock QuickML pipeline path which checks for `GROQ_API_KEY` (not set) and returns hardcoded template strings like "Hello Officer..." or "I've scanned the databases..."

1.10 WHEN a user says "hello" THEN the mock predict() method matches the regex `/hello|hi|hey/` on line 112 and returns the hardcoded string "Hello Officer. I am ready to assist with your investigation."

1.11 WHEN a user asks a substantive query with retrieved data THEN the mock generates a heuristic summary instead of using the LLM, appending "*(Note: Catalyst QuickML is currently unconfigured or unavailable...)*" to the response

**1.4 Intent Classification**
1.12 WHEN `IntentClassifier.classify()` sends a classification prompt to `CatalystQuickML.generateResponse()` THEN the QuickML call fails (due to 1.7-1.9) and falls back to `basicHeuristicClassification()` on line 82

1.13 WHEN the heuristic classifier processes "find murder relations" THEN it matches both `RELATIONSHIP_QUERY` (on "relation") and `DIRECT_RETRIEVAL` (on "find") in a fixed if-else chain, leading to incorrect intent classification based on regex order rather than semantic understanding

**1.5 Reasoning Engine**
1.14 WHEN `ReasoningEngine.processQuery()` is called THEN it performs an independent SDK initialization using `require('zcatalyst-sdk-node').initialize()` on line 21 which fails because no .catalystrc or OAuth config is available

1.15 WHEN the Reasoning Engine's independent SDK init fails THEN it falls to the catch block on line 112 which returns `fallbackReasoning()` with hardcoded values: claim "Analysis complete based on provided context", confidence level "Low", score 30, and empty mechanisms/evidence/alternatives arrays

1.16 WHEN the Reasoning Engine attempts to call the GLM endpoint directly via fetch() THEN it tries to extract a token from the failed SDK instance, gets no valid auth header, and the request fails with 401

1.17 WHEN any investigative query is processed THEN the UI displays empty Investigative Reasoning panels showing "Claim: Analysis complete", "Confidence: Low 30%", "Mechanism: (empty)", "Evidence: (empty)" regardless of the actual query or available data

**1.6 Session Context Persistence**
1.18 WHEN `ContextManager.getSession()` calls `CatalystNoSQL.getChatSession()` which calls `app.nosql().table('ChatSessions').fetchItem()` THEN the mock NoSQL implementation always returns an empty array `[]`

1.19 WHEN every chat request starts with a blank session THEN there is no conversation memory, no entity carry-over, and follow-up queries like "what about last year?" have no context to resolve against

1.20 WHEN the Active Context sidebar is rendered THEN it displays as always empty because no session data persists between requests

**1.7 Multi-Agent Retrieval**
1.21 WHEN SQLAgent constructs district mapping THEN it uses hardcoded mappings on lines 18-27 of `sqlAgent.ts` instead of querying the Districts table from Catalyst Data Store

1.22 WHEN GraphAgent retrieves entity relationships THEN it fetches ALL EntityRelationships rows from the mock store and filters client-side instead of using server-side WHERE clauses, which won't scale with real data volumes

1.23 WHEN VectorAgent calls `performSemanticSearch()` THEN it uses mock embeddings that return `[0.1, 0.1, ...]` resulting in meaningless cosine similarity scores, yet the UI displays fake semantic matches like "Attempt to Murder, 47% Match"

### Expected Behavior (Correct)

**2.1 Catalyst SDK Authentication**
2.1 WHEN the application attempts to initialize the Catalyst SDK using `getCatalystApp()` THEN it SHALL successfully authenticate using OAuth Client ID/Secret credentials from environment variables `CATALYST_CLIENT_ID` and `CATALYST_CLIENT_SECRET`

2.2 WHEN `USE_MOCK_CATALYST=false` is set in environment variables THEN the system SHALL throw a clear startup error instead of silently falling back to mock mode if authentication fails

2.3 WHEN Catalyst SDK authentication succeeds THEN all downstream services (ZCQL, NoSQL, QuickML, FileStore) SHALL operate against real Catalyst cloud services

**2.2 Database Layer (ZCQL)**
2.4 WHEN any component queries the database using `app.zcql().executeZCQLQuery()` THEN the query SHALL execute against the real Catalyst Data Store cloud database and return production data

2.5 WHEN SQLAgent constructs ZCQL queries THEN it SHALL use parameterized queries to prevent SQL injection vulnerabilities

2.6 WHEN the Districts table is needed for mapping THEN the system SHALL query it dynamically from Catalyst Data Store instead of using hardcoded values

**2.3 QuickML LLM Response Generation**
2.7 WHEN `CatalystQuickML.generateResponse()` is called THEN it SHALL obtain a valid OAuth Bearer token using the shared `getAccessToken()` function from `direct-api.ts`

2.8 WHEN the GLM API request is sent THEN it SHALL include valid authentication headers: `Authorization: Bearer {token}` and `CATALYST-ORG: {org_id}`

2.9 WHEN the Catalyst GLM endpoint processes the request THEN it SHALL return a natural language response generated by the GLM 47B model

2.10 WHEN a user says "hello" THEN the system SHALL return a contextually aware greeting generated by the LLM that describes the assistant's capabilities

2.11 WHEN a user asks a substantive query with retrieved data THEN the system SHALL generate an intelligent summary using the GLM model that analyzes patterns, identifies connections, and provides investigative insights

2.12 WHEN the GLM system prompt is sent THEN it SHALL include domain-specific instructions that guide the model to act as a Karnataka State Police intelligence assistant and summarize FIR data using criminological context

**2.4 Intent Classification**
2.13 WHEN `IntentClassifier.classify()` sends a classification prompt to `CatalystQuickML.generateResponse()` THEN it SHALL receive an LLM-generated intent classification with confidence scores and extracted entities

2.14 WHEN the heuristic classifier is used as a fallback THEN it SHALL implement a scoring-based system where multiple matched regex patterns are weighted and the intent with the highest aggregate score is selected

**2.5 Reasoning Engine**
2.15 WHEN `ReasoningEngine.processQuery()` is called THEN it SHALL use the shared authenticated Catalyst instance from `getCatalystApp()` instead of performing an independent SDK initialization

2.16 WHEN the Reasoning Engine calls the GLM endpoint THEN it SHALL use the shared OAuth flow via `getAccessToken()` from `direct-api.ts`

2.17 WHEN the GLM responds with reasoning output THEN it SHALL include a structured claim, identified criminological mechanisms (Routine Activity Theory, Crime Pattern Theory, etc.), linked evidence with real FIR IDs, evaluated alternative hypotheses, and a confidence score derived from data quality metrics

2.18 WHEN reasoning outputs are generated THEN they SHALL be persisted to the `ReasoningOutputs` NoSQL table in Catalyst for audit compliance

**2.6 Session Context Persistence**
2.19 WHEN `ContextManager.getSession()` calls `CatalystNoSQL.getChatSession()` THEN it SHALL retrieve the actual session data from the real Catalyst NoSQL `ChatSessions` table

2.20 WHEN a session is updated with new context THEN `saveChatSession()` SHALL upsert (update or insert) the session data to Catalyst NoSQL

2.21 WHEN follow-up queries are processed THEN the system SHALL have access to previous conversation context including extracted entities, active districts, crime types, and time windows

2.22 WHEN the Active Context sidebar is rendered THEN it SHALL display accumulated entities and context from the persistent session

**2.7 Multi-Agent Retrieval**
2.23 WHEN GraphAgent retrieves entity relationships THEN it SHALL use server-side WHERE clause filtering: `SELECT * FROM EntityRelationships WHERE source LIKE '%entityName%' OR target LIKE '%entityName%'` instead of fetching all rows

2.24 WHEN VectorAgent is not yet operational THEN it SHALL be disabled to prevent displaying fake similarity scores until real Catalyst QuickML embeddings are configured

### Unchanged Behavior (Regression Prevention)

**3.1 Seed Data Integrity**
3.1 WHEN the system switches from mock to real Catalyst services THEN the seed data structure and schema (FIRs, Persons, Vehicles, EntityRelationships, Districts) SHALL CONTINUE TO match the existing JSON seed files format

3.2 WHEN ZCQL queries are parameterized THEN the query results for equivalent queries SHALL CONTINUE TO return the same data structure and fields as before

**3.2 API Contract Stability**
3.3 WHEN the chat API endpoint `/api/chat` receives a POST request THEN it SHALL CONTINUE TO accept the same request format: `{ message, language, sessionId }` and return the same response structure: `{ text_summary, data_table, rag_context, reasoning_block }`

3.4 WHEN intent classification is improved THEN the set of valid intent types (DIRECT_RETRIEVAL, AGGREGATE_ANALYTICAL, REASONING_QUERY, RELATIONSHIP_QUERY, CONVERSATIONAL, FOLLOW_UP) SHALL CONTINUE TO be recognized

**3.3 UI Component Compatibility**
3.5 WHEN the Reasoning Engine returns structured output THEN the UI components expecting `reasoning_block` with fields `claim`, `mechanisms`, `evidence`, `alternatives`, `confidence` SHALL CONTINUE TO render correctly

3.6 WHEN RAG context is returned in the response THEN the data table widget and semantic search widget SHALL CONTINUE TO parse and display the evidence arrays

**3.4 Translation and Multilingual Support**
3.7 WHEN a user submits a query in Kannada (`language: 'kn'`) THEN the system SHALL CONTINUE TO translate the query to English before processing and translate the response back to Kannada

3.8 WHEN crime type mappings include Kannada transliterations THEN the existing mappings SHALL CONTINUE TO work alongside new LLM-based entity extraction

**3.5 Environment Configuration**
3.9 WHEN new environment variables are added (CATALYST_CLIENT_ID, CATALYST_CLIENT_SECRET, CATALYST_ORG_ID) THEN existing environment variables (CATALYST_PROJECT_ID, QUICKML_ENDPOINT_KEY) SHALL CONTINUE TO be used for their current purposes

3.10 WHEN the system runs in development mode with proper Catalyst auth THEN the seed data loading mechanism SHALL CONTINUE TO function for local testing

**3.6 Error Handling**
3.11 WHEN a Catalyst service is temporarily unavailable THEN the system SHALL CONTINUE TO return user-friendly error messages instead of crashing

3.12 WHEN query parsing fails THEN the system SHALL CONTINUE TO return a 400 error with a descriptive message

**3.7 File Upload and Document Processing**
3.13 WHEN FIR documents are uploaded to Catalyst FileStore THEN the existing upload flow via `/api/firs/upload` SHALL CONTINUE TO work with the real authenticated Catalyst SDK

3.14 WHEN OCR processing updates FIR records THEN the existing ZCQL UPDATE queries in the OCR pipeline SHALL CONTINUE TO function against real Catalyst Data Store

---

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition(SystemState)
  INPUT: SystemState containing {catalyst_authenticated, using_mock, quickml_functional, reasoning_engine_functional, nosql_persistent}
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

**Explanation**: The bug condition is met when ANY of the following are true:
- Catalyst SDK is not properly authenticated
- The system is using mock implementations despite `USE_MOCK_CATALYST=false`
- QuickML/GLM is not generating real responses
- Reasoning Engine is returning fallback outputs
- NoSQL session persistence is not working

### Property Specification

```pascal
// Property: Fix Checking - Real Catalyst Integration
FOR ALL ChatRequests WHERE isBugCondition(SystemState) DO
  // After fix, the same request should use real Catalyst services
  response ← processChatRequest'(request)
  
  ASSERT response.uses_real_catalyst = TRUE
  ASSERT response.llm_generated = TRUE
  ASSERT response.confidence_score > 30 OR response.confidence_score = NULL
  ASSERT response.reasoning_mechanisms.length >= 0
  ASSERT response.session_persisted = TRUE
END FOR
```

### Preservation Property

```pascal
// Property: Preservation Checking - Non-Buggy Flows Unchanged
FOR ALL SystemComponents WHERE NOT affectedByAuthFix(component) DO
  // Components not related to Catalyst auth should work identically
  ASSERT component.behavior_before_fix = component.behavior_after_fix
END FOR

// Examples of preserved components:
// - Translation service (uses external API, not Catalyst)
// - Frontend UI rendering logic
// - Seed data JSON file structure
// - API route signatures and response formats
```

### Concrete Bug Examples (Counterexamples)

**Example 1: Hello Query**
- **Input**: `{ message: "hello", language: "en", sessionId: "sess-123" }`
- **Current (Buggy) Output**: `"Hello Officer. I am ready to assist with your investigation."`
- **Expected (Fixed) Output**: GLM-generated greeting, e.g., `"Hello! I'm your CrimeIntel Assistant, powered by Karnataka State Police intelligence databases. I can help you search for FIRs, analyze crime patterns, investigate connections between suspects and cases, and identify crime hotspots. What would you like to explore?"`

**Example 2: Murder Query**
- **Input**: `{ message: "show murder cases", language: "en", sessionId: "sess-123" }`
- **Current (Buggy) Output**:
  - Text: Heuristic template `"I found X incident records..."`
  - Reasoning: `{ claim: "Analysis complete based on provided context.", confidence: { level: "Low", score: 30 }, mechanisms: [] }`
- **Expected (Fixed) Output**:
  - Text: GLM analysis of murder cases with patterns and insights
  - Reasoning: Real criminological analysis with identified mechanisms (e.g., Routine Activity Theory), evidence linked to FIR IDs, confidence score based on data quality

**Example 3: Follow-Up Query**
- **Input**: `{ message: "what about last year?", language: "en", sessionId: "sess-123" }`
- **Current (Buggy) Output**: No context available, treats as new query
- **Expected (Fixed) Output**: Uses persisted session context from previous query, applies time filter to previously identified crime type/district

---

## Fix Validation Strategy

### Critical Path Testing (Phases)

**Phase 1: Authentication & Data (Must be fixed first)**
- ✓ Catalyst SDK authenticates successfully with OAuth credentials
- ✓ ZCQL queries return data from real Catalyst Data Store (not seed files)
- ✓ NoSQL operations persist/retrieve from real Catalyst NoSQL tables

**Phase 2: LLM Pipeline (Unlocks intelligent responses)**
- ✓ QuickML/GLM generates natural language responses using real GLM 47B model
- ✓ Reasoning Engine produces structured criminological analysis with real confidence scores
- ✓ Intent classification uses LLM instead of falling back to heuristics

**Phase 3: Intelligence Quality (Improves accuracy)**
- ✓ SQLAgent uses parameterized queries and dynamic district mapping
- ✓ GraphAgent uses server-side filtering
- ✓ VectorAgent is disabled until embeddings are configured

**Phase 4: UX (Enables conversation flow)**
- ✓ Session context persists across requests
- ✓ Active Context sidebar shows accumulated entities
- ✓ Follow-up queries resolve against previous context

### Verification Commands

```bash
# Test 1: Verify Catalyst SDK authentication
curl -X POST http://localhost:3000/api/health/catalyst

# Test 2: Send hello query - should get real LLM response (not hardcoded template)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","language":"en","sessionId":"test-001"}'

# Test 3: Send substantive query - should get reasoning with confidence > 30
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"show murder cases in Bengaluru","language":"en","sessionId":"test-001"}'

# Test 4: Follow-up query - should use persisted context
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"what about last year?","language":"en","sessionId":"test-001"}'
```

### Success Criteria

| Test Case | Current Behavior | Expected After Fix |
|-----------|------------------|-------------------|
| "hello" query | Returns hardcoded "Hello Officer..." | Returns GLM-generated contextual greeting |
| Reasoning confidence | Always 30% with empty mechanisms | Variable confidence (40-95%) with identified theories |
| Session persistence | Active Context always empty | Active Context shows accumulated entities |
| ZCQL query source | In-memory seed data | Real Catalyst Data Store cloud database |
| QuickML response | Hardcoded templates | GLM-generated natural language |
| SQL injection risk | Vulnerable string interpolation | Parameterized queries |

