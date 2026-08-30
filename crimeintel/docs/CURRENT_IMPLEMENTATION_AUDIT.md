# CrimeIntel — Current Implementation Audit

## 1. Current Frontend Architecture
- **Status**: [REAL] (Mostly)
- **Framework**: Next.js 14 App Router, React, TailwindCSS, Lucide React icons.
- **State**: The UI has well-designed pages (`/cases`, `/offenders`, `/dashboard`, `/chat`, etc.)
- **Data fetching**: React components fetch data from Next.js API Routes (e.g., `app/api/cases/route.ts`, `app/api/chat/route.ts`).
- **Conclusion**: The frontend is highly reusable and does not need to be discarded. It simply needs to point to real Python FastAPI endpoints instead of the current mock Catalyst backend.

## 2. Current Backend Architecture
- **Status**: [MOCK/BROKEN]
- **Framework**: Next.js API Routes (`app/api/*`).
- **Logic**: API routes act as a proxy, calling Catalyst SDK methods via `lib/catalyst/index.ts` and `lib/catalyst/datastore.ts`.
- **Conclusion**: This layer should be completely replaced by the FastAPI Python backend. The Next.js API routes can either be deleted or repurposed as simple pass-throughs to FastAPI.

## 3. Current Database Architecture
- **Status**: [MOCK/HARDCODED]
- **Technology**: Zoho Catalyst Data Store / MOCK JSON seeds.
- **Structure**: Flat NoSQL-style tables (`FIRs`, `Persons`, `Vehicles`, `EntityRelationships`). 
- **Relationships**: Weakly enforced. Real relational constraints (Foreign Keys) do not exist.
- **Current State**: Because Zoho authentication failed (`USE_MOCK_CATALYST=true`), the system is serving hardcoded JSON seed files loaded into memory maps.
- **Conclusion**: Must be fully replaced with PostgreSQL and proper relational schemas (CaseMaster, FIR, Accused, etc.).

## 4. Current AI Architecture
- **Status**: [PARTIAL/MOCK]
- **Core LLM**: Gemini (via `@google/genai` or API keys in `.env`). This is [REAL].
- **Orchestration**: `Coordinator.ts` dispatches queries to 13 different "Agents" (`SQLAgent`, `GraphAgent`, `VectorAgent`, etc.). This is [OVER-ENGINEERED/PARTIAL].
- **Mock Services**: QuickML intent classification and reasoning engines are heavily mocked in `lib/catalyst/index.ts` (returning hardcoded reasoning payloads).
- **Conclusion**: The complex multi-agent system should be simplified to a single Python intelligent orchestrator (query planning -> retrieval -> grounded LLM).

## 5. Current Chatbot Flow
- **Status**: [MOCK/PLACEHOLDER]
- **Flow**: User -> `/api/chat` -> QuickML Intent Classifier (Mocked) -> Coordinator -> SQLAgent (ZCQL/Mock SQL) -> Gemini -> User.
- **Retrieval**: SQLAgent translates queries to ZCQL, but runs against mock data arrays.
- **Conclusion**: Fails to retrieve true dynamic context. Needs a complete rewrite in Python using SQL/Vector/Graph queries against PostgreSQL.

## 6. Current OCR Flow
- **Status**: [NOT IMPLEMENTED]
- **State**: There are UI placeholders for uploading FIRs and evidence, but no actual OCR extraction pipeline exists in the codebase.
- **Conclusion**: Needs to be built from scratch in Python (e.g., PaddleOCR/Tesseract -> chunking -> PostgreSQL).

## 7. Current GraphRAG Flow
- **Status**: [MOCK]
- **State**: `GraphAgent` exists, but the "Graph" is just a flat `EntityRelationships` Catalyst table or hardcoded JSON array. There is no true graph traversal or relationship context assembly.
- **Conclusion**: Rebuild in PostgreSQL using edge tables (EntityRelationship) and recursive CTEs or Python-based traversal.

## 8. Current Vector Search Flow
- **Status**: [NOT IMPLEMENTED/SKIPPED]
- **State**: `VectorAgent.ts` literally logs: `"Embeddings not configured... Skipping vector search."` QuickML embeddings mock returns an array of `[0.1, 0.1, ...]`.
- **Conclusion**: Needs to be implemented using `pgvector` and a real embedding model.

## 9. Current File/Document Flow
- **Status**: [MOCK]
- **State**: Catalyst Stratus is configured, but currently falls back to `mockDataStore.files` (in-memory Map) which loses files on restart.
- **Conclusion**: Replace with S3-compatible Object Storage via FastAPI.

## 10. Every Hardcoded Value
- Seed JSON data in `data/seed/` (`FIRs.json`, `Persons.json`, etc.).
- Mock QuickML reasoning payloads in `lib/catalyst/index.ts` (returns hardcoded Routine Activity Theory strings).
- `USE_MOCK_CATALYST=true` fallback logic.
- Mock file URLs (`/mock-files/...`).

## 11. Every Mock
- **Database**: `mockDataStore` in `index.ts` replacing Catalyst.
- **ZCQL**: Regex-based mock SQL parser in `index.ts`.
- **QuickML**: Mock intent classification and chat summarization.

## 12. Every Placeholder
- OCR Pipeline (UI only).
- Vector Embeddings (Code exists but is skipped).
- Threat/Spatial Agents (Return random or mocked aggregate data).

## 13. Every Dead/Unreachable Implementation
- Direct API queries (`lib/catalyst/direct-api.ts`) are currently unreachable because `USE_MOCK_CATALYST=true` forces the mock store.
- Catalyst auth flows in `index.ts` are unreachable/failing due to missing `.zcatalyst` CLI credentials.

## 14. Every API Route and What It Actually Does
- `/api/chat`: Processes chat messages, calls mock AI, returns summary.
- `/api/cases`: Returns mock FIR data.
- `/api/auth/me`: Returns mock user session.
- `/api/nosql/chat`: Saves chat history to in-memory mock store.
- `/api/notifications`: Returns mock system alerts.

## 15. Every Database Table Currently Referenced
- `FIRs`, `Persons`, `Vehicles`, `PhoneRecords`, `Weapons`, `BankAccounts`, `EntityRelationships`, `Embeddings`, `Districts`, `Notifications`, `SystemHealth`, `PoliceStations`.

## 16. Every Relationship Currently Implemented
- Flat `EntityRelationships` table linking `source_id` to `target_id`. No enforced integrity.

## 17. Every Component That Needs Replacement
- **Backend API Routes**: All of `app/api/` should be ported to FastAPI.
- **Database Layer**: All of `lib/catalyst/` must be deleted.
- **AI Orchestration**: All of `lib/ai/agents/` should be rewritten as Python Retrieval tools.

## 18. Components That Can Be Preserved
- All React UI components in `components/`.
- All Next.js page layouts in `app/`.
- Styling, icons, and themes.

## 19. Exact Migration Plan

1. **Keep Next.js running for the UI**, but point API calls to `localhost:8000` (FastAPI).
2. **Delete `lib/catalyst` and `app/api`** (or deprecate them) once Python endpoints are ready.
3. **Spin up PostgreSQL via Docker** (`docker-compose.yml`) with `pgvector`.
4. **Create SQLAlchemy/SQLModel schemas** for the normalized relational design.
5. **Build FastAPI routes** matching the data needs of the Next.js UI (`/cases`, `/chat`, etc.).
6. **Implement Python RAG Pipeline**: FastAPI endpoint -> Embeddings -> pgvector search + SQL lookup -> LLM prompt -> Response.
