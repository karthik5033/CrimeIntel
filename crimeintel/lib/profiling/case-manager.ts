/**
 * Phase 8: Case Management System
 * 
 * Manages cases with auto-generated summaries, timelines,
 * and similar case retrieval using semantic embeddings.
 */

import { embedFIRNarrative } from '../intelligence/embedding-computer';
import type {
  Case,
  CaseSummary,
  CaseTimelineEvent,
  SimilarCase,
  FIRDetail,
  CaseQuery,
  CaseListItem,
  CaseSearchFilters,
  InvestigationLead,
} from './types';

/**
 * Case management engine
 */
export class CaseManager {
  /**
   * Get comprehensive case details
   */
  async getCase(query: CaseQuery): Promise<{
    case: Case;
    summary?: CaseSummary;
    timeline?: CaseTimelineEvent[];
    similarCases?: SimilarCase[];
    leads?: InvestigationLead[];
  }> {
    const { caseId } = query;

    // Fetch base case
    const caseData = await this.fetchCase(caseId);

    const result: any = { case: caseData };

    // Conditionally include requested data
    if (query.includeSummary) {
      result.summary = await this.generateCaseSummary(caseId);
    }

    if (query.includeTimeline) {
      result.timeline = await this.getCaseTimeline(caseId);
    }

    if (query.includeSimilarCases) {
      result.similarCases = await this.findSimilarCases(caseId);
    }

    if (query.includeLeads) {
      result.leads = await this.generateCaseLeads(caseId);
    }

    return result;
  }

  /**
   * Get FIR details
   */
  async getFIRDetail(firId: string): Promise<FIRDetail> {
    // Mock - in production, query from DataStore
    return {
      firId,
      firNumber: '2024/001/0015',
      date: new Date('2024-01-15'),
      station: 'Whitefield Police Station',
      district: 'Bengaluru Urban',
      investigatingOfficer: 'Inspector Ravi Kumar',
      crimeType: 'Chain Snatching',
      ipcSections: ['IPC 392', 'IPC 34'],
      description:
        'On 15th January 2024 at approximately 7:30 PM, complainant Mrs. Lakshmi Devi (age 68) was walking near the bus stop on Whitefield Main Road when two unidentified males on a Honda Activa motorcycle approached from behind. The pillion rider snatched her 22-karat gold chain (weight: 15 grams, value: ₹75,000) and the duo fled towards Hope Farm Junction. The complainant sustained minor injuries to her neck. CCTV footage from nearby shops has been collected. Investigation is ongoing.',
      location: {
        address: 'Whitefield Main Road, near Bus Stop, Bengaluru - 560066',
        latitude: 12.9698,
        longitude: 77.7500,
      },
      status: 'Under Investigation',
      statusHistory: [
        {
          status: 'FIR Registered',
          date: new Date('2024-01-15'),
          updatedBy: 'SI Prakash',
        },
        {
          status: 'Investigation Started',
          date: new Date('2024-01-16'),
          updatedBy: 'Inspector Ravi Kumar',
        },
        {
          status: 'Accused Identified',
          date: new Date('2024-01-20'),
          updatedBy: 'Inspector Ravi Kumar',
        },
      ],
      linkedPersons: {
        accused: [
          { id: 'PERSON-001', name: 'Rajesh Kumar', age: 32 },
          { id: 'PERSON-010', name: 'Suresh Rao', age: 29 },
        ],
        victims: [{ id: 'PERSON-100', name: 'Lakshmi Devi', age: 68 }],
        witnesses: [
          { id: 'PERSON-101', name: 'Ramesh (Shop owner)', age: 45 },
          { id: 'PERSON-102', name: 'Kavita (Passerby)', age: 32 },
        ],
      },
      linkedEntities: {
        vehicles: ['KA-01-AB-1234 (Honda Activa - Seized)'],
        weapons: ['None'],
        phoneRecords: ['+91-98765-43210 (Call records obtained)'],
      },
      evidenceFiles: [
        { filename: 'CCTV_Whitefield_20240115_1930.mp4', type: 'video', uploadedAt: new Date('2024-01-16') },
        { filename: 'Medical_Report_Victim.pdf', type: 'document', uploadedAt: new Date('2024-01-16') },
        { filename: 'Crime_Scene_Photos.zip', type: 'image', uploadedAt: new Date('2024-01-16') },
      ],
    };
  }

