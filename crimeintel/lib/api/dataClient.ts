import { CatalystDataStore } from '../catalyst/datastore';

/**
 * DataClient proxies requests directly to CatalystDataStore (Data Store & ZCQL)
 * All getters are now asynchronous.
 */
export const DataClient = CatalystDataStore;
