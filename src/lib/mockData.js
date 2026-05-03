/**
 * Mock data for ReadyBlock pitch demo.
 * All demo components import from here when real Firestore data isn't available.
 */

// ── Demo neighborhood boundary ──
export const DEMO_NEIGHBORHOOD_BOUNDARY = [
  { lat: 35.578392, lng: -82.594307 },
  { lat: 35.577618, lng: -82.592768 },
  { lat: 35.576481, lng: -82.593424 },
  { lat: 35.572345, lng: -82.593537 },
  { lat: 35.572554, lng: -82.595894 },
  { lat: 35.572522, lng: -82.596348 },
  { lat: 35.572276, lng: -82.597112 },
  { lat: 35.572178, lng: -82.597905 },
  { lat: 35.572224, lng: -82.598226 },
  { lat: 35.572209, lng: -82.59875 },
  { lat: 35.572273, lng: -82.599095 },
  { lat: 35.572392, lng: -82.599464 },
  { lat: 35.572843, lng: -82.599963 },
  { lat: 35.572947, lng: -82.600218 },
  { lat: 35.573228, lng: -82.601416 },
  { lat: 35.574647, lng: -82.60002 },
  { lat: 35.576517, lng: -82.599124 },
  { lat: 35.577352, lng: -82.597337 },
  { lat: 35.577904, lng: -82.596952 },
  { lat: 35.578319, lng: -82.59615 },
  { lat: 35.578392, lng: -82.594307 },
];

// ── Neighborhoods for city map ──
export const MOCK_NEIGHBORHOODS = [
  {
    id: 'west-asheville-estates',
    name: 'West Asheville Estates',
    centroidLat: 35.574553,
    centroidLng: -82.597253,
    preparednessScore: 72,
    householdCount: 186,
    registeredCount: 42,
    emergencyMode: false,
    captains: [{ uid: 'cap-1', displayName: 'Alex Rivera', email: 'alex@readyblock.app' }],
    resourceCount: 38,
    skillCount: 24,
  },
  {
    id: 'lucerne-park',
    name: 'Lucerne Park',
    centroidLat: 35.582247,
    centroidLng: -82.608794,
    preparednessScore: 45,
    householdCount: 124,
    registeredCount: 18,
    emergencyMode: false,
    captains: [{ uid: 'cap-2', displayName: 'Maria Santos', email: 'maria.s@email.com' }],
    resourceCount: 12,
    skillCount: 8,
  },
  {
    id: 'kenilworth-forest',
    name: 'Kenilworth Forest',
    centroidLat: 35.581508,
    centroidLng: -82.529098,
    preparednessScore: 88,
    householdCount: 210,
    registeredCount: 78,
    emergencyMode: false,
    captains: [
      { uid: 'cap-3', displayName: 'James Walker', email: 'j.walker@email.com' },
      { uid: 'cap-4', displayName: 'Anh Nguyen', email: 'anh.n@email.com' },
    ],
    resourceCount: 64,
    skillCount: 41,
  },
  {
    id: 'jackson-park',
    name: 'Jackson Park',
    centroidLat: 35.618626,
    centroidLng: -82.559237,
    preparednessScore: 31,
    householdCount: 340,
    registeredCount: 22,
    emergencyMode: true,
    emergencyEventName: 'Ice Storm — Feb 2026',
    captains: [],
    resourceCount: 9,
    skillCount: 5,
  },
  {
    id: 'brucemont',
    name: 'Brucemont / Louisiana',
    centroidLat: 35.5819,
    centroidLng: -82.589464,
    preparednessScore: 56,
    householdCount: 275,
    registeredCount: 51,
    emergencyMode: false,
    captains: [{ uid: 'cap-5', displayName: 'DeShawn Harris', email: 'deshawn.h@email.com' }],
    resourceCount: 28,
    skillCount: 19,
  },
  {
    id: 'bull-mountain',
    name: 'Bull Mountain',
    centroidLat: 35.593545,
    centroidLng: -82.495897,
    preparednessScore: 23,
    householdCount: 95,
    registeredCount: 8,
    emergencyMode: false,
    captains: [],
    resourceCount: 3,
    skillCount: 2,
  },
  {
    id: 'grace',
    name: 'Grace',
    centroidLat: 35.625909,
    centroidLng: -82.55516,
    preparednessScore: 67,
    householdCount: 198,
    registeredCount: 44,
    emergencyMode: false,
    captains: [{ uid: 'cap-6', displayName: 'Rachel Kim', email: 'rachel.k@email.com' }],
    resourceCount: 31,
    skillCount: 22,
  },
  {
    id: 'hillcrest',
    name: 'Hillcrest',
    centroidLat: 35.592791,
    centroidLng: -82.570846,
    preparednessScore: 91,
    householdCount: 152,
    registeredCount: 89,
    emergencyMode: false,
    captains: [{ uid: 'cap-7', displayName: 'Tom Bradley', email: 'tom.b@email.com' }],
    resourceCount: 72,
    skillCount: 48,
  },
  {
    id: 'lakeshore-heights',
    name: 'Lakeshore Heights',
    centroidLat: 35.627619,
    centroidLng: -82.558009,
    preparednessScore: 39,
    householdCount: 230,
    registeredCount: 30,
    emergencyMode: false,
    captains: [{ uid: 'cap-8', displayName: 'Linda Chen', email: 'linda.c@email.com' }],
    resourceCount: 15,
    skillCount: 10,
  },
  {
    id: 'view-point',
    name: 'View Point',
    centroidLat: 35.582977,
    centroidLng: -82.493532,
    preparednessScore: 52,
    householdCount: 88,
    registeredCount: 19,
    emergencyMode: false,
    captains: [],
    resourceCount: 11,
    skillCount: 7,
  },
];

