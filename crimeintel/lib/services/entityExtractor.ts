/**
 * Phase 1 Step 5: Entity Extraction Service
 * 
 * Extracts structured entities from OCR text:
 * - People (names, roles, demographics)
 * - Vehicles (registration numbers, descriptions)
 * - Phone numbers (with IMEI if available)
 * - Locations (addresses, landmarks)
 * - Weapons (types, descriptions)
 * - Bank Accounts (account numbers, bank names)
 * - Dates and times
 * - Crime types and sections
 * 
 * Uses either:
 * 1. Catalyst Zia NLP (if available)
 * 2. GPT/Claude via API (fallback)
 * 3. Regex patterns (basic extraction)
 */

export interface ExtractedPerson {
  name: string;
  age?: number;
  gender?: string;
  role: 'Complainant' | 'Victim' | 'Witness' | 'Accused' | 'Suspect' | 'Officer' | 'Other';
  phone?: string;
  address?: string;
  aadhaar?: string;
}

export interface ExtractedVehicle {
  registration: string;
  type?: string;
  color?: string;
  make?: string;
  model?: string;
  owner?: string;
}

export interface ExtractedPhone {
  number: string;
  imei?: string;
  owner?: string;
  type?: 'Mobile' | 'Landline';
}

export interface ExtractedLocation {
  name: string;
  type: 'Crime Scene' | 'Residence' | 'Landmark' | 'Other';
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface ExtractedWeapon {
  type: string;
  description?: string;
  serialNumber?: string;
}

export interface ExtractedBankAccount {
  accountNumber: string;
  bankName?: string;
  ifsc?: string;
  holder?: string;
}

export interface ExtractedDate {
  date: string;
  context: string;
  type: 'Incident' | 'Report' | 'Other';
}

export interface ExtractionResult {
  persons: ExtractedPerson[];
  vehicles: ExtractedVehicle[];
  phones: ExtractedPhone[];
  locations: ExtractedLocation[];
  weapons: ExtractedWeapon[];
  bankAccounts: ExtractedBankAccount[];
  dates: ExtractedDate[];
  crimeType?: string;
  sections?: string[];
  confidence: number;
  method: 'zia' | 'gpt' | 'regex';
}

export class EntityExtractor {
  /**
   * Main extraction method - tries multiple strategies
   */
  static async extract(ocrText: string, firId?: string): Promise<ExtractionResult> {
    console.log(`🔍 Extracting entities from ${ocrText.length} characters...`);

    try {
      // Try Catalyst Zia first (if available)
      return await this.extractWithZia(ocrText, firId);
    } catch (ziaError) {
      console.warn('Zia extraction failed, trying GPT:', ziaError);
      
      try {
        // Fallback to GPT
        return await this.extractWithGPT(ocrText, firId);
      } catch (gptError) {
        console.warn('GPT extraction failed, using regex:', gptError);
        
        // Final fallback to regex patterns
        return this.extractWithRegex(ocrText);
      }
    }
  }

  /**
   * Method 1: Extract using Catalyst Zia NLP
   */
  private static async extractWithZia(ocrText: string, firId?: string): Promise<ExtractionResult> {
    const { getCatalystApp } = await import('@/lib/catalyst');
    const app = getCatalystApp();
    const zia = app.zia?.();

    if (!zia) {
      throw new Error('Zia not available');
    }

    // Call Zia NER (Named Entity Recognition)
    const nerResult = await zia.extractNamedEntities(ocrText);

    // Parse Zia result and map to our schema
    const persons: ExtractedPerson[] = [];
    const locations: ExtractedLocation[] = [];
    const dates: ExtractedDate[] = [];

    if (nerResult && nerResult.entities) {
      for (const entity of nerResult.entities) {
        if (entity.type === 'PERSON') {
          persons.push({
            name: entity.text,
            role: this.inferRole(entity.text, ocrText),
          });
        } else if (entity.type === 'LOCATION') {
          locations.push({
            name: entity.text,
            type: 'Other',
          });
        } else if (entity.type === 'DATE') {
          dates.push({
            date: entity.text,
            context: '',
            type: 'Other',
          });
        }
      }
    }

    // Supplement with regex for specific patterns
    const regexResult = this.extractWithRegex(ocrText);

    return {
      persons: [...persons, ...regexResult.persons],
      vehicles: regexResult.vehicles,
      phones: regexResult.phones,
      locations: [...locations, ...regexResult.locations],
      weapons: regexResult.weapons,
      bankAccounts: regexResult.bankAccounts,
      dates: [...dates, ...regexResult.dates],
      crimeType: regexResult.crimeType,
      sections: regexResult.sections,
      confidence: 0.85,
      method: 'zia',
    };
  }

