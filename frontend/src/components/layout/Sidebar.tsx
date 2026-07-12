import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, Users, Send, Wrench, Fuel, BarChart3, Settings } from 'lucide-react';

export function Sidebar() {
  const session = JSON.parse(localStorage.getItem('to_session') || '{}');

  const navs = [
    { label: 'Command', items: [
      { to: '/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
      { to: '/vehicles', icon: Truck, text: 'Fleet' },
      { to: '/drivers', icon: Users, text: 'Drivers' },
      { to: '/trips', icon: Send, text: 'Trips', badge: '18' }
    ]},
    { label: 'Operations', items: [
      { to: '/maintenance', icon: Wrench, text: 'Maintenance' },
      { to: '/fuel-expenses', icon: Fuel, text: 'Fuel & Expenses' },
      { to: '/analytics', icon: BarChart3, text: 'Analytics' }
    ]},
    { label: 'System', items: [
      { to: '/settings', icon: Settings, text: 'Settings' }
    ]}
  ];

  return (
    <nav className="w-[240px] bg-canvas border-r border-border h-screen flex flex-col flex-shrink-0 text-primary">
      <div className="h-[70px] flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-orange-600 text-white flex items-center justify-center font-bold text-lg">T</div>
          <div>
            <div className="text-sm font-bold text-white">TransitOps</div>
            <div className="text-[9px] text-muted uppercase tracking-widest font-semibold">Operations</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {navs.map((group, i) => (
          <div key={i}>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 px-3">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item, j) => (
                <NavLink key={j} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-panel text-white' : 'text-muted hover:text-white hover:bg-panel'}`}>
                  <item.icon size={16} />
                  {item.text}
                  {item.badge && <span className="ml-auto bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">{session.initials || 'U'}</div>
          <div>
            <div className="text-xs font-bold text-white">{session.name || 'User'}</div>
            <div className="text-[10px] text-muted">{session.role || 'Staff'}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