// ── Households in West Asheville Estates (demo neighborhood) ──
export const MOCK_HOUSEHOLDS = [
  {
    id: 'hh-1',
    name: 'Rivera Family',
    displayName: 'Alex Rivera',
    address: '14 Westover Dr',
    lat: 35.5755,
    lng: -82.5965,
    memberCount: 3,
    evacuationStatus: 'safe',
    hasVulnerableMembers: false,
    sharingScope: 'coordinatorAndNeighbors',
    resources: [
      { type: 'power', name: 'Generator', quantity: 1, shareable: true },
      { type: 'tools', name: 'Chainsaw', quantity: 1, shareable: true },
      { type: 'water', name: 'Water storage (50 gal)', quantity: 1, shareable: true },
      { type: 'medical', name: 'First aid kit', quantity: 2, shareable: true },
    ],
    skills: [
      { category: 'technical', name: 'Ham Radio', level: 'trained' },
      { category: 'construction', name: 'Chainsaw / Tree Removal', level: 'expert' },
    ],
  },
  {
    id: 'hh-2',
    name: 'Garcia Family',
    displayName: 'Ana Garcia',
    address: '28 Westover Dr',
    lat: 35.5748,
    lng: -82.5958,
    memberCount: 5,
    evacuationStatus: 'safe',
    hasVulnerableMembers: true,
    sharingScope: 'coordinatorAndNeighbors',
    resources: [
      { type: 'food', name: 'Canned goods (2 weeks)', quantity: 1, shareable: true },
      { type: 'medical', name: 'Prescription meds', quantity: 1, shareable: false },
    ],
    skills: [
      { category: 'medical', name: 'Nurse / Doctor', level: 'expert' },
      { category: 'support', name: 'Childcare', level: 'trained' },
    ],
  },
  {
    id: 'hh-3',
    name: 'Patel Household',
    displayName: 'Raj Patel',
    address: '45 Alabama Ave',
    lat: 35.5738,
    lng: -82.5978,
    memberCount: 2,
    evacuationStatus: 'needCheckIn',
    hasVulnerableMembers: true,
    sharingScope: 'coordinatorOnly',
    resources: [],
    skills: [],
  },
  {
    id: 'hh-4',
    name: 'Williams Family',
    displayName: 'Marcus Williams',
    address: '67 Alabama Ave',
    lat: 35.5729,
    lng: -82.5991,
    memberCount: 4,
    evacuationStatus: 'noStatus',
    hasVulnerableMembers: false,
    sharingScope: 'coordinatorAndNeighbors',
    resources: [
      { type: 'power', name: 'Solar panel + battery', quantity: 1, shareable: true },
      { type: 'communications', name: 'Ham radio', quantity: 1, shareable: true },
    ],
    skills: [
      { category: 'technical', name: 'Electrician', level: 'expert' },
      { category: 'technical', name: 'Ham Radio', level: 'expert' },
    ],
  },
  {
    id: 'hh-5',
    name: 'Johnson Household',
    displayName: 'Eleanor Johnson',
    address: '12 Sand Hill Rd',
    lat: 35.5762,
    lng: -82.5945,
    memberCount: 1,
    evacuationStatus: 'needHelp',
    needType: 'Medical — needs insulin refrigerated',
    hasVulnerableMembers: true,
    sharingScope: 'coordinatorOnly',
    resources: [],
    skills: [],
  },
  {
    id: 'hh-6',
    name: 'Chen Family',
    displayName: 'Wei Chen',
    address: '89 Brevard Rd',
    lat: 35.5771,
    lng: -82.5972,
    memberCount: 3,
    evacuationStatus: 'safe',
    hasVulnerableMembers: false,
    sharingScope: 'coordinatorAndNeighbors',
    resources: [
      { type: 'shelter', name: 'Extra room for 2 guests', quantity: 1, shareable: true },
      { type: 'food', name: 'Rice/dry goods (1 month)', quantity: 1, shareable: true },
    ],
    skills: [
      { category: 'support', name: 'Mental Health', level: 'expert' },
    ],
  },
  {
    id: 'hh-7',
    name: 'Brown Family',
    displayName: 'David Brown',
    address: '33 Sand Hill Rd',
    lat: 35.5745,
    lng: -82.5950,
    memberCount: 2,
    evacuationStatus: 'noStatus',
    hasVulnerableMembers: false,
    sharingScope: 'dontShare',
    resources: [],
    skills: [],
  },
  {
    id: 'hh-8',
    name: 'Rivera Family',
    displayName: 'Sofia Rivera',
    address: '102 Brevard Rd',
    lat: 35.5735,
    lng: -82.5985,
    memberCount: 4,
    evacuationStatus: 'safe',
    hasVulnerableMembers: false,
    sharingScope: 'coordinatorAndNeighbors',
    resources: [
      { type: 'tools', name: 'Hand tools set', quantity: 1, shareable: true },
      { type: 'power', name: 'Portable battery pack', quantity: 2, shareable: true },
    ],
    skills: [
      { category: 'construction', name: 'Carpentry', level: 'trained' },
      { category: 'medical', name: 'CPR / First Aid', level: 'trained' },
    ],
  },
  {
    id: 'hh-9',
    name: 'Okafor Household',
    displayName: 'Chidi Okafor',
    address: '55 Westover Dr',
    lat: 35.5758,
    lng: -82.5952,
    memberCount: 2,
    evacuationStatus: 'safe',
    hasVulnerableMembers: false,
    sharingScope: 'coordinatorAndNeighbors',
    resources: [
      { type: 'medical', name: 'Advanced first aid kit', quantity: 1, shareable: true },
    ],
    skills: [
      { category: 'medical', name: 'EMT', level: 'expert' },
      { category: 'emergency', name: 'Search & Rescue', level: 'trained' },
    ],
  },
  {
    id: 'hh-10',
    name: 'Kowalski Family',
    displayName: 'Anna Kowalski',
    address: '78 Alabama Ave',
    lat: 35.5740,
    lng: -82.5968,
    memberCount: 6,
    evacuationStatus: 'needCheckIn',
    hasVulnerableMembers: true,
    sharingScope: 'coordinatorAndNeighbors',
    resources: [
      { type: 'food', name: 'Emergency rations', quantity: 1, shareable: true },
      { type: 'water', name: 'Water filter', quantity: 1, shareable: true },
    ],
    skills: [
      { category: 'support', name: 'Animal Care', level: 'trained' },
    ],
  },
];

