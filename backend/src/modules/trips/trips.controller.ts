// ============================================================================
// modules/trips/trips.controller.ts  — BB owns
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import * as tripsService from './trips.service';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try { res.json(await tripsService.listTrips(req.query.status as string | undefined)); } catch (e) { next(e); }
}

export async function getOneHandler(req: Request, res: Response, next: NextFunction) {
  try { res.json(await tripsService.getTripById(req.params.id)); } catch (e) { next(e); }
}

export async function dispatchOptionsHandler(req: Request, res: Response, next: NextFunction) {
  try { res.json(await tripsService.getDispatchOptions()); } catch (e) { next(e); }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistance } = req.body;
    if (!source || !destination || !vehicleId || !driverId || !cargoWeightKg || !plannedDistance) {
      res.status(422).json({ error: 'VALIDATION_FAILED', message: 'source, destination, vehicleId, driverId, cargoWeightKg, plannedDistance are required' });
      return;
    }
    const cargo = Number(cargoWeightKg);
    const distance = Number(plannedDistance);
    if (isNaN(cargo) || cargo <= 0) {
      res.status(422).json({ error: 'VALIDATION_FAILED', message: 'cargoWeightKg must be a positive number' });
      return;
    }
    if (isNaN(distance) || distance <= 0) {
      res.status(422).json({ error: 'VALIDATION_FAILED', message: 'plannedDistance must be a positive number' });
      return;
    }
    const trip = await tripsService.createTrip({
      source, destination, vehicleId, driverId,
      cargoWeightKg: cargo,
      plannedDistance: distance,
    });
    res.status(201).json(trip);
  } catch (e) { next(e); }
}

export async function dispatchHandler(req: Request, res: Response, next: NextFunction) {
  try { res.json(await tripsService.dispatchTrip(req.params.id)); } catch (e) { next(e); }
}

export async function completeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { finalOdometer, fuelConsumedL, revenue, fuelCost } = req.body;
    if (finalOdometer === undefined || fuelConsumedL === undefined || revenue === undefined) {
      res.status(422).json({ error: 'VALIDATION_FAILED', message: 'finalOdometer, fuelConsumedL, revenue are required' });
      return;
    }
    res.json(await tripsService.completeTrip(req.params.id, {
      finalOdometer: Number(finalOdometer),
      fuelConsumedL: Number(fuelConsumedL),
      revenue: Number(revenue),
      fuelCost: fuelCost !== undefined ? Number(fuelCost) : undefined,
    }));
  } catch (e) { next(e); }
}

export async function cancelHandler(req: Request, res: Response, next: NextFunction) {
  try { res.json(await tripsService.cancelTrip(req.params.id)); } catch (e) { next(e); }
}
