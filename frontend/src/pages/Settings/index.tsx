import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

function load(key: string) { try { return JSON.parse(localStorage.getItem('to_' + key) || 'null'); } catch { return null; } }
function save(key: string, val: any) { localStorage.setItem('to_' + key, JSON.stringify(val)); }

const TOGGLES = [
  { key: 'licenseAlerts',      label: 'License Expiry Alerts',  desc: 'Alert when driver licenses expire within 30 days' },
  { key: 'capacityValidation', label: 'Capacity Validation',    desc: 'Reject trips that exceed vehicle load limits' },
  { key: 'autoUpdateStatus',   label: 'Auto-Update Status',     desc: 'Automatically update vehicle status on trip completion' },
  { key: 'twoFactor',          label: 'Two-Factor Auth',        desc: 'Require OTP verification on login' },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        width: 38, height: 22, borderRadius: 11, flexShrink: 0,
        background: on ? 'var(--brand)' : 'var(--border-mid)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: on ? 19 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

export default function Settings() {
  const [s, setS] = useState<any>(load('settings') || {});
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api<any>('/settings/permissions'),
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    save('settings', s);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      {saved && (
        <div className="alert-banner alert-blue" role="status" style={{ marginBottom: 20 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Settings saved successfully.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Company Profile */}
        <div className="card">
          <div className="card-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span className="card-title">Company Profile</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" type="text" value={s.company || ''} onChange={e => setS({ ...s, company: e.target.value })} placeholder="e.g. TransitOps India Ltd." />
            </div>
            <div className="form-group">
              <label className="form-label">City / Region</label>
              <input className="form-input" type="text" value={s.city || ''} onChange={e => setS({ ...s, city: e.target.value })} placeholder="e.g. Ahmedabad, Gujarat" />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                className="form-select"
                value={s.currency === 'USD' ? 'USD ($)' : 'INR (₹)'}
                onChange={e => setS({ ...s, currency: e.target.value.includes('USD') ? 'USD' : 'INR' })}
              >
                <option>INR (₹)</option>
                <option>USD ($)</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleSave} style={{ alignSelf: 'flex-start' }}>
              Save Changes
            </button>

            {/* Permissions */}
            {permissions && (
              <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div className="form-section-title">My Permissions — {permissions.role}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {permissions.allowedActions?.map((action: string) => (
                    <span
                      key={action}
                      style={{ background: 'var(--canvas)', padding: '3px 9px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, color: 'var(--tx-secondary)', border: '1px solid var(--border)' }}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Toggles */}
        <div className="card">
          <div className="card-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" aria-hidden="true">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span className="card-title">System Configuration</span>
          </div>
          <div className="card-body">
            {TOGGLES.map(t => (
              <div
                key={t.key}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-primary)' }}>{t.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--tx-muted)', marginTop: 2 }}>{t.desc}</div>
                </div>
                <Toggle on={!!s[t.key]} onChange={() => setS({ ...s, [t.key]: !s[t.key] })} />
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={handleSave}>
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