// ── Rally points with supplies ──
export const MOCK_PRIMARY_RALLY_POINT = {
  name: 'West Asheville Park Pavilion',
  lat: 35.5750,
  lng: -82.5975,
  description: 'Covered pavilion at the park entrance. Has power outlet and water spigot.',
  supplies: [
    { name: 'Bottled water (cases)', quantity: 12 },
    { name: 'First aid kits', quantity: 4 },
    { name: 'Flashlights', quantity: 8 },
    { name: 'Emergency blankets', quantity: 20 },
    { name: 'Battery packs', quantity: 6 },
    { name: 'AM/FM Radio', quantity: 2 },
  ],
};

export const MOCK_BACKUP_RALLY_POINT = {
  name: 'Sand Hill Community Center',
  lat: 35.5765,
  lng: -82.5940,
  description: 'Indoor facility with kitchen, restrooms, and backup generator.',
  supplies: [
    { name: 'Bottled water (cases)', quantity: 24 },
    { name: 'MRE meals', quantity: 50 },
    { name: 'Cots', quantity: 15 },
    { name: 'First aid kits', quantity: 8 },
    { name: 'Generator (propane)', quantity: 1 },
    { name: 'Propane tanks', quantity: 4 },
  ],
};

// ── Storm event ──
export const MOCK_STORM_EVENT = {
  eventName: 'Winter Storm Warning — Buncombe County',
  activatedAt: new Date('2026-03-28T14:30:00'),
  description: 'NWS has issued a Winter Storm Warning for Buncombe County. Expected 6-10" of snow with ice accumulation. Power outages likely.',
};

