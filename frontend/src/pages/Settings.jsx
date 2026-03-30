import { useState } from 'react';
import { Save, UploadCloud, FileText, Database, CheckCircle2, Server, HelpCircle } from 'lucide-react';

export default function Settings() {
  const [profile, setProfile] = useState({ name: 'Admin', designation: 'AI Secretary' });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 800);
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>AI Identity & Knowledge</h1>
        <p className="text-subtle">Configure how your autonomous agent represents your company and what private data it can access.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Left Column: Identity Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '6px', borderRadius: '8px' }}><Server size={18} color="#3b82f6" /></div>
              Agent Persona
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>Display Name</label>
              <input 
                type="text" 
                className="input"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)', outline: 'none', transition: 'border 0.2s', fontSize: '0.95rem' }}
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>Job Title Designation</label>
              <input 
                type="text" 
                className="input"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)', outline: 'none', transition: 'border 0.2s', fontSize: '0.95rem' }}
                value={profile.designation}
                onChange={e => setProfile({...profile, designation: e.target.value})}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>This appears in automated email signatures.</p>
            </div>
            
            <button className="btn" style={{ width: '100%', justifyContent: 'center', background: 'var(--primary)', color: 'white', border: 'none', padding: '12px' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Syncing to Orchestrator...' : <><Save size={16} /> Save Persona Changes</>}
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(30, 41, 59, 0.4) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#34d399" /> Operational Status
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              The orchestration engine is currently running perfectly. Your Google Workspace authorization token is active, and LLaMA-3.1 inference is maintaining a sub-second response latency.
            </p>
          </div>
        </div>

        {/* Right Column (Placeholder or Delete entirely if 1 column is preferred) */}
        <div>
        </div>
        
      </div>
    </div>
  );
}
