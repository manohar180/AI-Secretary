import { useState, useEffect } from 'react';
import { orchestratorApi } from '../api/client';

export default function Integrations() {
  const [googleStatus, setGoogleStatus] = useState({ state: 'checking', details: '' });

  const fetchStatus = async () => {
    try {
      const res = await orchestratorApi.testGoogleIntegration();
      setGoogleStatus({ state: res.status, details: res.details });
    } catch (e) {
      setGoogleStatus({ state: 'disconnected', details: 'Backend offline' });
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDisconnect = async () => {
    try {
      await orchestratorApi.disconnectGoogle();
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-slide-up">
      <div style={{ marginBottom: '32px' }}>
        <h1>Connected Applications</h1>
        <p className="text-subtle">Manage Google Workspace, Slack, and Salesforce integrations.</p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        <h3>Integration Tokens</h3>
        <p className="text-subtle" style={{marginTop: '8px', marginBottom: '24px'}}>Your AI Orchestrator currently holds auth tokens for these systems.</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
          <div>
            <strong style={{display: 'block', marginBottom: '4px'}}>Google Workspace API</strong>
            <span className="badge badge-ai" style={{fontSize: '0.65rem'}}>Gmail & Calendar Sync</span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {googleStatus.state === 'connected' ? (
              <>
                <span className="badge badge-approved" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  Connected
                </span>
                <button onClick={handleDisconnect} className="btn" style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', padding: '6px 12px', fontSize: '0.8rem' }}>Disconnect</button>
              </>
            ) : googleStatus.state === 'disconnected' ? (
              <button className="btn btn-primary" onClick={() => alert("Normally this would spawn a Google Auth Screen. To reconnect for demo purposes, rename token_offline.json.bak back to token.json on your system!")}>Connect</button>
            ) : (
               <span className="text-subtle">Detecting...</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
          <div>
            <strong style={{display: 'block', marginBottom: '4px'}}>Salesforce CRM</strong>
            <span className="text-subtle" style={{fontSize: '0.75rem'}}>No token detected</span>
          </div>
          <button className="btn">Connect Sandbox</button>
        </div>
      </div>
    </div>
  );
}
