import { Bell, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function TopNav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass-panel topnav" style={{ borderRadius: '0', borderTop: 'none', borderLeft: 'none', borderRight: 'none', display: 'flex', alignItems: 'center', gap: '24px', zIndex: 10 }}>
      
      <button onClick={toggleTheme} className="btn" style={{ padding: '8px', background: 'transparent', border: 'none' }} title="Toggle Theme">
        {theme === 'dark' ? <Sun size={20} color="var(--text-muted)" /> : <Moon size={20} color="var(--text-muted)" />}
      </button>

      <div style={{ position: 'relative', cursor: 'pointer' }}>
        <Bell size={20} color="var(--text-muted)" />
        <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--primary)', width: '8px', height: '8px', borderRadius: '50%' }}></span>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.tenantId}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%' }}>
          <User size={20} />
        </div>
      </div>

    </header>
  );
}
