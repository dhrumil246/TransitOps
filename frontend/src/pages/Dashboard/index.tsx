import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../../lib/api';

const activityData = [
  { name: 'Mon', distance: 150, fuel: 45 },
  { name: 'Tue', distance: 230, fuel: 68 },
  { name: 'Wed', distance: 310, fuel: 92 },
  { name: 'Thu', distance: 210, fuel: 63 },
  { name: 'Fri', distance: 350, fuel: 105 },
  { name: 'Sat', distance: 280, fuel: 84 },
  { name: 'Sun', distance: 390, fuel: 115 },
  { name: 'Mon', distance: 340, fuel: 100 },
];

const FLEET_COLORS = {
  AVAILABLE: '#059669',
  ON_TRIP:   '#d97706',
  IN_SHOP:   '#dc2626',
  RETIRED:   '#94a3b8',
};

export default function Dashboard() {
  const [showAlert, setShowAlert] = useState(true);
  const [activeTab, setActiveTab] = useState<'Week' | 'Month' | 'Year'>('Month');

  const { data: kpis } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api<any>('/dashboard/kpis'),
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => api<any[]>('/maintenance'),
  });

  const vAvailable = kpis?.vehicleStatusBreakdown?.AVAILABLE || 0;
  const vOnTrip    = kpis?.vehicleStatusBreakdown?.ON_TRIP   || 0;
  const vInShop    = kpis?.vehicleStatusBreakdown?.IN_SHOP   || 0;
  const vRetired   = kpis?.vehicleStatusBreakdown?.RETIRED   || 0;
  const totalVehicles  = vAvailable + vOnTrip + vInShop + vRetired;
  const activeVehicles = kpis?.activeVehicles || (vAvailable + vOnTrip);
  const utilization    = kpis?.fleetUtilizationPct || (totalVehicles ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : '0.0');
  const activeTrips    = kpis?.activeTrips    || 0;
  const driversOnDuty  = kpis?.driversOnDuty  || 0;

  const fleetData = [
    { name: 'Available', value: vAvailable, color: FLEET_COLORS.AVAILABLE },
    { name: 'On Trip',   value: vOnTrip,    color: FLEET_COLORS.ON_TRIP },
    { name: 'In Shop',   value: vInShop,    color: FLEET_COLORS.IN_SHOP },
    { name: 'Retired',   value: vRetired,   color: FLEET_COLORS.RETIRED },
  ].filter(d => d.value > 0);

  return (
    <>
      {/* Alert Banner */}
      {showAlert && (
        <div className="alert-banner alert-amber" role="alert">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span><strong>3 driver licenses expire within 7 days.</strong> Review compliance before next dispatch.</span>
          <a href="/drivers" className="alert-link">
            Review
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <button
            onClick={() => setShowAlert(false)}
            aria-label="Dismiss alert"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 14, flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <select aria-label="Filter by depot" className="filter-chip" style={{ appearance: 'none', paddingRight: 24, cursor: 'pointer' }}>
          <option>All Depots</option>
          <option>North Depot</option>
          <option>South Depot</option>
        </select>
        <select aria-label="Filter by vehicle type" className="filter-chip" style={{ appearance: 'none', paddingRight: 24, cursor: 'pointer' }}>
          <option>All Vehicle Types</option>
          <option>Bus</option>
          <option>Van</option>
        </select>
        <div className="filter-spacer" />
        <span style={{ fontSize: 10, color: 'var(--tx-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date Range</span>
        <select aria-label="Filter by date range" className="filter-chip" style={{ appearance: 'none', paddingRight: 24, cursor: 'pointer' }}>
          <option>Today</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {/* Fleet Utilization */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kpi-label">Fleet Utilization</div>
              <div className="kpi-value">
                {utilization}
                <span style={{ fontSize: 16, color: 'var(--tx-muted)', fontWeight: 600, fontFamily: 'var(--sans)' }}>%</span>
              </div>
            </div>
            <svg aria-hidden="true" width="80" height="36" viewBox="0 0 80 36">
              <path d="M0,32 L12,26 L24,28 L36,18 L48,20 L60,10 L72,6 L80,2" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M0,32 L12,26 L24,28 L36,18 L48,20 L60,10 L72,6 L80,2 L80,36 L0,36 Z" fill="#2563eb" opacity="0.08"/>
            </svg>
          </div>
          <div className="kpi-trend">
            <span className="trend-up" style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 11 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
              +2.1%
            </span>
            vs last week
          </div>
        </div>

        {/* Active Vehicles */}
        <div className="kpi-card">
          <div className="kpi-label">Active Vehicles</div>
          <div className="kpi-value">
            {activeVehicles}
            <span style={{ fontSize: 14, color: 'var(--tx-muted)', fontWeight: 500, fontFamily: 'var(--sans)', marginLeft: 4 }}>/ {totalVehicles}</span>
          </div>
          <div style={{ marginTop: 14, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${utilization}%`, height: '100%', background: 'var(--status-green)', borderRadius: 2 }} />
          </div>
          <div className="kpi-trend" style={{ marginTop: 6 }}>{utilization}% of fleet active</div>
        </div>

        {/* Active Trips */}
        <div className="kpi-card">
          <div className="kpi-label">Active Trips</div>
          <div className="kpi-value">{activeTrips}</div>
          <div className="kpi-trend">
            <span className="trend-up" style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 11 }}>
              {Math.floor(activeTrips / 3) || 1} dispatched today
            </span>
          </div>
        </div>

        {/* Drivers On Duty */}
        <div className="kpi-card">
          <div className="kpi-label">Drivers On Duty</div>
          <div className="kpi-value">{driversOnDuty}</div>
          <div className="kpi-trend">of active drivers assigned</div>
        </div>
      </div>

      {/* Main Grid: Chart + Side Panel */}
      <div className="main-grid">
        {/* Area Chart */}
        <div className="chart-card" role="region" aria-label="Fleet Activity Chart">
          <div className="chart-header">
            <div>
              <div className="card-title">Fleet Activity</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 3, fontWeight: 500 }}>
                Distance vs fuel consumed — last 7 days
              </div>
            </div>
            <div className="chart-tabs">
              {(['Week', 'Month', 'Year'] as const).map(tab => (
                <button
                  key={tab}
                  className={`chart-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 240, marginTop: 16 }}>
            <ResponsiveContainer>
              <AreaChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDistance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 7, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }}
                  labelStyle={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="distance" name="Distance (km)" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#gradDistance)" />
                <Area type="monotone" dataKey="fuel"     name="Fuel (L)"       stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#gradFuel)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panel */}
        <div className="side-panel">
          {/* Fleet Status Donut */}
          <div className="side-card" role="region" aria-label="Fleet Status Breakdown">
            <div className="card-title" style={{ marginBottom: 16 }}>Fleet Status</div>
            <div style={{ position: 'relative', height: 160, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fleetData} cx="50%" cy="50%" innerRadius={55} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                    {fleetData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--tx-primary)', fontFamily: 'var(--mono)', lineHeight: 1 }}>{totalVehicles}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Total</span>
              </div>
            </div>
            <div className="donut-legend" style={{ marginTop: 12 }}>
              {[
                { label: 'Available', val: vAvailable, color: FLEET_COLORS.AVAILABLE },
                { label: 'On Trip',   val: vOnTrip,   color: FLEET_COLORS.ON_TRIP   },
                { label: 'In Shop',   val: vInShop,   color: FLEET_COLORS.IN_SHOP   },
                { label: 'Retired',   val: vRetired,  color: FLEET_COLORS.RETIRED   },
              ].map(r => (
                <div className="legend-row" key={r.label}>
                  <div className="legend-left">
                    <div className="legend-dot" style={{ background: r.color }} />
                    <span className="legend-label">{r.label}</span>
                  </div>
                  <span className="legend-val">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Maintenance */}
          <div className="side-card">
            <div className="card-title" style={{ marginBottom: 14 }}>Upcoming Maintenance</div>
            {maintenance.slice(0, 3).map((m: any) => (
              <div className="maint-item" key={m.id}>
                <div className="maint-icon" style={{ background: 'var(--status-amber-bg)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="maint-name">{m.serviceType} — {m.vehicleRegNo}</div>
                  <div className="maint-meta">Due soon</div>
                </div>
                <span className="maint-badge" style={{ background: 'var(--status-amber-bg)', color: 'var(--status-amber)', borderColor: 'var(--status-amber-bd)' }}>Soon</span>
              </div>
            ))}
            {maintenance.length === 0 && (
              <div className="empty-state" style={{ padding: '16px 0' }}>
                <div className="empty-state-body">No upcoming maintenance scheduled.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
