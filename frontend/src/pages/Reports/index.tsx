import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../lib/api';

// ── Synthetic multi-period data ─────────────────────────────────────────────
const REVENUE_TREND = [
  { month: 'Feb', revenue: 28400, cost: 12800, profit: 15600 },
  { month: 'Mar', revenue: 34100, cost: 15200, profit: 18900 },
  { month: 'Apr', revenue: 29800, cost: 13600, profit: 16200 },
  { month: 'May', revenue: 41200, cost: 17400, profit: 23800 },
  { month: 'Jun', revenue: 38600, cost: 16100, profit: 22500 },
  { month: 'Jul', revenue: 46800, cost: 18200, profit: 28600 },
];

const FLEET_ACTIVITY = [
  { day: 'Mon', trips: 8,  km: 610,  fuel: 182 },
  { day: 'Tue', trips: 12, km: 880,  fuel: 264 },
  { day: 'Wed', trips: 10, km: 740,  fuel: 222 },
  { day: 'Thu', trips: 15, km: 1120, fuel: 336 },
  { day: 'Fri', trips: 18, km: 1380, fuel: 414 },
  { day: 'Sat', trips: 9,  km: 670,  fuel: 201 },
  { day: 'Sun', trips: 6,  km: 440,  fuel: 132 },
];

const COST_BREAKDOWN = [
  { name: 'Fuel',        value: 32400, color: '#2563eb' },
  { name: 'Maintenance', value: 18200, color: '#d97706' },
  { name: 'Tolls',       value: 5600,  color: '#0891b2' },
  { name: 'Misc',        value: 3800,  color: '#94a3b8' },
];

const DRIVER_PERFORMANCE = [
  { driver: 'Alex J.',   score: 91, trips: 146, km: 8420  },
  { driver: 'Priya N.',  score: 78, trips: 214, km: 12100 },
  { driver: 'Parag P.',  score: 62, trips: 98,  km: 5600  },
  { driver: 'Suresh R.', score: 95, trips: 311, km: 17800 },
];

const VEHICLE_ROI = [
  { vehicle: 'Truck-01', roi: 84, trips: 42, km: 8200  },
  { vehicle: 'Truck-11', roi: 71, trips: 38, km: 7100  },
  { vehicle: 'Van-03',   roi: 66, trips: 61, km: 4900  },
  { vehicle: 'Van-05',   roi: 58, trips: 29, km: 2600  },
  { vehicle: 'Mini-05',  roi: 43, trips: 22, km: 1800  },
];

const ROUTE_EFFICIENCY = [
  { route: 'Gandhinagar→Ahmedabad',  trips: 18, avgKm: 45, avgFuel: 14 },
  { route: 'Port→North Depot',       trips: 12, avgKm: 82, avgFuel: 28 },
  { route: 'Kadi Hub→Mehsana',       trips: 9,  avgKm: 32, avgFuel: 10 },
  { route: 'Vatva→Sanand',           trips: 14, avgKm: 28, avgFuel: 9  },
  { route: 'Manasa→Kalol',           trips: 7,  avgKm: 60, avgFuel: 20 },
];

