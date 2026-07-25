# Embeddings Table Schema
## Phase 1 Step 9: Vector Embeddings for Semantic Search

This table stores vector embeddings for FIR narratives and OCR text to enable semantic search.

---

## Table Structure

### Embeddings Table (Create in Catalyst Console)

```
Column Name       Type            Description
id                VARCHAR(100)    Primary key (EMB_FIR_FIR123_timestamp)
entityId          VARCHAR(100)    Foreign key to source entity (FIR ID, Person ID, etc.)
entityType        VARCHAR(20)     Entity type: FIR, Person, Case, Evidence
text              TEXT            Source text (truncated to 1000 chars for reference)
embedding         TEXT            Vector embedding as JSON string array
model             VARCHAR(50)     Embedding model used (catalyst-zia, text-embedding-3-small, etc.)
dimensions        INT             Vector dimensions (384, 1536, etc.)
createdAt         TIMESTAMP       When embedding was generated
```

---

## Sample Data

```json
{
  "id": "EMB_FIR_FIR_TEST001_1690123456789",
  "entityId": "FIR_TEST001",
  "entityType": "FIR",
  "text": "Complainant reported theft of mobile phone by unknown person near railway station. Phone model: iPhone 13, IMEI: 123456789012345. Accused fled on motorcycle without registration number. Amount: Rs 80,000.",
  "embedding": "[0.123, -0.456, 0.789, ..., 0.234]",
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "createdAt": "2026-07-25T14:30:00Z"
}
```

---

## Usage Examples

### Generate Embeddings for Single FIR
```bash
POST /api/embeddings
{
  "action": "generate",
  "firId": "FIR_TEST001"
}
```

### Batch Generate for Multiple FIRs
```bash
POST /api/embeddings
{
  "action": "batch",
  "firIds": ["FIR_TEST001", "FIR_TEST002", "FIR_TEST003"]
}
```

### Semantic Search by Text
```bash
POST /api/embeddings
{
  "action": "search",
  "query": "mobile phone theft near railway station"
}
```

### Find Similar FIRs
```bash
GET /api/embeddings?firId=FIR_TEST001&action=similar
```

---

## Embedding Models

### 1. Catalyst Zia (Primary)
- **Model**: `catalyst-zia`
- **Dimensions**: Variable
- **Cost**: Included with Catalyst
- **Quality**: Optimized for legal/police documents

### 2. OpenAI (Fallback)
- **Model**: `text-embedding-3-small`
- **Dimensions**: 1536
- **Cost**: $0.00002 per 1K tokens
- **Quality**: High-quality general embeddings

### 3. Fallback (Testing)
- **Model**: `fallback-hash`
- **Dimensions**: 384
- **Cost**: Free
- **Quality**: Basic (not suitable for production)

---

## Similarity Calculation

Uses **cosine similarity** between vectors:

```
similarity = (A · B) / (||A|| * ||B||)

Where:
- A, B are embedding vectors
- A · B is dot product
- ||A|| is vector magnitude
- Result: -1 (opposite) to +1 (identical)
```

---

## Create Table in Catalyst Console

1. **Open Catalyst Console**
   - Go to: https://console.catalyst.zoho.com
   - Select your project

2. **Navigate to Data Store**
   - Left sidebar → Data Store
   - Click "Create Table"

3. **Table Configuration**
   ```
   Table Name: Embeddings
   Description: Vector embeddings for semantic search
   ```

4. **Add Columns** (in order):

   **Column 1: id**
   ```
   Name: id
   Type: VARCHAR
   Max Length: 100
   Mandatory: YES (Primary Key)
   ```

   **Column 2: entityId**
   ```
   Name: entityId
   Type: VARCHAR
   Max Length: 100
   Mandatory: YES
   ```

   **Column 3: entityType**
   ```
   Name: entityType
   Type: VARCHAR
   Max Length: 20
   Mandatory: YES
   ```

   **Column 4: text**
   ```
   Name: text
   Type: TEXT
   Mandatory: NO
   ```

   **Column 5: embedding**
   ```
   Name: embedding
   Type: TEXT
   Mandatory: YES
   ```

   **Column 6: model**
   ```
   Name: model
   Type: VARCHAR
   Max Length: 50
   Mandatory: YES
   ```

   **Column 7: dimensions**
   ```
   Name: dimensions
   Type: INT
   Mandatory: YES
   ```

   **Column 8: createdAt**
   ```
   Name: createdAt
   Type: TIMESTAMP
   Mandatory: YES
   ```

5. **Create Indexes** (Optional, for performance)
   - Index on: `entityId`
   - Index on: `entityType`
   - Index on: `createdAt`

---

## Query Examples

### Get embeddings for a FIR
```sql
SELECT * FROM Embeddings 
WHERE entityId = 'FIR_TEST001' 
AND entityType = 'FIR';
```

### Get all FIR embeddings
```sql
SELECT entityId, model, dimensions, createdAt 
FROM Embeddings 
WHERE entityType = 'FIR' 
ORDER BY createdAt DESC;
```

### Find embeddings by model
```sql
SELECT COUNT(*) as count, model 
FROM Embeddings 
GROUP BY model;
```

### Recent embeddings
```sql
SELECT entityId, entityType, model, createdAt 
FROM Embeddings 
WHERE createdAt > '2026-07-01' 
ORDER BY createdAt DESC 
LIMIT 100;
```

---

## Environment Setup

### OpenAI API Key (Optional)
Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-your-key-here
```

### Catalyst Zia (Recommended)
Ensure Zia Services are enabled in Catalyst Console:
1. Console → Zia Services
2. Enable "Embeddings" service
3. Check available quota

---

## Performance Considerations

### Storage Size
- Each embedding record: ~6KB (1536 dimensions)
- 1000 FIRs: ~6MB
- 10,000 FIRs: ~60MB

### Generation Time
- Single FIR: 0.5-2 seconds
- Batch of 100 FIRs: 1-5 minutes
- Rate limiting: 100ms delay between requests

### Search Performance
- Linear search: O(n) where n = number of embeddings
- For >10K embeddings, consider vector database (Pinecone, Weaviate)

---

## Troubleshooting

### Issue: "Zia not available"
**Solution:**
- Enable Zia Services in Catalyst Console
- Check Zia quota/credits
- Verify project has Zia access

### Issue: "OpenAI API failed"
**Solution:**
- Verify API key in environment
- Check OpenAI account quota
- Ensure text length < 8000 characters

### Issue: "Table not found"
**Solution:**
- Create Embeddings table in Catalyst Console
- Verify exact table name: `Embeddings`
- Check column names match schema

### Issue: "Similarity search returns no results"
**Solution:**
- Generate embeddings first: `POST /api/embeddings`
- Verify embeddings stored in table
- Check query text is meaningful

---

## Integration with Search

### Step 10 Preview
The embeddings enable semantic search in Step 10:

```typescript
// Semantic search
const results = await EmbeddingsService.searchByText(
  "theft of vehicle near market"
);

// Traditional keyword search
const keywordResults = await SearchService.keywordSearch(
  "theft AND vehicle AND market"
);

// Combined results
const combinedResults = SearchService.combineResults(
  results, keywordResults
);
```

---

**Step 9 Complete! Vector embeddings enable semantic search and similarity matching. ✅**