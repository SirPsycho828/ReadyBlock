import Dexie from 'dexie';

export const localDb = new Dexie('ReadyBlockLocal');

localDb.version(2).stores({
  // Households — indexed by id and neighborhood for scoped queries
  households: 'id, neighborhoodId, status, assignmentStatus',

  // Household sensitive data — encrypted before storage
  householdSensitive: 'id, householdId',

  // Household contacts
  householdContacts: 'id, householdId',

  // Household members
  householdMembers: 'id, householdId, uid',

  // Resources — indexed for neighborhood + type filtering
  resources: 'id, householdId, neighborhoodId, type',

  // Skills — indexed for neighborhood + category filtering
  skills: 'id, householdId, neighborhoodId, uid, category',

  // Neighborhoods
  neighborhoods: 'id, cityId',

  // Neighborhood members
  neighborhoodMembers: 'id, neighborhoodId, uid',

  // Alerts
  alerts: 'id, neighborhoodId, type, createdAt',

  // Drills
  drills: 'id, neighborhoodId',

  // Drill statuses — isolated from real data
  drillStatuses: 'id, drillId, householdId',

  // Action plans / protocols
  protocols: 'id, neighborhoodId, scenarioType',

  // Coordinator notes
  coordinatorNotes: 'id, neighborhoodId, householdRef',

  // Offline write queue — persists pending writes
  offlineQueue: '++id, collection, operation, status, createdAt, expiresAt',

  // Sync metadata — tracks last sync per collection
  syncMeta: 'collection, lastSynced',

  // User profile (single doc cached locally)
  userProfile: 'uid',
});

export default localDb;
