import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

const STATUS_PILL: Record<string, string> = {
  Available: 'pill-available',
  'On Trip':  'pill-ontrip',
  'Off Duty': 'pill-inshop',
  Suspended:  'pill-retired',
};

const formatStatus = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? 'var(--status-green)' : score >= 65 ? 'var(--status-amber)' : 'var(--status-red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--mono)' }}>{score}%</span>
    </div>
  );
}

export default function Drivers() {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api<any[]>('/drivers'),
  });

  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdd, setShowAdd]         = useState(false);

  // Add form state
  const [name, setName]         = useState('');
  const [license, setLicense]   = useState('');
  const [category, setCategory] = useState('LMV');
  const [expiry, setExpiry]     = useState('');

  const filtered = drivers.filter(d => {
    if (filterStatus && d.status !== filterStatus.toUpperCase().replace(' ', '_')) return false;
    const q = searchQuery || search;
    if (q && !d.name.toLowerCase().includes(q.toLowerCase()) && !d.licenseNo.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api('/drivers', { method: 'POST', body: JSON.stringify(d) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setShowAdd(false);
      setName(''); setLicense(''); setExpiry(''); setCategory('LMV');
    },
    onError: (err: any) => alert(err.error || 'Failed to create driver'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api(`/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
    onError: (err: any) => alert(err.error || 'Failed to update driver'),
  });

  function changeStatus(id: string, status: string) {
    updateMutation.mutate({ id, data: { status: status.toUpperCase().replace(/ /g, '_') } });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!expiry || !expiry.includes('-')) { alert('Invalid expiry date format.'); return; }
    const [y, m] = expiry.split('-');
    const expDate = new Date(Number(y), Number(m) - 1, 1);
    if (isNaN(expDate.getTime())) { alert('Invalid expiry date.'); return; }
    createMutation.mutate({ name, licenseNo: license, licenseCategory: category, licenseExpiry: expDate.toISOString(), contact: 'N/A' });
  }

  return (
    <>
      {/* Rules Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 7 }}>
        <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
          Only <strong style={{ color: 'var(--tx-primary)' }}>Available</strong> drivers are eligible for dispatch.{' '}
          <strong style={{ color: 'var(--status-red)' }}>Expired</strong> licenses automatically block trip assignment.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span className="pill pill-available">Available</span>
          <span className="pill pill-ontrip">On Trip</span>
          <span className="pill pill-inshop">Off Duty</span>
          <span className="pill pill-retired">Suspended</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--tx-muted)" strokeWidth="2" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }} aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or license…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-chip"
            style={{ width: 220, paddingLeft: 32, cursor: 'text' }}
            aria-label="Search drivers"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="filter-chip"
          aria-label="Filter by status"
          style={{ appearance: 'none', paddingRight: 24, cursor: 'pointer' }}
        >
          <option value="">Status: All</option>
          <option>Available</option><option>On Trip</option><option>Off Duty</option><option>Suspended</option>
        </select>
        <div className="filter-spacer" />
        <span style={{ fontSize: 11, color: 'var(--tx-muted)', fontWeight: 500 }}>
          {filtered.length} driver{filtered.length !== 1 ? 's' : ''}
        </span>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Driver
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>License No.</th>
              <th>Category</th>
              <th>Expiry Date</th>
              <th>Trips Done</th>
              <th>Safety Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                <span style={{ color: 'var(--tx-muted)', fontSize: 13 }}>Loading drivers…</span>
              </td></tr>
            ) : filtered.map(d => {
              const sc = d.safetyScore ?? 100;
              const expiryDate = new Date(d.licenseExpiry);
              const expiryStr  = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear()}`;
              const daysLeft   = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000);
              const expired    = daysLeft < 0;
              const nearExpiry = !expired && daysLeft <= 60;
              const initials   = d.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              const fStatus    = formatStatus(d.status);

              return (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-primary)' }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Standard Driver</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="mono-id">{d.licenseNo}</span></td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--brand-bg)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}>
                      {d.licenseCategory}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', color: expired ? 'var(--status-red)' : nearExpiry ? 'var(--status-amber)' : 'var(--tx-primary)' }}>
                      {expiryStr}
                    </span>
                    {expired && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#991b1b', background: 'var(--status-red-bg)', padding: '1px 6px', borderRadius: 3, width: 'fit-content', marginTop: 2 }}>EXPIRED</div>
                    )}
                    {nearExpiry && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-amber)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        </svg>
                        {daysLeft}d left
                      </div>
                    )}
                  </td>
                  <td><span className="mono-id">{d.trips?.length || 0}</span></td>
                  <td><ScoreBar score={sc} /></td>
                  <td><span className={`pill ${STATUS_PILL[fStatus] || 'pill-draft'}`}>{fStatus}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {expired ? (
                        <>
                          <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.4 }}>Blocked</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => {
                            const newExp = new Date(); newExp.setFullYear(newExp.getFullYear() + 5);
                            updateMutation.mutate({ id: d.id, data: { licenseExpiry: newExp.toISOString() } });
                          }}>Renew</button>
                        </>
                      ) : fStatus === 'Available' ? (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(d.id, 'On Trip')}>On Trip</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(d.id, 'Suspended')}>Suspend</button>
                        </>
                      ) : fStatus === 'On Trip' ? (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(d.id, 'Available')}>Available</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(d.id, 'Suspended')}>Suspend</button>
                        </>
                      ) : fStatus === 'Suspended' ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(d.id, 'Available')}>Reinstate</button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(d.id, 'Available')}>Activate</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <div className="empty-state-title">No drivers found</div>
                  <div className="empty-state-body">Try adjusting your filters or add a new driver.</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Driver Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <form style={{ background: '#fff', borderRadius: 10, padding: 28, maxWidth: 420, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,.2)' }} onSubmit={handleAdd}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx-primary)', letterSpacing: '-0.02em', margin: 0 }}>Add New Driver</h2>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ravi Kumar" required />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">License Number <span className="required">*</span></label>
                <input
                  type="text" className="form-input" value={license}
                  onChange={e => {
                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (val.length > 4) val = val.substring(0, 4) + ' ' + val.substring(4);
                    if (val.length > 7) val = val.substring(0, 7) + ' ' + val.substring(7);
                    setLicense(val.substring(0, 12));
                  }}
                  placeholder="XX00 XX 0000" required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date <span className="required">*</span></label>
                <input type="month" className="form-input" value={expiry} onChange={e => setExpiry(e.target.value)} min={new Date().toISOString().substring(0, 7)} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">License Category <span className="required">*</span></label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} required>
                <option>LMV</option><option>MCV</option><option>HGV</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Add Driver'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
