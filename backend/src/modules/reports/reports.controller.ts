// ============================================================================
// modules/reports/reports.controller.ts  — BB owns
// ============================================================================
import { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service';
import { getCached, setCache } from '../../lib/cache';

export async function reportsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = 'reports_data';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const data = await reportsService.getReports();
    setCache(cacheKey, data, 60);
    res.json(data);
  } catch (e) { next(e); }
}

export async function csvExportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-trips.csv"');
    await reportsService.streamCsvData(res);
  } catch (e) { next(e); }
}
