import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span><strong>3 driver licenses expire within 7 days.</strong> Review compliance before next dispatch.</span>
        <a href="/drivers" className="alert-link">Review <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        <button onClick={() => setShowAlert(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#b45309',marginLeft:'auto',padding:'0 4px',fontSize:16}}>✕</button>
      </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div className="kpi-label">Fleet Utilization</div>
              <div className="kpi-value">{utilization}<span style={{fontSize:16,color:'#94a3b8',fontWeight:600}}>%</span></div>
            </div>
            <svg width="80" height="36" viewBox="0 0 80 36"><path d="M0,32 L12,26 L24,28 L36,18 L48,20 L60,10 L72,6 L80,2" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M0,32 L12,26 L24,28 L36,18 L48,20 L60,10 L72,6 L80,2 L80,36 L0,36 Z" fill="url(#sparkGrad)" opacity="0.12"/><defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d9488"/><stop offset="100%" stopColor="#0d9488" stopOpacity="0"/></linearGradient></defs></svg>
          </div>
          <div className="kpi-trend">
            <span style={{display:'flex',alignItems:'center',gap:3,color:'#059669',fontSize:11,fontWeight:700,background:'#d1fae5',padding:'2px 7px',borderRadius:5,fontFamily:"'JetBrains Mono',monospace"}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>+2.1%
            </span>
            <span className="kpi-trend" style={{marginTop:0}}>vs last week</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Vehicles</div>
          <div className="kpi-value">{activeVehicles}<span style={{fontSize:14,color:'#94a3b8',fontWeight:500,fontFamily:"'Inter',sans-serif",marginLeft:4}}>/ {totalVehicles}</span></div>
          <div style={{marginTop:14,height:3,background:'#f1f5f9',borderRadius:2,overflow:'hidden'}}><div style={{width:`${utilization}%`,height:'100%',background:'#059669',borderRadius:2}}></div></div>
          <div style={{marginTop:6,fontSize:11,color:'#94a3b8',fontWeight:500}}>{utilization}% of fleet active</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Trips</div>
          <div className="kpi-value">{activeTrips}</div>
          <div style={{marginTop:14,display:'flex',alignItems:'center',gap:5}}>
            <span style={{display:'flex',alignItems:'center',gap:3,color:'#059669',fontSize:11,fontWeight:700}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>{Math.floor(activeTrips/3) || 1} new today
            </span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Drivers On Duty</div>
          <div className="kpi-value">{driversOnDuty}</div>
          <div style={{marginTop:14,fontSize:11,color:'#94a3b8',fontWeight:500}}>of active drivers assigned</div>
        </div>
      </div>

      <div className="main-grid">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="card-title">Fleet Activity</div>
              <div style={{fontSize:11,color:'#94a3b8',marginTop:3,fontWeight:500}}>Distance covered vs. fuel consumed — last 7 days</div>
            </div>
            <div className="chart-tabs">
              <button className="chart-tab">Week</button>
              <button className="chart-tab active">Month</button>
              <button className="chart-tab">Year</button>
            </div>
          </div>
          <svg width="100%" height="200" viewBox="0 0 580 200" style={{overflow:'visible'}}>
            <line x1="0" y1="20" x2="580" y2="20" stroke="#f1f5f9" strokeWidth="1"/>
            <line x1="0" y1="65" x2="580" y2="65" stroke="#f1f5f9" strokeWidth="1"/>
            <line x1="0" y1="110" x2="580" y2="110" stroke="#f1f5f9" strokeWidth="1"/>
            <line x1="0" y1="155" x2="580" y2="155" stroke="#f1f5f9" strokeWidth="1"/>
            <text x="0" y="18" fontSize="9" fill="#94a3b8" fontFamily="JetBrains Mono">600</text>
            <text x="0" y="63" fontSize="9" fill="#94a3b8" fontFamily="JetBrains Mono">400</text>
            <text x="0" y="108" fontSize="9" fill="#94a3b8" fontFamily="JetBrains Mono">400</text>
            <text x="0" y="153" fontSize="9" fill="#94a3b8" fontFamily="JetBrains Mono">200</text>
            <defs><linearGradient id="aFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d9488"/><stop offset="100%" stopColor="#0d9488" stopOpacity="0"/></linearGradient></defs>
            <path d="M30,148 L111,108 L192,68 L273,118 L354,48 L435,90 L516,38 L580,58 L580,180 L30,180 Z" fill="url(#aFill)" opacity="0.1"/>
            <path d="M30,148 L111,108 L192,68 L273,118 L354,48 L435,90 L516,38 L580,58" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="30" cy="148" r="4" fill="#0d9488" stroke="white" strokeWidth="2"/>
            <circle cx="111" cy="108" r="4" fill="#0d9488" stroke="white" strokeWidth="2"/>
            <circle cx="192" cy="68" r="4" fill="#0d9488" stroke="white" strokeWidth="2"/>
            <circle cx="273" cy="118" r="4" fill="#0d9488" stroke="white" strokeWidth="2"/>
            <circle cx="354" cy="48" r="4" fill="#0d9488" stroke="white" strokeWidth="2"/>
            <circle cx="435" cy="90" r="4" fill="#0d9488" stroke="white" strokeWidth="2"/>
            <circle cx="516" cy="38" r="5" fill="#0d9488" stroke="white" strokeWidth="2"/>
            <circle cx="580" cy="58" r="4" fill="#0d9488" stroke="white" strokeWidth="2"/>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon'].map((d,i) => <text key={i} x={30+i*78.6} y="196" fontSize="9.5" fill="#94a3b8" fontWeight="600" textAnchor="middle" fontFamily="Inter">{d}</text>)}
          </svg>
          <div style={{display:'flex',gap:20,marginTop:12,paddingTop:12,borderTop:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:6,height:6,background:'#0d9488',borderRadius:'50%'}}></div><span style={{fontSize:11,color:'#94a3b8',fontWeight:500}}>Distance (km)</span></div>
            <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:6,height:6,background:'#cbd5e1',borderRadius:'50%'}}></div><span style={{fontSize:11,color:'#94a3b8',fontWeight:500}}>Fuel (L)</span></div>
          </div>
        </div>

        <div className="side-panel">
          <div className="side-card">
            <div className="card-title" style={{marginBottom:16}}>Fleet Status</div>
            <div className="donut-wrap">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="46" fill="none" stroke="#f1f5f9" strokeWidth="12"/>
                <circle cx="60" cy="60" r="46" fill="none" stroke="#059669" strokeWidth="12" strokeDasharray={`${(vAvailable/totalVehicles)*289 || 0} 289`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
                <circle cx="60" cy="60" r="46" fill="none" stroke="#d97706" strokeWidth="12" strokeDasharray={`${(vOnTrip/totalVehicles)*289 || 0} 289`} strokeDashoffset={`-${(vAvailable/totalVehicles)*289 || 0}`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
                <circle cx="60" cy="60" r="46" fill="none" stroke="#dc2626" strokeWidth="12" strokeDasharray={`${(vInShop/totalVehicles)*289 || 0} 289`} strokeDashoffset={`-${((vAvailable+vOnTrip)/totalVehicles)*289 || 0}`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
                <circle cx="60" cy="60" r="46" fill="none" stroke="#94a3b8" strokeWidth="12" strokeDasharray={`${(vRetired/totalVehicles)*289 || 0} 289`} strokeDashoffset={`-${((vAvailable+vOnTrip+vInShop)/totalVehicles)*289 || 0}`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
                <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a" fontFamily="JetBrains Mono">{totalVehicles}</text>
                <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600" fontFamily="Inter">Vehicles</text>
              </svg>
            </div>
            <div className="donut-legend">
              <div className="legend-row"><div className="legend-left"><div className="legend-dot" style={{background:'#059669'}}></div><span className="legend-label">Available</span></div><span className="legend-val">{vAvailable}</span></div>
              <div className="legend-row"><div className="legend-left"><div className="legend-dot" style={{background:'#d97706'}}></div><span className="legend-label">On Trip</span></div><span className="legend-val">{vOnTrip}</span></div>
              <div className="legend-row"><div className="legend-left"><div className="legend-dot" style={{background:'#dc2626'}}></div><span className="legend-label">In Shop</span></div><span className="legend-val">{vInShop}</span></div>
              <div className="legend-row"><div className="legend-left"><div className="legend-dot" style={{background:'#94a3b8'}}></div><span className="legend-label">Retired</span></div><span className="legend-val">{vRetired}</span></div>
            </div>
          </div>
          <div className="side-card">
            <div className="card-title" style={{marginBottom:14}}>Upcoming Maintenance</div>
            {maintenance.slice(0,2).map((m:any) => (
              <div className="maint-item" key={m.id}>
                <div className="maint-icon" style={{background:'#fef3c7'}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
                <div style={{flex:1,minWidth:0}}><div className="maint-name">{m.serviceType} — {m.vehicleRegNo}</div><div className="maint-meta">Due soon</div></div>
                <span className="maint-badge" style={{background:'#fef3c7',color:'#b45309',border:'1px solid #fde68a'}}>Soon</span>
              </div>
            ))}
            {maintenance.length === 0 && <div style={{fontSize:12,color:'#64748b'}}>No upcoming maintenance.</div>}
          </div>
        </div>
      </div>
    </>
  );
}
