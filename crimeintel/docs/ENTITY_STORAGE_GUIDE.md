# Entity Storage Guide
## Phase 1 Step 6: Storing Extracted Entities

This guide explains how extracted entities from OCR text are stored in Catalyst Data Store tables.

---

## Overview

After OCR text extraction and entity recognition, structured entities are automatically stored in their respective tables:

```
OCR Text → Entity Extraction → Entity Storage → Data Store Tables
```

**Stored Entity Types:**
- ✅ Persons (Complainants, Victims, Accused, Witnesses)
- ✅ Vehicles (Registration numbers, descriptions)
- ✅ Phone Records (Mobile numbers, IMEI)
- ✅ Weapons (Types, descriptions)
- ✅ Bank Accounts (Account numbers, bank details)

---

## Table Structure

### Persons Table
```
id                 VARCHAR(100)  Primary Key (PERSON_FIR123_1)
name               VARCHAR(200)  Person's full name
age                INT           Age (if extracted)
gender             VARCHAR(10)   Male/Female/Other
role               VARCHAR(50)   Complainant, Victim, Accused, Witness, Officer
phone              VARCHAR(15)   Contact number
address            TEXT          Residential address
aadhaar            VARCHAR(12)   Aadhaar number (masked)
fir_id             VARCHAR(100)  Foreign key to FIRs table
case_id            VARCHAR(100)  Foreign key to Cases table
extracted_from_ocr BOOLEAN       TRUE if auto-extracted
extraction_date    TIMESTAMP     When entity was extracted
```

### Vehicles Table
```
id                 VARCHAR(100)  Primary Key (VEHICLE_FIR123_1)
registration       VARCHAR(20)   Vehicle registration number (KA03AB1234)
type               VARCHAR(50)   Car, Motorcycle, Truck, etc.
color              VARCHAR(50)   Vehicle color
make               VARCHAR(50)   Manufacturer (Honda, Maruti, etc.)
model              VARCHAR(50)   Model name
owner              VARCHAR(200)  Owner's name
fir_id             VARCHAR(100)  Foreign key to FIRs table
case_id            VARCHAR(100)  Foreign key to Cases table
extracted_from_ocr BOOLEAN       TRUE if auto-extracted
extraction_date    TIMESTAMP     When entity was extracted
```

### PhoneRecords Table
```
id                 VARCHAR(100)  Primary Key (PHONE_FIR123_1)
number             VARCHAR(15)   Phone number (10 digits)
imei               VARCHAR(20)   IMEI number (if available)
owner              VARCHAR(200)  Owner's name
type               VARCHAR(20)   Mobile or Landline
fir_id             VARCHAR(100)  Foreign key to FIRs table
case_id            VARCHAR(100)  Foreign key to Cases table
extracted_from_ocr BOOLEAN       TRUE if auto-extracted
extraction_date    TIMESTAMP     When entity was extracted
```

### Weapons Table
```
id                 VARCHAR(100)  Primary Key (WEAPON_FIR123_1)
type               VARCHAR(100)  Knife, Gun, Pistol, etc.
description        TEXT          Detailed description
serial_number      VARCHAR(50)   Serial/registration number
fir_id             VARCHAR(100)  Foreign key to FIRs table
case_id            VARCHAR(100)  Foreign key to Cases table
extracted_from_ocr BOOLEAN       TRUE if auto-extracted
extraction_date    TIMESTAMP     When entity was extracted
```

### BankAccounts Table
```
id                 VARCHAR(100)  Primary Key (BANK_FIR123_1)
account_number     VARCHAR(20)   Bank account number
bank_name          VARCHAR(100)  Bank name
ifsc               VARCHAR(11)   IFSC code
holder             VARCHAR(200)  Account holder name
fir_id             VARCHAR(100)  Foreign key to FIRs table
case_id            VARCHAR(100)  Foreign key to Cases table
extracted_from_ocr BOOLEAN       TRUE if auto-extracted
extraction_date    TIMESTAMP     When entity was extracted
```

