// ============================================================================
// modules/trips/trips.routes.ts  — BB owns
// ============================================================================

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  listHandler,
  getOneHandler,
  dispatchOptionsHandler,
  createHandler,
  dispatchHandler,
  completeHandler,
  cancelHandler,
} from './trips.controller';

export const tripsRouter = Router();

tripsRouter.use(requireAuth);

// GET  /api/trips
tripsRouter.get('/', listHandler);

// GET  /api/trips/dispatch-options  ← must be before /:id to avoid conflict
tripsRouter.get('/dispatch-options', dispatchOptionsHandler);

// GET  /api/trips/:id
tripsRouter.get('/:id', getOneHandler);

// POST /api/trips
tripsRouter.post('/', createHandler);

// POST /api/trips/:id/dispatch
tripsRouter.post('/:id/dispatch', dispatchHandler);

// POST /api/trips/:id/complete
tripsRouter.post('/:id/complete', completeHandler);

// POST /api/trips/:id/cancel
tripsRouter.post('/:id/cancel', cancelHandler);
