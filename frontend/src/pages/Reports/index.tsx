import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api<any>('/reports')
  });

  const fleetUtilizationPct = data?.fleetUtilizationPct || 0;
  const fuelEfficiencyKmPerL = data?.fuelEfficiencyKmPerL || 0;
  const operationalCost = data?.operationalCost || 0;
  
  const topRoi = data?.roiByVehicle?.[0] || null;
  const topRoiRegNo = topRoi?.regNo || '--';
  const topRoiPct = topRoi ? Math.round(topRoi.roi * 100) : 0;

  const monthlyRevenue = data?.monthlyRevenue || [];
  const maxRev = monthlyRevenue.length > 0 ? Math.max(...monthlyRevenue.map((d:any) => d.value)) : 1000;

  if (isLoading) return <div style={{padding:40,textAlign:'center',color:'#94a3b8'}}>Loading reports...</div>;

  return (
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        <div className="kpi-card">
          <div className="kpi-label">Fleet Utilization</div>
          <div className="kpi-value">{fleetUtilizationPct}<span style={{fontSize:16,color:'#94a3b8',fontWeight:600}}>%</span></div>
          <div className="kpi-trend trend-up"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>Current period</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fuel Efficiency</div>
          <div className="kpi-value">{fuelEfficiencyKmPerL.toFixed(1)}<span style={{fontSize:16,color:'#94a3b8',fontWeight:600}}>km/L</span></div>
          <div className="kpi-trend trend-up"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>Current period</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Operational Cost</div>
          <div className="kpi-value" style={{color:'#dc2626'}}>₹{(operationalCost/1000).toFixed(1)}K</div>
          <div className="kpi-trend">Fuel + Maintenance</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">ROI (Top Vehicle)</div>
          <div className="kpi-value" style={{color:'#059669'}}>{topRoiPct}<span style={{fontSize:16,color:'#94a3b8',fontWeight:600}}>%</span></div>
          <div className="kpi-trend">{topRoiRegNo}</div>
        </div>
      </div>
      <div className="card" style={{padding:20}}>
        <div className="card-title" style={{marginBottom:16}}>Monthly Revenue</div>
        <div style={{display:'flex',gap:8,alignItems:'flex-end',height:160}}>
          {monthlyRevenue.length === 0 ? <div style={{flex:1,textAlign:'center',color:'#94a3b8',alignSelf:'center'}}>No revenue data available</div> : monthlyRevenue.map((d:any) => (
            <div key={d.month} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{fontSize:10,fontWeight:600,color:'#0f172a',fontFamily:"'JetBrains Mono',monospace"}}>₹{(d.value/1000).toFixed(0)}K</div>
              <div style={{width:'100%',height: (d.value/maxRev)*140,background:'linear-gradient(135deg,#0f766e,#14b8a6)',borderRadius:4,transition:'height .3s'}}></div>
              <div style={{fontSize:10,color:'#94a3b8',fontWeight:500}}>{d.month}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
