# Backend Performance Baseline

*Measurements taken via `autocannon -c 20 -d 10` on branch `be/perf` before any optimizations.*

## 1. Load Test Results

| Endpoint | Req/Sec (Avg) | Latency p50 | Latency p95 / p99 |
|----------|---------------|-------------|-------------------|
| `GET /api/dashboard/kpis` | 7.8 req/s | 1863 ms | 5280 ms / 6051 ms |
| `GET /api/reports` | 18.1 req/s | 926 ms | 1567 ms / 4436 ms |
| `GET /api/trips` | 25 req/s | 652 ms | 1540 ms / 3601 ms |
| `GET /api/vehicles` | 79.7 req/s | 219 ms | 382 ms / 429 ms |

## 2. Identified Hotspots (In Priority Order)

1. **Dashboard KPIs (`/dashboard/kpis`)**: Horrendous latency (~1.8s p50). Likely performing N+1 queries by fetching every vehicle/trip/driver and aggregating in JS, or running heavy queries sequentially without `Promise.all`.
2. **Reports (`/reports`)**: Nearly 1s latency on average. Similar N+1 issues and lack of proper SQL aggregation (e.g. fetching all logs to calculate totals).
3. **Trips List (`/trips`)**: Moderate latency (650ms), probably lacking indexes on relation fields or status filtering, doing full table scans.
4. **Vehicles List (`/vehicles`)**: Fastest of the bunch but still has room for improvement with basic query optimization and DB connection pooling.

## 3. General Architecture Hotspots
- **Prisma Client Instantiation**: High likelihood that a new `PrismaClient` is being created repeatedly or we lack proper connection pooling parameters in the connection string (`?pgbouncer=true&connection_limit=X`), starving the serverless DB of connections.
- **Missing Database Indexes**: Postgres does not auto-index foreign keys (`vehicleId`, `driverId`), nor do we have indexes on heavily filtered columns like `status` across tables.

These hotspots will be addressed in the subsequent execution phases.