---

## API Usage

### Extract and Store Entities

```bash
POST /api/extract
Content-Type: application/json

{
  "firId": "FIR_TEST001",
  "storeEntities": true  # Set to false to extract without storing
}
```

**Response:**
```json
{
  "success": true,
  "message": "Entity extraction and storage completed",
  "data": {
    "persons": [
      {
        "name": "Rahul Kumar",
        "role": "Complainant",
        "age": 35,
        "phone": "9876543210"
      }
    ],
    "vehicles": [
      {
        "registration": "KA03AB1234",
        "type": "Car",
        "color": "Red"
      }
    ],
    "phones": [
      {
        "number": "9876543210",
        "type": "Mobile"
      }
    ],
    "method": "regex",
    "confidence": 0.70
  },
  "storage": {
    "personsStored": 1,
    "vehiclesStored": 1,
    "phonesStored": 1,
    "weaponsStored": 0,
    "bankAccountsStored": 0,
    "success": true,
    "errors": []
  },
  "stats": {
    "extraction": {
      "personsCount": 1,
      "vehiclesCount": 1,
      "phonesCount": 1,
      "method": "regex",
      "confidence": 0.70
    },
    "storage": {
      "personsStored": 1,
      "vehiclesStored": 1,
      "phonesStored": 1,
      "success": true
    }
  }
}
```

---

## Storage Flow

### 1. Extraction Phase
```typescript
const extractionResult = await EntityExtractor.extract(ocrText, firId);
// Returns: { persons: [], vehicles: [], phones: [], ... }
```

### 2. Storage Phase
```typescript
const storageResult = await EntityStorage.storeEntities(
  extractionResult,
  firId,
  caseId  // optional
);
// Stores entities in Data Store tables
```

### 3. Verification
```typescript
const entities = await EntityStorage.getEntitiesForFIR(firId);
// Returns all entities linked to this FIR
```

---

## Error Handling

### Batch Insert Failure
If batch insert fails, the system automatically retries one-by-one:

```typescript
try {
  await table.insertRows(records);  // Try batch
} catch (error) {
  // Fallback: insert one by one
  for (const record of records) {
    try {
      await table.insertRow(record);
    } catch (e) {
      console.error(`Failed to store: ${record.name}`);
    }
  }
}
```

### Duplicate Detection
Check if entity already exists:

```typescript
const isDuplicate = await EntityStorage.checkDuplicates(
  'vehicle',  // person, vehicle, phone
  'KA03AB1234'  // identifier
);
```

---

## Data Cleanup

### Delete Entities for Reprocessing
```typescript
await EntityStorage.deleteEntitiesForFIR(firId);
// Removes all entities linked to this FIR
```

### Reprocess FIR
```bash
# 1. Delete old entities
DELETE /api/extract/entities?firId=FIR_TEST001

# 2. Re-extract and store
POST /api/extract
{
  "firId": "FIR_TEST001",
  "storeEntities": true
}
```

---

## Query Examples

### Get All Persons from a FIR
```sql
SELECT * FROM Persons WHERE fir_id = 'FIR_TEST001';
```

### Get All Accused Across Cases
```sql
SELECT * FROM Persons WHERE role = 'Accused' ORDER BY extraction_date DESC;
```

### Find Vehicles by Registration
```sql
SELECT * FROM Vehicles WHERE registration LIKE 'KA03%';
```

### Get Phone Records with Owner
```sql
SELECT * FROM PhoneRecords WHERE owner IS NOT NULL;
```

### Find Weapons Used in Crimes
```sql
SELECT w.*, f.crime_type_en, f.date 
FROM Weapons w 
JOIN FIRs f ON w.fir_id = f.fir_no 
WHERE w.type LIKE '%gun%';
```

### Cross-Reference: Person in Multiple FIRs
```sql
SELECT p.name, COUNT(DISTINCT p.fir_id) as fir_count
FROM Persons p
GROUP BY p.name
HAVING fir_count > 1
ORDER BY fir_count DESC;
```

