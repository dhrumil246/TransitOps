// ============================================================================
// modules/drivers/drivers.service.ts  — BA owns
// Full CRUD: list (filter/search/sort), create (unique licenseNo), get, update, delete
// ============================================================================

import prisma from '../../lib/prisma';
import { ConflictError, NotFoundError, ValidationError } from '../../middleware/error';
import { Prisma, DriverStatus } from '@prisma/client';

// ---- List with filter / search / sort ----
export async function listDrivers(query: {
  status?: string;
  search?: string;
  sort?: string;
}) {
  const where: Prisma.DriverWhereInput = {};

  if (query.status && Object.values(DriverStatus).includes(query.status as DriverStatus)) {
    where.status = query.status as DriverStatus;
  }
  if (query.search) {
    where.OR = [
      { name:      { contains: query.search, mode: 'insensitive' } },
      { licenseNo: { contains: query.search, mode: 'insensitive' } },
      { contact:   { contains: query.search, mode: 'insensitive' } },
    ];
  }

  let orderBy: Prisma.DriverOrderByWithRelationInput = { createdAt: 'desc' };
  if (query.sort) {
    const desc = query.sort.startsWith('-');
    const field = desc ? query.sort.slice(1) : query.sort;
    const allowed = ['name', 'licenseNo', 'licenseExpiry', 'safetyScore', 'status', 'createdAt'];
    if (allowed.includes(field)) {
      orderBy = { [field]: desc ? 'desc' : 'asc' } as Prisma.DriverOrderByWithRelationInput;
    }
  }

  return prisma.driver.findMany({ where, orderBy });
}

// ---- Create ----
export async function createDriver(data: {
  name: string;
  licenseNo: string;
  licenseCategory: string;
  licenseExpiry: string;
  contact: string;
  safetyScore?: number;
}) {
  const existing = await prisma.driver.findUnique({ where: { licenseNo: data.licenseNo } });
  if (existing) throw new ConflictError('License number already exists');

  return prisma.driver.create({
    data: {
      ...data,
      licenseExpiry: new Date(data.licenseExpiry),
      safetyScore: data.safetyScore ?? 100,
    },
  });
}

// ---- Get one ----
export async function getDriver(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new NotFoundError('Driver not found');
  return driver;
}

// ---- Update ----
export async function updateDriver(id: string, data: Prisma.DriverUpdateInput) {
  await getDriver(id); // ensure exists

  if (data.licenseNo && typeof data.licenseNo === 'string') {
    const conflict = await prisma.driver.findFirst({
      where: { licenseNo: data.licenseNo, NOT: { id } },
    });
    if (conflict) throw new ConflictError('License number already exists');
  }

  // Parse licenseExpiry if provided as string
  if (data.licenseExpiry && typeof data.licenseExpiry === 'string') {
    data.licenseExpiry = new Date(data.licenseExpiry);
  }

  return prisma.driver.update({ where: { id }, data });
}

// ---- Delete ----
export async function deleteDriver(id: string) {
  const driver = await getDriver(id); // ensure exists
  if (driver.status === 'ON_TRIP') {
    throw new ValidationError('Cannot delete a driver that is currently On Trip');
  }
  return prisma.driver.delete({ where: { id } });
}

// ---- Trip history for a driver ----
export async function getDriverTrips(id: string) {
  await getDriver(id); // ensure driver exists → 404 if not
  return prisma.trip.findMany({
    where: { driverId: id },
    include: { vehicle: { select: { regNo: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
