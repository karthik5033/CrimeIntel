import { NextRequest, NextResponse } from "next/server";
import { getCatalystApp } from "@/lib/catalyst";
import { CatalystZiaOCR } from "@/lib/catalyst/zia-ocr";
import { CatalystStratus } from "@/lib/catalyst/stratus";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Phase 1 Step 3: OCR API Endpoint
 * 
 * POST /api/ocr
 * 
 * Triggers OCR processing for uploaded FIR PDFs
 * 
 * Flow:
 * 1. Upload completed → Call this API
 * 2. Download PDF from Stratus
 * 3. Extract text using Zia OCR
 * 4. Update FIR record with OCR text
 * 5. Set ocr_status = 'completed'
 */

export async function POST(req: NextRequest) {
  try {
    // Check if this is a direct file upload or a reference to existing FIR
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Direct file upload (for testing)
      return await handleDirectUpload(req);
    } else {
      // Process existing FIR from Data Store
      return await handleFIRProcessing(req);
    }

  } catch (error: any) {
    console.error("❌ OCR Error:", error);
    return NextResponse.json(
      { error: "Failed to process OCR request", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process existing FIR (main Phase 1 flow)
 */
async function handleFIRProcessing(req: NextRequest) {
  const body = await req.json();
  const { firId, fileId, fileUrl } = body;

  if (!firId) {
    return NextResponse.json(
      { error: 'FIR ID required' },
      { status: 400 }
    );
  }

  console.log('🔍 Starting OCR for FIR:', firId);

  try {
    // Get the FIR from Data Store
    const app = getCatalystApp(req);
    const zcql = app.zcql?.();
    
    let fir: any = null;
    let firRowId: string = 'MOCK_ROW';

    if (zcql) {
      // Real mode: Query database
      try {
        const firQuery = await zcql.executeZCQLQuery(
          `SELECT * FROM FIRs WHERE fir_no = '${firId}' LIMIT 1`
        );
        
        if (!firQuery || firQuery.length === 0) {
          console.warn('⚠️ FIR not found in database, using MOCK mode fallback');
          // Fallback to mock mode if FIR not found
          fir = {
            fir_no: firId,
            pdf_file_id: fileId || 'MOCK_FILE_' + Date.now(),
            ocr_status: 'processing'
          };
        } else {
          fir = firQuery[0].FIRs || firQuery[0];
          firRowId = fir.ROWID;

          // Update status to 'processing'
          await zcql.executeZCQLQuery(
            `UPDATE FIRs SET ocr_status = 'processing' WHERE ROWID = ${firRowId}`
          );
        }
      } catch (dbError) {
        console.warn('⚠️ Database query error, using MOCK mode:', dbError);
        // Fallback to mock mode on database errors
        fir = {
          fir_no: firId,
          pdf_file_id: fileId || 'MOCK_FILE_' + Date.now(),
          ocr_status: 'processing'
        };
      }
    } else {
      // Mock mode: Create mock FIR data
      console.log('⚠️ Using MOCK mode for FIR data');
      fir = {
        fir_no: firId,
        pdf_file_id: fileId || 'MOCK_FILE_' + Date.now(),
        ocr_status: 'processing'
      };
    }

    // Download PDF or use mock
    let pdfBuffer: Buffer | null = null;
    let fileName = 'document.pdf';
    
    try {
      if (fileUrl) {
        const response = await fetch(fileUrl);
        pdfBuffer = Buffer.from(await response.arrayBuffer());
      } else if (fileId || fir.pdf_file_id) {
        const targetFileId = fileId || fir.pdf_file_id;
        const fileData = await CatalystStratus.getFIR(targetFileId);
        const response = await fetch(fileData.url);
        pdfBuffer = Buffer.from(await response.arrayBuffer());
        fileName = fileData.fileName || fileName;
      }
    } catch (fetchError) {
      console.warn('⚠️ Could not fetch PDF, using mock extraction');
    }

    // Extract text using Zia OCR (or mock)
    const ocrResult = await CatalystZiaOCR.extractTextFromPDF(
      pdfBuffer || Buffer.from(''), 
      fileName
    );

    console.log(`✅ OCR completed: ${ocrResult.rawText.length} characters`);

    // Update FIR with OCR text (or create if doesn't exist)
    const firExists = firRowId !== 'MOCK_ROW' && zcql;
    
    if (firExists) {
      try {
        const escapedText = ocrResult.rawText.replace(/'/g, "''").substring(0, 5000); // Limit to 5000 chars for safety
        const updateQuery = `UPDATE FIRs SET ocr_text = '${escapedText}', ocr_status = 'completed', ocr_confidence = ${ocrResult.confidenceScore} WHERE ROWID = ${firRowId}`;
        
        console.log('📝 Updating existing FIR in database...');
        await zcql.executeZCQLQuery(updateQuery);
        console.log('✅ FIR updated in Data Store with OCR results');
      } catch (updateError) {
        console.error('❌ Failed to update FIR with OCR text:', updateError);
        console.warn('⚠️ OCR extraction succeeded but database update failed');
      }
    } else if (!firExists && fileId) {
      // FIR doesn't exist yet - create it with OCR text as description
      console.log('💾 Creating new FIR with OCR-extracted description...');
      
      const newFirRecord = {
        fir_no: firId,
        description: ocrResult.rawText.substring(0, 500) + '...', // Use first 500 chars as description
        pdf_url: fileUrl || 'mock-url',
        pdf_file_id: fileId,
        ocr_text: ocrResult.rawText.substring(0, 5000),
        ocr_status: 'completed',
        ocr_confidence: ocrResult.confidenceScore,
        upload_time: new Date().toISOString(),
        crime_type_en: 'Unknown',
        police_station_id: 'Unknown',
        status_en: 'Under Investigation',
        date: new Date().toISOString().split('T')[0],
        latitude: null,
        longitude: null
      };
      
      try {
        // Try to insert via Catalyst DataStore
        if (zcql) {
          // We can't use DataStore insert here easily, so skip real insert
          console.log('⏭️ Skipping real DataStore insert (would need DataStore client)');
        }
      } catch (insertError) {
        console.warn('⚠️ Could not insert FIR to DataStore:', insertError);
      }
      
      // Save to local seed file
      try {
        const fs = await import('fs');
        const path = await import('path');
        const seedDir = path.join(process.cwd(), 'data', 'seed');
        const firsSeedPath = path.join(seedDir, 'FIRs.json');
        
        let existingFIRs = [];
        if (fs.existsSync(firsSeedPath)) {
          const raw = fs.readFileSync(firsSeedPath, 'utf-8');
          existingFIRs = JSON.parse(raw);
        }
        
        // Check if FIR already exists
        const existingIndex = existingFIRs.findIndex((f: any) => f.fir_no === firId);
        if (existingIndex >= 0) {
          // Update existing
          existingFIRs[existingIndex] = {
            ...existingFIRs[existingIndex],
            ...newFirRecord,
            ROWID: existingFIRs[existingIndex].ROWID,
            id: firId
          };
          console.log('✅ Updated existing FIR in seed file');
        } else {
          // Add new
          const newFIR = {
            ...newFirRecord,
            ROWID: String(existingFIRs.length + 1),
            id: firId
          };
          existingFIRs.push(newFIR);
          console.log('✅ Added new FIR to seed file');
        }
        
        fs.writeFileSync(firsSeedPath, JSON.stringify(existingFIRs, null, 2));
      } catch (seedError) {
        console.error('❌ Failed to save FIR to seed file:', seedError);
      }
    } else {
      console.log('💾 MOCK: Would update FIR', firId, 'with OCR text');
    }

    // ALSO update the seed file (for development mode)
    try {
      const seedDir = path.join(process.cwd(), 'data', 'seed');
      const firsSeedPath = path.join(seedDir, 'FIRs.json');
      
      if (fs.existsSync(firsSeedPath)) {
        const raw = fs.readFileSync(firsSeedPath, 'utf-8');
        const existingFIRs = JSON.parse(raw);
        
        // Find and update the FIR by fir_no
        const firIndex = existingFIRs.findIndex((f: any) => f.fir_no === firId);
        if (firIndex >= 0) {
          existingFIRs[firIndex].ocr_text = ocrResult.rawText.substring(0, 5000);
          existingFIRs[firIndex].ocr_status = 'completed';
          existingFIRs[firIndex].ocr_confidence = ocrResult.confidenceScore;
          
          fs.writeFileSync(firsSeedPath, JSON.stringify(existingFIRs, null, 2));
          console.log('✅ FIR also updated in local seed file');
        } else {
          console.warn('⚠️ FIR not found in seed file:', firId);
        }
      }
    } catch (seedError) {
      console.error('❌ Failed to update seed file:', seedError);
      // Continue anyway - not critical
    }

    return NextResponse.json({
      success: true,
      message: 'OCR completed successfully',
      data: {
        firId: firId,
        textLength: ocrResult.rawText.length,
        confidence: ocrResult.confidenceScore,
        language: ocrResult.language,
        pageCount: ocrResult.pageCount,
        extractedText: ocrResult.rawText.substring(0, 500) + '...', // Preview
        mode: zcql && firRowId !== 'MOCK_ROW' ? 'real' : 'mock',
        databaseUpdated: zcql && firRowId !== 'MOCK_ROW'
      }
    });

  } catch (error) {
    console.error('❌ OCR processing error:', error);
    
    // Try to mark as failed (if using real database)
    try {
      const app = getCatalystApp(req);
      const zcql = app.zcql?.();
      if (zcql) {
        await zcql.executeZCQLQuery(
          `UPDATE FIRs SET ocr_status = 'failed' WHERE fir_no = '${firId}'`
        );
      }
    } catch (updateError) {
      console.warn('Could not update failure status');
    }
    
    throw error;
  }
}

/**
 * Direct file upload (for testing/legacy support)
 */
async function handleDirectUpload(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Convert file to a buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Save to temp file (Zia might need file path)
  const tempDir = os.tmpdir();
  const randomId = Math.random().toString(36).substring(2, 15);
  const tempFilePath = path.join(tempDir, `${randomId}-${file.name}`);
  fs.writeFileSync(tempFilePath, buffer);

  try {
    // Extract text using our enhanced OCR
    const ocrResult = await CatalystZiaOCR.extractTextFromPDF(buffer);

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    // Basic field extraction for response
    const lines = ocrResult.rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    
    const dataset: Record<string, string> = {
      docType: "Incident Report",
      date: new Date().toISOString().split('T')[0],
      location: "Unknown",
      suspect: "Unknown",
      description: "No description found",
    };

    for (const line of lines) {
      if (line.toLowerCase().includes("report")) dataset.docType = line;
      if (line.toLowerCase().startsWith("date:")) dataset.date = line.split(":")[1].trim();
      if (line.toLowerCase().startsWith("incident:")) dataset.location = line.split(":")[1].trim();
      if (line.toLowerCase().startsWith("suspect:")) dataset.suspect = line.split(":")[1].trim();
      if (line.toLowerCase().startsWith("details:")) dataset.description = line.split(":")[1].trim();
    }

    return NextResponse.json({ 
      success: true, 
      rawText: ocrResult.rawText,
      confidence: ocrResult.confidenceScore,
      language: ocrResult.language,
      pageCount: ocrResult.pageCount,
      dataset
    });
    
  } catch (apiError: any) {
    // Clean up on error
    if (fs.existsSync(tempFilePath)) {
       fs.unlinkSync(tempFilePath);
    }
    throw apiError;
  }
}

/**
 * GET /api/ocr?firId=...
 * Get OCR status for a FIR
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const firId = searchParams.get('firId');

    if (!firId) {
      return NextResponse.json(
        { error: 'FIR ID required' },
        { status: 400 }
      );
    }

    const app = getCatalystApp(req);
    const zcql = app.zcql();
    
    const result = await zcql.executeZCQLQuery(
      `SELECT fir_no, ocr_status, ocr_text 
       FROM FIRs WHERE fir_no = '${firId}' LIMIT 1`
    );

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'FIR not found' },
        { status: 404 }
      );
    }

    const data = result[0].FIRs || result[0];

    return NextResponse.json({
      success: true,
      data: {
        firId: data.fir_no,
        ocrStatus: data.ocr_status,
        textLength: data.ocr_text ? data.ocr_text.length : 0,
        textPreview: data.ocr_text ? data.ocr_text.substring(0, 200) + '...' : null
      }
    });

  } catch (error: any) {
    console.error('❌ Get OCR status error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get OCR status',
      details: error.message
    }, { status: 500 });
  }
}
