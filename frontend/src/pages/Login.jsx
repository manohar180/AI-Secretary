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
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      setError('Backend authentication failed or email not authorized.');
    }
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', background: '#020617' }}>
      <div className="ambient-orb orb-1" style={{ background: '#3b82f6', opacity: 0.25, transform: 'scale(1.2)' }}></div>
      <div className="ambient-orb orb-2" style={{ background: '#10b981', opacity: 0.20, transform: 'scale(1.5)' }}></div>
      <div className="ambient-orb" style={{ background: '#8b5cf6', opacity: 0.15, top: '20%', left: '20%', animation: 'float 20s infinite reverse', transform: 'scale(1.8)' }}></div>
      <div className="ambient-orb" style={{ background: '#eab308', opacity: 0.1, bottom: '10%', right: '30%', animation: 'float 15s infinite', transform: 'scale(0.8)' }}></div>
      
      {/* Landing Page */}
      <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'row', position: 'relative', zIndex: 1, padding: 0, overflow: 'hidden', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        <div style={{ display: 'flex', width: '100%' }}>
            {/* Left Branding Panel */}
            <div style={{ flex: 1.5, padding: '64px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', width: 44, height: 44, borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
                        <Zap color="white" size={24} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#f8fafc', fontWeight: 600 }}>CoordAI <span style={{color: '#94a3b8', fontWeight: 400}}>Enterprise</span></h2>
                </div>
                
                <h1 style={{ fontSize: '3.2rem', margin: '0 0 24px 0', lineHeight: '1.1', fontWeight: 800, color: '#f8fafc', letterSpacing: '-1px' }}>Autonomous <br/><span style={{ background: 'linear-gradient(to right, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 40px rgba(59,130,246,0.2)' }}>B2B Workflows</span></h1>
                <p style={{ marginBottom: '48px', fontSize: '1.15rem', maxWidth: '400px', lineHeight: '1.6', color: '#94a3b8' }}>The ultra-secure AI Secretary designed to mathematically execute high-stakes enterprise scheduling and inbox routing.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="animate-fade-in delay-100" style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}><Lock size={24} color="#34d399" /></div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>Military-Grade PII Shielding</h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Zero-retention inference architecture.</p>
                        </div>
                    </div>
                    <div className="animate-fade-in delay-200" style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px' }}><Globe size={24} color="#a78bfa" /></div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>Mathematical Scheduling Engine</h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>100% deterministic Google Meet generation.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Auth Panel */}
            <div style={{ flex: 1, padding: '64px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a' }}>
            
                <div style={{ textAlign: 'center', width: '100%', maxWidth: '320px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', width: '72px', height: '72px', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.02)' }}>
                        <ShieldAlert size={36} color="#94a3b8" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#f8fafc', fontWeight: 600 }}>Admin Portal</h2>
                    <p style={{ marginBottom: '40px', color: '#64748b', fontSize: '0.95rem' }}>Authenticate via Google Identity Services to access the orchestrator.</p>
                    
                    {error && (
                    <div className="animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '24px' }}>
                        {error}
                    </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', background: 'white', borderRadius: '4px', padding: '2px', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Authentication Failed.')}
                            theme="filled_black"
                            size="large"
                            shape="rectangular"
                            useOneTap
                            width="316"
                        />
                    </div>
                    
                    <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <ShieldAlert size={16} color="#3b82f6" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Access Architecture</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.5' }}>
                            Currently, <strong>global identity verification</strong> is active. Any valid Google account may authenticate to establish a session. However, to deploy autonomous AI capabilities, you must explicitly bind your backend Workspace (Calendar/Gmail) offline inside the internal Configuration portal.
                        </p>
                    </div>
                    
                    <p style={{ marginTop: '24px', fontSize: '0.75rem', color: '#475569' }}>
                        By continuing, you agree to our strictly zero-retention Enterprise Terms of Service.
                    </p>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