const RADAR_DATA = [
  { metric: 'Utilization', A: 82, B: 65 },
  { metric: 'Fuel Eff.',   A: 74, B: 58 },
  { metric: 'Safety',      A: 88, B: 70 },
  { metric: 'On-Time',     A: 79, B: 72 },
  { metric: 'Revenue',     A: 91, B: 67 },
  { metric: 'Cost Ctrl',   A: 68, B: 80 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const FMT_INR = (n: number) => '₹' + n.toLocaleString('en-IN');

const TOOLTIP_STYLE = {
  borderRadius: 7,
  border: '1px solid var(--border)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
};

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx-primary)', letterSpacing: '-0.02em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: 'var(--tx-muted)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--tx-primary)', fontFamily: 'var(--mono)' }}>{value}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Reports() {
  const [revenueTab, setRevenueTab] = useState<'revenue' | 'profit'>('revenue');
  const [activityTab, setActivityTab] = useState<'trips' | 'km' | 'fuel'>('trips');

  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api<any>('/reports'),
  });

  const fleetUtilizationPct  = data?.fleetUtilizationPct  || 50;
  const fuelEfficiencyKmPerL = data?.fuelEfficiencyKmPerL || 10.4;
  const operationalCost      = data?.operationalCost      || 40100;
  const topRoi               = data?.roiByVehicle?.[0]    || null;
  const topRoiRegNo          = topRoi?.regNo || 'TRUCK-11';
  const topRoiPct            = topRoi ? Math.round(topRoi.roi * 100) : 84;

  const totalRevenue  = REVENUE_TREND.reduce((s, d) => s + d.revenue, 0);
  const totalProfit   = REVENUE_TREND.reduce((s, d) => s + d.profit, 0);
  const avgTripsPerDay = Math.round(FLEET_ACTIVITY.reduce((s, d) => s + d.trips, 0) / 7);
  const totalKmThisWeek = FLEET_ACTIVITY.reduce((s, d) => s + d.km, 0);

  return (
    <>
      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Fleet Utilization</div>
          <div className="kpi-value">
            {fleetUtilizationPct}
            <span style={{ fontSize: 15, color: 'var(--tx-muted)', fontWeight: 600, fontFamily: 'var(--sans)' }}>%</span>
          </div>
          <div style={{ margin: '10px 0 6px', height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${fleetUtilizationPct}%`, height: '100%', background: 'var(--brand)', borderRadius: 2, transition: 'width 0.5s' }} />
          </div>
          <div className="kpi-trend trend-up" style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>+2.1% vs last week</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fuel Efficiency</div>
          <div className="kpi-value">
            {fuelEfficiencyKmPerL.toFixed(1)}
            <span style={{ fontSize: 13, color: 'var(--tx-muted)', fontWeight: 600, fontFamily: 'var(--sans)', marginLeft: 3 }}>km/L</span>
          </div>
          <div className="kpi-trend">Fleet average · this period</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Period Revenue</div>
          <div className="kpi-value" style={{ color: 'var(--status-green)' }}>
            ₹{(totalRevenue / 1000).toFixed(0)}K
          </div>
          <div className="kpi-trend trend-up" style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>
            ₹{(totalProfit / 1000).toFixed(0)}K profit
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Operational Cost</div>
          <div className="kpi-value" style={{ color: 'var(--status-red)' }}>
            ₹{(operationalCost / 1000).toFixed(1)}K
          </div>
          <div className="kpi-trend">Fuel + Maintenance + Misc</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg. Daily Trips</div>
          <div className="kpi-value">{avgTripsPerDay}</div>
          <div className="kpi-trend">{totalKmThisWeek.toLocaleString()} km this week</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Top Vehicle ROI</div>
          <div className="kpi-value" style={{ color: 'var(--status-green)' }}>
            {topRoiPct}
            <span style={{ fontSize: 15, color: 'var(--tx-muted)', fontWeight: 600, fontFamily: 'var(--sans)' }}>%</span>
          </div>
          <div className="kpi-trend" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{topRoiRegNo}</div>
        </div>
      </div>

      {/* ── Row 1: Revenue Trend + Cost Breakdown ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue & Profit Trend */}
        <div className="card">
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <div className="card-title">Revenue &amp; Profit Trend</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>Last 6 months · INR</div>
            </div>
            <div className="chart-tabs">
              {(['revenue', 'profit'] as const).map(t => (
                <button key={t} className={`chart-tab${revenueTab === t ? ' active' : ''}`} onClick={() => setRevenueTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <StatChip label="Total Revenue" value={`₹${(totalRevenue / 1000).toFixed(0)}K`} color="var(--brand)" />
              <StatChip label="Total Cost" value={`₹${REVENUE_TREND.reduce((s, d) => s + d.cost, 0) / 1000 | 0}K`} color="var(--status-red)" />
              <StatChip label="Net Profit" value={`₹${(totalProfit / 1000).toFixed(0)}K`} color="var(--status-green)" />
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={REVENUE_TREND} margin={{ top: 5, right: 0, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#059669" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${v / 1000 | 0}K`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => FMT_INR(v)} />
                  {revenueTab === 'revenue' ? (
                    <>
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} fill="url(#gRev)" />
                      <Area type="monotone" dataKey="cost"    name="Cost"    stroke="#dc2626" strokeWidth={2} fill="url(#gCost)" strokeDasharray="4 2" />
                    </>
                  ) : (
                    <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#059669" strokeWidth={2.5} fill="url(#gProfit)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Donut */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Cost Breakdown</div>
          </div>
          <div className="card-body">
            <div style={{ height: 180, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={COST_BREAKDOWN} cx="50%" cy="50%" innerRadius={52} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                    {COST_BREAKDOWN.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => FMT_INR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--tx-primary)', fontFamily: 'var(--mono)' }}>
                  ₹{((COST_BREAKDOWN.reduce((s, d) => s + d.value, 0) / 1000) | 0)}K
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--tx-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>total</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
              {COST_BREAKDOWN.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--tx-secondary)', fontWeight: 500 }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-primary)', fontFamily: 'var(--mono)' }}>
                    {FMT_INR(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Fleet Activity + Vehicle ROI ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Fleet Activity Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <div className="card-title">Fleet Activity — This Week</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>Daily breakdown by metric</div>
            </div>
            <div className="chart-tabs">
              {(['trips', 'km', 'fuel'] as const).map(t => (
                <button key={t} className={`chart-tab${activityTab === t ? ' active' : ''}`} onClick={() => setActivityTab(t)}>
                  {t === 'km' ? 'Distance' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <StatChip label="Total Trips" value={FLEET_ACTIVITY.reduce((s, d) => s + d.trips, 0)} />
              <StatChip label="Total KM" value={`${totalKmThisWeek.toLocaleString()}`} />
              <StatChip label="Fuel (L)" value={FLEET_ACTIVITY.reduce((s, d) => s + d.fuel, 0)} />
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={FLEET_ACTIVITY} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={28} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar
                    dataKey={activityTab}
                    name={activityTab === 'trips' ? 'Trips' : activityTab === 'km' ? 'Distance (km)' : 'Fuel (L)'}
                    fill={activityTab === 'trips' ? '#2563eb' : activityTab === 'km' ? '#0891b2' : '#d97706'}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Vehicle ROI Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Vehicle ROI Ranking</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>Return on investment by unit</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={VEHICLE_ROI} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <YAxis type="category" dataKey="vehicle" axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fill: '#475569', fontWeight: 600, fontFamily: 'var(--mono)' }} width={64} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="roi" name="ROI" radius={[0, 4, 4, 0]}
                    fill="#2563eb"
                    label={{ position: 'right', fontSize: 10, fill: '#64748b', fontWeight: 700, fontFamily: 'var(--mono)', formatter: (v: number) => `${v}%` }}
                  >
                    {VEHICLE_ROI.map((d, i) => (
                      <Cell key={i} fill={d.roi >= 75 ? '#059669' : d.roi >= 55 ? '#2563eb' : '#d97706'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Driver Performance Table + Fleet Radar ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Driver Performance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Driver Performance</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>Safety score, trip count &amp; total distance</div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Safety Score</th>
                <th>Trips</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {DRIVER_PERFORMANCE.sort((a, b) => b.score - a.score).map(d => {
                const color = d.score >= 85 ? 'var(--status-green)' : d.score >= 70 ? 'var(--status-amber)' : 'var(--status-red)';
                return (
                  <tr key={d.driver}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--brand-bg)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                          {d.driver.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-primary)' }}>{d.driver}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${d.score}%`, height: '100%', background: color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--mono)' }}>{d.score}%</span>
                      </div>
                    </td>
                    <td><span className="mono-id">{d.trips}</span></td>
                    <td><span className="mono-id" style={{ fontSize: 12 }}>{d.km.toLocaleString()} km</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Fleet Radar */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Fleet Health Radar</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>Current period vs previous period</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 3, background: '#2563eb', borderRadius: 2 }} />
                <span style={{ fontSize: 11, color: 'var(--tx-secondary)', fontWeight: 500 }}>Current</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 3, background: '#94a3b8', borderRadius: 2 }} />
                <span style={{ fontSize: 11, color: 'var(--tx-secondary)', fontWeight: 500 }}>Previous</span>
              </div>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10.5, fill: '#64748b', fontWeight: 600 }} />
                  <Radar dataKey="A" name="Current" stroke="#2563eb" fill="#2563eb" fillOpacity={0.12} strokeWidth={2} />
                  <Radar dataKey="B" name="Previous" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${v}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Route Efficiency ──────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Route Efficiency</div>
            <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>Top routes by trip count · avg distance &amp; fuel consumption</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Trips</th>
              <th>Avg Distance</th>
              <th>Avg Fuel</th>
              <th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {ROUTE_EFFICIENCY.sort((a, b) => b.trips - a.trips).map(r => {
              const kmPerL = (r.avgKm / r.avgFuel).toFixed(1);
              const effScore = Math.min(100, Math.round((r.avgKm / r.avgFuel) * 6));
              const effColor = effScore >= 70 ? 'var(--status-green)' : effScore >= 50 ? 'var(--status-amber)' : 'var(--status-red)';
              return (
                <tr key={r.route}>
                  <td style={{ fontWeight: 600, color: 'var(--tx-primary)', fontSize: 12.5 }}>{r.route}</td>
                  <td><span className="mono-id">{r.trips}</span></td>
                  <td><span className="mono-id" style={{ fontSize: 12 }}>{r.avgKm} km</span></td>
                  <td><span className="mono-id" style={{ fontSize: 12 }}>{r.avgFuel} L</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 72, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${effScore}%`, height: '100%', background: effColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: effColor, fontFamily: 'var(--mono)', minWidth: 40 }}>{kmPerL} km/L</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
