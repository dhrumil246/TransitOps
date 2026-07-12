import React from 'react';
import { Button } from '../../components/ui/Button';

export default function Settings() {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-lg font-bold text-white">System Settings</h2>
      <div className="max-w-xl space-y-6">
        <div>
          <label className="block text-xs font-semibold text-muted mb-2">Company Name</label>
          <input type="text" defaultValue="Gujarat Transport Pvt. Ltd." className="w-full h-10 px-4 rounded-lg bg-panel border border-border text-sm text-primary focus:outline-none" />
        </div>
        <Button>Save Settings</Button>
      </div>
    </div>
  );
}
