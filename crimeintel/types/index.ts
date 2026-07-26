// Core Data Models

export type Role = 'Constable' | 'Inspector' | 'ACP' | 'DCP' | 'Administrator';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  stationId?: string; // If applicable
  districtId?: string; // If applicable
}

export type CrimeType = 
  | 'Vehicle Theft' 
  | 'Burglary' 
  | 'Robbery' 
  | 'Cybercrime' 
  | 'Drug Offense' 
  | 'Assault' 
  | 'Murder' 
  | 'Financial Fraud' 
  | 'Kidnapping' 
  | 'Chain Snatching'
  | 'Other';

export type CaseStatus = 'Under Investigation' | 'Charge-sheeted' | 'Trial' | 'Convicted' | 'Acquitted' | 'Pending';
export type PersonRole = 'Accused' | 'Victim' | 'Witness';

export interface Person {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  occupation?: string;
  role: PersonRole;
  riskScore?: number; // 0-100
}

export interface FIR {
  id: string;
  firNumber: string;
  stationId: string;
  date: string; // ISO String
  crimeType: CrimeType;
  description: string;
  status: CaseStatus;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Case {
  id: string;
  caseNumber: string;
  firIds: string[];
  status: CaseStatus;
  investigatingOfficerId: string;
  summary: string;
}

export interface PoliceStation {
  id: string;
  name: string;
  district: string;
  jurisdictionGeo?: any; // Polygon coordinates
}

export interface Vehicle {
  id: string;
  regNo: string;
  ownerPersonId?: string;
}

export interface PhoneRecord {
  id: string;
  number: string;
  ownerPersonId?: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string; // Masked
  holderPersonId?: string;
  accountType?: 'savings' | 'current' | 'business';
  bank?: string;
  balance?: number;
  flagged?: boolean;
  flagReason?: string;
}

export interface UPIHandle {
  id: string;
  handle: string;
  holderPersonId?: string;
  linkedAccountId?: string;
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  timestamp: string;
  type: 'UPI' | 'NEFT' | 'RTGS' | 'CASH' | 'IMPS';
  description?: string;
  flagged: boolean;
  flagReason?: string;
  relatedCaseId?: string;
  relatedFIRId?: string;
}

export interface FinancialFlow {
  sourceAccount: BankAccount;
  destinationAccount: BankAccount;
  transactions: Transaction[];
  totalAmount: number;
  suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
  patterns: string[]; // ['structuring', 'circular', 'mule', 'velocity_spike']
}

export interface MoneyTrailNode {
  accountId: string;
  accountNumber: string;
  holderName: string;
  totalIn: number;
  totalOut: number;
  balance: number;
  transactionCount: number;
  flagged: boolean;
  isMule: boolean; // High throughput, low balance
}

export interface MoneyTrailEdge {
  from: string;
  to: string;
  transactions: Transaction[];
  totalAmount: number;
  avgAmount: number;
  flagged: boolean;
}

export interface Weapon {
  id: string;
  type: string;
  linkedCaseId?: string;
}

export type RelationshipType = 
  | 'called' 
  | 'visited' 
  | 'owns' 
  | 'uses' 
  | 'accused_in' 
  | 'victim_of' 
  | 'same_address' 
  | 'same_phone' 
  | 'same_vehicle';

export interface EntityRelationship {
  id: string;
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  weight: number;
  evidenceRef?: string; // e.g., FIR ID
  createdAt: string;
}

// Reasoning Engine Types
export type ConfidenceLevel = 'Low' | 'Moderate' | 'Moderate-High' | 'High';

export interface AlternativeHypothesis {
  hypothesis: string;
  status: 'Supported' | 'Partially Supported' | 'Rejected';
  evidence: string;
}

export interface ReasoningOutput {
  id: string;
  claim: string;
  mechanism: string; // e.g., "Routine Activity Theory"
  mechanismDetails: string[];
  evidenceRefs: string[]; // IDs of FIRs, Persons, etc.
  alternatives: AlternativeHypothesis[];
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-100
}