  /**
   * Search cases with filters
   */
  async searchCases(filters: CaseSearchFilters): Promise<CaseListItem[]> {
    // Mock data
    const mockCases: CaseListItem[] = [
      {
        caseId: 'CASE-001',
        caseNumber: 'CC/2024/001',
        linkedFIRCount: 3,
        status: 'Under Investigation',
        investigatingOfficer: 'Inspector Ravi Kumar',
        district: 'Bengaluru Urban',
        dateOpened: new Date('2024-01-15'),
      },
      {
        caseId: 'CASE-002',
        caseNumber: 'CC/2023/142',
        linkedFIRCount: 1,
        status: 'Chargesheeted',
        investigatingOfficer: 'Inspector Manjunath',
        district: 'Mysuru',
        dateOpened: new Date('2023-08-10'),
      },
      {
        caseId: 'CASE-003',
        caseNumber: 'CC/2023/089',
        linkedFIRCount: 2,
        status: 'Trial',
        investigatingOfficer: 'Inspector Suresh',
        district: 'Bengaluru Urban',
        dateOpened: new Date('2023-06-20'),
      },
    ];

    // Apply filters
    let filtered = mockCases;

    if (filters.status) {
      filtered = filtered.filter((c) => filters.status!.includes(c.status));
    }

    if (filters.districts) {
      filtered = filtered.filter((c) => filters.districts!.includes(c.district));
    }

    if (filters.investigatingOfficer) {
      filtered = filtered.filter((c) => c.investigatingOfficer === filters.investigatingOfficer);
    }

    return filtered.sort((a, b) => b.dateOpened.getTime() - a.dateOpened.getTime());
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Fetch case data
   */
  private async fetchCase(caseId: string): Promise<Case> {
    // Mock - in production, query from DataStore
    return {
      caseId,
      caseNumber: 'CC/2024/001',
      linkedFIRs: ['FIR-001', 'FIR-002', 'FIR-003'],
      status: 'Under Investigation',
      investigatingOfficer: 'Inspector Ravi Kumar',
      district: 'Bengaluru Urban',
      dateOpened: new Date('2024-01-15'),
      dateUpdated: new Date('2024-01-22'),
    };
  }

  /**
   * Generate case summary using LLM
   */
  private async generateCaseSummary(caseId: string): Promise<CaseSummary> {
    // In production, call LLM with linked FIR narratives
    // For now, return mock summary

    return {
      caseId,
      summary:
        'This case involves a series of chain snatching incidents in the Whitefield area of Bengaluru during January 2024. The accused, Rajesh Kumar (32) and Suresh Rao (29), operated as a duo using a Honda Activa motorcycle. They targeted elderly women in isolated areas during evening hours (6-9 PM). The modus operandi was consistent: approach from behind, snatch gold chain, and flee immediately. Three FIRs (2024/001/0015, 2024/001/0018, 2024/001/0023) have been linked to this case based on MO similarity and CCTV evidence. Both accused were arrested on January 20, 2024. The stolen jewelry worth ₹2.1 lakhs has been partially recovered. Investigation is ongoing to identify any additional accomplices.',
      keyFacts: {
        crimeType: 'Chain Snatching',
        location: 'Whitefield, Bengaluru',
        date: new Date('2024-01-15'),
        accusedNames: ['Rajesh Kumar', 'Suresh Rao'],
        victimNames: ['Lakshmi Devi', 'Kavita Sharma', 'Meena Rao'],
        evidenceCount: 12,
      },
      generatedAt: new Date(),
      regenerable: true,
    };
  }

  /**
   * Get case timeline
   */
  private async getCaseTimeline(caseId: string): Promise<CaseTimelineEvent[]> {
    // Mock - in production, aggregate from FIR status history
    return [
      {
        eventType: 'FIR Filed',
        date: new Date('2024-01-15'),
        description: 'First FIR (2024/001/0015) registered at Whitefield Police Station',
        actor: 'SI Prakash',
      },
      {
        eventType: 'Investigation Started',
        date: new Date('2024-01-16'),
        description: 'Case assigned to Inspector Ravi Kumar',
        actor: 'Inspector Ravi Kumar',
      },
      {
        eventType: 'Evidence Collected',
        date: new Date('2024-01-16'),
        description: 'CCTV footage from 3 locations, medical reports, witness statements collected',
        actor: 'Inspector Ravi Kumar',
      },
      {
        eventType: 'FIR Filed',
        date: new Date('2024-01-18'),
        description: 'Second FIR (2024/001/0018) linked to same MO',
        actor: 'SI Manjunath',
      },
      {
        eventType: 'Accused Identified',
        date: new Date('2024-01-20'),
        description: 'Accused identified as Rajesh Kumar and Suresh Rao through CCTV analysis',
        actor: 'Inspector Ravi Kumar',
      },
      {
        eventType: 'Accused Identified',
        date: new Date('2024-01-20'),
        description: 'Both accused arrested, vehicle seized',
        actor: 'Inspector Ravi Kumar',
        status: 'In Custody',
      },
      {
        eventType: 'FIR Filed',
        date: new Date('2024-01-21'),
        description: 'Third FIR (2024/001/0023) linked after confession',
        actor: 'Inspector Ravi Kumar',
      },
      {
        eventType: 'Evidence Collected',
        date: new Date('2024-01-22'),
        description: 'Partial recovery of stolen jewelry (₹1.2 lakhs)',
        actor: 'Inspector Ravi Kumar',
      },
    ];
  }

  /**
   * Find similar cases using semantic embeddings
   */
  private async findSimilarCases(caseId: string): Promise<SimilarCase[]> {
    // In production:
    // 1. Get current case summary/narrative
    // 2. Embed using Phase 0.1 embedding-computer
    // 3. Query similar embeddings from vector index
    // 4. Return top-K similar cases

    // Mock data
    return [
      {
        caseId: 'CASE-042',
        caseNumber: 'CC/2023/089',
        summary: 'Chain snatching case from August 2023, two-wheeler used, elderly targets',
        outcome: 'Convicted - 3 years imprisonment',
        similarityScore: 87,
        moComparison: 'Same MO: Two-wheeler approach, elderly targets, evening hours',
        crimesTypes: ['Chain Snatching', 'Robbery'],
        dateRange: {
          start: new Date('2023-08-10'),
          end: new Date('2023-11-15'),
        },
      },
      {
        caseId: 'CASE-038',
        caseNumber: 'CC/2023/067',
        summary: 'Serial chain snatchings in Koramangala area, similar pattern',
        outcome: 'Chargesheeted - Trial ongoing',
        similarityScore: 75,
        moComparison: 'Similar MO but different geographic area',
        crimesTypes: ['Chain Snatching'],
        dateRange: {
          start: new Date('2023-06-20'),
          end: new Date('2023-09-10'),
        },
      },
      {
        caseId: 'CASE-021',
        caseNumber: 'CC/2022/134',
        summary: 'Vehicle-borne snatching incidents, different target demographic',
        outcome: 'Acquitted - Insufficient evidence',
        similarityScore: 62,
        moComparison: 'Vehicle used but different MO and target selection',
        crimesTypes: ['Snatching', 'Theft'],
        dateRange: {
          start: new Date('2022-11-05'),
          end: new Date('2023-02-20'),
        },
      },
    ];
  }

  /**
   * Generate investigation leads for case
   */
  private async generateCaseLeads(caseId: string): Promise<InvestigationLead[]> {
    // Combine insights from graph, patterns, reasoning, and similar cases
    return [
      {
        id: 'LEAD-C001',
        description: 'Similar Case CC/2023/089 had a third accomplice who acted as lookout - investigate if pattern holds',
        priority: 'High',
        source: 'Similarity',
        confidence: 85,
        actionable: true,
        details: 'Review evidence for presence of third person in CCTV footage',
      },
      {
        id: 'LEAD-C002',
        description: 'Accused Rajesh Kumar\'s phone records show frequent contact with known fence "Tony" near Majestic',
        priority: 'High',
        source: 'Graph',
        confidence: 78,
        actionable: true,
        details: 'Investigate Tony for receiving stolen jewelry',
      },
      {
        id: 'LEAD-C003',
        description: 'Geographic pattern suggests 2 unsolved snatchings near Marathahalli may be related',
        priority: 'Medium',
        source: 'Pattern',
        confidence: 70,
        actionable: true,
        details: 'Compare MO with FIRs 2024/002/0034 and 2024/002/0041',
      },
      {
        id: 'LEAD-C004',
        description: 'Rational Choice analysis suggests escalation due to debt - check financial records',
        priority: 'Low',
        source: 'Theory',
        confidence: 55,
        actionable: false,
        details: 'Background information for prosecution',
      },
    ];
  }
}

/**
 * Singleton instance
 */
export const caseManager = new CaseManager();
