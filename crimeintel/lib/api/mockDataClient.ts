import personsData from '@/data/seed/Persons.json';
import policeStationsData from '@/data/seed/PoliceStations.json';
import firsData from '@/data/seed/FIRs.json';
import casesData from '@/data/seed/Cases.json';
import vehiclesData from '@/data/seed/Vehicles.json';
import phoneRecordsData from '@/data/seed/PhoneRecords.json';
import bankAccountsData from '@/data/seed/BankAccounts.json';
import weaponsData from '@/data/seed/Weapons.json';
import entityRelationshipsData from '@/data/seed/EntityRelationships.json';
import socioEconomicData from '@/data/seed/SocioEconomicData.json';
import transactionsData from '@/data/seed/Transactions.json';

export const MockDataClient = {
  getPersons: () => personsData,
  getPersonById: (id: string) => {
    return personsData.find((p: any) => p.id === id);
  },
  getPoliceStations: () => policeStationsData,
  getFIRs: () => firsData,
  getFIRById: (id: string) => {
    return firsData.find((f: any) => f.id === id);
  },
  getCases: () => casesData,
  getVehicles: () => vehiclesData,
  getPhoneRecords: () => phoneRecordsData,
  getBankAccounts: () => bankAccountsData,
  getWeapons: () => weaponsData,
  getEntityRelationships: () => entityRelationshipsData,
  getSocioEconomicData: () => socioEconomicData,
  
  // Helper for graph data
  getGraphForEntity: (entityId: string) => {
    return entityRelationshipsData.filter((edge: any) => edge.source === entityId || edge.target === entityId);
  },
  getTransactions: () => transactionsData
};
