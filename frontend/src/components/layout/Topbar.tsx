import React from 'react';
import { Search, Bell } from 'lucide-react';

export function Topbar({ title, breadcrumb }: { title: string, breadcrumb: string }) {
  const now = new Date();
  return (
    <div className="h-[70px] border-b border-border bg-canvas flex items-center justify-between px-8">
      <div>
        <div className="text-xs font-medium text-muted mb-1">{breadcrumb}</div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search fleet, drivers, trips..." className="w-64 h-9 pl-9 pr-4 rounded-full bg-panel border border-border text-xs text-primary focus:outline-none focus:border-muted transition-colors" />
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="font-bold text-muted">{now.toLocaleDateString('en-IN', {weekday:'short',day:'numeric'})}</span>
          <span>{now.toLocaleDateString('en-IN', {month:'short',year:'numeric'})}</span>
          <span className="text-[10px] ml-1">{now.toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}</span>
        </div>
        <div className="relative cursor-pointer">
          <Bell size={18} className="text-muted" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-600 rounded-full border border-canvas"></div>
        </div>
      </div>
    </div>
  );
}
