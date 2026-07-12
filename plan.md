# TransitOps — Master Plan & Implementation Guide

> **One file, whole project.** Context → stack → architecture → data model → API contract → the rule engine (with code) → RBAC → frontend design system → per-module implementation → team split → 8-hour timeline → demo script.
> **How to use it:** each of the four devs loads `AGENTS.md` into their agent, then works only the sections marked for their role (BA / BB / FA / FB). Everyone treats the schema and contract here as **frozen after Hour 0**.

---

## 1. Business context & goal

Logistics companies still run fleets on spreadsheets and paper logbooks, which causes scheduling clashes, idle vehicles, missed maintenance, expired-license dispatches, sloppy expense tracking, and zero operational visibility. **TransitOps** digitizes the whole lifecycle: vehicle registration, driver management, trip dispatch, maintenance, fuel/expense logging, and analytics — while *enforcing business rules* and *surfacing insights*.

Stripped down, this is a CRUD app around **one hard thing: the dispatch rule engine**. The rest — vehicles, drivers, fuel, expenses, dashboard, reports — is forms, tables, and aggregation. Judges will look at whether the **state machine** works: dispatching a trip flips vehicle + driver to `On Trip`, completing restores both, opening maintenance sends a vehicle to `In Shop` and removes it from the dispatch pool, and every validation fires. Build everything else to support that centerpiece.

## 2. Target users (the four roles)

| Role | What they do in the app |
|---|---|
| **Fleet Manager** | Oversees vehicles, maintenance, lifecycle, efficiency |
| **Driver** | Creates trips, assigns vehicle+driver, monitors active deliveries |
| **Safety Officer** | Tracks license validity, safety scores, compliance |
| **Financial Analyst** | Reviews expenses, fuel, maintenance cost, profitability |

RBAC controls what each role can see/do. Screen 8 renders the role × module matrix.

## 3. Tech stack & why

| Layer | Choice | Why for an 8-hour, 4-agent build |
|---|---|---|
| Backend | **Node + TypeScript + Express** | Fast to move, agents fluent, clean module folders |
| ORM/DB | **Prisma + Postgres (Neon/Supabase)** | One `schema.prisma` = the frozen contract; generated types shared with FE; cloud DB = zero local setup |
| Auth | **JWT** + bcrypt | Stateless, role travels in the token |
| Frontend | **React + TS + Vite** | Instant HMR, minimal config |
| Styling | **Tailwind + shadcn/ui** | Matches the dark mockup, gives the Table/Card/Button shell free |
| Data fetching | **TanStack Query** | Cache + refetch/invalidation → the "live board" updates itself when a status flips |
| Charts | **Recharts** | React-native, quick bar/line charts for Reports |
| Shared | **`packages/contract`** (TS types) | Both sides compile against identical shapes — the real conflict-killer |

## 4. Architecture

```
Browser (React SPA)
   │  fetch /api/*  (JWT in Authorization header)
   ▼
Express API  ──►  service layer (business rules)  ──►  Prisma  ──►  Postgres
```

- **Feature-folder modules**, one owner each. No layer-based folders.
- The **only true coupling point** is the vehicle/driver `status` column: BA writes it via CRUD, BB writes it via the rule engine — *different files, same column, agreed once, never reshaped*. That is why there are no merge conflicts.
- Frontend calls always go through one `api.ts` client; a mock layer lets the FE build fully before the backend is live.

## 5. Repository structure (monorepo)

