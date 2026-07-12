import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

function load(key: string) { try { return JSON.parse(localStorage.getItem('to_' + key) || 'null'); } catch { return null; } }
function save(key: string, val: any) { localStorage.setItem('to_' + key, JSON.stringify(val)); }

export default function Settings() {
  const [s, setS] = useState<any>(load('settings') || {});
  const { data: permissions } = useQuery({ queryKey: ['permissions'], queryFn: () => api<any>('/settings/permissions') });

  function handleSave() {
    save('settings', s);
    alert('Settings saved successfully!');
  }

  return (
    <>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <div className="card" style={{padding:24}}>
          <div className="form-section-title">Company Profile</div>
          <div className="form-group" style={{marginBottom:16}}>
            <label className="form-label">Company Name</label>
            <input className="form-input" type="text" value={s.company||''} onChange={e=>setS({...s,company:e.target.value})} />
          </div>
          <div className="form-group" style={{marginBottom:16}}>
            <label className="form-label">City / Region</label>
            <input className="form-input" type="text" value={s.city||''} onChange={e=>setS({...s,city:e.target.value})} />
          </div>
          <div className="form-group" style={{marginBottom:16}}>
            <label className="form-label">Currency</label>
            <select className="form-select" value={s.currency==='USD'?'USD ($)':'INR (₹)'} onChange={e=>setS({...s,currency:e.target.value.includes('USD')?'USD':'INR'})}>
              <option>INR (₹)</option><option>USD ($)</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>

          {permissions && (
            <div style={{marginTop: 32}}>
              <div className="form-section-title">My Permissions ({permissions.role})</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {permissions.allowedActions?.map((action:string)=>(
                  <span key={action} style={{background:'#f1f5f9',padding:'4px 10px',borderRadius:6,fontSize:12,fontWeight:600,color:'#475569'}}>{action}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="card" style={{padding:24}}>
          <div className="form-section-title">System Toggles</div>
          {[
            {key:'licenseAlerts',label:'License Expiry Alerts'},
            {key:'capacityValidation',label:'Capacity Validation'},
            {key:'autoUpdateStatus',label:'Auto Update Status'},
            {key:'twoFactor',label:'Two-Factor Auth'},
          ].map(t => (
            <div key={t.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f1f5f9'}}>
              <span style={{fontSize:13,fontWeight:500,color:'#0f172a'}}>{t.label}</span>
              <div onClick={()=>setS({...s,[t.key]:!s[t.key]})} style={{width:40,height:22,borderRadius:11,background:s[t.key]?'#0d9488':'#cbd5e1',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                <div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:s[t.key]?20:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}></div>
              </div>
            </div>
          ))}
          <button className="btn btn-primary" style={{width:'100%',marginTop:20}} onClick={handleSave}>Save Configuration</button>
        </div>
      </div>
    </>
  );
}
