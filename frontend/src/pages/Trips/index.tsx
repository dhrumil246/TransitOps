import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

function load(key: string) { try { return JSON.parse(localStorage.getItem('to_' + key) || 'null'); } catch { return null; } }
function save(key: string, val: any) { localStorage.setItem('to_' + key, JSON.stringify(val)); }

export default function Trips() {
  const { searchQuery } = useOutletContext<{searchQuery:string}>();
  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  
  // Form state
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [cargo, setCargo] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);

  useEffect(() => { 
    setTrips(load('trips') || []); 
    setVehicles(load('vehicles') || []);
    setDrivers(load('drivers') || []);
  }, []);

  function reload() { 
    setTrips([...(load('trips') || [])]); 
    setVehicles([...(load('vehicles') || [])]);
    setDrivers([...(load('drivers') || [])]);
  }

  const filtered = trips.filter(t => {
    if (filter && t.status !== filter) return false;
    if (searchQuery && !t.id.toLowerCase().includes(searchQuery.toLowerCase()) && !t.dest.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Derive capacity
  const vData = vehicles.find(v => v.name === vehicle);
  const capacity = vData ? vData.capacity : 0;
  const isOverCapacity = cargo > capacity && capacity > 0;
  const isOkCapacity = cargo > 0 && cargo <= capacity;

  function handleDispatch() {
    if (!source || !dest || !vehicle || !driver) return alert("Fill all fields");
    if (isOverCapacity) return alert("Capacity exceeded!");

    const tripId = 'TRP-' + Math.floor(2100 + Math.random() * 900);
    const newTrip = { id: tripId, source, dest, vehicle, driver, status: 'Dispatched', cargo, distance, eta: '45 min' };
    
    const allTrips = [newTrip, ...trips];
    save('trips', allTrips);

    // Update vehicle & driver status
    const allV = [...vehicles];
    const vIdx = allV.findIndex(v => v.name === vehicle);
    if (vIdx >= 0) allV[vIdx].status = 'On Trip';
    save('vehicles', allV);

    const allD = [...drivers];
    const dIdx = allD.findIndex(d => d.id === driver);
    if (dIdx >= 0) allD[dIdx].status = 'On Trip';
    save('drivers', allD);

    setSource(''); setDest(''); setVehicle(''); setDriver(''); setCargo(0); setDistance(0);
    reload();
  }

  function handleSaveDraft() {
    const tripId = 'TRP-' + Math.floor(2100 + Math.random() * 900);
    const newTrip = { id: tripId, source, dest, vehicle, driver: null, status: 'Draft', cargo, distance, eta: null };
    const allTrips = [newTrip, ...trips];
    save('trips', allTrips);
    setSource(''); setDest(''); setVehicle(''); setDriver(''); setCargo(0); setDistance(0);
    reload();
  }

  function changeStatus(id: string, status: string) {
    const all = [...trips];
    const t = all.find(x => x.id === id);
    if (t) {
      t.status = status;
      // if completed/cancelled, free up driver/vehicle
      if (status === 'Completed' || status === 'Cancelled') {
        const allV = load('vehicles');
        const v = allV.find((x:any) => x.name === t.vehicle);
        if (v) v.status = 'Available';
        save('vehicles', allV);
        
        // Match driver safely
        if (t.driver) {
           const allD = load('drivers');
           const driverMatch = allD.find((x:any) => t.driver.includes(x.name.split(' ')[0]));
           if (driverMatch) driverMatch.status = 'Available';
           save('drivers', allD);
        }
      }
    }
    save('trips', all);
    reload();
  }

  return (
    <>
      <div className="lifecycle" id="lifecycle-bar">
        <div className={`lc-step ${filter==='Draft'?'active':trips.some(t=>t.status==='Draft')?'done':''}`} onClick={() => setFilter(filter === 'Draft' ? '' : 'Draft')}>
          <div className="lc-dot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div className="lc-label">Draft</div>
        </div>
        <div className={`lc-step ${filter==='Dispatched'?'active':trips.some(t=>t.status==='Dispatched')?'done':''}`} onClick={() => setFilter(filter === 'Dispatched' ? '' : 'Dispatched')}>
          <div className="lc-dot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div className="lc-label">Dispatched</div>
        </div>
        <div className={`lc-step ${filter==='Completed'?'active':trips.some(t=>t.status==='Completed')?'done':''}`} onClick={() => setFilter(filter === 'Completed' ? '' : 'Completed')}>
          <div className="lc-dot">{trips.filter(t=>t.status==='Completed').length}</div>
          <div className="lc-label">Completed</div>
        </div>
        <div className={`lc-step cancelled ${filter==='Cancelled'?'active':''}`} onClick={() => setFilter(filter === 'Cancelled' ? '' : 'Cancelled')}>
          <div className="lc-dot">✕</div>
          <div className="lc-label">Cancelled</div>
        </div>
      </div>

      <div className="dispatch-grid">
        <div>
          <div className="create-form">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:700,color:'#0f172a',letterSpacing:'-.02em'}}>Create Trip</div>
            </div>
            <div className="form-grid-2">
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Source</label>
                <input type="text" className="form-input" placeholder="Origin city/depot" style={{height:40}} value={source} onChange={e=>setSource(e.target.value)} />
              </div>
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Destination</label>
                <input type="text" className="form-input" placeholder="Destination" style={{height:40}} value={dest} onChange={e=>setDest(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{marginBottom:14}}>
              <label className="form-label">Vehicle <span style={{color:'#94a3b8',textTransform:'none',fontWeight:500}}>(Available only)</span></label>
              <select className="form-select" style={{height:40}} value={vehicle} onChange={e=>setVehicle(e.target.value)}>
                <option value="">Select vehicle...</option>
                {vehicles.filter(v=>v.status==='Available').map(v=><option key={v.id} value={v.name}>{v.name} — {v.capacity}kg capacity</option>)}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:14}}>
              <label className="form-label">Driver <span style={{color:'#94a3b8',textTransform:'none',fontWeight:500}}>(Available only)</span></label>
              <select className="form-select" style={{height:40}} value={driver} onChange={e=>setDriver(e.target.value)}>
                <option value="">Select driver...</option>
                {drivers.filter(d=>d.status==='Available').map(d=><option key={d.id} value={d.id}>{d.name} — {d.license}</option>)}
              </select>
            </div>
            <div className="form-grid-2" style={{marginBottom:14}}>
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Cargo Weight (KG)</label>
                <input type="number" className="form-input" value={cargo} onChange={e=>setCargo(Number(e.target.value))} style={{height:40}} />
              </div>
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Planned Distance (KM)</label>
                <input type="number" className="form-input" value={distance} onChange={e=>setDistance(Number(e.target.value))} style={{height:40}} />
              </div>
            </div>

            {isOverCapacity && (
              <div className="cap-error show" style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px',margin:'10px 0'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#991b1b',display:'flex',alignItems:'center',gap:6,marginBottom:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Capacity exceeded</div>
                <div style={{fontSize:11.5,color:'#b91c1c'}}>Vehicle capacity: {capacity}kg</div>
                <div style={{fontSize:11.5,color:'#b91c1c'}}>Cargo weight: {cargo}kg</div>
                <div style={{fontSize:11.5,color:'#b91c1c',fontWeight:700,marginTop:4}}>✕ Dispatch blocked</div>
              </div>
            )}
            {isOkCapacity && (
              <div className="cap-ok show" style={{background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:8,padding:'8px 14px',margin:'10px 0',fontSize:12,fontWeight:600,color:'#059669',display:'flex',alignItems:'center',gap:8}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Capacity OK
              </div>
            )}

            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button className="btn btn-ghost" disabled={isOverCapacity} onClick={handleDispatch} style={{flex:1,background:isOverCapacity?'#94a3b8':'#0d9488',color:'#fff',cursor:isOverCapacity?'not-allowed':'pointer'}}>Dispatch Trip</button>
              <button className="btn btn-primary" onClick={handleSaveDraft} style={{flex:1,background:'transparent',color:'#475569',boxShadow:'none',border:'1px solid #e2e8f0'}}>Save Draft</button>
            </div>
          </div>
          
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
            <button className="btn btn-ghost btn-sm" onClick={reload} style={{gap:4}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Refresh
            </button>
          </div>
          <div className="live-board">
            {filtered.map(t => (
              <div key={t.id} className="lb-card" style={{borderLeft:`3px solid ${t.status==='Dispatched'?'#d97706':t.status==='Completed'?'#059669':t.status==='Cancelled'?'#dc2626':'#94a3b8'}`, opacity:t.status==='Cancelled'?0.7:1}}>
                <div className="lb-card-header">
                  <div className="lb-trip-id">{t.id}</div>
                  <div className={`pill ${t.status==='Dispatched'?'pill-ontrip':t.status==='Completed'?'pill-available':t.status==='Cancelled'?'pill-inshop':''}`}>{t.status}</div>
                </div>
                <div className="lb-route">{t.source} → {t.dest}</div>
                <div className="lb-meta">
                  <div>
                    <div className="lb-vehicle">{t.vehicle}</div>
                    {t.driver && <div className="lb-driver"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>{t.driver}</div>}
                  </div>
                  {t.status === 'Dispatched' && <div className="lb-eta">45 min ETA</div>}
                  {t.status === 'Dispatched' && <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-ghost btn-sm" style={{color:'#059669',padding:'4px 8px'}} onClick={()=>changeStatus(t.id, 'Completed')}>Mark Complete</button>
                    <button className="btn btn-ghost btn-sm" style={{color:'#dc2626',padding:'4px 8px'}} onClick={()=>changeStatus(t.id, 'Cancelled')}>Cancel</button>
                  </div>}
                  {t.status === 'Draft' && <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-ghost btn-sm" style={{background:'#0d9488',color:'#fff',padding:'4px 8px'}} onClick={()=>{
                      // simple mock for dispatch draft
                      if(t.vehicle) {
                         changeStatus(t.id, 'Dispatched');
                      } else alert('Edit draft to assign vehicle and driver first.');
                    }}>Dispatch Now</button>
                    <button className="btn btn-ghost btn-sm" style={{color:'#dc2626',padding:'4px 8px'}} onClick={()=>changeStatus(t.id, 'Cancelled')}>Delete Draft</button>
                  </div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