```
transitops/
├─ package.json                # workspaces: backend, frontend, packages/*
├─ AGENTS.md                   # rules every agent loads (see separate file)
├─ packages/
│  └─ contract/
│     ├─ types.ts              # request/response interfaces (FROZEN after Hour 0)
│     └─ labels.ts             # enum → display label helpers  e.g. ON_TRIP → "On Trip"
├─ backend/
│  ├─ .env                     # DATABASE_URL, JWT_SECRET
│  ├─ prisma/
│  │  ├─ schema.prisma         # FROZEN
│  │  └─ seed.ts               # BA
│  └─ src/
│     ├─ lib/                  # prisma.ts, jwt.ts        (FROZEN after Hour 0)
│     ├─ middleware/           # auth.ts, error.ts        (FROZEN after Hour 0)
│     ├─ app.ts server.ts      # router mounting          (FROZEN after Hour 0)
│     └─ modules/
│        ├─ auth/ vehicles/ drivers/ dashboard/ settings/     ← BA
│        └─ trips/ maintenance/ fuel-expense/ reports/        ← BB
└─ frontend/
   └─ src/
      ├─ components/ui/        # Sidebar Topbar Table Card Button StatusPill Modal Field (FROZEN)
      ├─ lib/                  # api.ts (FROZEN) mocks.ts queryClient.ts theme.css
      └─ pages/
         ├─ Login/ Dashboard/ Vehicles/ Drivers/ Settings/    ← FA
         └─ Trips/ Maintenance/ FuelExpense/ Reports/          ← FB
```

Each backend module folder contains `*.routes.ts`, `*.controller.ts`, `*.service.ts`. Keep all business logic in the service.

## 6. Environment setup (Hour 0, whole team, ~30 min)

```bash
# 1. DB — create a Neon or Supabase Postgres, copy the connection string
echo 'DATABASE_URL="postgresql://..."'  >  backend/.env
echo 'JWT_SECRET="change-me"'          >> backend/.env

# 2. Schema + client
cd backend
npx prisma migrate dev --name init
npx prisma generate
npx tsx prisma/seed.ts        # loads the demo data below

# 3. Dev servers
npm run dev          # backend on :4000
cd ../frontend && npm run dev   # vite on :5173, proxy /api -> :4000
```

Frontend `.env`: `VITE_USE_MOCKS=true` (flip to `false` once real endpoints are live).

## 7. Data model

Full schema lives in `schema.prisma` (frozen). Entities and the fields that matter:

- **User** — email (unique), passwordHash, name, `role` enum.
- **Vehicle** — `regNo` (**unique**), name, `type` (VAN/TRUCK/MINI), `maxLoadKg`, `odometer`, `acquisitionCost`, `region?`, `status` (AVAILABLE/ON_TRIP/IN_SHOP/RETIRED).
- **Driver** — name, `licenseNo` (unique), `licenseCategory`, `licenseExpiry`, `contact`, `safetyScore`, `status` (AVAILABLE/ON_TRIP/OFF_DUTY/SUSPENDED).
- **Trip** — source, destination, vehicleId, driverId, `cargoWeightKg`, `plannedDistance`, `status` (DRAFT/DISPATCHED/COMPLETED/CANCELLED), `finalOdometer?`, `fuelConsumedL?`, `revenue?`, timestamps.
- **MaintenanceLog** — vehicleId, type, cost, `status` (OPEN/CLOSED). Vehicle is IN_SHOP while a log is OPEN.
- **FuelLog** — vehicleId, liters, cost, odometer?, date.
- **Expense** — vehicleId, `type` (TOLL/MAINTENANCE/OTHER), amount, date, description?.

**Design decisions to sanity-check with a judge:** Role is an enum + static permission map (fast, still demos RBAC); `revenue` sits on Trip because the ROI formula needs a revenue source and nothing else provided one.

## 8. API contract

Base `/api`. All protected routes require `Authorization: Bearer <token>`. Responses are exactly these shapes — FE never invents fields, BE never omits them.

