import { NavLink, useNavigate } from 'react-router-dom';

function getSession() {
  try { return JSON.parse(localStorage.getItem('to_session') || '{}'); } catch { return {}; }
}

export function Sidebar() {
  const navigate = useNavigate();
  const session = getSession();
  const initials = session.initials || (session.name ? session.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'OP');

  function handleLogout() {
    localStorage.removeItem('to_session');
    localStorage.removeItem('to_token');
    navigate('/login');
  }

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar-logo">
        <div className="logo-mark" aria-hidden="true">T</div>
        <div className="logo-text">
          <span className="app-name">TransitOps</span>
          <span className="app-sub">Operations</span>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-group-label">Command</div>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/dashboard" title="Dashboard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/vehicles" title="Vehicle Registry">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
          </svg>
          Fleet
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/drivers" title="Drivers & Safety">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Drivers
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/trips" title="Trip Dispatcher">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Trips
          <span className="nav-badge">18</span>
        </NavLink>

        <div className="nav-group-label" style={{ paddingTop: 12 }}>Operations</div>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/maintenance" title="Maintenance">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          Maintenance
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/fuel-expenses" title="Fuel & Expenses">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Fuel &amp; Expenses
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/analytics" title="Analytics & Reports">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
          </svg>
          Analytics
        </NavLink>

        <div className="nav-group-label" style={{ paddingTop: 12 }}>System</div>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="/settings" title="Settings">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Settings
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
          <div className="avatar">{initials}</div>
          <div className="avatar-info" style={{ flex: 1 }}>
            <div className="avatar-name">{session.name || 'Operator'}</div>
            <div className="avatar-role">{session.role || 'Dispatcher'}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="topbar-icon-btn" title="Logout" style={{ width: 32, height: 32, flexShrink: 0, padding: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}