// ── Recovery notification ──
export const MOCK_RECOVERY_NOTIFICATION = {
  title: 'Recovery Update — Buncombe County EOC',
  body: 'Power restoration is underway. Duke Energy estimates 80% restoration by end of day. Warming centers open at Kenilworth Recreation Center and West Asheville Library. FEMA assistance hotline: 1-800-621-3362. Boil water advisory remains in effect for zones 3 and 4.',
  sender: 'Buncombe County Emergency Operations',
  senderRole: 'City/County Emergency Management',
  timestamp: new Date('2026-03-29T08:15:00'),
};

// ── Recent alerts ──
export const MOCK_ALERTS = [
  {
    id: 'alert-1',
    neighborhoodId: 'west-asheville-estates',
    type: 'emergency',
    title: 'Winter Storm Warning Activated',
    body: 'Emergency mode has been activated for West Asheville Estates. Check on your neighbors and report to the rally point if needed.',
    createdAt: new Date('2026-03-28T14:30:00'),
    authorName: 'Alex Rivera',
    acknowledgedCount: 28,
    totalRecipients: 42,
  },
  {
    id: 'alert-2',
    neighborhoodId: 'west-asheville-estates',
    type: 'urgent',
    title: 'Road Closure — Brevard Rd',
    body: 'Brevard Rd is closed between Sand Hill and Alabama Ave due to a downed tree. Use Westover Dr as alternate route.',
    createdAt: new Date('2026-03-28T18:45:00'),
    authorName: 'Alex Rivera',
    acknowledgedCount: 19,
    totalRecipients: 42,
  },
  {
    id: 'alert-3',
    neighborhoodId: 'west-asheville-estates',
    type: 'info',
    title: 'Warming Center Open',
    body: 'The Sand Hill Community Center is now open as a warming center. Hot coffee and blankets available. Bring medications.',
    createdAt: new Date('2026-03-28T20:00:00'),
    authorName: 'Alex Rivera',
    acknowledgedCount: 35,
    totalRecipients: 42,
  },
  {
    id: 'alert-4',
    neighborhoodId: 'jackson-park',
    type: 'emergency',
    title: 'Ice Storm Emergency — Jackson Park',
    body: 'Significant ice accumulation has caused widespread power outages and road blockages in Jackson Park.',
    createdAt: new Date('2026-03-28T16:00:00'),
    authorName: 'System',
    acknowledgedCount: 8,
    totalRecipients: 22,
  },
];

// ── City-wide admin messages ──
export const MOCK_ADMIN_MESSAGES = [
  {
    id: 'msg-1',
    type: 'emergency',
    title: 'County-Wide Winter Storm Warning',
    body: 'All neighborhood captains: prepare your blocks for significant winter weather. Ensure rally points are stocked and contact lists are current.',
    targets: 'All Neighborhoods',
    recipientCount: 847,
    neighborhoodCount: 10,
    createdAt: new Date('2026-03-28T10:00:00'),
    sender: 'Buncombe County EOC',
    acknowledgedCount: 612,
  },
  {
    id: 'msg-2',
    type: 'info',
    title: 'FEMA Assistance Now Available',
    body: 'FEMA individual assistance is now available for Buncombe County residents. Apply at disasterassistance.gov or call 1-800-621-3362.',
    targets: 'All Neighborhoods',
    recipientCount: 847,
    neighborhoodCount: 10,
    createdAt: new Date('2026-03-29T09:00:00'),
    sender: 'Buncombe County EOC',
    acknowledgedCount: 234,
  },
  {
    id: 'msg-3',
    type: 'urgent',
    title: 'Captains: Submit Welfare Check Reports',
    body: 'All block captains: please submit your welfare check reports by 6 PM today. Priority on households with vulnerable members.',
    targets: 'Captains Only',
    recipientCount: 7,
    neighborhoodCount: 10,
    createdAt: new Date('2026-03-29T11:00:00'),
    sender: 'Buncombe County EOC',
    acknowledgedCount: 4,
  },
];

