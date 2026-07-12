// ============================================================================
// modules/dashboard/dashboard.controller.ts  — BA owns
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';
import { getCached, setCache } from '../../lib/cache';

export async function kpisHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, status, region } = req.query as Record<string, string>;
    const cacheKey = `kpis:${type || ''}:${status || ''}:${region || ''}`;
    
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const kpis = await dashboardService.getKpis({ type, status, region });
    setCache(cacheKey, kpis, 60);
    res.json(kpis);
  } catch (err) { next(err); }
}
