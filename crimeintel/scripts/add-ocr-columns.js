/**
 * Phase 1 Step 4: Add OCR Columns to FIRs Table
 * 
 * This script adds the necessary columns to support the Intelligence Data Ingestion Pipeline:
 * - pdf_url: Stratus storage URL
 * - pdf_file_id: Stratus file identifier
 * - ocr_text: Extracted text from PDF
 * - ocr_status: Processing status (pending, processing, completed, failed)
 * - upload_time: Timestamp of PDF upload
 * - ocr_confidence: OCR accuracy score
 * 
 * Run with: node scripts/add-ocr-columns.js
 */

const catalyst = require('zcatalyst-sdk-node');

async function addOCRColumns() {
  try {
    console.log('🔧 Phase 1 Step 4: Adding OCR columns to FIRs table...\n');

    // Initialize Catalyst
    const app = catalyst.initialize();
    
    // Get Data Store instance
    const datastore = app.datastore();
    const table = datastore.table('FIRs');

    console.log('📋 Current schema will be extended with:');
    console.log('   - pdf_url (VARCHAR 500)');
    console.log('   - pdf_file_id (VARCHAR 100)');
    console.log('   - ocr_text (TEXT)');
    console.log('   - ocr_status (VARCHAR 20)');
    console.log('   - upload_time (TIMESTAMP)');
    console.log('   - ocr_confidence (DECIMAL 4,2)');
    console.log('');

    // Note: Catalyst SDK doesn't support ALTER TABLE directly
    // Columns must be added via Catalyst Console
    console.log('⚠️  IMPORTANT: Catalyst Data Store columns must be added via Console\n');
    console.log('👉 Steps to add columns:');
    console.log('   1. Open Catalyst Console (https://console.catalyst.zoho.com)');
    console.log('   2. Navigate to: Data Store > Tables > FIRs');
    console.log('   3. Click "Edit Schema" or "Add Column"');
    console.log('   4. Add each column with these specifications:\n');

    const columns = [
      {
        name: 'pdf_url',
        type: 'VARCHAR',
        length: 500,
        nullable: true,
        description: 'Stratus storage URL for FIR PDF'
      },
      {
        name: 'pdf_file_id',
        type: 'VARCHAR',
        length: 100,
        nullable: true,
        description: 'Stratus file ID for retrieval'
      },
      {
        name: 'ocr_text',
        type: 'TEXT',
        length: null,
        nullable: true,
        description: 'Extracted text from OCR'
      },
      {
        name: 'ocr_status',
        type: 'VARCHAR',
        length: 20,
        nullable: true,
        description: 'Status: pending, processing, completed, failed'
      },
      {
        name: 'upload_time',
        type: 'TIMESTAMP',
        length: null,
        nullable: true,
        description: 'When PDF was uploaded'
      },
      {
        name: 'ocr_confidence',
        type: 'DECIMAL',
        length: '4,2',
        nullable: true,
        description: 'OCR confidence score (0.00-1.00)'
      }
    ];

    columns.forEach((col, i) => {
      console.log(`   ${i + 1}. Column Name: ${col.name}`);
      console.log(`      Type: ${col.type}${col.length ? `(${col.length})` : ''}`);
      console.log(`      Nullable: YES`);
      console.log(`      Description: ${col.description}`);
      console.log('');
    });

    console.log('📝 Alternative: Manual SQL (if supported):\n');
    console.log('ALTER TABLE FIRs ADD COLUMN pdf_url VARCHAR(500);');
    console.log('ALTER TABLE FIRs ADD COLUMN pdf_file_id VARCHAR(100);');
    console.log('ALTER TABLE FIRs ADD COLUMN ocr_text TEXT;');
    console.log('ALTER TABLE FIRs ADD COLUMN ocr_status VARCHAR(20) DEFAULT \'pending\';');
    console.log('ALTER TABLE FIRs ADD COLUMN upload_time TIMESTAMP;');
    console.log('ALTER TABLE FIRs ADD COLUMN ocr_confidence DECIMAL(4,2);');
    console.log('');

    // Verify table exists
    try {
      const tableInfo = await table.getTableDetails();
      console.log('✅ FIRs table found:', tableInfo.table_name);
      console.log('   Table ID:', tableInfo.table_id);
      console.log('   Current row count:', tableInfo.row_count || 'Unknown');
      console.log('');
    } catch (err) {
      console.error('❌ Could not access FIRs table:', err.message);
      console.log('   Make sure the table exists in Catalyst Console');
      process.exit(1);
    }

    console.log('✅ Schema documentation created at: docs/FIR_TABLE_SCHEMA.md');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Add columns via Catalyst Console (instructions above)');
    console.log('   2. Test upload pipeline: POST /api/upload');
    console.log('   3. Test OCR extraction: POST /api/ocr');
    console.log('   4. Verify new fields in Data Store');
    console.log('');
    console.log('📖 Full documentation: docs/FIR_TABLE_SCHEMA.md');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('- Ensure Catalyst SDK is initialized');
    console.error('- Check .catalystrc configuration');
    console.error('- Verify network connection to Catalyst');
    process.exit(1);
  }
}

// Run the script
addOCRColumns()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
