import { useState, useEffect } from 'react';
import { Sliders, Shield, Zap, Globe, Save } from 'lucide-react';
import { orchestratorApi } from '../api/client';

export default function Integrations() {
  const [saving, setSaving] = useState(false);
  const [oauthStatus, setOauthStatus] = useState('loading');
  
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/integrations/google/test')
      .then(r => r.json())
      .then(data => setOauthStatus(data.status))
      .catch(() => setOauthStatus('error'));
  }, []);
  
  const [config, setConfig] = useState({
    aggression: 50,
    autopilot: false,
    tone: 'Professional',
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 800);
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-main)' }}>Orchestrator Configuration</h1>
        <p className="text-subtle">Tune the cognitive parameters of the autonomous routing agent.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Core AI Parameters */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
            <Sliders size={22} color="var(--primary)" /> Cognitive Parameters
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Context Tone */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Conversational Tone</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['Casual', 'Professional', 'Executive'].map(tone => (
                  <button 
                    key={tone}
                    onClick={() => setConfig({...config, tone})}
                    className="btn" 
                    style={{ 
                      flex: 1, 
                      justifyContent: 'center',
                      background: config.tone === tone ? 'rgba(59, 130, 246, 0.1)' : 'var(--glass-bg)',
                      borderColor: config.tone === tone ? '#3b82f6' : 'var(--glass-border)',
                      color: config.tone === tone ? '#60a5fa' : 'var(--text-muted)'
                    }}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Negotiation Aggression */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Scheduling Aggression</span>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{config.aggression}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={config.aggression}
                onChange={(e) => setConfig({...config, aggression: e.target.value})}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Strict (Accommodates {'<'} 1 hr shifts)</span>
                <span>Flex (Will overwrite your focus blocks)</span>
              </div>
            </div>

            {/* Autopilot Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="#fbbf24" /> Full Autopilot Mode
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: '1.4' }}>
                  If activated, the AI will automatically dispatch emails and lock calendar blocks without requiring manual approval in the Dashboard queue.
                </p>
              </div>
              
              {/* Custom CSS Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={config.autopilot}
                  onChange={() => setConfig({...config, autopilot: !config.autopilot})}
                  style={{ display: 'none' }}
                />
                <div style={{ 
                  width: '50px', 
                  height: '26px', 
                  background: config.autopilot ? '#10b981' : 'rgba(255,255,255,0.1)', 
                  borderRadius: '26px',
                  position: 'relative',
                  transition: 'background 0.3s'
                }}>
                  <div style={{
                    width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                    position: 'absolute', top: '3px', left: config.autopilot ? '27px' : '3px',
                    transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}></div>
                </div>
              </label>
            </div>
            
          </div>

          <div style={{ marginTop: '32px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Syncing Models...' : <><Save size={16} /> Update AI Models</>}
            </button>
          </div>
        </div>
        
        {/* Connection Architecture */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
            <Globe size={22} color="#34d399" /> Current Connections
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            The AI currently has structural read/write access to the following enterprise surfaces.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {oauthStatus === 'loading' && <div style={{ color: 'var(--text-muted)' }}>Checking OAuth heartbeat...</div>}
             
             {oauthStatus === 'connected' && (
               <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, background: 'white', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="24" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>Google Workspace API</div>
                      <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Connected (Calendar & Gmail)</div>
                    </div>
                  </div>
                  <button className="btn" style={{ fontSize: '0.8rem' }} onClick={async () => {
                    await fetch('http://localhost:8000/api/v1/integrations/google', { method: 'DELETE' });
                    setOauthStatus('disconnected');
                  }}>Revoke Token</button>
               </div>
             )}

             {oauthStatus === 'disconnected' && (
                <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Globe size={20} color="#94a3b8" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>Google Workspace API</div>
                      <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Offline. No Context Permitted.</div>
                    </div>
                  </div>
                  <button className="btn" style={{ fontSize: '0.85rem', background: '#3b82f6', color: 'white', borderColor: '#2563eb' }} onClick={async () => {
                    setOauthStatus('loading');
                    try {
                        const res = await fetch('http://localhost:8000/api/v1/integrations/google/connect', { method: 'POST' });
                        const data = await res.json();
                        if (data.status === 'connected') {
                            setOauthStatus('connected');
                        } else {
                            setOauthStatus('disconnected');
                            alert("Failed to securely spin up Oauth UI port. Check your Python terminal for warnings.");
                        }
                    } catch (e) {
                        setOauthStatus('disconnected');
                    }
                  }}>
                    Connect Workspace
                  </button>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