| Method | Path | Owner | Purpose |
|---|---|---|---|
| POST | `/auth/register` | BA | Create user with a role |
| POST | `/auth/login` | BA | `{ token, user }` |
| GET | `/auth/me` | BA | Current user |
| GET/POST | `/vehicles` | BA | List (`type,status,region,search,sort`) / create (unique regNo → 409) |
| GET/PATCH/DELETE | `/vehicles/:id` | BA | Read / update / remove |
| GET/POST | `/drivers` | BA | List (`status,search,sort`) / create (unique licenseNo) |
| GET/PATCH/DELETE | `/drivers/:id` | BA | Read / update / remove |
| GET | `/dashboard/kpis` | BA | All KPI cards + breakdown + recent trips |
| GET | `/settings/permissions` | BA | Role × module matrix |
| GET | `/trips` | BB | Live board list |
| GET | `/trips/dispatch-options` | BB | Only assignable vehicles + drivers |
| POST | `/trips` | BB | Create Draft (runs validations) |
| POST | `/trips/:id/dispatch` | BB | Draft→Dispatched, both → ON_TRIP |
| POST | `/trips/:id/complete` | BB | Dispatched→Completed, both → AVAILABLE |
| POST | `/trips/:id/cancel` | BB | Dispatched→Cancelled, both → AVAILABLE |
| GET/POST | `/maintenance` | BB | List / create (vehicle → IN_SHOP) |
| POST | `/maintenance/:id/close` | BB | Close (vehicle → AVAILABLE unless RETIRED) |
| GET/POST | `/fuel` | BB | Fuel logs |
| GET/POST | `/expenses` | BB | Expenses |
| GET | `/operations/cost-summary` | BB | Per-vehicle Fuel + Maintenance totals |
| GET | `/reports` | BB | Efficiency, utilization, cost, ROI, chart data |
| GET | `/reports/export.csv` | BB | CSV download |

Non-obvious shapes:

```jsonc
// POST /auth/login  ->  200
{ "token": "jwt...", "user": { "id": "...", "name": "Riya", "role": "FLEET_MANAGER" } }

// GET /dashboard/kpis?type=VAN&status=AVAILABLE&region=North
{ "activeVehicles":5, "availableVehicles":2, "inMaintenance":1, "activeTrips":3,
  "pendingTrips":4, "driversOnDuty":3, "fleetUtilizationPct":87,
  "vehicleStatusBreakdown": { "AVAILABLE":2,"ON_TRIP":3,"IN_SHOP":1,"RETIRED":0 },
  "recentTrips": [ { "id":"TR001","vehicleRegNo":"VAN-05","driver":"Alex","status":"ON_TRIP","eta":"40 min" } ] }

// GET /trips/dispatch-options  (already excludes ineligible)
{ "vehicles":[{ "id":"..","regNo":"VAN-05","name":"Force Traveller","maxLoadKg":500 }],
  "drivers":[{ "id":"..","name":"Alex","licenseCategory":"LMV" }] }

// POST /trips  ->  422 on validation failure
{ "error":"VALIDATION_FAILED", "message":"Cargo Weight exceeds vehicle capacity (450 kg > 400 kg)" }

// POST /trips/:id/complete  (req)
{ "finalOdometer":64200, "fuelConsumedL":38.5, "revenue":12000 }

// GET /reports
{ "fuelEfficiencyKmPerL":8.4, "fleetUtilizationPct":87, "operationalCost":34090,
  "roiByVehicle":[{ "regNo":"VAN-05","roi":0.42 }],
  "monthlyRevenue":[{ "month":"Jan","value":12000 }],
  "topCostliestVehicles":[{ "regNo":"TRUCK-11","cost":18500 }] }
```

Validation `message` strings the FE displays verbatim in the red box (screen 4):
`Cargo Weight exceeds vehicle capacity (X kg > Y kg)` · `Driver license expired on <date>` · `Suspended drivers cannot be assigned` · `Vehicle is already On Trip` · `Driver is already On Trip` · `Retired or In-Shop vehicles cannot be dispatched`.

## 9. The rule engine (BB — the demo centerpiece)

Every status-changing action runs inside a single `prisma.$transaction` so a trip and its vehicle/driver never end up half-updated.

