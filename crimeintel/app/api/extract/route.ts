import { NextRequest, NextResponse } from 'next/server';
import { getCatalystApp } from '@/lib/catalyst';
import { EntityExtractor } from '@/lib/services/entityExtractor';
import { EntityStorage } from '@/lib/services/entityStorage';

/**
 * Phase 1 Step 5 & 6: Entity Extraction & Storage API
 * 
 * POST /api/extract
 * 
 * Extracts structured entities from OCR text:
 * - Persons (Complainant, Victim, Accused, Witness)
 * - Vehicles (registration numbers, descriptions)
 * - Phone numbers
 * - Locations
 * - Weapons
 * - Bank accounts
 * - Dates
 * 
 * Flow:
 * 1. Get FIR with OCR text
 * 2. Run entity extraction (Zia NLP / GPT / Regex)
 * 3. Store entities in respective Data Store tables
 * 4. Return extraction and storage results
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firId, ocrText, storeEntities = true } = body;

    if (!firId && !ocrText) {
      return NextResponse.json(
        { error: 'Either firId or ocrText required' },
        { status: 400 }
      );
    }

    console.log('🔍 Starting entity extraction for FIR:', firId || 'direct text');

    let textToExtract = ocrText;

    // If firId provided, fetch OCR text from Data Store
    if (firId && !ocrText) {
      const app = getCatalystApp();
      const zcql = app.zcql();
      
      const result = await zcql.executeZCQLQuery(
        `SELECT ocr_text, ocr_status FROM FIRs WHERE fir_no = '${firId}' LIMIT 1`
      );

      if (!result || result.length === 0) {
        return NextResponse.json(
          { error: 'FIR not found' },
          { status: 404 }
        );
      }

      const fir = result[0].FIRs || result[0];

      if (!fir.ocr_text) {
        return NextResponse.json(
          { error: 'FIR has no OCR text. Run OCR first.' },
          { status: 400 }
        );
      }

      if (fir.ocr_status !== 'completed') {
        return NextResponse.json(
          { error: `OCR status is '${fir.ocr_status}'. Wait for OCR to complete.` },
          { status: 400 }
        );
      }

      textToExtract = fir.ocr_text;
    }

    // Extract entities
    const extractionResult = await EntityExtractor.extract(textToExtract, firId);

    console.log('✅ Entity extraction completed:');
    console.log(`   - ${extractionResult.persons.length} persons`);
    console.log(`   - ${extractionResult.vehicles.length} vehicles`);
    console.log(`   - ${extractionResult.phones.length} phone numbers`);
    console.log(`   - ${extractionResult.locations.length} locations`);
    console.log(`   - ${extractionResult.weapons.length} weapons`);
    console.log(`   - Method: ${extractionResult.method}`);
    console.log(`   - Confidence: ${extractionResult.confidence}`);

    // Step 6: Store entities (if requested)
    let storageResult = null;
    if (storeEntities && firId) {
      console.log('💾 Storing extracted entities...');
      storageResult = await EntityStorage.storeEntities(
        extractionResult,
        firId
      );

      // Update FIR with extraction summary
      await EntityStorage.updateFIRExtractionStatus(firId, storageResult);
    }

    return NextResponse.json({
      success: true,
      message: storeEntities 
        ? 'Entity extraction and storage completed'
        : 'Entity extraction completed (not stored)',
      data: extractionResult,
      storage: storageResult,
      stats: {
        extraction: {
          personsCount: extractionResult.persons.length,
          vehiclesCount: extractionResult.vehicles.length,
          phonesCount: extractionResult.phones.length,
          locationsCount: extractionResult.locations.length,
          weaponsCount: extractionResult.weapons.length,
          bankAccountsCount: extractionResult.bankAccounts.length,
          datesCount: extractionResult.dates.length,
          sectionsCount: extractionResult.sections?.length || 0,
          method: extractionResult.method,
          confidence: extractionResult.confidence,
        },
        storage: storageResult ? {
          personsStored: storageResult.personsStored,
          vehiclesStored: storageResult.vehiclesStored,
          phonesStored: storageResult.phonesStored,
          weaponsStored: storageResult.weaponsStored,
          bankAccountsStored: storageResult.bankAccountsStored,
          success: storageResult.success,
          errors: storageResult.errors,
        } : null,
      }
    });

  } catch (error) {
    console.error('❌ Entity extraction error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Entity extraction failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * GET /api/extract?firId=...
 * Get cached extraction results (if stored)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firId = searchParams.get('firId');

    if (!firId) {
      return NextResponse.json(
        { error: 'FIR ID required' },
        { status: 400 }
      );
    }

    // In future, this could return cached extraction results
    // For now, return instruction to use POST

    return NextResponse.json({
      success: true,
      message: 'Use POST /api/extract with firId to extract entities',
      firId: firId
    });

  } catch (error) {
    console.error('❌ Get extraction error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get extraction results',
      details: (error as Error).message
    }, { status: 500 });
  }
}
