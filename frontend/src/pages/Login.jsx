import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Zap, Lock, Globe } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err) {
      setError('Backend verification failed or email not authorized.');
    }
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      
      <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'row', position: 'relative', zIndex: 1, padding: 0, overflow: 'hidden' }}>
        
        {/* Left Branding Panel */}
        <div style={{ flex: 1, padding: '48px', background: 'rgba(59, 130, 246, 0.05)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', lineHeight: '1.2' }}>Automate Your <br/><span style={{ color: 'var(--primary)' }}>B2B Workflows</span></h1>
          <p className="text-subtle" style={{ marginBottom: '32px', fontSize: '1.1rem' }}>The ultra-secure, multi-tenant AI Orchestrator designed for high-stakes enterprise coordination.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Zap size={24} color="var(--primary)" /> <span style={{ fontWeight: 500 }}>Microsecond Execution</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Lock size={24} color="var(--success)" /> <span style={{ fontWeight: 500 }}>PII Data Minimization</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Globe size={24} color="#8b5cf6" /> <span style={{ fontWeight: 500 }}>Multi-Tenant Architecture</span></div>
          </div>
        </div>

        {/* Right Auth Panel */}
        <div style={{ width: '400px', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px', border: '1px solid var(--glass-border)' }}>
              <ShieldAlert size={32} color="var(--text-main)" />
            </div>
            <h2>Admin Gateway</h2>
            <p className="text-subtle">Sign in to orchestrate tenants.</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', padding: '12px', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Authentication Failed.')}
              theme="filled_black"
              size="large"
              shape="pill"
              useOneTap
              width="100%"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
