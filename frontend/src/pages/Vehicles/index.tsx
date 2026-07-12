import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function Vehicles() {
  const context = useOutletContext<{searchQuery:string}>();
  // Using context or ignore if unused to avoid TS error
  const searchQuery = context?.searchQuery || '';
  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useQuery({ queryKey: ['vehicles'], queryFn: () => api<any[]>('/vehicles') });

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  // Add form
  const [mReg, setMReg] = useState('');
  const [mName, setMName] = useState('');
  const [mModel, setMModel] = useState('');
  const [mType, setMType] = useState('Van');
  const [mSubtype, setMSubtype] = useState('');
  const [mCapacity, setMCapacity] = useState('');
  const [mCost, setMCost] = useState('');
  const [mOdo, setMOdo] = useState('');
  
  // Status edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string | null>(null);

  const filtered = vehicles.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.regNo.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && v.type !== filterType.toUpperCase()) return false;
    if (filterStatus && v.status !== filterStatus.toUpperCase().replace(' ', '_')) return false;
    return true;
  });

  const formatStatus = (s: string) => s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  const formatType = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

  const STATUS_PILL: Record<string,string> = { Available:'pill-available', 'On Trip':'pill-ontrip', 'In Shop':'pill-inshop', Retired:'pill-retired' };
  const TYPE_CLASS: Record<string,string> = { Van:'type-van', Truck:'type-truck', Mini:'type-mini' };
  const FMT_COST = (n: number) => '₹' + Number(n).toLocaleString('en-IN');
  const FMT_ODO  = (n: number) => Number(n).toLocaleString('en-IN') + ' km';
  const FMT_CAP  = (n: number) => n >= 1000 ? (n/1000) + ' Ton' : n + ' kg';

  const createMutation = useMutation({
    mutationFn: (v: any) => api('/vehicles', { method: 'POST', body: JSON.stringify(v) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsAddModalOpen(false);
      setMReg(''); setMName(''); setMModel(''); setMSubtype(''); setMCapacity(''); setMCost(''); setMOdo('');
    },
    onError: (err: any) => alert(err.error || 'Failed to create vehicle')
  });

  function saveVehicle(e: React.FormEvent) {
    e.preventDefault();
    const v = {
      regNo: mReg, name: mName, type: mType.toUpperCase(),
      maxLoadKg: Number(mCapacity), acquisitionCost: Number(mCost), odometer: Number(mOdo)||0, status: 'AVAILABLE'
    };
    createMutation.mutate(v);
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsStatusModalOpen(false);
    },
    onError: (err: any) => alert(err.error || 'Failed to update vehicle')
  });

  function applyStatusChange() {
    if (!editingId || !newStatus) return;
    updateMutation.mutate({ id: editingId, data: { status: newStatus.toUpperCase().replace(' ', '_') } });
  }

  function exportCSV() {
    const csv = [['RegNo','Name','Type','Capacity','Cost','Odo','Status'].join(','), ...filtered.map(v => [v.regNo,v.name,v.type,v.maxLoadKg,v.acquisitionCost,v.odometer,v.status].join(','))].join('\n');
    const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='vehicles.csv'; a.click();
  }

  return (
    <>
      <div className="filter-bar">
        <div style={{position:'relative'}}>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{height:32,padding:'0 28px 0 10px',border:'1px solid #e2e8f0',borderRadius:999,fontSize:12,fontWeight:500,color:'#475569',background:'#fff',appearance:'none',cursor:'pointer',fontFamily:"'Inter',sans-serif",outline:'none'}}>
            <option value="">Type: All</option><option>Van</option><option>Truck</option><option>Mini</option>
          </select>
          <svg style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div style={{position:'relative'}}>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{height:32,padding:'0 28px 0 10px',border:'1px solid #e2e8f0',borderRadius:999,fontSize:12,fontWeight:500,color:'#475569',background:'#fff',appearance:'none',cursor:'pointer',fontFamily:"'Inter',sans-serif",outline:'none'}}>
            <option value="">Status: All</option><option>Available</option><option>On Trip</option><option>In Shop</option><option>Retired</option>
          </select>
          <svg style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <input type="text" placeholder="Search reg. no..." value={search} onChange={e=>setSearch(e.target.value)} style={{height:32,padding:'0 12px',border:'1px solid #e2e8f0',borderRadius:999,fontSize:12,fontWeight:500,color:'#475569',background:'#fff',outline:'none',fontFamily:"'Inter',sans-serif",width:160}} />
        <div className="filter-spacer"></div>
        <span style={{fontSize:11,color:'#94a3b8',fontWeight:500}}>Showing {filtered.length} vehicles</span>
        
        {/* Added "Add Vehicle" button from original Topbar (since Topbar is shared, we put it here or as a floating action) */}
        <button className="btn btn-primary" onClick={()=>setIsAddModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Vehicle
        </button>
        
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export CSV
        </button>
      </div>

      <div className="card" style={{overflow:'visible'}}>
        <table className="data-table">
          <thead><tr>
            <th>Reg. No.</th><th>Name / Model</th><th>Type</th><th>Sub-Type</th>
            <th>Capacity</th><th>Acq. Cost</th><th>Odometer</th><th>Status</th><th style={{width:40}}></th>
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={9} style={{textAlign:'center',padding:48,color:'#94a3b8',fontSize:13}}>Loading...</td></tr> : filtered.map(v => (
              <tr key={v.id}>
                <td><span className="mono-id">{v.regNo}</span></td>
                <td><div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{v.name}</div><div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{v.model}</div></td>
                <td><span className={`type-badge ${TYPE_CLASS[formatType(v.type)]||''}`}>{formatType(v.type)}</span></td>
                <td style={{color:'#94a3b8',fontSize:12}}>{v.subtype}</td>
                <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:'#0f172a'}}>{FMT_CAP(v.maxLoadKg)}</td>
                <td><span className="acq-cost">{FMT_COST(v.acquisitionCost)}</span></td>
                <td><span className="odo">{FMT_ODO(v.odometer)}</span></td>
                <td><span className={`pill ${STATUS_PILL[formatStatus(v.status)]||''}`}>{formatStatus(v.status)}</span></td>
                <td>
                  <button onClick={()=>{setEditingId(v.id); setNewStatus(formatStatus(v.status)); setIsStatusModalOpen(true);}} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',display:'flex',alignItems:'center',padding:4}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} style={{textAlign:'center',padding:48,color:'#94a3b8',fontSize:13}}>No vehicles match your filters</td></tr>}
          </tbody>
        </table>
        <div className="rule-footer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Registration No. must be unique. Retired / In Shop vehicles are hidden from Trip Dispatcher.</span>
        </div>
      </div>

      {isAddModalOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <form onSubmit={saveVehicle} style={{background:'#fff',borderRadius:12,padding:28,maxWidth:500,width:'90%',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>Add Vehicle</div>
              <button type="button" onClick={()=>setIsAddModalOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:20}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div><label className="form-label">Registration No.</label><input className="form-input" value={mReg} onChange={e=>setMReg(e.target.value)} placeholder="e.g. GJ01AB1234" required /></div>
              <div><label className="form-label">Vehicle Name</label><input className="form-input" value={mName} onChange={e=>setMName(e.target.value)} placeholder="e.g. Van-06" required /></div>
            </div>
            <div style={{marginBottom:14}}><label className="form-label">Make & Model</label><input className="form-input" value={mModel} onChange={e=>setMModel(e.target.value)} placeholder="e.g. Tata Prima" required /></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div><label className="form-label">Type</label>
                <select className="form-select" value={mType} onChange={e=>setMType(e.target.value)} required><option>Van</option><option>Truck</option><option>Mini</option></select>
              </div>
              <div><label className="form-label">Sub-Type</label><input className="form-input" value={mSubtype} onChange={e=>setMSubtype(e.target.value)} placeholder="e.g. Standard" /></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div><label className="form-label">Capacity (kg)</label><input className="form-input" type="number" min="1" value={mCapacity} onChange={e=>setMCapacity(e.target.value)} placeholder="500" required /></div>
              <div><label className="form-label">Acq. Cost (₹)</label><input className="form-input" type="number" min="0" value={mCost} onChange={e=>setMCost(e.target.value)} placeholder="430000" required /></div>
            </div>
            <div style={{marginBottom:14}}><label className="form-label">Odometer (km)</label><input className="form-input" type="number" min="0" value={mOdo} onChange={e=>setMOdo(e.target.value)} placeholder="0" /></div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button type="button" className="btn btn-ghost" onClick={()=>setIsAddModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Vehicle</button>
            </div>
          </form>
        </div>
      )}

      {isStatusModalOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,maxWidth:380,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
            <div style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:6}}>Change Vehicle Status</div>
            <div style={{fontSize:12,color:'#94a3b8',marginBottom:20}}>{editingId}</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
              {['Available','On Trip','In Shop','Retired'].map(st => (
                <button key={st} onClick={()=>setNewStatus(st)} className={`status-btn ${newStatus===st?'active-st':''}`} style={{padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:600,border:'1.5px solid',cursor:'pointer',background:newStatus===st?'#0f172a':'#fff',color:newStatus===st?'#fff':'#64748b',borderColor:newStatus===st?'#0f172a':'#e2e8f0'}}>{st}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-ghost" onClick={()=>setIsStatusModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={applyStatusChange}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
