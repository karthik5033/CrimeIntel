/**
 * Create DocumentMetadata Table in Catalyst Data Store
 * 
 * This table stores metadata about uploaded FIR PDFs:
 * - File location in Stratus
 * - OCR status and extracted text
 * - Extracted entities (persons, vehicles, etc.)
 * - Links to FIRs table
 * 
 * Run: node scripts/create-document-metadata-table.js
 */

const catalyst = require('zcatalyst-sdk-node');

async function createDocumentMetadataTable() {
  try {
    console.log('🔧 Initializing Catalyst SDK...');
    const app = catalyst.initialize();
    const datastore = app.datastore();

    console.log('📋 Creating DocumentMetadata table...');

    const tableConfig = {
      table_name: 'DocumentMetadata',
      columns: [
        {
          column_name: 'file_id',
          data_type: 'varchar',
          max_length: 255,
          is_mandatory: true
        },
        {
          column_name: 'file_name',
          data_type: 'varchar',
          max_length: 500,
          is_mandatory: true
        },
        {
          column_name: 'file_url',
          data_type: 'text',
          is_mandatory: true
        },
        {
          column_name: 'bucket_name',
          data_type: 'varchar',
          max_length: 100,
          is_mandatory: true
        },
        {
          column_name: 'fir_number',
          data_type: 'varchar',
          max_length: 100,
          is_mandatory: true
        },
        {
          column_name: 'upload_time',
          data_type: 'varchar',
          max_length: 50,
          is_mandatory: true
        },
        {
          column_name: 'file_size',
          data_type: 'bigint',
          is_mandatory: true
        },
        {
          column_name: 'ocr_status',
          data_type: 'varchar',
          max_length: 50,
          is_mandatory: true,
          default_value: 'pending'
        },
        {
          column_name: 'ocr_text',
          data_type: 'text',
          is_mandatory: false
        },
        {
          column_name: 'extracted_entities',
          data_type: 'text',
          is_mandatory: false
        },
        {
          column_name: 'crime_type',
          data_type: 'varchar',
          max_length: 100,
          is_mandatory: false
        },
        {
          column_name: 'police_station',
          data_type: 'varchar',
          max_length: 100,
          is_mandatory: false
        },
        {
          column_name: 'description',
          data_type: 'text',
          is_mandatory: false
        },
        {
          column_name: 'created_at',
          data_type: 'varchar',
          max_length: 50,
          is_mandatory: true
        },
        {
          column_name: 'updated_at',
          data_type: 'varchar',
          max_length: 50,
          is_mandatory: true
        }
      ]
    };

    const table = await datastore.createTable(tableConfig);
    
    console.log('✅ DocumentMetadata table created successfully!');
    console.log('Table ID:', table.table_id);
    console.log('Table Name:', table.table_name);
    
    console.log('\n📊 Table Structure:');
    console.log('  - file_id: Stratus file identifier');
    console.log('  - file_name: Original filename');
    console.log('  - file_url: Public access URL');
    console.log('  - bucket_name: Stratus bucket (firdocuments)');
    console.log('  - fir_number: Associated FIR number');
    console.log('  - upload_time: ISO timestamp');
    console.log('  - file_size: File size in bytes');
    console.log('  - ocr_status: pending/processing/completed/failed');
    console.log('  - ocr_text: Extracted text from PDF');
    console.log('  - extracted_entities: JSON of persons/vehicles/etc.');
    console.log('  - crime_type: Crime classification');
    console.log('  - police_station: Station ID');
    console.log('  - description: Brief description');
    console.log('  - created_at: Row creation timestamp');
    console.log('  - updated_at: Last update timestamp');
    
    console.log('\n✨ Upload pipeline now ready:');
    console.log('   1. Upload PDF → Stratus (firdocuments bucket)');
    console.log('   2. Save metadata → DocumentMetadata table');
    console.log('   3. Create FIR → FIRs table');
    console.log('   4. All three locations linked by file_id/fir_number');

  } catch (error) {
    console.error('❌ Failed to create table:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️ Table already exists. No action needed.');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Make sure you:');
      console.log('   1. Are logged into Catalyst CLI (catalyst login)');
      console.log('   2. Have selected the correct project');
      console.log('   3. Have Data Store permissions');
    }
    
    process.exit(1);
  }
}

// Run the script
createDocumentMetadataTable()
  .then(() => {
    console.log('\n🎉 Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
