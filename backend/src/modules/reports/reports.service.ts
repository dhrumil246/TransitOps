// ============================================================================
// modules/reports/reports.service.ts  — BB owns
// Aggregation: fuel efficiency, utilization, op cost, ROI, monthly revenue, CSV
// ============================================================================

import prisma from '../../lib/prisma';

export async function getReports() {
  const [
    tripAgg,
    fuelAgg,
    maintAgg,
    statusGroup,
    fuelByVehicle,
    maintByVehicle,
    revenueByVehicle,
    vehicles,
    completedTripsWithRevenue
  ] = await Promise.all([
    prisma.trip.aggregate({ where: { status: 'COMPLETED' }, _sum: { plannedDistance: true, fuelConsumedL: true, revenue: true } }),
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.vehicle.groupBy({ by: ['status'], _count: true }),
    prisma.fuelLog.groupBy({ by: ['vehicleId'], _sum: { cost: true } }),
    prisma.maintenanceLog.groupBy({ by: ['vehicleId'], _sum: { cost: true } }),
    prisma.trip.groupBy({ by: ['vehicleId'], _sum: { revenue: true }, where: { status: 'COMPLETED' } }),
    prisma.vehicle.findMany({ select: { id: true, regNo: true, acquisitionCost: true } }),
    prisma.trip.findMany({
      where: { status: 'COMPLETED', revenue: { not: null }, completedAt: { not: null } },
      select: { revenue: true, completedAt: true }
    })
  ]);

  // ---- Fuel efficiency: totalPlannedDistance / totalFuelConsumed ----
  const totalDistance = tripAgg._sum.plannedDistance || 0;
  const totalFuel     = tripAgg._sum.fuelConsumedL || 0;
  const fuelEfficiencyKmPerL = totalFuel > 0
    ? Math.round((totalDistance / totalFuel) * 10) / 10
    : 0;

  // ---- Fleet utilization ----
  const onTrip    = statusGroup.find(s => s.status === 'ON_TRIP')?._count || 0;
  const available = statusGroup.find(s => s.status === 'AVAILABLE')?._count || 0;
  const fleetUtilizationPct = (onTrip + available) > 0
    ? Math.round((onTrip / (onTrip + available)) * 100)
    : 0;

  // ---- Operational cost: sum of all fuel + maintenance ----
  const operationalCost = Math.round(((fuelAgg._sum.cost || 0) + (maintAgg._sum.cost || 0)) * 100) / 100;

  // ---- ROI per vehicle: (revenue − (maint + fuel)) / acquisitionCost ----
  const roiByVehicle = vehicles.map(v => {
    const revenue   = revenueByVehicle.find(r => r.vehicleId === v.id)?._sum.revenue || 0;
    const fuelCost  = fuelByVehicle.find(f => f.vehicleId === v.id)?._sum.cost || 0;
    const maintCost = maintByVehicle.find(m => m.vehicleId === v.id)?._sum.cost || 0;
    const roi = v.acquisitionCost > 0
      ? Math.round(((revenue - fuelCost - maintCost) / v.acquisitionCost) * 100) / 100
      : 0;
    return { regNo: v.regNo, roi };
  });

  // ---- Monthly revenue ----
  const monthlyMap: Record<string, number> = {};
  completedTripsWithRevenue.forEach(t => {
    if (!t.completedAt || !t.revenue) return;
    const month = t.completedAt.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    monthlyMap[month] = (monthlyMap[month] || 0) + t.revenue;
  });
  const monthlyRevenue = Object.entries(monthlyMap).map(([month, value]) => ({ month, value }));

  // ---- Top costliest vehicles ----
  const costByVehicle = vehicles.map(v => {
    const fuelCost  = fuelByVehicle.find(f => f.vehicleId === v.id)?._sum.cost || 0;
    const maintCost = maintByVehicle.find(m => m.vehicleId === v.id)?._sum.cost || 0;
    return { regNo: v.regNo, cost: Math.round((fuelCost + maintCost) * 100) / 100 };
  }).sort((a, b) => b.cost - a.cost);
  const topCostliestVehicles = costByVehicle.slice(0, 5);

  return {
    fuelEfficiencyKmPerL,
    fleetUtilizationPct,
    operationalCost,
    roiByVehicle,
    monthlyRevenue,
    topCostliestVehicles,
  };
}

// ---- CSV export ----
export async function streamCsvData(stream: NodeJS.WritableStream): Promise<void> {
  const header = 'Trip ID,Vehicle,Driver,Source,Destination,Status,Cargo (kg),Distance (km),Fuel (L),Revenue,Dispatched At,Completed At\n';
  stream.write(header);

  let skip = 0;
  const take = 500;
  let hasMore = true;

  while (hasMore) {
    const trips = await prisma.trip.findMany({
      skip,
      take,
      include: {
        vehicle: { select: { regNo: true, name: true } },
        driver:  { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (trips.length === 0) {
      hasMore = false;
      break;
    }

    for (const t of trips) {
      const row = [
        t.id,
        t.vehicle.regNo,
        t.driver.name,
        `"${t.source}"`,
        `"${t.destination}"`,
        t.status,
        t.cargoWeightKg,
        t.plannedDistance,
        t.fuelConsumedL ?? '',
        t.revenue ?? '',
        t.dispatchedAt ? t.dispatchedAt.toISOString() : '',
        t.completedAt  ? t.completedAt.toISOString()  : '',
      ].join(',') + '\n';
      stream.write(row);
    }
    
    skip += take;
  }
  stream.end();
}
