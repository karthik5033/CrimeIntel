/**
 * Phase 0.11: Context Extractor
 * 
 * Extracts structured context (district, crime types, time, entities, focus) from queries
 */

import {
  ContextExtraction,
  ConversationFrame,
  EntityReference,
  InvestigationFocus,
  TimeWindow,
} from './types';

/**
 * Extracts context from natural language queries
 */
export class ContextExtractor {
  private readonly DISTRICTS = [
    'Bengaluru',
    'Mysuru',
    'Mangaluru',
    'Hubballi',
    'Belagavi',
    'Ballari',
    'Kalaburagi',
    'Davanagere',
    'Tumakuru',
    'Shivamogga',
  ];

  private readonly CRIME_TYPES = [
    'Vehicle Theft',
    'Burglary',
    'Robbery',
    'Murder',
    'Assault',
    'Fraud',
    'Cybercrime',
    'Drug Offenses',
    'Kidnapping',
    'Sexual Assault',
    'Domestic Violence',
    'Theft',
    'Forgery',
    'Money Laundering',
    'Extortion',
  ];

  private readonly FOCUS_KEYWORDS: Record<string, InvestigationFocus> = {
    'repeat offender': 'repeat_offenders',
    'serial': 'repeat_offenders',
    'habitual': 'repeat_offenders',
    'money': 'money_trail',
    'financial': 'money_trail',
    'bank': 'money_trail',
    'transaction': 'money_trail',
    'network': 'network_connections',
    'gang': 'network_connections',
    'associate': 'network_connections',
    'connection': 'network_connections',
    'pattern': 'crime_patterns',
    'modus operandi': 'crime_patterns',
    'MO': 'crime_patterns',
    'hotspot': 'hotspot_analysis',
    'area': 'hotspot_analysis',
    'zone': 'hotspot_analysis',
    'resolution': 'case_resolution',
    'closure': 'case_resolution',
    'solved': 'case_resolution',
    'evidence': 'evidence_gathering',
    'proof': 'evidence_gathering',
    'witness': 'evidence_gathering',
    'suspect': 'suspect_profiling',
    'accused': 'suspect_profiling',
    'profile': 'suspect_profiling',
    'trend': 'temporal_trends',
    'time': 'temporal_trends',
    'temporal': 'temporal_trends',
    'geographic': 'geographic_analysis',
    'spatial': 'geographic_analysis',
    'location': 'geographic_analysis',
  };

  /**
   * Extract context from a query
   */
  async extractContext(
    query: string,
    currentFrame: ConversationFrame
  ): Promise<ContextExtraction> {
    const queryLower = query.toLowerCase();
    const ambiguities: string[] = [];
    let confidence = 1.0;

    // Extract district
    const district = this.extractDistrict(queryLower, currentFrame);
    if (!district && !currentFrame.activeDistrict) {
      ambiguities.push('District not specified');
      confidence *= 0.9;
    }

    // Extract crime types
    const crimeTypes = this.extractCrimeTypes(queryLower, currentFrame);
    if (crimeTypes.length === 0 && currentFrame.activeCrimeTypes.length === 0) {
      ambiguities.push('Crime type not specified');
      confidence *= 0.9;
    }

    // Extract time window
    const timeWindow = this.extractTimeWindow(queryLower, currentFrame);
    if (!timeWindow && !currentFrame.activeTimeWindow) {
      ambiguities.push('Time period not specified');
      confidence *= 0.8;
    }

    // Extract entities
    const entities = this.extractEntities(query, currentFrame);

    // Extract focus
    const focus = this.extractFocus(queryLower, currentFrame);

    // Adjust confidence based on extraction quality
    if (district) confidence *= 1.1;
    if (crimeTypes.length > 0) confidence *= 1.1;
    if (timeWindow) confidence *= 1.1;
    if (entities.length > 0) confidence *= 1.05;
    if (focus) confidence *= 1.05;

    confidence = Math.min(1.0, confidence);

    return {
      district,
      crimeTypes,
      timeWindow,
      entities,
      focus,
      confidence,
      ambiguities,
    };
  }

