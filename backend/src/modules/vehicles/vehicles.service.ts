// ============================================================================
// modules/vehicles/vehicles.service.ts  — BA owns
// Full CRUD: list (filter/search/sort), create (unique regNo), get, update, delete
// ============================================================================

import prisma from '../../lib/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../middleware/error';
import { Prisma, VehicleType, VehicleStatus } from '@prisma/client';

// ---- List with filter / search / sort ----
export async function listVehicles(query: {
  type?: string;
  status?: string;
  region?: string;
  search?: string;
  sort?: string;
  skip?: string;
  take?: string;
}) {
  const where: Prisma.VehicleWhereInput = {};

  if (query.type && Object.values(VehicleType).includes(query.type as VehicleType)) {
    where.type = query.type as VehicleType;
  }
  if (query.status && Object.values(VehicleStatus).includes(query.status as VehicleStatus)) {
    where.status = query.status as VehicleStatus;
  }
  if (query.region) {
    where.region = { equals: query.region, mode: 'insensitive' };
  }
  if (query.search) {
    where.OR = [
      { regNo: { contains: query.search, mode: 'insensitive' } },
      { name:  { contains: query.search, mode: 'insensitive' } },
    ];
  }

  // sort: field name, prefix '-' for desc
  let orderBy: Prisma.VehicleOrderByWithRelationInput = { createdAt: 'desc' };
  if (query.sort) {
    const desc = query.sort.startsWith('-');
    const field = desc ? query.sort.slice(1) : query.sort;
    const allowed = ['regNo', 'name', 'type', 'status', 'odometer', 'maxLoadKg', 'createdAt'];
    if (allowed.includes(field)) {
      orderBy = { [field]: desc ? 'desc' : 'asc' } as Prisma.VehicleOrderByWithRelationInput;
    }
  }

  return prisma.vehicle.findMany({ 
    where, 
    orderBy,
    skip: query.skip ? Number(query.skip) : undefined,
    take: query.take ? Number(query.take) : undefined,
  });
}

// ---- Create ----
export async function createVehicle(data: {
  regNo: string;
  name: string;
  type: VehicleType;
  maxLoadKg: number;
  odometer?: number;
  acquisitionCost: number;
  region?: string;
}) {
  const existing = await prisma.vehicle.findUnique({ where: { regNo: data.regNo } });
  if (existing) throw new ConflictError('Registration number already exists');

  return prisma.vehicle.create({ data });
}

// ---- Get one ----
export async function getVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  return vehicle;
}

// ---- Update ----
export async function updateVehicle(
  id: string,
  data: Prisma.VehicleUpdateInput,
) {
  const existing = await getVehicle(id); // ensure exists

  // Business rule: RETIRED is a terminal status — cannot be changed via a plain PATCH
  if (existing.status === 'RETIRED' && data.status && data.status !== 'RETIRED') {
    throw new ValidationError('Retired vehicles cannot be reactivated');
  }

  // If changing regNo, check uniqueness
  if (data.regNo && typeof data.regNo === 'string') {
    const conflict = await prisma.vehicle.findFirst({
      where: { regNo: data.regNo, NOT: { id } },
    });
    if (conflict) throw new ConflictError('Registration number already exists');
  }

  return prisma.vehicle.update({ where: { id }, data });
}

// ---- Delete ----
export async function deleteVehicle(id: string) {
  const vehicle = await getVehicle(id); // ensure exists
  if (vehicle.status === 'ON_TRIP') {
    throw new ValidationError('Cannot delete a vehicle that is currently On Trip');
  }
  if (vehicle.status === 'IN_SHOP') {
    throw new ValidationError('Cannot delete a vehicle that is currently In Shop — close the maintenance log first');
  }
  return prisma.vehicle.delete({ where: { id } });
}

// ---- Trip history for a vehicle ----
export async function getVehicleTrips(id: string) {
  await getVehicle(id); // ensure vehicle exists → 404 if not
  return prisma.trip.findMany({
    where: { vehicleId: id },
    include: { driver: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