**Validation helpers** (`modules/trips/rules.ts`):
```ts
export class ValidationError extends Error { status = 422; }
const fail = (m: string) => { throw new ValidationError(m); };

export const assertVehicleAvailable = (v: Vehicle) =>
  v.status !== 'AVAILABLE' && fail('Retired or In-Shop vehicles cannot be dispatched');

export const assertDriverAssignable = (d: Driver) => {
  if (d.status === 'SUSPENDED') fail('Suspended drivers cannot be assigned');
  if (d.status !== 'AVAILABLE')  fail('Driver is already On Trip');
};

export const assertLicenseValid = (d: Driver) =>
  d.licenseExpiry <= new Date() && fail(`Driver license expired on ${d.licenseExpiry.toDateString()}`);

export const assertCargoWithinCapacity = (cargo: number, max: number) =>
  cargo > max && fail(`Cargo Weight exceeds vehicle capacity (${cargo} kg > ${max} kg)`);
```

**Dispatch** (`dispatch.service.ts`) — the pattern all transitions follow:
```ts
export const dispatchTrip = (id: string) => prisma.$transaction(async (tx) => {
  const trip = await tx.trip.findUniqueOrThrow({ where: { id }, include: { vehicle: true, driver: true } });
  if (trip.status !== 'DRAFT') fail('Only draft trips can be dispatched');
  assertVehicleAvailable(trip.vehicle);
  assertDriverAssignable(trip.driver);
  assertLicenseValid(trip.driver);
  assertCargoWithinCapacity(trip.cargoWeightKg, trip.vehicle.maxLoadKg);

  await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } });
  await tx.driver.update({  where: { id: trip.driverId  }, data: { status: 'ON_TRIP' } });
  return tx.trip.update({ where: { id }, data: { status: 'DISPATCHED', dispatchedAt: new Date() } });
});
```

**Complete** — restore both, write odometer, auto-log fuel:
```ts
export const completeTrip = (id: string, { finalOdometer, fuelConsumedL, revenue }) =>
  prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({ where: { id } });
    if (trip.status !== 'DISPATCHED') fail('Only dispatched trips can be completed');
    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE', odometer: finalOdometer } });
    await tx.driver.update({  where: { id: trip.driverId  }, data: { status: 'AVAILABLE' } });
    await tx.fuelLog.create({ data: { vehicleId: trip.vehicleId, liters: fuelConsumedL, cost: 0, odometer: finalOdometer } });
    return tx.trip.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date(), finalOdometer, fuelConsumedL, revenue } });
  });
```

**Cancel** — mirror of complete without the fuel log; both statuses → AVAILABLE.
**Maintenance open** — create `OPEN` log + set vehicle `IN_SHOP` (transaction). **Close** — set `CLOSED`; if vehicle not `RETIRED`, set `AVAILABLE`.

**Dispatch-options query** — the exclusion rules live here so the FE just renders the result:
```ts
const vehicles = await prisma.vehicle.findMany({ where: { status: 'AVAILABLE' } });
const drivers  = await prisma.driver.findMany({
  where: { status: 'AVAILABLE', licenseExpiry: { gt: new Date() } },
});
```

## 10. RBAC & permissions

- `login` embeds `{ userId, role }` in the JWT.
- `middleware/auth.ts`:
```ts
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Forbidden' });
```
- `GET /settings/permissions` returns a static matrix, e.g. Fleet Manager → all; Driver → Trips (edit) + read-only Dashboard; Safety Officer → Drivers (edit); Financial Analyst → Reports + Fuel/Expense. Screen 8 renders it.

## 11. Frontend design system (FA + FB, built once at Hour 0)

**Match the mockup — do not reinvent.** Tokens in `tailwind.config` + `theme.css`:

- Surfaces: canvas `#0F1115`, panel `#171A21`, border `#262A33`.
- Text: primary `#E6E8EC`, muted `#8A909B`.
- Primary action (orange buttons): `#E8862E`.
- Status pill colors (one shared `<StatusPill>`, used everywhere): AVAILABLE `#2FBF71` (green) · ON_TRIP/DISPATCHED `#3E7BFA` (blue) · IN_SHOP/OFF_DUTY `#E8A33D` (amber) · RETIRED/SUSPENDED `#E5484D` (red).
- Layout: fixed left sidebar (Dashboard, Fleet, Drivers, Trips, Maintenance, Fuel & Expenses, Analytics, Settings) + topbar with search + role badge; content is cards and dense tables with `tabular-nums`.
- Type: Inter throughout.

