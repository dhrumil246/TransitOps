import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function Trips() {
  const { searchQuery } = useOutletContext<{searchQuery:string}>();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState('');
  
  // Form state
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [cargo, setCargo] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: trips = [], isLoading: tripsLoading } = useQuery({ queryKey: ['trips'], queryFn: () => api<any[]>('/trips') });
  const { data: dispatchOptions } = useQuery({ queryKey: ['dispatch-options'], queryFn: () => api<any>('/trips/dispatch-options') });

  const vehicles = dispatchOptions?.vehicles || [];
  const drivers = dispatchOptions?.drivers || [];

  const filtered = trips.filter(t => {
    if (filter && t.status !== filter.toUpperCase()) return false;
    if (searchQuery && !t.id.toLowerCase().includes(searchQuery.toLowerCase()) && !t.destination.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Derive capacity
  const vData = vehicles.find((v:any) => v.id === vehicle);
  const capacity = vData ? vData.maxLoadKg : 0;
  const isOverCapacity = cargo > capacity && capacity > 0;
  const isOkCapacity = cargo > 0 && cargo <= capacity;

  const createMutation = useMutation({
    mutationFn: (t: any) => api('/trips', { method: 'POST', body: JSON.stringify(t) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch-options'] });
      setSource(''); setDest(''); setVehicle(''); setDriver(''); setCargo(0); setDistance(0);
      setErrorMsg('');
    },
    onError: (err: any) => setErrorMsg(err.message || err.error || 'Failed to create trip')
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api(`/trips/${id}/dispatch`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch-options'] });
    },
    onError: (err: any) => setErrorMsg(err.message || err.error || 'Failed to dispatch trip')
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api(`/trips/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch-options'] });
    },
    onError: (err: any) => alert(err.message || err.error || 'Failed to complete trip')
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api(`/trips/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch-options'] });
    },
    onError: (err: any) => alert(err.message || err.error || 'Failed to cancel trip')
  });

  const [submitAction, setSubmitAction] = useState<'dispatch'|'draft'>('dispatch');

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitAction === 'dispatch') {
      const t = { source, destination: dest, vehicleId: vehicle, driverId: driver, cargoWeightKg: cargo, plannedDistance: distance };
      createMutation.mutate(t, { onSuccess: (data: any) => dispatchMutation.mutate(data.id) });
    } else {
      const t = { source, destination: dest, vehicleId: vehicle, driverId: driver, cargoWeightKg: cargo, plannedDistance: distance };
      createMutation.mutate(t);
    }
  }

  function doComplete(id: string) {
    const odo = prompt('Final Odometer reading?', '50000');
    if (!odo) return;
    const fuel = prompt('Fuel consumed (L)?', '15');
    if (!fuel) return;
    const rev = prompt('Revenue (₹)?', '10000');
    if (!rev) return;
    completeMutation.mutate({ id, data: { finalOdometer: Number(odo), fuelConsumedL: Number(fuel), revenue: Number(rev) } });
  }

  const formatStatus = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

  return (
    <>
      <div className="lifecycle" id="lifecycle-bar">
        <div className={`lc-step ${filter==='Draft'?'active':trips.some(t=>t.status==='DRAFT')?'done':''}`} onClick={() => setFilter(filter === 'Draft' ? '' : 'Draft')}>
          <div className="lc-dot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div className="lc-label">Draft</div>
        </div>
        <div className={`lc-step ${filter==='Dispatched'?'active':trips.some(t=>t.status==='DISPATCHED')?'done':''}`} onClick={() => setFilter(filter === 'Dispatched' ? '' : 'Dispatched')}>
          <div className="lc-dot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div className="lc-label">Dispatched</div>
        </div>
        <div className={`lc-step ${filter==='Completed'?'active':trips.some(t=>t.status==='COMPLETED')?'done':''}`} onClick={() => setFilter(filter === 'Completed' ? '' : 'Completed')}>
          <div className="lc-dot">{trips.filter(t=>t.status==='COMPLETED').length}</div>
          <div className="lc-label">Completed</div>
        </div>
        <div className={`lc-step cancelled ${filter==='Cancelled'?'active':''}`} onClick={() => setFilter(filter === 'Cancelled' ? '' : 'Cancelled')}>
          <div className="lc-dot">✕</div>
          <div className="lc-label">Cancelled</div>
        </div>
      </div>

      <div className="dispatch-grid">
        <div>
          <form className="create-form" onSubmit={handleFormSubmit}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:700,color:'#0f172a',letterSpacing:'-.02em'}}>Create Trip</div>
            </div>
            <div className="form-grid-2">
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Source</label>
                <input type="text" className="form-input" placeholder="Origin city/depot" style={{height:40}} value={source} onChange={e=>setSource(e.target.value)} required />
              </div>
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Destination</label>
                <input type="text" className="form-input" placeholder="Destination" style={{height:40}} value={dest} onChange={e=>setDest(e.target.value)} required />
              </div>
            </div>
            <div className="form-group" style={{marginBottom:14}}>
              <label className="form-label">Vehicle <span style={{color:'#94a3b8',textTransform:'none',fontWeight:500}}>(Available only)</span></label>
              <select className="form-select" style={{height:40}} value={vehicle} onChange={e=>setVehicle(e.target.value)} required>
                <option value="">Select vehicle...</option>
                {vehicles.map((v:any)=><option key={v.id} value={v.id}>{v.name} — {v.maxLoadKg}kg capacity</option>)}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:14}}>
              <label className="form-label">Driver <span style={{color:'#94a3b8',textTransform:'none',fontWeight:500}}>(Available only)</span></label>
              <select className="form-select" style={{height:40}} value={driver} onChange={e=>setDriver(e.target.value)} required>
                <option value="">Select driver...</option>
                {drivers.map((d:any)=><option key={d.id} value={d.id}>{d.name} — {d.licenseNo}</option>)}
              </select>
            </div>
            <div className="form-grid-2" style={{marginBottom:14}}>
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Cargo Weight (KG)</label>
                <input type="number" min="1" className="form-input" value={cargo||''} onChange={e=>setCargo(Number(e.target.value))} style={{height:40}} required />
              </div>
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Planned Distance (KM)</label>
                <input type="number" min="1" className="form-input" value={distance||''} onChange={e=>setDistance(Number(e.target.value))} style={{height:40}} required />
              </div>
            </div>

            {errorMsg && (
              <div className="cap-error show" style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px',margin:'10px 0'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#991b1b',display:'flex',alignItems:'center',gap:6,marginBottom:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Action Failed</div>
                <div style={{fontSize:11.5,color:'#b91c1c'}}>{errorMsg}</div>
              </div>
            )}
            {!errorMsg && isOkCapacity && (
              <div className="cap-ok show" style={{background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:8,padding:'8px 14px',margin:'10px 0',fontSize:12,fontWeight:600,color:'#059669',display:'flex',alignItems:'center',gap:8}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Capacity OK
              </div>
            )}

            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button type="submit" disabled={isOverCapacity} onClick={()=>setSubmitAction('dispatch')} style={{flex:1,background:isOverCapacity?'#94a3b8':'#0d9488',color:'#fff',cursor:isOverCapacity?'not-allowed':'pointer'}} className="btn btn-ghost">Dispatch Trip</button>
              <button type="submit" onClick={()=>setSubmitAction('draft')} style={{flex:1,background:'transparent',color:'#475569',boxShadow:'none',border:'1px solid #e2e8f0'}} className="btn btn-primary">Save Draft</button>
            </div>
          </form>
          
          <div className="biz-rules">
            <div className="biz-title">Business Rules</div>
            <div className="biz-rule">On dispatch: Vehicle & Driver status → <span className="status-highlight on-trip">On Trip</span></div>
            <div className="biz-rule">On complete: Driver odometer & fuel — status → <span className="status-highlight avail">Available</span></div>
            <div className="biz-rule">On cancel: Vehicle & Driver restored to <span className="status-highlight avail">Available</span></div>
            <div className="biz-rule">Capacity exceeded = Dispatch blocked automatically</div>
          </div>
        </div>

        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Live Board</div>
              <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>Showing all trips — click a status step to filter</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { queryClient.invalidateQueries({ queryKey: ['trips'] }); queryClient.invalidateQueries({ queryKey: ['dispatch-options'] }); }} style={{gap:4}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Refresh
            </button>
          </div>
          <div className="live-board">
            {tripsLoading ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Loading...</div> : filtered.map(t => {
              const fStatus = formatStatus(t.status);
              return (
              <div key={t.id} className="lb-card" style={{borderLeft:`3px solid ${t.status==='DISPATCHED'?'#d97706':t.status==='COMPLETED'?'#059669':t.status==='CANCELLED'?'#dc2626':'#94a3b8'}`, opacity:t.status==='CANCELLED'?0.7:1}}>
                <div className="lb-card-header">
                  <div className="lb-trip-id">{t.id}</div>
                  <div className={`pill ${t.status==='DISPATCHED'?'pill-ontrip':t.status==='COMPLETED'?'pill-available':t.status==='CANCELLED'?'pill-inshop':''}`}>{fStatus}</div>
                </div>
                <div className="lb-route">{t.source} → {t.destination}</div>
                <div className="lb-meta">
                  <div>
                    <div className="lb-vehicle">{t.vehicle?.name || t.vehicleId}</div>
                    {t.driver && <div className="lb-driver"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>{t.driver?.name || t.driverId}</div>}
                  </div>
                  {t.status === 'DISPATCHED' && <div className="lb-eta">In Transit</div>}
                  {t.status === 'DISPATCHED' && <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-ghost btn-sm" style={{color:'#059669',padding:'4px 8px'}} onClick={()=>doComplete(t.id)}>Mark Complete</button>
                    <button className="btn btn-ghost btn-sm" style={{color:'#dc2626',padding:'4px 8px'}} onClick={()=>cancelMutation.mutate(t.id)}>Cancel</button>
                  </div>}
                  {t.status === 'DRAFT' && <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-ghost btn-sm" style={{background:'#0d9488',color:'#fff',padding:'4px 8px'}} onClick={()=>{
                      dispatchMutation.mutate(t.id);
                    }}>Dispatch Now</button>
                    <button className="btn btn-ghost btn-sm" style={{color:'#dc2626',padding:'4px 8px'}} onClick={()=>cancelMutation.mutate(t.id)}>Delete Draft</button>
                  </div>}
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>
    </>
  );
}
