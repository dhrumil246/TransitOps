// Mocks reflecting the API contract in PLAN_BACKEND.md / plan.md
const SEED = {
  vehicles: [
    { id: 'GJ01AJ3463', regNo: 'VAN-05', name: 'Ford Transit', type: 'VAN', maxLoadKg: 500, status: 'AVAILABLE' },
    { id: 'GJ01AJ3945', regNo: 'TRUCK-11', name: 'Volvo FH', type: 'TRUCK', maxLoadKg: 5000, status: 'ON_TRIP' },
    { id: 'GJ01AJ3129', regNo: 'MINI-03', name: 'Tata Ace', type: 'MINI', maxLoadKg: 750, status: 'IN_SHOP' },
    { id: 'GJ01AJ3000', regNo: 'VAN-09', name: 'Mahindra Supro', type: 'VAN', maxLoadKg: 500, status: 'AVAILABLE' },
  ],
  drivers: [
    { id: 'DRV001', name: 'Alex', licenseNo: 'DL-88213-L', licenseCategory: 'LMV', licenseExpiry: '2028-10-01', safetyScore: 91, status: 'AVAILABLE' },
    { id: 'DRV002', name: 'John', licenseNo: 'DL-44901-H', licenseCategory: 'HMV', licenseExpiry: '2026-08-01', safetyScore: 78, status: 'ON_TRIP' },
    { id: 'DRV003', name: 'Priya', licenseNo: 'DL-22341-M', licenseCategory: 'LMV', licenseExpiry: '2026-05-01', safetyScore: 62, status: 'AVAILABLE' },
    { id: 'DRV004', name: 'Suresh', licenseNo: 'DL-81490-L', licenseCategory: 'HMV', licenseExpiry: '2029-11-01', safetyScore: 95, status: 'SUSPENDED' },
  ],
  trips: [
    { id: 'TRP-2041', source: 'Gandhinagar', destination: 'Ahmedabad', vehicleRegNo: 'TRUCK-11', driver: 'John', status: 'DISPATCHED', cargoWeightKg: 1200 },
    { id: 'TRP-2044', source: 'Vatva', destination: 'Sanand', vehicleRegNo: null, driver: null, status: 'DRAFT', cargoWeightKg: 600 },
  ],
  maintenance: [
    { id: 'MNT001', vehicleId: 'GJ01AJ3129', vehicleRegNo: 'MINI-03', type: 'Oil Change', cost: 3500, date: '2026-07-01', status: 'OPEN' },
  ],
  expenses: [],
  fuelLogs: [],
};

function load(key: string) {
  try { return JSON.parse(localStorage.getItem('to_api_' + key) || 'null'); } catch { return null; }
}
function save(key: string, val: any) {
  localStorage.setItem('to_api_' + key, JSON.stringify(val));
}
function init(key: keyof typeof SEED) {
  if (!load(key)) save(key, SEED[key]);
}

['vehicles','drivers','trips','maintenance','expenses','fuelLogs'].forEach(k => init(k as keyof typeof SEED));

export async function mockResolve<T>(path: string, opts: RequestInit): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const method = opts.method || 'GET';
      const body = opts.body ? JSON.parse(opts.body as string) : {};

      if (path === '/auth/login' && method === 'POST') {
        if (body.password !== 'demo1234') return reject({ error: 'Unauthorized', message: 'Invalid password' });
        return resolve({ token: 'mock-jwt-token', user: { id: 'u1', name: 'Fleet Manager', role: 'FLEET_MANAGER' } } as T);
      }

      if (path.startsWith('/vehicles')) {
        const vehicles = load('vehicles');
        if (method === 'GET') return resolve(vehicles as T);
      }
      
      if (path.startsWith('/drivers')) {
        const drivers = load('drivers');
        if (method === 'GET') return resolve(drivers as T);
      }

      if (path === '/trips/dispatch-options' && method === 'GET') {
        const vehicles = load('vehicles').filter((v:any) => v.status === 'AVAILABLE');
        const drivers = load('drivers').filter((d:any) => d.status === 'AVAILABLE' && new Date(d.licenseExpiry) > new Date());
        return resolve({ vehicles, drivers } as T);
      }

      if (path === '/trips' && method === 'GET') {
        return resolve(load('trips') as T);
      }
      
      if (path === '/dashboard/kpis' && method === 'GET') {
        return resolve({
          activeVehicles: 5, availableVehicles: 2, inMaintenance: 1, activeTrips: 3, pendingTrips: 4, driversOnDuty: 3, fleetUtilizationPct: 87,
          vehicleStatusBreakdown: { AVAILABLE: 2, ON_TRIP: 3, IN_SHOP: 1, RETIRED: 0 },
          recentTrips: []
        } as T);
      }

      // Allow basic resolution for missing endpoints
      resolve([] as unknown as T);
    }, 300); // simulate network latency
  });
}