**The signature** is the status pill doing real work — it flips live when the rule engine changes a status. Keep everything else quiet so that cascade is what pops.

**API client + mock pattern** (`lib/api.ts`, frozen):
```ts
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (USE_MOCKS) return mockResolve<T>(path, opts);      // from lib/mocks.ts, shaped per contract
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...opts.headers },
  });
  if (!res.ok) throw await res.json();                    // { error, message } — surfaced in the UI
  return res.json();
}
```

**Live board via TanStack Query** — dispatch/complete/cancel invalidate `['trips']` and `['dispatch-options']`, so pills update themselves:
```ts
const dispatch = useMutation({
  mutationFn: (id: string) => api(`/trips/${id}/dispatch`, { method: 'POST' }),
  onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); qc.invalidateQueries({ queryKey: ['dispatch-options'] }); },
});
```

## 12. Screen-by-screen implementation

**FA (Pod 1):**
- **0 Login** — brand left, form right, role hint, orange Sign In, inline red error on 401. Store token, redirect by role, `<ProtectedRoute>`.
- **1 Dashboard** — 7 KPI cards + type/status/region filters + recent-trips table + status breakdown bar, all from `/dashboard/kpis`.
- **2 Vehicle Registry** — table (search/filter/sort), status pills, Add/Edit modal; show 409 duplicate-regNo error inline.
- **3 Drivers & Safety** — same table pattern; safety score + license expiry columns; status pills.
- **8 Settings & RBAC** — render the permission matrix from `/settings/permissions`.

**FB (Pod 2):**
- **4 Trip Dispatcher** — left: create-trip form (vehicle/driver dropdowns from `/trips/dispatch-options`, cargo, distance); right: live board. Red box shows the 422 `message` verbatim. Dispatch/complete/cancel buttons → invalidate queries → pills flip live.
- **5 Maintenance** — service-record list, "Send to Shop" action, the AVAILABLE⇄IN_SHOP state arrow; opening a log moves the vehicle to In Shop and out of the dispatcher dropdown.
- **6 Fuel & Expense** — fuel log table + expenses table + "Total Operational Cost = Fuel + Maintenance" footer from `/operations/cost-summary`.
- **7 Reports & Analytics** — KPI strip (efficiency, utilization, op cost, ROI) + monthly-revenue bar chart + top-costliest chart (Recharts) + working Download CSV.

## 13. Team split, ownership & conflict rules

| | Backend | Frontend |
|---|---|---|
| **Pod 1 (Identity & Assets)** | **BA:** auth, vehicles, drivers, dashboard, settings + seed.ts | **FA:** Login, Dashboard, Vehicles, Drivers, Settings |
| **Pod 2 (Ops & Financials)** | **BB:** trips (rule engine), maintenance, fuel-expense, reports | **FB:** Trips, Maintenance, FuelExpense, Reports |

Rules (full version in `AGENTS.md`): only edit files you own; frozen files (`schema.prisma`, `packages/contract`, `middleware`, `lib`, `components/ui`, `lib/api.ts`) change only via a heads-up + re-sync; contract-first always; FE uses mocks until an endpoint is live; one branch per person, PR at each checkpoint, resolve conflicts only in your own files; a task is done only when its acceptance check passes.

## 14. Eight-hour timeline

