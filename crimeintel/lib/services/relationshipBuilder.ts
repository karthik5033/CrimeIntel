/**
 * Phase 1 Step 7: Relationship Builder Service
 * 
 * Builds knowledge graph edges between entities:
 * - Person → Vehicle (OWNS, USED, DROVE)
 * - Person → Person (KNOWS, RELATED_TO, ACCOMPLICE)
 * - Person → Phone (OWNS, CALLED)
 * - Person → FIR (COMPLAINANT_IN, VICTIM_IN, ACCUSED_IN, WITNESS_IN)
 * - Vehicle → FIR (INVOLVED_IN)
 * - Phone → Phone (CALLED, CONTACTED)
 * - Person → Location (LIVES_AT, SPOTTED_AT)
 * 
 * Stores relationships in EntityRelationships table for graph visualization
 */

import { getCatalystApp } from '@/lib/catalyst';
import type { ExtractionResult } from './entityExtractor';

export interface Relationship {
  source: string;
  sourceType: 'Person' | 'Vehicle' | 'Phone' | 'Weapon' | 'BankAccount' | 'FIR' | 'Location';
  target: string;
  targetType: 'Person' | 'Vehicle' | 'Phone' | 'Weapon' | 'BankAccount' | 'FIR' | 'Location';
  relationshipType: string;
  strength: number;
  context?: string;
  firId: string;
  caseId?: string;
}

export interface RelationshipBuildResult {
  relationshipsCreated: number;
  relationshipTypes: Record<string, number>;
  errors: string[];
  success: boolean;
}

export class RelationshipBuilder {
  /**
   * Build all relationships from extraction result
   */
  static async buildRelationships(
    extractionResult: ExtractionResult,
    firId: string,
    caseId?: string
  ): Promise<RelationshipBuildResult> {
    const result: RelationshipBuildResult = {
      relationshipsCreated: 0,
      relationshipTypes: {},
      errors: [],
      success: false,
    };

    console.log(`🕸️  Building relationships for FIR: ${firId}`);

    try {
      const relationships: Relationship[] = [];

      // 1. Person → FIR relationships (based on role)
      relationships.push(...this.buildPersonFIRRelationships(extractionResult, firId, caseId));

      // 2. Person → Vehicle relationships (ownership/usage)
      relationships.push(...this.buildPersonVehicleRelationships(extractionResult, firId, caseId));

      // 3. Person → Phone relationships
      relationships.push(...this.buildPersonPhoneRelationships(extractionResult, firId, caseId));

      // 4. Person → Person relationships (co-occurrence)
      relationships.push(...this.buildPersonPersonRelationships(extractionResult, firId, caseId));

      // 5. Vehicle → FIR relationships
      relationships.push(...this.buildVehicleFIRRelationships(extractionResult, firId, caseId));

      // 6. Phone → Phone relationships (call records)
      relationships.push(...this.buildPhonePhoneRelationships(extractionResult, firId, caseId));

      // Store relationships in Data Store
      const stored = await this.storeRelationships(relationships);
      result.relationshipsCreated = stored;

      // Count by type
      relationships.forEach(rel => {
        result.relationshipTypes[rel.relationshipType] = 
          (result.relationshipTypes[rel.relationshipType] || 0) + 1;
      });

      result.success = true;

      console.log('✅ Relationship building completed:');
      console.log(`   - Total relationships: ${result.relationshipsCreated}`);
      Object.entries(result.relationshipTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });

    } catch (error) {
      console.error('❌ Relationship building error:', error);
      result.errors.push((error as Error).message);
      result.success = false;
    }

