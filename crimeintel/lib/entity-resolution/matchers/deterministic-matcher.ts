/**
 * Deterministic Matcher - Layer 1
 * Phase 0.3
 * 
 * Exact matches on phone/vehicle/ID numbers
 */

import { PersonRecord, MatchCandidate } from '../types';

export class DeterministicMatcher {
  /**
   * Find exact matches on identifying numbers
   */
  findMatches(persons: PersonRecord[]): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    // Build index maps
    const phoneIndex = this.buildPhoneIndex(persons);
    const vehicleIndex = this.buildVehicleIndex(persons);
    const idNumberIndex = this.buildIdNumberIndex(persons);

    // Find exact phone matches
    for (const [phone, personIds] of phoneIndex.entries()) {
      if (personIds.length > 1) {
        // Multiple persons share this phone number
        candidates.push(...this.generateCandidatesFromSet(
          personIds,
          1.0,
          'exact_phone',
          [`Shared phone: ${phone}`],
          'auto_merge'
        ));
      }
    }

    // Find exact vehicle matches
    for (const [vehicle, personIds] of vehicleIndex.entries()) {
      if (personIds.length > 1) {
        candidates.push(...this.generateCandidatesFromSet(
          personIds,
          1.0,
          'exact_vehicle',
          [`Shared vehicle: ${vehicle}`],
          'auto_merge'
        ));
      }
    }

    // Find exact ID number matches (highest confidence)
    for (const [idNumber, personIds] of idNumberIndex.entries()) {
      if (personIds.length > 1) {
        candidates.push(...this.generateCandidatesFromSet(
          personIds,
          1.0,
          'exact_id',
          [`Shared ID number: ${idNumber}`],
          'auto_merge'
        ));
      }
    }

    console.log(`[Deterministic Matcher] Found ${candidates.length} exact match candidates`);
    return candidates;
  }

  private buildPhoneIndex(persons: PersonRecord[]): Map<string, string[]> {
    const index = new Map<string, string[]>();

    for (const person of persons) {
      if (person.phoneNumbers) {
        for (const phone of person.phoneNumbers) {
          const normalized = this.normalizePhone(phone);
          if (!index.has(normalized)) {
            index.set(normalized, []);
          }
          index.get(normalized)!.push(person.id);
        }
      }
    }

    return index;
  }

  private buildVehicleIndex(persons: PersonRecord[]): Map<string, string[]> {
    const index = new Map<string, string[]>();

    for (const person of persons) {
      if (person.vehicleNumbers) {
        for (const vehicle of person.vehicleNumbers) {
          const normalized = this.normalizeVehicle(vehicle);
          if (!index.has(normalized)) {
            index.set(normalized, []);
          }
          index.get(normalized)!.push(person.id);
        }
      }
    }

    return index;
  }

  private buildIdNumberIndex(persons: PersonRecord[]): Map<string, string[]> {
    const index = new Map<string, string[]>();

    for (const person of persons) {
      if (person.idNumbers) {
        for (const idNumber of person.idNumbers) {
          const normalized = this.normalizeIdNumber(idNumber);
          if (!index.has(normalized)) {
            index.set(normalized, []);
          }
          index.get(normalized)!.push(person.id);
        }
      }
    }

    return index;
  }

  private normalizePhone(phone: string): string {
    // Remove all non-digits
    return phone.replace(/\D/g, '');
  }

  private normalizeVehicle(vehicle: string): string {
    // Uppercase, remove spaces and special chars
    return vehicle.toUpperCase().replace(/[\s\-]/g, '');
  }

  private normalizeIdNumber(idNumber: string): string {
    // Uppercase, remove spaces
    return idNumber.toUpperCase().replace(/\s/g, '');
  }

  private generateCandidatesFromSet(
    personIds: string[],
    confidence: number,
    method: any,
    evidence: string[],
    action: any
  ): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    // Generate pairwise combinations
    for (let i = 0; i < personIds.length; i++) {
      for (let j = i + 1; j < personIds.length; j++) {
        candidates.push({
          person1Id: personIds[i],
          person2Id: personIds[j],
          confidence,
          method,
          evidence,
          suggestedAction: action,
        });
      }
    }

    return candidates;
  }
}
