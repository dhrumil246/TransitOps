import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function Maintenance() {
  const { searchQuery } = useOutletContext<{searchQuery:string}>();
  const queryClient = useQueryClient();
  
  // form state
  const [vehicle, setVehicle] = useState('');
  const [service, setService] = useState('Oil Change');
  const [cost, setCost] = useState(3500);

  const { data: records = [], isLoading } = useQuery({ queryKey: ['maintenance'], queryFn: () => api<any[]>('/maintenance') });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => api<any[]>('/vehicles') });

  const filtered = records.filter(r => {
    if (searchQuery && !r.vehicleRegNo?.toLowerCase().includes(searchQuery.toLowerCase()) && !r.type?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setVehicle(''); setService('Oil Change'); setCost(3500);
    },
    onError: (err: any) => alert(err.error || 'Failed to create record')
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api(`/maintenance/${id}/close`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err: any) => alert(err.error || 'Failed to close record')
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ vehicleId: vehicle, type: service, cost: Number(cost) });
  }

  const total = filtered.reduce((s:number,r:any) => s + Number(r.cost), 0);


  return (
    <>
      <div className="maint-grid">
        <form className="maint-form-card" onSubmit={handleSave}>
          <div className="card-header"><div className="card-title">Log Service Record</div></div>
          <div className="card-body" style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Vehicle</label>
              <select className="form-select" value={vehicle} onChange={e=>setVehicle(e.target.value)} required>
                <option value="">Select vehicle...</option>
                {vehicles.filter(v=>v.status!=='RETIRED').map(v => <option key={v.id} value={v.id}>{v.name} ({v.status})</option>)}
              </select>
            </div>
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Service Type</label>
              <select className="form-select" value={service} onChange={e=>setService(e.target.value)} required>
                <option>Oil Change</option><option>Brake Inspection</option><option>Tyre Replace</option><option>Engine Repair</option><option>Full Service</option>
              </select>
            </div>
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Cost (₹)</label>
              <input className="form-input" type="number" min="0" value={cost||''} onChange={e=>setCost(Number(e.target.value))} placeholder="Enter amount" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{marginTop:4,background:'#0d9488'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Save Record
            </button>
          </div>

          <div style={{borderTop:'1px solid #f1f5f9',padding:'18px 20px',marginTop:20}}>
            <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:14}}>Status Transitions</div>
            <div className="flow-row">
              <span className="flow-badge avail">Available</span>
              <div className="flow-arrow"><span className="flow-caret">→</span><span className="flow-desc">creating service record</span><span className="flow-caret">→</span></div>
              <span className="flow-badge inshop">In Shop</span>
            </div>
            <div className="flow-row">
              <span className="flow-badge inshop">In Shop</span>
              <div className="flow-arrow"><span className="flow-caret">→</span><span className="flow-desc">closing record returns vehicle</span><span className="flow-caret">→</span></div>
              <span className="flow-badge avail">Available</span>
            </div>
            <div style={{fontSize:11.5,color:'#d97706',fontWeight:500,marginTop:10,display:'flex',alignItems:'center',gap:6}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Note: In Shop vehicles are removed from the dispatch pool.
            </div>
          </div>
        </form>

        <div className="card">
          <div className="card-header" style={{position:'relative'}}>
            <div className="card-title">Service Log</div>
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              <button className="btn btn-ghost btn-sm"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M7 12h10M10 18h4"/></svg>Filter</button>
              <button className="btn btn-ghost btn-sm"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export</button>
            </div>
          </div>
          <table className="data-table">
            <thead><tr><th>VEHICLE</th><th>SERVICE</th><th>COST</th><th>DATE</th><th>STATUS</th></tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5} style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Loading...</td></tr> : filtered.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:600,color:'#0f172a'}}>{r.vehicleRegNo}</td>
                  <td>{r.type}</td>
                  <td className="cost-cell">₹{Number(r.cost).toLocaleString('en-IN')}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11.5,color:'#94a3b8'}}>{new Date(r.openedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td>
                    <span className={`pill ${r.status==='OPEN'?'pill-inshop':'pill-completed'}`}>{r.status==='OPEN'?'In Shop':'Completed'}</span>
                    {r.status === 'OPEN' && <button className="btn btn-ghost btn-sm" style={{marginLeft:8,padding:'2px 8px'}} onClick={() => closeMutation.mutate(r.id)}>Close</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:'12px 20px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:11,color:'#94a3b8',fontWeight:500}}>Showing {filtered.length} records</span>
            <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>Total: <span style={{fontFamily:"'JetBrains Mono',monospace",color:'#dc2626'}}>₹{total.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
