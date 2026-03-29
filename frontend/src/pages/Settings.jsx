import { useState, useEffect } from 'react';
import { orchestratorApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Save, LogOut } from 'lucide-react';

export default function Settings() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState({ name: '', designation: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const profileRes = await orchestratorApi.getProfile();
      setProfile({ name: profileRes.name || '', designation: profileRes.designation || '' });
    } catch (e) {
      console.error('Failed to load profile');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1>Configuration & Identity</h1>
          <p className="text-subtle">Manage AI Persona formats and workspace integrations.</p>
        </div>
        <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={logout}>
          <LogOut size={16} style={{marginRight: '6px'}} /> Sign Out Workspace
        </button>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px', marginBottom: '24px' }}>
        <h3 style={{marginBottom: '16px'}}>AI Persona Customization</h3>
        <p className="text-subtle" style={{marginBottom: '24px'}}>Your Orchestrator will sign every auto-drafted email using these precise details.</p>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Full Name</label>
            <input 
              className="input glass-panel" style={{ width: '100%' }} 
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})} 
              placeholder="e.g. Vanukuri Manohar Reddy" 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Designation / Title</label>
            <input 
              className="input glass-panel" style={{ width: '100%' }} 
              value={profile.designation} 
              onChange={e => setProfile({...profile, designation: e.target.value})} 
              placeholder="e.g. VP of Partnerships" 
            />
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={async () => {
            setSaving(true);
            await orchestratorApi.updateProfile(profile.name, profile.designation);
            setSaving(false);
          }}
          disabled={saving}
        >
          {saving ? 'Saving...' : <><Save size={16} style={{marginRight: '6px'}}/> Save Identity</>}
        </button>
      </div>
    </div>
  );
}