  /**
   * Method 2: Extract using GPT/Claude API
   */
  private static async extractWithGPT(ocrText: string, firId?: string): Promise<ExtractionResult> {
    // Use OpenAI or Anthropic API to extract entities
    // This requires API keys to be configured

    const prompt = `
Extract structured information from this FIR (First Information Report):

Text:
${ocrText}

Extract and return JSON with:
{
  "persons": [{"name": "", "role": "Complainant|Victim|Accused|Witness", "age": null, "phone": ""}],
  "vehicles": [{"registration": "", "type": "", "color": ""}],
  "phones": [{"number": "", "owner": ""}],
  "locations": [{"name": "", "type": "Crime Scene|Residence"}],
  "weapons": [{"type": "", "description": ""}],
  "bankAccounts": [{"accountNumber": "", "bankName": ""}],
  "dates": [{"date": "", "type": "Incident|Report"}],
  "crimeType": "",
  "sections": []
}

Extract all entities mentioned. Return only valid JSON.`;

    try {
      // If OpenAI API key exists
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert at extracting structured data from police reports.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`GPT API failed: ${response.statusText}`);
      }

      const data = await response.json();
      const extracted = JSON.parse(data.choices[0].message.content);

      return {
        ...extracted,
        confidence: 0.90,
        method: 'gpt',
      };
    } catch (error) {
      console.error('GPT extraction error:', error);
      throw error;
    }
  }

  /**
   * Method 3: Extract using regex patterns (basic but reliable)
   */
  private static extractWithRegex(ocrText: string): ExtractionResult {
    const text = ocrText;

    return {
      persons: this.extractPersons(text),
      vehicles: this.extractVehicles(text),
      phones: this.extractPhones(text),
      locations: this.extractLocations(text),
      weapons: this.extractWeapons(text),
      bankAccounts: this.extractBankAccounts(text),
      dates: this.extractDates(text),
      crimeType: this.extractCrimeType(text),
      sections: this.extractSections(text),
      confidence: 0.70,
      method: 'regex',
    };
  }

  // Regex extraction helpers

  private static extractPersons(text: string): ExtractedPerson[] {
    const persons: ExtractedPerson[] = [];
    
    // Pattern: "Complainant: Name" or "Accused: Name"
    const patterns = [
      /(?:Complainant|Informant)[\s:]+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi,
      /(?:Victim)[\s:]+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi,
      /(?:Accused|Suspect|Offender)[\s:]+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi,
      /(?:Witness)[\s:]+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi,
    ];

    const roles: Array<ExtractedPerson['role']> = ['Complainant', 'Victim', 'Accused', 'Witness'];

    patterns.forEach((pattern, index) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1].trim();
        if (name && name.length > 2 && !persons.find(p => p.name === name)) {
          persons.push({
            name,
            role: roles[index],
          });
        }
      }
    });

    // Extract ages: "Name, Age 35" or "Name (35)"
    const agePattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*)[,\s]+(?:Age|aged?)[:\s]*(\d{1,3})/gi;
    const ageMatches = text.matchAll(agePattern);
    for (const match of ageMatches) {
      const name = match[1].trim();
      const age = parseInt(match[2]);
      const existing = persons.find(p => p.name === name);
      if (existing) {
        existing.age = age;
      }
    }

    return persons;
  }

  private static extractVehicles(text: string): ExtractedVehicle[] {
    const vehicles: ExtractedVehicle[] = [];
    
    // Indian vehicle registration patterns
    const patterns = [
      /\b([A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,2}[\s-]?\d{4})\b/g, // KA 03 AB 1234
      /\b([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})\b/g, // KA03AB1234
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const registration = match[1].replace(/\s/g, '').toUpperCase();
        if (!vehicles.find(v => v.registration === registration)) {
          vehicles.push({
            registration,
            type: this.inferVehicleType(text, registration),
          });
        }
      }
    });

    return vehicles;
  }

  private static extractPhones(text: string): ExtractedPhone[] {
    const phones: ExtractedPhone[] = [];
    
    // Indian phone patterns
    const patterns = [
      /\b([6-9]\d{9})\b/g, // 10-digit mobile
      /\b(\+91[\s-]?[6-9]\d{9})\b/g, // +91 prefix
      /\b(0\d{2,4}[\s-]?\d{6,8})\b/g, // Landline
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const number = match[1].replace(/\s|-/g, '');
        if (!phones.find(p => p.number === number)) {
          phones.push({
            number,
            type: number.length === 10 ? 'Mobile' : 'Landline',
          });
        }
      }
    });

    return phones;
  }

  private static extractLocations(text: string): ExtractedLocation[] {
    const locations: ExtractedLocation[] = [];
    
    // Pattern: "at Location" or "near Location"
    const patterns = [
      /(?:at|near|in)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*(?:,? [A-Z][a-z]+)*)/g,
      /(?:Crime Scene|Location)[\s:]+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1].trim();
        if (name.length > 3 && !locations.find(l => l.name === name)) {
          locations.push({
            name,
            type: 'Other',
          });
        }
      }
    });

    return locations;
  }

  private static extractWeapons(text: string): ExtractedWeapon[] {
    const weapons: ExtractedWeapon[] = [];
    
    const weaponKeywords = ['knife', 'gun', 'pistol', 'rifle', 'weapon', 'firearm', 'dagger', 'sword', 'stick', 'rod'];
    
    weaponKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword}[a-z]*)\\b`, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        const type = match[1];
        if (!weapons.find(w => w.type.toLowerCase() === type.toLowerCase())) {
          weapons.push({
            type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
          });
        }
      }
    });

    return weapons;
  }

  private static extractBankAccounts(text: string): ExtractedBankAccount[] {
    const accounts: ExtractedBankAccount[] = [];
    
    // Pattern: 10-16 digit account numbers
    const pattern = /\b(\d{10,16})\b/g;
    const matches = text.matchAll(pattern);
    
    for (const match of matches) {
      const accountNumber = match[1];
      // Check if it looks like a bank account (not phone, not date)
      if (accountNumber.length >= 11 && !accounts.find(a => a.accountNumber === accountNumber)) {
        accounts.push({
          accountNumber,
        });
      }
    }

    return accounts;
  }

  private static extractDates(text: string): ExtractedDate[] {
    const dates: ExtractedDate[] = [];
    
    // Various date patterns
    const patterns = [
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g, // DD/MM/YYYY or DD-MM-YYYY
      /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g, // YYYY-MM-DD
      /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/gi, // DD Month YYYY
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const date = match[1];
        if (!dates.find(d => d.date === date)) {
          dates.push({
            date,
            context: this.extractContext(text, match.index || 0, 50),
            type: 'Other',
          });
        }
      }
    });

    return dates;
  }

  private static extractCrimeType(text: string): string | undefined {
    const crimeKeywords = [
      'murder', 'homicide', 'robbery', 'theft', 'burglary', 'assault', 'rape',
      'kidnapping', 'extortion', 'fraud', 'cheating', 'forgery', 'arson',
    ];

    for (const keyword of crimeKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }

    return undefined;
  }

  private static extractSections(text: string): string[] {
    const sections: string[] = [];
    
    // Pattern: "Section 302" or "IPC 420" or "u/s 498A"
    const patterns = [
      /(?:Section|Sec\.?|u\/s)\s*(\d{2,4}[A-Z]?)/gi,
      /IPC\s*(\d{2,4}[A-Z]?)/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const section = match[1];
        if (!sections.includes(section)) {
          sections.push(section);
        }
      }
    });

    return sections;
  }

  // Helper methods

  private static inferRole(name: string, text: string): ExtractedPerson['role'] {
    const context = text.toLowerCase();
    const nameLower = name.toLowerCase();
    
    const index = context.indexOf(nameLower);
    if (index === -1) return 'Other';
    
    const surroundingText = context.substring(Math.max(0, index - 50), index + 50);
    
    if (surroundingText.includes('complainant') || surroundingText.includes('informant')) return 'Complainant';
    if (surroundingText.includes('victim')) return 'Victim';
    if (surroundingText.includes('accused') || surroundingText.includes('suspect')) return 'Accused';
    if (surroundingText.includes('witness')) return 'Witness';
    if (surroundingText.includes('officer') || surroundingText.includes('inspector')) return 'Officer';
    
    return 'Other';
  }

  private static inferVehicleType(text: string, registration: string): string {
    const context = text.toLowerCase();
    const regLower = registration.toLowerCase();
    
    const index = context.indexOf(regLower);
    if (index === -1) return 'Unknown';
    
    const surroundingText = context.substring(Math.max(0, index - 30), index + 30);
    
    if (surroundingText.includes('car')) return 'Car';
    if (surroundingText.includes('bike') || surroundingText.includes('motorcycle')) return 'Motorcycle';
    if (surroundingText.includes('truck')) return 'Truck';
    if (surroundingText.includes('auto')) return 'Auto Rickshaw';
    if (surroundingText.includes('bus')) return 'Bus';
    
    return 'Vehicle';
  }

  private static extractContext(text: string, index: number, radius: number): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);
    return '...' + text.substring(start, end).trim() + '...';
  }
}
