# Authentication Flow End-to-End Tests

## Overview

This test suite validates the complete authentication flow for the Zoho Catalyst SDK integration, ensuring that all authentication strategies work correctly and that services operate against real Catalyst cloud infrastructure instead of mock implementations.

**Test File**: `tests/integration/auth-flow.test.ts`  
**Task**: 3.4 - Test authentication flow end-to-end  
**Phase**: Phase 1 - Authentication & Infrastructure

## Purpose

- ✅ Verify Catalyst SDK authenticates successfully with real credentials
- ✅ Validate ZCQL queries return data from real Catalyst Data Store
- ✅ Confirm NoSQL operations connect to real Catalyst tables
- ✅ Ensure no silent fallback to mock mode when `USE_MOCK_CATALYST=false`

## Test Structure

### Test 1: SDK Authentication
- **Test 1.1**: Verify `getCatalystApp()` returns authenticated instance when credentials present
- **Test 1.2**: Confirm no "Falling back to MOCK mode" warnings appear

### Test 2: ZCQL Query Execution
- Execute simple query: `SELECT * FROM FIRs LIMIT 1`
- Verify query returns results
- Validate FIR record structure

### Test 3: Data Source Verification
- Verify results come from real Catalyst Data Store (not seed JSON)
- Confirm data source is production database

### Test 4: ROWID Format Verification
- Check ROWID format is real Catalyst ID (not "MOCK_*" or "SEED_*")
- Validate multiple records for consistency

### Test 5: NoSQL Table Connection
- **Test 5.1**: Verify NoSQL `fetchItem` operation works
- **Test 5.2**: Verify NoSQL `insertItems` operation works
- Validate connection to ChatSessions table

## Running the Tests

### In Mock Mode (Default for Test Environment)

```bash
npm run test:auth-flow
```

This will run in mock mode by default (since `NODE_ENV=test`). All tests will pass but will be marked as SKIPPED since they cannot validate real authentication.

### In Real Catalyst Mode

To test actual Catalyst authentication:

1. **Set environment variable**:
   ```bash
   # In .env.local
   USE_MOCK_CATALYST=false
   ```

2. **Configure OAuth credentials** (from Task 3.1 and 3.3):
   ```bash
   # In .env.local
   CATALYST_CLIENT_ID=your_client_id
   CATALYST_CLIENT_SECRET=your_client_secret
   CATALYST_REFRESH_TOKEN=your_refresh_token
   CATALYST_ORG_ID=your_org_id
   CATALYST_PROJECT_ID=your_project_id
   ```

3. **Run the tests**:
   ```bash
   npm run test:auth-flow
   ```

## Expected Results

### Mock Mode
```
Mode: MOCK
Environment: test
USE_MOCK_CATALYST: not set

⚠️  Tests ran in MOCK mode
   - Test 1 SKIPPED (SDK authentication)
   - Test 3 SKIPPED (Real data store verification)
   - Test 4 SKIPPED (ROWID format verification)
   - Tests 2, 5 PASSED (Mock operations work)
```

### Real Catalyst Mode
```
Mode: REAL CATALYST
Environment: development
USE_MOCK_CATALYST: false

✅ All authentication tests completed successfully
   - SDK authenticated with real credentials
   - ZCQL queries returning real Catalyst data
   - NoSQL operations connecting to real tables
   - No mock fallback warnings detected
```

## Dependencies

This test suite validates the following completed tasks:

- **Task 3.1**: Centralized OAuth authentication module (`lib/catalyst/auth.ts`)
  - `getSharedAccessToken()` function for token management
  - Token caching with 60-second buffer

- **Task 3.2**: Updated SDK initialization with strict mode
  - OAuth Refresh Token authentication strategy
  - Conditional mock fallback based on `USE_MOCK_CATALYST` flag
  - Clear error messages when authentication fails

- **Task 3.3**: Environment variables configured
  - OAuth credentials documented
  - `.env.local.example` created

## Acceptance Criteria

All acceptance criteria from Task 3.4 are validated:

- ✅ **SDK authenticates successfully** - Test 1 verifies authenticated instance
- ✅ **ZCQL queries return real data** - Test 2 and 3 verify Data Store connection
- ✅ **NoSQL operations work** - Test 5 verifies NoSQL table operations
- ✅ **No mock fallback warnings** - Test 1.2 checks console output

## Integration with Bugfix Workflow

This test suite is part of the broader bugfix workflow for the Catalyst integration cascade failure:

**Bug Condition** (from `bugfix.md` section 1.1-1.3):
- WHEN Catalyst SDK initialization fails THEN system silently falls back to mock mode
- WHEN `USE_MOCK_CATALYST=false` is set THEN system ignores flag and uses mock anyway

**Expected Behavior** (from `bugfix.md` section 2.1-2.3):
- WHEN SDK authenticates successfully THEN all downstream services operate against real Catalyst
- WHEN `USE_MOCK_CATALYST=false` THEN system throws clear error instead of silent fallback
- WHEN authentication succeeds THEN ZCQL, NoSQL, QuickML use real cloud services

## Next Steps

After Task 3.4 passes with real credentials, proceed to:

- **Phase 2 (Task 4)**: Fix QuickML/GLM LLM response generation
  - Task 4.1: Update QuickML OAuth integration
  - Task 4.2: Implement context summarization
  - Task 4.3: Create domain-specific system prompt
  - Task 4.4: Update Reasoning Engine SDK usage

## Troubleshooting

### "Cannot find package" Error
- Check that vitest.config.ts has correct path alias: `'@': path.resolve(__dirname, './')`
- Verify import uses `@/lib/catalyst/index` (not `@/crimeintel/lib/catalyst/index`)

### Tests Always Skip in Real Mode
- Verify `USE_MOCK_CATALYST=false` is set in `.env.local` (not `.env`)
- Check that `NODE_ENV` is not set to `'test'` when running manually
- Confirm OAuth credentials are configured

### Authentication Fails
- Verify OAuth credentials are valid and not expired
- Check that `CATALYST_REFRESH_TOKEN` is correctly set
- Ensure Catalyst project and org IDs match your account
- Review console logs for specific OAuth error messages

### ZCQL Returns No Data
- Verify Catalyst Data Store tables exist (FIRs, ChatSessions, etc.)
- Check that seed data has been loaded (see Task 5.7 for seeding endpoint)
- Confirm table permissions allow read access

## Related Files

- `lib/catalyst/index.ts` - SDK initialization and authentication strategies
- `lib/catalyst/auth.ts` - Centralized OAuth token management
- `.env.local` - Environment configuration
- `tests/integration/catalyst-integration.test.ts` - Bug condition exploration tests (Task 1)
- `tests/integration/preservation.test.ts` - Preservation property tests (Task 2)
