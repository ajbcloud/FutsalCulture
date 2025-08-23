import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('platform');
  const queryClient = useQueryClient();
  
  const { data } = useQuery({ 
    queryKey: ['settings'], 
    queryFn: () => get<any>('/api/super-admin/settings') 
  });
  
  const mutation = useMutation({
    mutationFn: (data: any) => patch('/api/super-admin/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
  
  const [settings, setSettings] = useState({
    autoApproveTenants: false,
    requireTenantApproval: true,
    defaultBookingWindowHours: 0,
    maxTenantsPerAdmin: 10,
    defaultSessionCapacity: 16,
    maintenanceMode: false,
  });
  
  React.useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);
  
  const handleSave = () => {
    mutation.mutate(settings);
  };
  
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Settings</h1>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('platform')}
          className={`px-4 py-2 rounded ${activeTab === 'platform' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          Platform Settings
        </button>
        <button 
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2 rounded ${activeTab === 'integrations' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          Integrations
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          User Management
        </button>
      </div>
      
      {activeTab === 'platform' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
            <div>
              <div className="font-medium">Auto Approve New Tenants</div>
              <div className="text-sm opacity-70">Automatically approve new tenant registrations</div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.autoApproveTenants}
              onChange={(e) => setSettings({...settings, autoApproveTenants: e.target.checked})}
              className="w-5 h-5"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
            <div>
              <div className="font-medium">Require Admin Approval for Tenant Changes</div>
              <div className="text-sm opacity-70">Tenant changes must be approved by admin</div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.requireTenantApproval}
              onChange={(e) => setSettings({...settings, requireTenantApproval: e.target.checked})}
              className="w-5 h-5"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
            <div>
              <div className="font-medium">Default Booking Window Hours</div>
              <div className="text-sm opacity-70">Hours before session when booking opens</div>
            </div>
            <input 
              type="number" 
              value={settings.defaultBookingWindowHours}
              onChange={(e) => setSettings({...settings, defaultBookingWindowHours: parseInt(e.target.value) || 0})}
              className="w-20 px-2 py-1 rounded bg-gray-800"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
            <div>
              <div className="font-medium">Max Tenants per Admin</div>
              <div className="text-sm opacity-70">Maximum number of tenants an admin can manage</div>
            </div>
            <input 
              type="number" 
              value={settings.maxTenantsPerAdmin}
              onChange={(e) => setSettings({...settings, maxTenantsPerAdmin: parseInt(e.target.value) || 1})}
              className="w-20 px-2 py-1 rounded bg-gray-800"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
            <div>
              <div className="font-medium">Default Session Capacity</div>
              <div className="text-sm opacity-70">Default maximum players per session</div>
            </div>
            <input 
              type="number" 
              value={settings.defaultSessionCapacity}
              onChange={(e) => setSettings({...settings, defaultSessionCapacity: parseInt(e.target.value) || 1})}
              className="w-20 px-2 py-1 rounded bg-gray-800"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
            <div>
              <div className="font-medium">Maintenance Mode</div>
              <div className="text-sm opacity-70">Put platform in maintenance mode</div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              className="w-5 h-5"
            />
          </div>
          
          <button 
            onClick={handleSave}
            disabled={mutation.isPending}
            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
      
      {activeTab === 'integrations' && (
        <div className="p-4 bg-gray-900 rounded">
          <p>Integrations settings coming soon...</p>
        </div>
      )}
      
      {activeTab === 'users' && (
        <div className="p-4 bg-gray-900 rounded">
          <p>User management settings coming soon...</p>
        </div>
      )}
    </div>
  );
}