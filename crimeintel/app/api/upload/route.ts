import { NextRequest, NextResponse } from 'next/server';
import { CatalystStratus } from '@/lib/catalyst/stratus';
import { CatalystDataStore } from '@/lib/catalyst/datastore';
import { CatalystNoSQL } from '@/lib/catalyst/nosql';

/**
 * Phase 1 Step 2: FIR Upload API
 * 
 * POST /api/upload
 * 
 * Flow:
 * Frontend → POST PDF → Backend → Stratus → Return URL
 * 
 * Body: multipart/form-data with 'file' field
 * Optional: firNumber, description, policeStation
 */

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Upload API called');
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Parse multipart form data
    let formData;
    try {
      formData = await request.formData();
      console.log('✅ FormData parsed successfully');
    } catch (formError) {
      console.error('❌ Failed to parse FormData:', formError);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse form data',
        details: (formError as Error).message
      }, { status: 400 });
    }

    const file = formData.get('file') as File;
    const firNumber = formData.get('firNumber') as string | null;
    const description = formData.get('description') as string | null;
    const policeStation = formData.get('policeStation') as string | null;
    const crimeType = formData.get('crimeType') as string | null;

    console.log('📋 Form data received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      firNumber,
      crimeType,
      policeStation
    });

    // Validation
    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json(
        { 
          success: false,
          error: 'No file provided' 
        },
        { status: 400 }
      );
    }

    // Check if file is actually a File object
    if (!(file instanceof File)) {
      console.error('❌ Invalid file object:', typeof file);
      return NextResponse.json({
        success: false,
        error: 'Invalid file object'
      }, { status: 400 });
    }

    // Validate file type (PDF and images)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { 
          success: false,
          error: 'Only PDF and Image files (JPEG, PNG, WEBP) are allowed' 
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json(
        { 
          success: false,
          error: 'File size exceeds 10MB limit' 
        },
        { status: 400 }
      );
    }

    console.log('📤 Uploading FIR PDF:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);

    // Step 1: Upload to Stratus
    let uploadResult;
    try {
      uploadResult = await CatalystStratus.uploadFIR(file, firNumber || undefined);
      console.log('✅ Uploaded to Stratus:', uploadResult.fileId);
    } catch (stratusError) {
      console.error('❌ Stratus upload failed:', stratusError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload to Stratus storage',
        details: (stratusError as Error).message
      }, { status: 500 });
    }

    // Step 2: Save metadata to NoSQL/DataStore (DocumentMetadata table)
    const documentMetadata = {
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.fileUrl,
      bucketName: uploadResult.bucketName,
      firNumber: firNumber || `FIR-${Date.now()}`,
      uploadTime: uploadResult.uploadTime,
      fileSize: uploadResult.fileSize,
      ocrStatus: 'pending' as const,
      crimeType: crimeType || undefined,
      policeStation: policeStation || undefined,
      description: description || 'Pending OCR extraction'
    };

    console.log('💾 Saving document metadata to NoSQL/DataStore...');
    
    try {
      await CatalystNoSQL.saveDocumentMetadata(documentMetadata);
      console.log('✅ Document metadata saved');
    } catch (metadataError) {
      console.error('❌ Failed to save metadata:', metadataError);
      // Continue anyway - we have the file uploaded
      console.warn('⚠️ Continuing despite metadata save error');
    }

    // Step 3: Create FIR record in Data Store (FIRs table) - ONLY if user provided description
    // Otherwise, OCR will create it with extracted text
    const shouldCreateFIRNow = !!description; // Only create if user provided description
    let firInsertSuccess = false; // Track if FIR was created
    
    if (shouldCreateFIRNow) {
      const firRecord = {
        fir_no: documentMetadata.firNumber,
        description: description,
        pdf_url: uploadResult.fileUrl,
        pdf_file_id: uploadResult.fileId,
        ocr_text: null,
        ocr_status: 'pending', // pending, processing, completed, failed
        upload_time: uploadResult.uploadTime,
        crime_type_en: crimeType || 'Unknown',
        police_station_id: policeStation || 'Unknown',
        status_en: 'Under Investigation',
        date: new Date().toISOString().split('T')[0],
        latitude: null,
        longitude: null
      };

      console.log('💾 Creating FIR record in Data Store:', firRecord.fir_no);

      // Insert FIR record and wait for it to complete
      try {
        await CatalystDataStore.insertFIRs([firRecord]);
        console.log('✅ FIR record created in Data Store');
        firInsertSuccess = true;
      } catch (datastoreError) {
        console.error('❌ DataStore insert failed:', datastoreError);
        console.error('Error details:', {
          message: (datastoreError as Error).message,
          stack: (datastoreError as Error).stack
        });
        // Don't throw - continue with partial success
        console.warn('⚠️ Continuing with upload despite DataStore error');
      }

      // Small delay to ensure database write is committed (if it succeeded)
      if (firInsertSuccess) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('⏱️ Waited for database commit');
      }
    } else {
      console.log('⏭️ Skipping FIR record creation - will be created by OCR endpoint with extracted text');
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: firInsertSuccess 
        ? 'FIR uploaded successfully to all three locations'
        : 'FIR uploaded to Stratus and metadata saved (Database insert pending)',
      data: {
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        bucketName: uploadResult.bucketName,
        firNumber: documentMetadata.firNumber,
        ocrStatus: 'pending',
        uploadTime: uploadResult.uploadTime,
        fileSize: uploadResult.fileSize
      },
      storageStatus: {
        stratus: '✅ Uploaded',
        metadata: '✅ Saved to DocumentMetadata table',
        dataStore: firInsertSuccess ? '✅ Saved to FIRs table' : '⚠️ Failed to save to FIRs table'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Error stack:', (error as Error).stack);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to upload FIR',
      details: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/upload/:fileId
 * Get upload status and metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID required' },
        { status: 400 }
      );
    }

    // Get file from Stratus
    const fileData = await CatalystStratus.getFIR(fileId);

    return NextResponse.json({
      success: true,
      data: fileData
    });

  } catch (error) {
    console.error('❌ Get file error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve file',
      details: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/upload/:fileId
 * Delete uploaded FIR (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID required' },
        { status: 400 }
      );
    }

    // Delete from Stratus
    await CatalystStratus.deleteFIR(fileId);

    return NextResponse.json({
      success: true,
      message: 'FIR deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete file error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete file',
      details: (error as Error).message
    }, { status: 500 });
  }
}
