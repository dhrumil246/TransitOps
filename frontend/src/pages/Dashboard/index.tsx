import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

export default function Dashboard() {
  const [showAlert, setShowAlert] = useState(true);

  const { data: kpis } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api<any>('/dashboard/kpis')
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => api<any[]>('/maintenance')
  });

  const vAvailable = kpis?.vehicleStatusBreakdown?.AVAILABLE || 0;
  const vOnTrip = kpis?.vehicleStatusBreakdown?.ON_TRIP || 0;
  const vInShop = kpis?.vehicleStatusBreakdown?.IN_SHOP || 0;
  const vRetired = kpis?.vehicleStatusBreakdown?.RETIRED || 0;
  const totalVehicles = vAvailable + vOnTrip + vInShop + vRetired;
  const activeVehicles = kpis?.activeVehicles || (vAvailable + vOnTrip);
  const utilization = kpis?.fleetUtilizationPct || (totalVehicles ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : '0.0');

  const activeTrips = kpis?.activeTrips || 0;
  const driversOnDuty = kpis?.driversOnDuty || 0;


  return (
    <>
      {/* Alert Banner */}
      {showAlert && (
      <div className="alert-banner alert-amber">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-amber-700" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span><strong>3 driver licenses expire within 7 days.</strong> Review compliance before next dispatch.</span>
        <a href="/drivers" className="alert-link">Review <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        <button onClick={() => setShowAlert(false)} aria-label="Close alert" className="ml-auto flex items-center justify-center w-6 h-6 rounded-md text-amber-700 bg-transparent border-none cursor-pointer hover:bg-amber-700/10 transition-colors">✕</button>
      </div>
      )}

      {/* Dashboard Filters */}
      <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2">
          <select aria-label="Filter by depot" className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium cursor-pointer transition-colors">
            <option>All Depots</option>
            <option>North Depot</option>
            <option>South Depot</option>
          </select>
          <select aria-label="Filter by vehicle type" className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium cursor-pointer transition-colors">
            <option>All Vehicle Types</option>
            <option>Bus</option>
            <option>Van</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Date Range</span>
          <select aria-label="Filter by date range" className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium cursor-pointer transition-colors">
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="flex justify-between items-start">
            <div>
              <div className="kpi-label">Fleet Utilization</div>
              <div className="kpi-value">{utilization}<span className="text-base text-slate-400 font-semibold">%</span></div>
            </div>
            <svg aria-hidden="true" width="80" height="36" viewBox="0 0 80 36"><path d="M0,32 L12,26 L24,28 L36,18 L48,20 L60,10 L72,6 L80,2" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M0,32 L12,26 L24,28 L36,18 L48,20 L60,10 L72,6 L80,2 L80,36 L0,36 Z" fill="url(#sparkGrad)" opacity="0.12"/><defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f766e"/><stop offset="100%" stopColor="#0f766e" stopOpacity="0"/></linearGradient></defs></svg>
          </div>
          <div className="kpi-trend">
            <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold bg-emerald-100 px-2 py-0.5 rounded font-mono">
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>+2.1%
            </span>
            <span className="kpi-trend mt-0">vs last week</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Vehicles</div>
          <div className="kpi-value">{activeVehicles}<span className="text-sm text-slate-400 font-medium font-sans ml-1">/ {totalVehicles}</span></div>
          <div className="mt-3.5 h-[3px] bg-slate-100 rounded-sm overflow-hidden"><div style={{width:`${utilization}%`}} className="h-full bg-emerald-600 rounded-sm"></div></div>
          <div className="mt-1.5 text-[11px] text-slate-400 font-medium">{utilization}% of fleet active</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Trips</div>
          <div className="kpi-value">{activeTrips}</div>
          <div className="mt-3.5 flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>{Math.floor(activeTrips/3) || 1} new today
            </span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Drivers On Duty</div>
          <div className="kpi-value">{driversOnDuty}</div>
          <div className="mt-3.5 text-[11px] text-slate-400 font-medium">of active drivers assigned</div>
        </div>
      </div>

      <div className="main-grid">
        <div className="chart-card" role="region" aria-label="Fleet Activity Chart">
          <div className="chart-header">
            <div>
              <div className="card-title">Fleet Activity</div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Distance covered vs. fuel consumed — last 7 days</div>
            </div>
            <div className="chart-tabs">
              <button className="chart-tab">Week</button>
              <button className="chart-tab active">Month</button>
              <button className="chart-tab">Year</button>
            </div>
          </div>
          
          <div className="w-full h-[240px] mt-5">
            <ResponsiveContainer>
              <AreaChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="distance" name="Distance (km)" stroke="#0f766e" strokeWidth={2} fillOpacity={1} fill="url(#colorDistance)" />
                <Area type="monotone" dataKey="fuel" name="Fuel (L)" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorFuel)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="side-panel">
          <div className="side-card" role="region" aria-label="Fleet Status Breakdown">
            <div className="card-title mb-4">Fleet Status</div>
            <div className="donut-wrap relative h-40 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Available', value: vAvailable, color: '#059669' },
                      { name: 'On Trip', value: vOnTrip, color: '#d97706' },
                      { name: 'In Shop', value: vInShop, color: '#dc2626' },
                      { name: 'Retired', value: vRetired, color: '#94a3b8' }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {
                      [
                        { name: 'Available', value: vAvailable, color: '#059669' },
                        { name: 'On Trip', value: vOnTrip, color: '#d97706' },
                        { name: 'In Shop', value: vInShop, color: '#dc2626' },
                        { name: 'Retired', value: vRetired, color: '#94a3b8' }
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    }
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '13px' }}
                    itemStyle={{ fontWeight: '600' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                <span className="text-[28px] font-extrabold text-slate-900 font-mono leading-none">{totalVehicles}</span>
                <span className="text-[11px] font-semibold text-slate-400 font-sans mt-0.5">Vehicles</span>
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-row"><div className="legend-left"><div className="legend-dot bg-emerald-600"></div><span className="legend-label">Available</span></div><span className="legend-val">{vAvailable}</span></div>
              <div className="legend-row"><div className="legend-left"><div className="legend-dot bg-amber-600"></div><span className="legend-label">On Trip</span></div><span className="legend-val">{vOnTrip}</span></div>
              <div className="legend-row"><div className="legend-left"><div className="legend-dot bg-red-600"></div><span className="legend-label">In Shop</span></div><span className="legend-val">{vInShop}</span></div>
              <div className="legend-row"><div className="legend-left"><div className="legend-dot bg-slate-400"></div><span className="legend-label">Retired</span></div><span className="legend-val">{vRetired}</span></div>
            </div>
          </div>
          <div className="side-card">
            <div className="card-title mb-3.5">Upcoming Maintenance</div>
            {maintenance.slice(0,2).map((m:any) => (
              <div className="maint-item" key={m.id}>
                <div className="maint-icon bg-amber-100"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-amber-600" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
                <div className="flex-1 min-w-0"><div className="maint-name">{m.serviceType} — {m.vehicleRegNo}</div><div className="maint-meta">Due soon</div></div>
                <span className="maint-badge bg-amber-100 text-amber-700 border border-amber-200">Soon</span>
              </div>
            ))}
            {maintenance.length === 0 && <div className="text-xs text-slate-500">No upcoming maintenance.</div>}
          </div>
        </div>
      </div>
    </>
  );
}