---

## Integration with Existing Tables

### Linking to Seed Data
Extracted entities can be linked to existing seed data:

```typescript
// Match extracted person with existing person by name
const existingPerson = await zcql.executeZCQLQuery(
  `SELECT * FROM Persons WHERE name LIKE '%${extractedName}%'`
);

if (existingPerson.length > 0) {
  // Link instead of creating duplicate
  await linkEntities(extractedPerson, existingPerson[0]);
}
```

---

## Performance Considerations

### Batch Insert Limits
- Catalyst Data Store: 100 rows per batch (recommended)
- Large FIRs: Process in batches to avoid timeouts

### Indexing Recommendations
For optimal query performance, create indexes on:
- `fir_id` (all entity tables)
- `case_id` (all entity tables)
- `name` (Persons table)
- `registration` (Vehicles table)
- `number` (PhoneRecords table)

---

## Testing

### Test Entity Storage

```bash
# 1. Upload FIR
curl -X POST http://localhost:3000/api/upload \
  -F "file=@sample_fir.pdf" \
  -F "firNumber=TEST001"

# 2. Run OCR
curl -X POST http://localhost:3000/api/ocr \
  -H "Content-Type: application/json" \
  -d '{"firId": "TEST001"}'

# 3. Extract and Store Entities
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"firId": "TEST001", "storeEntities": true}'

# 4. Verify in Data Store
# Check Catalyst Console → Data Store → Persons/Vehicles/etc.
```

### Verification Checklist
```
□ Persons table has new records
□ Vehicles table has new records
□ PhoneRecords table has new records
□ fir_id correctly links to FIR
□ extracted_from_ocr = true
□ extraction_date is set
□ Can query entities by fir_id
□ No duplicate entries
```

---

## Troubleshooting

### Issue: "Table not found"
**Solution:**
- Verify tables exist in Catalyst Console
- Check table names: `Persons`, `Vehicles`, `PhoneRecords` (case-sensitive)
- Ensure tables have required columns

### Issue: "Column does not exist"
**Solution:**
- Add missing columns: `extracted_from_ocr`, `extraction_date`, `fir_id`
- Check column names match schema (case-sensitive)

### Issue: "Batch insert failed"
**Solution:**
- System automatically retries one-by-one
- Check logs for specific record errors
- Verify data types match schema

### Issue: "Duplicate entities"
**Solution:**
- Use `EntityStorage.checkDuplicates()` before insert
- Delete and reprocess: `EntityStorage.deleteEntitiesForFIR()`

---

## Next Steps

After entity storage:

1. **Step 7**: Build relationships between entities (EntityRelationships table)
2. **Step 8**: Create knowledge graph API
3. **Step 9**: Generate embeddings for semantic search
4. **Step 10**: Implement full-text search

---

## Complete Pipeline Example

```typescript
// Complete FIR processing pipeline
async function processFIR(pdfFile: File, firNumber: string) {
  // 1. Upload PDF
  const upload = await uploadAPI.post('/api/upload', {
    file: pdfFile,
    firNumber: firNumber
  });
  
  // 2. Run OCR
  const ocr = await uploadAPI.post('/api/ocr', {
    firId: firNumber,
    fileId: upload.data.fileId
  });
  
  // 3. Extract and Store Entities
  const extract = await uploadAPI.post('/api/extract', {
    firId: firNumber,
    storeEntities: true
  });
  
  console.log('✅ FIR processed successfully');
  console.log(`   - Persons: ${extract.data.storage.personsStored}`);
  console.log(`   - Vehicles: ${extract.data.storage.vehiclesStored}`);
  console.log(`   - Phones: ${extract.data.storage.phonesStored}`);
  
  return extract.data;
}
```

---

**Step 6 Complete! Entities are now stored in Data Store and ready for relationship building. ✅**