  /**
   * Extract district from query
   */
  private extractDistrict(
    queryLower: string,
    currentFrame: ConversationFrame
  ): string | null {
    // Check for explicit district mention
    for (const district of this.DISTRICTS) {
      if (queryLower.includes(district.toLowerCase())) {
        return district;
      }
    }

    // Check for district code/abbreviation
    const districtAbbreviations: Record<string, string> = {
      'blr': 'Bengaluru',
      'mys': 'Mysuru',
      'mlr': 'Mangaluru',
      'hdl': 'Hubballi',
      'blgm': 'Belagavi',
    };

    for (const [abbr, district] of Object.entries(districtAbbreviations)) {
      if (queryLower.includes(abbr)) {
        return district;
      }
    }

    // Inherit from current frame if not explicitly changed
    return currentFrame.activeDistrict;
  }

  /**
   * Extract crime types from query
   */
  private extractCrimeTypes(
    queryLower: string,
    currentFrame: ConversationFrame
  ): string[] {
    const found: string[] = [];

    for (const crimeType of this.CRIME_TYPES) {
      if (queryLower.includes(crimeType.toLowerCase())) {
        found.push(crimeType);
      }
    }

    // Check for aliases
    const aliases: Record<string, string> = {
      'stolen vehicle': 'Vehicle Theft',
      'car theft': 'Vehicle Theft',
      'bike theft': 'Vehicle Theft',
      'house break': 'Burglary',
      'break-in': 'Burglary',
      'homicide': 'Murder',
      'scam': 'Fraud',
      'cyber': 'Cybercrime',
      'drugs': 'Drug Offenses',
      'narcotics': 'Drug Offenses',
      'abduction': 'Kidnapping',
      'rape': 'Sexual Assault',
    };

    for (const [alias, crimeType] of Object.entries(aliases)) {
      if (queryLower.includes(alias) && !found.includes(crimeType)) {
        found.push(crimeType);
      }
    }

    // If nothing found, inherit from frame
    if (found.length === 0) {
      return currentFrame.activeCrimeTypes;
    }

    return found;
  }

