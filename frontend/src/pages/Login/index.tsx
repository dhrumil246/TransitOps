import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import './login.css';

const DEMO_CREDS: Record<string, {password:string;name:string;initials:string}> = {
  'admin@transitops.in': { password: 'admin123', name: 'Admin',        initials: 'AD' },
  'raven@transitops.in': { password: 'raven123', name: 'Raven K.',     initials: 'RK' },
  'priya@transitops.in': { password: 'priya123', name: 'Priya Nair',   initials: 'PN' },
  'alex@transitops.in':  { password: 'alex123',  name: 'Alex Johnson', initials: 'AJ' },
  'demo@transitops.in':  { password: 'demo',     name: 'Demo User',    initials: 'DU' },
};

const ROLES = [
  { id: 'fm', role: 'Fleet Manager',     color: '#0d9488', desc: 'Fleet, Maintenance, Analytics' },
  { id: 'dp', role: 'Dispatcher',        color: '#d97706', desc: 'Dashboard, Trips, Live Board' },
  { id: 'so', role: 'Safety Officer',    color: '#dc2626', desc: 'Drivers, Compliance, Alerts' },
  { id: 'fa', role: 'Financial Analyst', color: '#7c3aed', desc: 'Fuel, Expenses, Reports' },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('Dispatcher');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<{title:string;desc:string}|null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [subText, setSubText] = useState('Enter your credentials to continue');

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('to_session') || 'null');
      if (s?.email) { setEmail(s.email); setSelectedRole(s.role || 'Dispatcher'); }
    } catch {}
  }, []);

  function selectRole(role: string) {
    setSelectedRole(role);
    setSubText(`Signing in as ${role}`);
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      return api<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    onSuccess: (data) => {
      const { token, user } = data;
      localStorage.setItem('to_token', token);
      
      let initials = user.name.slice(0, 2).toUpperCase();
      const parts = user.name.split(' ');
      if (parts.length > 1) {
        initials = parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
      }

      const session = { email: user.email, role: user.role, name: user.name, initials };
      localStorage.setItem('to_session', JSON.stringify(session));
      if (remember) localStorage.setItem('to_remembered', JSON.stringify({ email: user.email, role: user.role }));
      else localStorage.removeItem('to_remembered');

      navigate('/dashboard');
    },
    onError: (err: any) => {
      
      setError({ title: 'Invalid credentials', desc: err.error || 'Incorrect email or password.' });
    }
  });

  function handleSignIn() {
    setError(null);
    if (!email.trim()) { setError({title:'Email required', desc:'Please enter your email address.'}); return; }
    if (!password) { setError({title:'Password required', desc:'Please enter your password.'}); return; }

    loginMutation.mutate({ email: email.trim(), password });
  }

  function handleForgotSend() {
    if (!forgotEmail.trim()) return;
    setShowForgot(false);
    setResetMsg(`Reset link sent to ${forgotEmail} (demo — no actual email sent)`);
    setTimeout(() => setResetMsg(''), 5000);
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',width:'100%',flex:1}}>
      {/* LEFT PANEL */}
      <div className="left">
        <div>
          <div className="brand">
            <div className="brand-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M7 17h14M7 13h10M7 9h6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg></div>
            <div><div className="brand-name">TransitOps</div><div className="brand-tag">Smart Transport Operations</div></div>
          </div>
          <h1 className="hero-heading">One login.<br/><span>Four roles.</span></h1>
          <p className="hero-sub">Your access is scoped immediately after sign-in. No extra setup required.</p>
          <div className="roles-section">
            <div className="roles-title">Click to select your role</div>
            {ROLES.map(r => (
              <div key={r.id} className={`role-item ${selectedRole === r.role ? 'selected' : ''}`} onClick={() => selectRole(r.role)}>
                <div className="role-dot" style={{background: r.color}}></div>
                <div><div className="role-name">{r.role}</div><div className="role-desc">{r.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="left-footer">TransitOps © 2026 · Enterprise Access Only</div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right">
        <div className="form-box">
          <div className="form-title">Sign in to your account</div>
          <div className="form-sub">{subText}</div>

          {resetMsg && (
            <div style={{background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:8,padding:'12px 14px',marginBottom:16,fontSize:13,color:'#059669',fontWeight:500,display:'flex',alignItems:'center',gap:8}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {resetMsg}
            </div>
          )}

          {error && (
            <div className="error-box show">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <div><div className="error-title">{error.title}</div><div className="error-desc">{error.desc}</div></div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrap">
              <input className={`form-input ${error ? 'err' : ''}`} type="email" placeholder="you@transitops.in" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleSignIn()}} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <input className={`form-input ${error ? 'err' : ''}`} type={showPw?'text':'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleSignIn()}} />
              <button className="pw-eye" type="button" onClick={()=>setShowPw(!showPw)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  {showPw ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Role (RBAC)</label>
            <div className="select-wrap">
              <select className="form-select" value={selectedRole} onChange={e=>{setSelectedRole(e.target.value);setSubText(`Signing in as ${e.target.value}`)}}>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Financial Analyst">Financial Analyst</option>
              </select>
              <svg className="select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div className="form-row">
            <label className="checkbox-label"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
            <a href="#" className="forgot" onClick={e=>{e.preventDefault();setForgotEmail(email);setShowForgot(true)}}>Forgot password?</a>
          </div>
          <button className="btn-signin" disabled={loading} onClick={handleSignIn}>
            {loading ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:'spin .8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Signing in…</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Sign In</>
            )}
          </button>

          <div className="access-note">
            <div className="access-title">Access is scoped by role after login</div>
            <div className="access-row"><div className="access-dot" style={{background:'#0d9488'}}></div>Fleet Manager → Fleet, Maintenance, Analytics</div>
            <div className="access-row"><div className="access-dot" style={{background:'#d97706'}}></div>Dispatcher → Dashboard, Trips, Live Board</div>
            <div className="access-row"><div className="access-dot" style={{background:'#dc2626'}}></div>Safety Officer → Drivers, Compliance, Alerts</div>
            <div className="access-row"><div className="access-dot" style={{background:'#7c3aed'}}></div>Financial Analyst → Fuel &amp; Expenses, Reports</div>
          </div>
        </div>
      </div>

      {/* Forgot password modal */}
      {showForgot && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowForgot(false)}}>
          <div className="modal-box">
            <div style={{fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:8}}>Reset your password</div>
            <div style={{fontSize:13,color:'#64748b',marginBottom:20}}>Enter your email address and we'll send a reset link.</div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:'10.5px',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.8px',display:'block',marginBottom:6}}>Email</label>
              <input className="form-input" type="email" placeholder="you@transitops.in" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} style={{width:'100%'}} />
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowForgot(false)} style={{padding:'10px 16px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',background:'#fff',color:'#475569'}}>Cancel</button>
              <button onClick={handleForgotSend} style={{padding:'10px 16px',background:'#0d9488',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>Send Reset Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
