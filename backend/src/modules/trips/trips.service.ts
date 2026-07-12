// ============================================================================
// modules/trips/trips.service.ts  — BB owns
// THE centerpiece: all state transitions inside prisma.$transaction
// ============================================================================

import prisma from '../../lib/prisma';
import { ValidationError, NotFoundError } from '../../middleware/error';
import { TripStatus } from '@prisma/client';
import {
  assertVehicleAvailable,
  assertDriverAssignable,
  assertLicenseValid,
  assertCargoWithinCapacity,
} from './rules';

// ---- List trips (live board) — optional ?status= filter ----
export async function listTrips(status?: string) {
  const where = status ? { status: status as TripStatus } : {};
  return prisma.trip.findMany({
    where,
    include: {
      vehicle: { select: { regNo: true, name: true, status: true } },
      driver:  { select: { name: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ---- Get single trip ----
export async function getTripById(id: string) {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: { select: { regNo: true, name: true, status: true, maxLoadKg: true } },
      driver:  { select: { name: true, status: true, licenseCategory: true } },
    },
  });
  if (!trip) throw new NotFoundError('Trip not found');
  return trip;
}

// ---- Dispatch options — ONLY assignable vehicles + drivers ----
export async function getDispatchOptions() {
  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({
      where: { status: 'AVAILABLE' },
      select: { id: true, regNo: true, name: true, maxLoadKg: true },
    }),
    prisma.driver.findMany({
      where: {
        status: 'AVAILABLE',
        licenseExpiry: { gt: new Date() },
      },
      select: { id: true, name: true, licenseCategory: true },
    }),
  ]);
  return { vehicles, drivers };
}

// ---- Create Draft — runs all 4 validations ----
export async function createTrip(data: {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistance: number;
}) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    const driver = await tx.driver.findUnique({ where: { id: data.driverId } });
    if (!driver) throw new NotFoundError('Driver not found');

    assertVehicleAvailable(vehicle);
    assertDriverAssignable(driver);
    assertLicenseValid(driver);
    assertCargoWithinCapacity(data.cargoWeightKg, vehicle.maxLoadKg);

    return tx.trip.create({
      data,
      include: {
        vehicle: { select: { regNo: true, name: true } },
        driver:  { select: { name: true } },
      },
    });
  });
}

// ---- Dispatch: DRAFT → DISPATCHED, both → ON_TRIP ----
export async function dispatchTrip(id: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    });
    if (!trip) throw new NotFoundError('Trip not found');
    if (trip.status !== 'DRAFT') {
      throw new ValidationError('Only draft trips can be dispatched');
    }

    // Re-validate — state may have changed since draft was created
    assertVehicleAvailable(trip.vehicle);
    assertDriverAssignable(trip.driver);
    assertLicenseValid(trip.driver);
    assertCargoWithinCapacity(trip.cargoWeightKg, trip.vehicle.maxLoadKg);

    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } });
    await tx.driver.update({  where: { id: trip.driverId  }, data: { status: 'ON_TRIP' } });

    return tx.trip.update({
      where: { id },
      data: { status: 'DISPATCHED', dispatchedAt: new Date() },
      include: {
        vehicle: { select: { regNo: true, name: true } },
        driver:  { select: { name: true } },
      },
    });
  });
}

// ---- Complete: DISPATCHED → COMPLETED, both → AVAILABLE, log fuel ----
export async function completeTrip(
  id: string,
  body: { finalOdometer: number; fuelConsumedL: number; revenue: number; fuelCost?: number },
) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundError('Trip not found');
    if (trip.status !== 'DISPATCHED') {
      throw new ValidationError('Only dispatched trips can be completed');
    }

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data:  { status: 'AVAILABLE', odometer: body.finalOdometer },
    });
    await tx.driver.update({
      where: { id: trip.driverId },
      data:  { status: 'AVAILABLE' },
    });
    await tx.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        liters:    body.fuelConsumedL,
        cost:      body.fuelCost ?? 0,   // fuelCost optional; defaults to 0 if not provided
        odometer:  body.finalOdometer,
      },
    });

    return tx.trip.update({
      where: { id },
      data:  {
        status:        'COMPLETED',
        completedAt:   new Date(),
        finalOdometer: body.finalOdometer,
        fuelConsumedL: body.fuelConsumedL,
        revenue:       body.revenue,
      },
      include: {
        vehicle: { select: { regNo: true, name: true } },
        driver:  { select: { name: true } },
      },
    });
  });
}

// ---- Cancel: DISPATCHED → CANCELLED, both → AVAILABLE ----
export async function cancelTrip(id: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundError('Trip not found');
    if (trip.status !== 'DISPATCHED') {
      throw new ValidationError('Only dispatched trips can be cancelled');
    }

    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } });
    await tx.driver.update({  where: { id: trip.driverId  }, data: { status: 'AVAILABLE' } });

    return tx.trip.update({
      where: { id },
      data:  { status: 'CANCELLED' },
      include: {
        vehicle: { select: { regNo: true, name: true } },
        driver:  { select: { name: true } },
      },
    });
  });
}