    return result;
  }

  /**
   * Person → FIR relationships based on role
   */
  private static buildPersonFIRRelationships(
    extraction: ExtractionResult,
    firId: string,
    caseId?: string
  ): Relationship[] {
    const relationships: Relationship[] = [];

    extraction.persons.forEach(person => {
      let relType = 'INVOLVED_IN';

      // Map role to relationship type
      switch (person.role) {
        case 'Complainant':
          relType = 'COMPLAINANT_IN';
          break;
        case 'Victim':
          relType = 'VICTIM_IN';
          break;
        case 'Accused':
        case 'Suspect':
          relType = 'ACCUSED_IN';
          break;
        case 'Witness':
          relType = 'WITNESS_IN';
          break;
        case 'Officer':
          relType = 'INVESTIGATING';
          break;
      }

      relationships.push({
        source: person.id!,
        sourceType: 'Person',
        target: firId,
        targetType: 'FIR',
        relationshipType: relType,
        strength: 1.0,
        context: `${person.name} is ${person.role} in FIR`,
        firId: firId,
        caseId: caseId,
      });
    });

    return relationships;
  }

  /**
   * Person → Vehicle relationships
   */
  private static buildPersonVehicleRelationships(
    extraction: ExtractionResult,
    firId: string,
    caseId?: string
  ): Relationship[] {
    const relationships: Relationship[] = [];

    // Match person names with vehicle owners
    extraction.vehicles.forEach(vehicle => {
      if (vehicle.owner) {
        const matchingPerson = extraction.persons.find(
          p => p.name.toLowerCase() === vehicle.owner?.toLowerCase()
        );

        if (matchingPerson) {
          relationships.push({
            source: matchingPerson.id!,
            sourceType: 'Person',
            target: vehicle.id!,
            targetType: 'Vehicle',
            relationshipType: 'OWNS',
            strength: 0.9,
            context: `${matchingPerson.name} owns ${vehicle.registration}`,
            firId: firId,
            caseId: caseId,
          });
        }
      }

      // Accused/Suspect likely used vehicle in crime
      const accused = extraction.persons.filter(
        p => p.role === 'Accused' || p.role === 'Suspect'
      );

      accused.forEach(person => {
        relationships.push({
          source: person.id!,
          sourceType: 'Person',
          target: vehicle.id!,
          targetType: 'Vehicle',
          relationshipType: 'USED',
          strength: 0.7,
          context: `${person.name} (Accused) potentially used ${vehicle.registration}`,
          firId: firId,
          caseId: caseId,
        });
      });
    });

    return relationships;
  }

  /**
   * Person → Phone relationships
   */
  private static buildPersonPhoneRelationships(
    extraction: ExtractionResult,
    firId: string,
    caseId?: string
  ): Relationship[] {
    const relationships: Relationship[] = [];

    extraction.persons.forEach(person => {
      // Match person's phone with phone records
      if (person.phone) {
        const matchingPhone = extraction.phones.find(
          p => p.number === person.phone
        );

        if (matchingPhone) {
          relationships.push({
            source: person.id!,
            sourceType: 'Person',
            target: matchingPhone.id!,
            targetType: 'Phone',
            relationshipType: 'OWNS',
            strength: 1.0,
            context: `${person.name} owns phone ${person.phone}`,
            firId: firId,
            caseId: caseId,
          });
        }
      }

      // Match phone owners
      extraction.phones.forEach(phone => {
        if (phone.owner && phone.owner.toLowerCase() === person.name.toLowerCase()) {
          relationships.push({
            source: person.id!,
            sourceType: 'Person',
            target: phone.id!,
            targetType: 'Phone',
            relationshipType: 'OWNS',
            strength: 0.9,
            context: `${person.name} owns phone ${phone.number}`,
            firId: firId,
            caseId: caseId,
          });
        }
      });
    });

    return relationships;
  }

  /**
   * Person → Person relationships (co-occurrence suggests connection)
   */
  private static buildPersonPersonRelationships(
    extraction: ExtractionResult,
    firId: string,
    caseId?: string
  ): Relationship[] {
    const relationships: Relationship[] = [];

    // If multiple persons in same FIR, they likely know each other
    if (extraction.persons.length >= 2) {
      for (let i = 0; i < extraction.persons.length; i++) {
        for (let j = i + 1; j < extraction.persons.length; j++) {
          const person1 = extraction.persons[i];
          const person2 = extraction.persons[j];

          let relType = 'KNOWS';
          let strength = 0.5;

          // Stronger relationship if both are accused
          if (
            (person1.role === 'Accused' || person1.role === 'Suspect') &&
            (person2.role === 'Accused' || person2.role === 'Suspect')
          ) {
            relType = 'ACCOMPLICE';
            strength = 0.8;
          }

          // Victim-Accused relationship
          if (
            (person1.role === 'Victim' && (person2.role === 'Accused' || person2.role === 'Suspect')) ||
            (person2.role === 'Victim' && (person1.role === 'Accused' || person1.role === 'Suspect'))
          ) {
            relType = 'VICTIM_OF';
            strength = 1.0;
          }

          relationships.push({
            source: person1.id!,
            sourceType: 'Person',
            target: person2.id!,
            targetType: 'Person',
            relationshipType: relType,
            strength: strength,
            context: `${person1.name} (${person1.role}) and ${person2.name} (${person2.role}) in same FIR`,
            firId: firId,
            caseId: caseId,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Vehicle → FIR relationships
   */
  private static buildVehicleFIRRelationships(
    extraction: ExtractionResult,
    firId: string,
    caseId?: string
  ): Relationship[] {
    const relationships: Relationship[] = [];

    extraction.vehicles.forEach(vehicle => {
      relationships.push({
        source: vehicle.id!,
        sourceType: 'Vehicle',
        target: firId,
        targetType: 'FIR',
        relationshipType: 'INVOLVED_IN',
        strength: 1.0,
        context: `Vehicle ${vehicle.registration} involved in FIR`,
        firId: firId,
        caseId: caseId,
      });
    });

    return relationships;
  }

  /**
   * Phone → Phone relationships (call records)
   */
  private static buildPhonePhoneRelationships(
    extraction: ExtractionResult,
    firId: string,
    caseId?: string
  ): Relationship[] {
    const relationships: Relationship[] = [];

    // If multiple phones, assume potential communication
    if (extraction.phones.length >= 2) {
      for (let i = 0; i < extraction.phones.length; i++) {
        for (let j = i + 1; j < extraction.phones.length; j++) {
          const phone1 = extraction.phones[i];
          const phone2 = extraction.phones[j];

          relationships.push({
            source: phone1.id!,
            sourceType: 'Phone',
            target: phone2.id!,
            targetType: 'Phone',
            relationshipType: 'CONTACTED',
            strength: 0.6,
            context: `Potential contact between ${phone1.number} and ${phone2.number}`,
            firId: firId,
            caseId: caseId,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Store relationships in EntityRelationships table
   */
  private static async storeRelationships(relationships: Relationship[]): Promise<number> {
    if (relationships.length === 0) return 0;

    const app = getCatalystApp();
    const table = app.datastore().table('EntityRelationships');

    const records = relationships.map((rel, index) => ({
      id: `REL_${rel.firId}_${index + 1}`,
      source: rel.source,
      source_type: rel.sourceType,
      target: rel.target,
      target_type: rel.targetType,
      relationship_type: rel.relationshipType,
      strength: rel.strength,
      context: rel.context || '',
      fir_id: rel.firId,
      case_id: rel.caseId || null,
      created_date: new Date().toISOString(),
    }));

    try {
      // Batch insert (100 at a time)
      const batchSize = 100;
      let stored = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await table.insertRows(batch);
        stored += batch.length;
        console.log(`   Stored ${stored} / ${records.length} relationships`);
      }

      return stored;
    } catch (error) {
      console.error('Failed to store relationships in batch:', error);
      
      // Fallback: one by one
      let stored = 0;
      for (const record of records) {
        try {
          await table.insertRow(record);
          stored++;
        } catch (e) {
          console.error(`Failed to store relationship ${record.id}:`, e);
        }
      }
      return stored;
    }
  }

  /**
   * Get graph data for visualization
   */
  static async getGraphForFIR(firId: string): Promise<{
    nodes: Array<{ id: string; type: string; label: string }>;
    edges: Array<{ source: string; target: string; type: string; strength: number }>;
  }> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      const relationships = await zcql.executeZCQLQuery(
        `SELECT * FROM EntityRelationships WHERE fir_id = '${firId}'`
      );

      const nodes = new Map<string, { id: string; type: string; label: string }>();
      const edges: Array<{ source: string; target: string; type: string; strength: number }> = [];

      relationships.forEach((row: any) => {
        const rel = row.EntityRelationships || row;

        // Add source node
        if (!nodes.has(rel.source)) {
          nodes.set(rel.source, {
            id: rel.source,
            type: rel.source_type,
            label: rel.source.split('_').pop() || rel.source,
          });
        }

        // Add target node
        if (!nodes.has(rel.target)) {
          nodes.set(rel.target, {
            id: rel.target,
            type: rel.target_type,
            label: rel.target.split('_').pop() || rel.target,
          });
        }

        // Add edge
        edges.push({
          source: rel.source,
          target: rel.target,
          type: rel.relationship_type,
          strength: rel.strength,
        });
      });

      return {
        nodes: Array.from(nodes.values()),
        edges: edges,
      };
    } catch (error) {
      console.error('Failed to get graph for FIR:', error);
      throw error;
    }
  }

  /**
   * Delete relationships for a FIR (for reprocessing)
   */
  static async deleteRelationshipsForFIR(firId: string): Promise<void> {
    const app = getCatalystApp();
    const zcql = app.zcql();

    try {
      await zcql.executeZCQLQuery(
        `DELETE FROM EntityRelationships WHERE fir_id = '${firId}'`
      );
      console.log(`✅ Deleted all relationships for FIR: ${firId}`);
    } catch (error) {
      console.error('Failed to delete relationships:', error);
      throw error;
    }
  }
}
