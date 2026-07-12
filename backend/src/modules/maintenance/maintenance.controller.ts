// ============================================================================
// modules/maintenance/maintenance.controller.ts  — BB owns
// ============================================================================
import { Request, Response, NextFunction } from 'express';
import * as maintenanceService from './maintenance.service';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try { res.json(await maintenanceService.listMaintenance(req.query.vehicleId as string | undefined)); } catch (e) { next(e); }
}

export async function openHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicleId, type, cost, notes } = req.body;
    if (!vehicleId || !type || cost === undefined) {
      res.status(422).json({ error: 'VALIDATION_FAILED', message: 'vehicleId, type, cost are required' });
      return;
    }
    const log = await maintenanceService.openMaintenance({ vehicleId, type, cost: Number(cost), notes });
    res.status(201).json(log);
  } catch (e) { next(e); }
}

export async function closeHandler(req: Request, res: Response, next: NextFunction) {
  try { res.json(await maintenanceService.closeMaintenance(req.params.id)); } catch (e) { next(e); }
}
