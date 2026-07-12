// ============================================================================
// app.ts — FROZEN after Hour 0
// Express app: CORS, JSON, routes, error handler.
// BA scaffolds module routers here; after that nobody touches this file.
// ============================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from './middleware/error';

// Module routers
import { authRouter } from './modules/auth/auth.routes';
import { vehiclesRouter } from './modules/vehicles/vehicles.routes';
import { driversRouter } from './modules/drivers/drivers.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { tripsRouter } from './modules/trips/trips.routes';
import { maintenanceRouter } from './modules/maintenance/maintenance.routes';
import { fuelExpenseRouter } from './modules/fuel-expense/fuel-expense.routes';
import { reportsRouter } from './modules/reports/reports.routes';

const app = express();

// ---- Middleware ----
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(compression());
app.use(express.json());

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Routes ----
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api', fuelExpenseRouter);      // /fuel and /expenses live under /api
app.use('/api/reports', reportsRouter);

// ---- Error handler (must be last) ----
app.use(errorHandler);

export default app;