| Time | BA | BB | FA | FB | Gate |
|---|---|---|---|---|---|
| 0:00–0:30 | DB + schema + migrate + scaffold shell/middleware + seed | agree contract | build `components/ui` shell + api.ts + mocks | build shell | health 200, 8 tables, contract frozen |
| 0:30–1:45 | Auth + RBAC | trips schema + rule skeleton + `dispatch-options` | Login screen live | scaffold screens 4–7 on mocks | **1:45 login works, shell stable** |
| 1:45–3:30 | Vehicle + Driver CRUD | **full rule engine** | Vehicles + Drivers screens | **Trip Dispatcher** | **3:30 golden path cascades live (non-negotiable)** |
| 3:30–4:45 | Dashboard + Settings | Maintenance + Fuel/Expense | Dashboard + Settings | Maintenance + Fuel/Expense | **4:45 every screen on live data** |
| 4:45–5:45 | polish, search/sort | Reports + CSV | Pod-1 polish, responsive | Reports + charts + CSV | **5:45 all mandatory deliverables green** |
| 5:45–6:30 | rule-engine bug bash (BA+BB) | | joint visual/responsive pass (FA+FB) | | edge cases pass |
| 6:30–8:00 | bonus + hardening | bonus + hardening | bonus + hardening | bonus + hardening | **8:00 rehearsed, backup recorded** |

## 15. Seed data (reuse the mockup so the demo looks identical)

Password `demo1234` for all users. Users: `manager@` (FLEET_MANAGER), `driver@`, `safety@`, `finance@`.
Vehicles: `VAN-05` (VAN, 500 kg, AVAILABLE), `TRUCK-11` (TRUCK, 5000 kg, ON_TRIP), `MINI-03` (MINI, 750 kg, IN_SHOP), `VAN-09` (VAN, 500 kg, AVAILABLE).
Drivers: `Alex` (LMV, valid, AVAILABLE), `John` (HMV, valid, ON_TRIP), `Priya` (LMV, valid, AVAILABLE), `Suresh` (HMV, **SUSPENDED**).
Trips `TR001`–`TR006` across all statuses; a couple of fuel logs; one OPEN maintenance log on MINI-03.

## 16. Acceptance / test checklist

- [ ] Login rejects bad password (401), accepts seeded users, guards protected routes.
- [ ] Duplicate `regNo` → 409; duplicate `licenseNo` → 409.
- [ ] `dispatch-options` excludes IN_SHOP/RETIRED/ON_TRIP vehicles and SUSPENDED/expired/ON_TRIP drivers.
- [ ] Cargo > capacity → 422 with exact message; suspended driver → 422; expired license → 422; double-book → 422.
- [ ] Dispatch flips both to ON_TRIP; complete restores both + writes odometer + logs fuel; cancel restores both.
- [ ] Open maintenance → vehicle IN_SHOP and gone from dispatcher; close → AVAILABLE.
- [ ] Dashboard KPIs move when statuses change; Reports numbers reconcile; CSV downloads.
- [ ] Every screen has loading/empty/error states; responsive to mobile; dark theme consistent.

## 17. Golden demo script (the ~2-minute run that wins the round)

1. Log in as Fleet Manager → land on Dashboard (KPIs, filters).
2. Register **VAN-05** (500 kg) and driver **Alex** (valid license) → both show green AVAILABLE pills.
3. Trip Dispatcher: create a trip, cargo **450 kg** ≤ 500 → allowed. Try **600 kg** → red box: capacity exceeded. Try **Suresh** → not selectable (suspended).
4. Dispatch VAN-05 + Alex → both pills flip to blue **On Trip** live on the board.
5. Complete the trip (final odometer + fuel) → both flip back to green **Available**; Reports update.
6. Open an **Oil Change** maintenance log on VAN-05 → pill goes amber **In Shop**, vehicle disappears from the dispatcher dropdown. Close it → back to Available.
7. Close on Reports: fuel efficiency, fleet utilization, operational cost, ROI, charts, CSV export.

## 18. Bonus features (only after the 5:45 gate is green)

Dark mode (already in the mockup) · search/filter/sort everywhere · PDF export of reports · email/console reminder for licenses expiring < 30 days · vehicle document uploads · status-cascade micro-interactions.
