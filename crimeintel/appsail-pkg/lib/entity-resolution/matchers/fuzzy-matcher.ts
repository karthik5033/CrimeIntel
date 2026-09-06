/**
 * Fuzzy Name Matcher - Layer 2
 * Phase 0.3
 * 
 * Levenshtein distance + phonetic matching for Indian names
 */

import { PersonRecord, MatchCandidate } from '../types';

export class FuzzyMatcher {
  private fuzzyThreshold: number;
  private phoneticThreshold: number;

  constructor(fuzzyThreshold: number = 0.85, phoneticThreshold: number = 0.80) {
    this.fuzzyThreshold = fuzzyThreshold;
    this.phoneticThreshold = phoneticThreshold;
  }

  /**
   * Find fuzzy name matches using Levenshtein + phonetic algorithms
   */
  findMatches(persons: PersonRecord[]): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    console.log(`[Fuzzy Matcher] Comparing ${persons.length} persons (${persons.length * (persons.length - 1) / 2} pairs)...`);

    // Pairwise comparison (expensive - optimize with blocking in production)
    for (let i = 0; i < persons.length; i++) {
      for (let j = i + 1; j < persons.length; j++) {
        const person1 = persons[i];
        const person2 = persons[j];

        // Skip if already matched by deterministic methods
        if (this.hasExactMatch(person1, person2)) {
          continue;
        }

        // Fuzzy name comparison
        const fuzzyScore = this.fuzzyNameMatch(person1.name, person2.name);
        
        if (fuzzyScore >= this.fuzzyThreshold) {
          candidates.push({
            person1Id: person1.id,
            person2Id: person2.id,
            confidence: fuzzyScore,
            method: 'fuzzy_name',
            evidence: [
              `Names similar: "${person1.name}" ≈ "${person2.name}" (${(fuzzyScore * 100).toFixed(1)}%)`,
            ],
            suggestedAction: fuzzyScore > 0.95 ? 'auto_merge' : 'review_required',
          });
        }

        // Phonetic comparison (Soundex-like for Indian names)
        const phoneticScore = this.phoneticMatch(person1.name, person2.name);
        
        if (phoneticScore >= this.phoneticThreshold && fuzzyScore < this.fuzzyThreshold) {
          candidates.push({
            person1Id: person1.id,
            person2Id: person2.id,
            confidence: phoneticScore,
            method: 'phonetic_name',
            evidence: [
              `Names sound similar: "${person1.name}" ≈ "${person2.name}" (phonetic match)`,
            ],
            suggestedAction: 'review_required',
          });
        }
      }
    }

    console.log(`[Fuzzy Matcher] Found ${candidates.length} fuzzy match candidates`);
    return candidates;
  }

  /**
   * Normalized Levenshtein distance (0-1 similarity)
   */
  private fuzzyNameMatch(name1: string, name2: string): number {
    const normalized1 = this.normalizeName(name1);
    const normalized2 = this.normalizeName(name2);

    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLen = Math.max(normalized1.length, normalized2.length);
    
    if (maxLen === 0) return 1.0;
    
    return 1 - (distance / maxLen);
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Phonetic matching (simplified Soundex adapted for Indian names)
   */
  private phoneticMatch(name1: string, name2: string): number {
    const code1 = this.generatePhoneticCode(name1);
    const code2 = this.generatePhoneticCode(name2);

    if (code1 === code2) return 0.90; // High confidence for exact phonetic match
    
    // Check if codes are similar (first char + some digits match)
    if (code1[0] === code2[0] && code1.slice(1, 3) === code2.slice(1, 3)) {
      return 0.75;
    }

    return 0;
  }

  /**
   * Generate phonetic code (Soundex-like)
   */
  private generatePhoneticCode(name: string): string {
    const normalized = this.normalizeName(name);
    
    if (normalized.length === 0) return '0000';

    let code = normalized[0].toUpperCase();
    
    // Soundex mapping
    const soundexMap: Record<string, string> = {
      'b': '1', 'f': '1', 'p': '1', 'v': '1',
      'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2', 'z': '2',
      'd': '3', 't': '3',
      'l': '4',
      'm': '5', 'n': '5',
      'r': '6',
    };

    let lastCode = '';
    
    for (let i = 1; i < normalized.length && code.length < 4; i++) {
      const char = normalized[i].toLowerCase();
      const mappedCode = soundexMap[char] || '';
      
      if (mappedCode && mappedCode !== lastCode) {
        code += mappedCode;
        lastCode = mappedCode;
      }
    }

    // Pad with zeros
    return (code + '000').slice(0, 4);
  }

  /**
   * Normalize name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')     // Normalize spaces
      .trim();
  }

  /**
   * Check if persons already have exact match (to avoid duplicates)
   */
  private hasExactMatch(person1: PersonRecord, person2: PersonRecord): boolean {
    // Check phone overlap
    if (person1.phoneNumbers && person2.phoneNumbers) {
      const phones1 = new Set(person1.phoneNumbers.map(p => p.replace(/\D/g, '')));
      const phones2 = new Set(person2.phoneNumbers.map(p => p.replace(/\D/g, '')));
      
      for (const phone of phones1) {
        if (phones2.has(phone)) return true;
      }
    }

    // Check vehicle overlap
    if (person1.vehicleNumbers && person2.vehicleNumbers) {
      const vehicles1 = new Set(person1.vehicleNumbers.map(v => v.toUpperCase().replace(/[\s\-]/g, '')));
      const vehicles2 = new Set(person2.vehicleNumbers.map(v => v.toUpperCase().replace(/[\s\-]/g, '')));
      
      for (const vehicle of vehicles1) {
        if (vehicles2.has(vehicle)) return true;
      }
    }

    return false;
  }
}