// ── Mock audit log ──
export const MOCK_AUDIT_LOG = [
  { id: 'log-1', action: 'emergency.activated', actorUid: 'cap-1', actorRole: 'blockCaptain', details: 'West Asheville Estates — Winter Storm Warning', timestamp: new Date('2026-03-28T14:30:00') },
  { id: 'log-2', action: 'alert.sent', actorUid: 'cap-1', actorRole: 'blockCaptain', details: 'Winter Storm Warning Activated → 42 recipients', timestamp: new Date('2026-03-28T14:31:00') },
  { id: 'log-3', action: 'captain.assigned', actorUid: 'admin-1', actorRole: 'cityCountyCaptain', details: 'Rachel Kim → Grace neighborhood', timestamp: new Date('2026-03-25T10:00:00') },
  { id: 'log-4', action: 'alert.sent', actorUid: 'admin-1', actorRole: 'cityCountyCaptain', details: 'County-Wide Winter Storm Warning → 847 recipients', timestamp: new Date('2026-03-28T10:01:00') },
  { id: 'log-5', action: 'emergency.activated', actorUid: 'admin-1', actorRole: 'cityCountyCaptain', details: 'Jackson Park — Ice Storm Feb 2026', timestamp: new Date('2026-03-28T16:00:00') },
  { id: 'log-6', action: 'captain.removed', actorUid: 'admin-1', actorRole: 'cityCountyCaptain', details: 'Former captain removed from Bull Mountain', timestamp: new Date('2026-03-20T09:00:00') },
];

// ── Emergency action plan (mock, for storm mode) ──
export const MOCK_EMERGENCY_PLAN = {
  id: 'plan-storm',
  title: 'Winter Storm Response Plan',
  scenarioType: 'power_outage',
  content: `
    <h3>Immediate Actions (0-2 hours)</h3>
    <ol>
      <li>Check on vulnerable neighbors (elderly, medical equipment dependent)</li>
      <li>Report to rally point if you can safely travel</li>
      <li>Send "I'm Okay" status to your emergency contacts</li>
      <li>Conserve phone battery — switch to low-power mode</li>
    </ol>
    <h3>Short-Term (2-24 hours)</h3>
    <ol>
      <li>Pool resources with neighbors — generators, food, water</li>
      <li>Keep pipes dripping to prevent freezing</li>
      <li>Check road conditions before driving</li>
      <li>Monitor captain alerts for updates</li>
    </ol>
    <h3>Recovery Phase</h3>
    <ol>
      <li>Document damage for insurance/FEMA claims</li>
      <li>Report downed power lines to Duke Energy: 1-800-769-3766</li>
      <li>Check on neighbors daily until power is restored</li>
    </ol>
  `,
};

// ── Welfare check summary (computed from households) ──
export function getWelfareSummary(households = MOCK_HOUSEHOLDS) {
  const needHelp = households.filter((h) => h.evacuationStatus === 'needHelp').length;
  const needCheckIn = households.filter((h) => h.evacuationStatus === 'needCheckIn').length;
  const safe = households.filter((h) => h.evacuationStatus === 'safe').length;
  const noStatus = households.filter((h) => !h.evacuationStatus || h.evacuationStatus === 'noStatus').length;
  return { needHelp, needCheckIn, safe, noStatus, total: households.length };
}

// ── Aggregate resource counts ──
export function getResourceCounts(households = MOCK_HOUSEHOLDS) {
  const counts = { medical: 0, power: 0, water: 0, food: 0, shelter: 0, tools: 0, communications: 0 };
  for (const h of households) {
    for (const r of h.resources || []) {
      if (counts[r.type] !== undefined) counts[r.type] += r.quantity || 1;
    }
  }
  return counts;
}
