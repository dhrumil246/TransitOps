import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

function load(key: string) { try { return JSON.parse(localStorage.getItem('to_' + key) || 'null'); } catch { return null; } }
function save(key: string, val: any) { localStorage.setItem('to_' + key, JSON.stringify(val)); }

export default function Drivers() {
  const { searchQuery } = useOutletContext<{searchQuery:string}>();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [name, setName] = useState('');
  const [license, setLicense] = useState('');
  const [category, setCategory] = useState('LMV');
  const [expiry, setExpiry] = useState('');

  useEffect(() => { setDrivers(load('drivers') || []); }, []);
  function reload() { setDrivers([...(load('drivers') || [])]); }

  const filtered = drivers.filter(d => {
    if (filterStatus && d.status !== filterStatus) return false;
    const q = searchQuery || search;
    if (q && !d.name.toLowerCase().includes(q.toLowerCase()) && !d.license.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  function changeStatus(id: string, status: string) {
    const list = load('drivers');
    const d = list.find((x:any) => x.id === id);
    if (d) d.status = status;
    save('drivers', list);
    reload();
  }

  function handleAdd() {
    if (!name || !license || !expiry) return alert('Fill all fields');
    const [y, m] = expiry.split('-');
    const newDriver = {
      id: 'DRV' + Math.floor(100+Math.random()*900),
      name,
      initials: name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase(),
      color: '#0f172a', textColor: '#fff',
      role: 'Standard Driver',
      license, category,
      expiry: `${m}/${y}`,
      trips: 0, score: 100, status: 'Available'
    };
    const list = load('drivers') || [];
    save('drivers', [newDriver, ...list]);
    setShowAdd(false);
    setName(''); setLicense(''); setExpiry(''); setCategory('LMV');
    reload();
  }

  const STATUS_PILL: Record<string,string> = { Available:'pill-available', 'On Trip':'pill-ontrip', 'Off Duty':'pill-inshop', Suspended:'pill-inshop' };

  return (
    <>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <span className="pill pill-available">Available</span>
        <span className="pill pill-ontrip">On Trip</span>
        <span className="pill pill-inshop" style={{color:'#dc2626'}}>Off Duty</span>
        <span className="pill" style={{color:'#7c3aed',background:'#f5f3ff',borderColor:'#ddd6fe'}}>Suspended</span>
        <div style={{flex:1}}></div>
        <span style={{fontSize:11.5,color:'#94a3b8',fontWeight:500}}>
          Only <strong style={{color:'#0f172a'}}>Available</strong> drivers are eligible for dispatch. <strong style={{color:'#dc2626'}}>Expired</strong> licenses block assignment.
        </span>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <div className="search-bar" style={{flex:1,maxWidth:300}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Search drivers..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{height:32,padding:'0 28px 0 10px',border:'1px solid #e2e8f0',borderRadius:999,fontSize:12,fontWeight:500,color:'#475569',background:'#fff',appearance:'none' as any,cursor:'pointer',fontFamily:"'Inter',sans-serif",outline:'none'}}>
          <option value="">Status: All</option><option>Available</option><option>On Trip</option><option>Off Duty</option><option>Suspended</option>
        </select>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Driver
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead><tr>
            <th>Driver</th><th>License No.</th><th>Category</th><th>Expiry Date</th><th>Trips Done</th><th>Safety Score</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(d => {
              const sc = d.score;
              const scColor = sc >= 85 ? '#059669' : sc >= 65 ? '#d97706' : '#dc2626';
              const [em, ey] = d.expiry.split('/');
              const expiryDate = new Date(Number(ey), Number(em)-1, 1);
              const today = new Date();
              const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / 86400000);
              const expired = daysLeft < 0;
              const nearExpiry = !expired && daysLeft <= 60;
              const catClass = d.category === 'LMV' ? 'cat-lmv' : d.category === 'HGV' ? 'cat-hgv' : 'cat-mcv';
              
              return (
                <tr key={d.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="driver-av" style={{background:d.color,color:d.textColor}}>{d.initials}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{d.name}</div>
                        <div style={{fontSize:11,color:'#94a3b8'}}>{d.role}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="mono-id">{d.license}</span></td>
                  <td><span className={`cat-badge ${catClass}`}>{d.category}</span></td>
                  <td>
                    <span style={{fontSize:12,fontWeight:600,color:expired?'#dc2626':nearExpiry?'#d97706':'#0f172a'}}>{d.expiry}</span>
                    {expired && <div style={{display:'flex',alignItems:'center',gap:4,fontSize:10.5,fontWeight:700,color:'#991b1b',background:'#fee2e2',padding:'1px 6px',borderRadius:4,width:'fit-content',marginTop:2}}>EXPIRED</div>}
                    {nearExpiry && <div className="expiry-warn" style={{marginTop:2}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>{daysLeft} days left</div>}
                  </td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:'#0f172a'}}>{d.trips}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="score-track"><div className="score-fill" style={{width:`${sc}%`,background:`linear-gradient(to right, ${scColor}, ${scColor})`}}></div></div>
                      <span style={{fontSize:12,fontWeight:700,color:scColor,fontFamily:"'JetBrains Mono',monospace"}}>{sc}%</span>
                    </div>
                  </td>
                  <td><span className={`pill ${STATUS_PILL[d.status]||''}`} style={d.status==='Suspended'?{color:'#7c3aed',background:'#f5f3ff',borderColor:'#ddd6fe'}:{}}>{d.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      {expired ? (
                        <><button className="btn btn-ghost btn-sm" style={{opacity:0.4}} disabled>Blocked</button><button className="btn btn-ghost btn-sm" onClick={() => {
                          const list = load('drivers');
                          const drv = list.find((x:any) => x.id === d.id);
                          if(drv) { drv.expiry = '12/2029'; save('drivers', list); reload(); }
                        }}>Renew</button></>
                      ) : d.status === 'Available' ? (
                        <><button className="btn btn-ghost btn-sm" onClick={()=>changeStatus(d.id,'On Trip')}>On Trip</button><button className="btn btn-ghost btn-sm" onClick={()=>changeStatus(d.id,'Suspended')}>Suspend</button></>
                      ) : d.status === 'On Trip' ? (
                        <><button className="btn btn-ghost btn-sm" onClick={()=>changeStatus(d.id,'Available')}>Available</button><button className="btn btn-ghost btn-sm" onClick={()=>changeStatus(d.id,'Suspended')}>Suspend</button></>
                      ) : d.status === 'Suspended' ? (
                        <button className="btn btn-ghost btn-sm" onClick={()=>changeStatus(d.id,'Available')}>Reinstate</button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={()=>changeStatus(d.id,'Available')}>Activate</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'#94a3b8'}}>No drivers found</td></tr>}
          </tbody>
        </table>
        <div style={{background:'#fafafa',borderTop:'1px solid #f1f5f9',padding:'14px 20px',display:'flex',alignItems:'center',gap:8,fontSize:11.5,color:'#94a3b8'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Only <strong style={{color:'#0f172a',margin:'0 3px'}}>Available</strong> drivers are eligible for dispatch. <strong style={{color:'#dc2626',margin:'0 3px'}}>Expired</strong> licenses block trip assignment automatically.
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div className="modal-box" style={{width: 400}}>
            <h2 style={{marginTop:0}}>Add New Driver</h2>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label className="form-label">License Number</label>
                <input type="text" className="form-input" value={license} onChange={e=>{
                  let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (val.length > 4) val = val.substring(0,4) + ' ' + val.substring(4);
                  if (val.length > 7) val = val.substring(0,7) + ' ' + val.substring(7);
                  setLicense(val.substring(0,12));
                }} placeholder="XX00 XX 0000" />
              </div>
              <div>
                <label className="form-label">Expiry Date</label>
                <input type="month" className="form-input" value={expiry} onChange={e=>setExpiry(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">License Category</label>
              <select className="form-select" value={category} onChange={e=>setCategory(e.target.value)}>
                <option>LMV</option><option>MCV</option><option>HGV</option>
              </select>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
              <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Add Driver</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
