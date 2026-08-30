import { ServerDataLoader } from '@/lib/api/serverDataLoader';

export const getCatalystApp = () => ({
  zcql: () => ({
    executeZCQLQuery: async (query: string) => {
      try {
        const q = query.toLowerCase();
        if (q.includes('from firs')) return await ServerDataLoader.getFIRs();
        if (q.includes('from persons')) return await ServerDataLoader.getPersons();
        if (q.includes('from vehicles')) return await ServerDataLoader.getVehicles();
        if (q.includes('from phonerecords')) return await ServerDataLoader.getPhoneRecords();
        if (q.includes('from bankaccounts')) return await ServerDataLoader.getBankAccounts();
        if (q.includes('from weapons')) return await ServerDataLoader.getWeapons();
      } catch (e) {
        console.error("Mock ZCQL Error:", e);
      }
      return [];
    }
  }),
  datastore: () => ({
    table: (tableName: string) => ({
      insertRow: async (row: any) => row,
      insertRows: async (rows: any[]) => rows,
      deleteRow: async (id: string) => ({ id }),
      updateRow: async (row: any) => row,
    })
  })
});

export const getCatalystAppAsync = async () => getCatalystApp();
