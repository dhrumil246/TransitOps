// ============================================================================
// modules/maintenance/maintenance.service.ts  — BB owns
// Open log → vehicle IN_SHOP; Close log → vehicle AVAILABLE (unless RETIRED)
// All state changes in prisma.$transaction
// ============================================================================

import prisma from '../../lib/prisma';
import { ValidationError, NotFoundError } from '../../middleware/error';

// ---- List — optional ?vehicleId filter ----
export async function listMaintenance(vehicleId?: string) {
  return prisma.maintenanceLog.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: { vehicle: { select: { regNo: true, name: true, status: true } } },
    orderBy: { openedAt: 'desc' },
  });
}

// ---- Open — create OPEN log + set vehicle IN_SHOP ----
export async function openMaintenance(data: {
  vehicleId: string;
  type: string;
  cost: number;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (vehicle.status === 'RETIRED') {
      throw new ValidationError('Retired vehicles cannot be sent to maintenance');
    }
    if (vehicle.status === 'ON_TRIP') {
      throw new ValidationError('Vehicle is currently On Trip — complete the trip first');
    }

    await tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'IN_SHOP' } });

    return tx.maintenanceLog.create({
      data: { ...data, status: 'OPEN' },
      include: { vehicle: { select: { regNo: true, name: true } } },
    });
  });
}

// ---- Close — set CLOSED + restore vehicle AVAILABLE (unless RETIRED) ----
export async function closeMaintenance(id: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({
      where: { id },
      include: { vehicle: true },
    });
    if (!log) throw new NotFoundError('Maintenance log not found');
    if (log.status === 'CLOSED') throw new ValidationError('Log is already closed');

    // Restore vehicle unless it was retired
    if (log.vehicle.status !== 'RETIRED') {
      await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: 'AVAILABLE' } });
    }

    return tx.maintenanceLog.update({
      where: { id },
      data:  { status: 'CLOSED', closedAt: new Date() },
      include: { vehicle: { select: { regNo: true, name: true } } },
    });
  });
}