  /**
   * Extract time window from query
   */
  private extractTimeWindow(
    queryLower: string,
    currentFrame: ConversationFrame
  ): TimeWindow | null {
    const now = new Date();

    // Relative time patterns
    const relativePatterns: Array<{
      pattern: RegExp;
      label: string;
      days: number;
    }> = [
      { pattern: /last (\d+) days?/, label: 'last X days', days: 0 },
      { pattern: /last (\d+) weeks?/, label: 'last X weeks', days: 0 },
      { pattern: /last (\d+) months?/, label: 'last X months', days: 0 },
      { pattern: /last year/, label: 'last year', days: 365 },
      { pattern: /this year/, label: 'this year', days: -1 },
      { pattern: /this month/, label: 'this month', days: -1 },
      { pattern: /this week/, label: 'this week', days: -1 },
      { pattern: /past 3 months/, label: 'past 3 months', days: 90 },
      { pattern: /past 6 months/, label: 'past 6 months', days: 180 },
      { pattern: /past year/, label: 'past year', days: 365 },
    ];

    for (const { pattern, label, days } of relativePatterns) {
      const match = queryLower.match(pattern);
      if (match) {
        let startDate: Date;
        let endDate = now;

        if (days === -1) {
          // Special handling for "this year", "this month", etc.
          if (label === 'this year') {
            startDate = new Date(now.getFullYear(), 0, 1);
          } else if (label === 'this month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          } else if (label === 'this week') {
            const dayOfWeek = now.getDay();
            startDate = new Date(now);
            startDate.setDate(now.getDate() - dayOfWeek);
          } else {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
          }
        } else if (days === 0) {
          // Extract number from match
          const num = parseInt(match[1], 10);
          if (label.includes('days')) {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - num);
          } else if (label.includes('weeks')) {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - num * 7);
          } else if (label.includes('months')) {
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - num);
          } else {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
          }
        } else {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - days);
        }

        return {
          startDate,
          endDate,
          label: label.replace('X', match[1] || ''),
          isRelative: true,
        };
      }
    }

    // Absolute date patterns (YYYY-MM-DD, DD/MM/YYYY, etc.)
    const absolutePattern = /(\d{4})-(\d{2})-(\d{2})/;
    const absoluteMatch = queryLower.match(absolutePattern);
    if (absoluteMatch) {
      const [_, year, month, day] = absoluteMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return {
        startDate: date,
        endDate: date,
        label: `${year}-${month}-${day}`,
        isRelative: false,
      };
    }

    // Year patterns (2024, 2025, etc.)
    const yearPattern = /\b(20\d{2})\b/;
    const yearMatch = queryLower.match(yearPattern);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31),
        label: `${year}`,
        isRelative: false,
      };
    }

    // Inherit from frame
    return currentFrame.activeTimeWindow;
  }

  /**
   * Extract entity references from query
   */
  private extractEntities(
    query: string,
    currentFrame: ConversationFrame
  ): EntityReference[] {
    const entities: EntityReference[] = [];
    const now = new Date();

    // FIR pattern (FIR-XXX-YYYY or FIRXXXXXXYYYY)
    const firPattern = /FIR[- ]?(\d{3})[- ]?(\d{4})/gi;
    let firMatch;
    while ((firMatch = firPattern.exec(query)) !== null) {
      const firId = `FIR-${firMatch[1]}-${firMatch[2]}`;
      entities.push({
        type: 'fir',
        id: firId,
        name: firId,
        mentionedAt: now,
        relevance: 1.0,
      });
    }

    // Case pattern (CASE-XXX-YYYY or similar)
    const casePattern = /CASE[- ]?(\d{3})[- ]?(\d{4})/gi;
    let caseMatch;
    while ((caseMatch = casePattern.exec(query)) !== null) {
      const caseId = `CASE-${caseMatch[1]}-${caseMatch[2]}`;
      entities.push({
        type: 'case',
        id: caseId,
        name: caseId,
        mentionedAt: now,
        relevance: 1.0,
      });
    }

    // Person name pattern (very simplistic - in production, use NER)
    // Look for capitalized words that might be names
    const namePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    let nameMatch;
    while ((nameMatch = namePattern.exec(query)) !== null) {
      const name = nameMatch[1];
      // Skip common false positives
      if (!['Police Station', 'Crime Branch', 'High Court'].includes(name)) {
        entities.push({
          type: 'person',
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          mentionedAt: now,
          relevance: 0.8, // Lower confidence for name extraction
        });
      }
    }

    // Vehicle pattern (KA-XX-YYYY or similar)
    const vehiclePattern = /\b([A-Z]{2})[- ]?(\d{2})[- ]?([A-Z]{1,2})[- ]?(\d{4})\b/gi;
    let vehicleMatch;
    while ((vehicleMatch = vehiclePattern.exec(query)) !== null) {
      const vehicleId = `${vehicleMatch[1]}-${vehicleMatch[2]}-${vehicleMatch[3]}-${vehicleMatch[4]}`;
      entities.push({
        type: 'vehicle',
        id: vehicleId,
        name: vehicleId,
        mentionedAt: now,
        relevance: 1.0,
      });
    }

    // Station pattern (XXX Police Station)
    const stationPattern = /\b([A-Z][a-z]+) Police Station\b/gi;
    let stationMatch;
    while ((stationMatch = stationPattern.exec(query)) !== null) {
      const stationName = stationMatch[0];
      entities.push({
        type: 'station',
        id: stationName.toLowerCase().replace(/\s+/g, '-'),
        name: stationName,
        mentionedAt: now,
        relevance: 0.9,
      });
    }

    return entities;
  }

  /**
   * Extract investigation focus from query
   */
  private extractFocus(
    queryLower: string,
    currentFrame: ConversationFrame
  ): InvestigationFocus | null {
    // Check for focus keywords
    for (const [keyword, focus] of Object.entries(this.FOCUS_KEYWORDS)) {
      if (queryLower.includes(keyword.toLowerCase())) {
        return focus;
      }
    }

    // Inherit from frame
    return currentFrame.activeFocus;
  }
}
