import { Link, useLocation } from 'react-router-dom';
import { 
  Monitor, CheckSquare, Workflow, Settings, Beaker 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const SidebarSection = ({ title, items }) => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '16px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((item) => {
          const isActive = location.pathname === item.path && item.path !== '#';
          return (
            <Link 
              key={item.label} 
              to={item.path} 
              className={`nav-link ${isActive ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: '0.9rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{ background: 'var(--danger)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="sidebar glass-panel" style={{ borderLeft: 'none', flexDirection: 'column', width: '260px', overflowY: 'auto' }}>
      <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--glass-border)', marginBottom: '16px' }}>
        <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '6px' }}>
          <Beaker size={20} color="white" />
        </div>
        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>Coord<span style={{color: 'var(--primary)'}}>AI</span></h2>
      </div>

      <nav style={{ padding: '0 8px', flex: 1 }}>
        
        <div style={{ marginBottom: '24px' }}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} style={{ padding: '8px 16px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
            <Monitor size={18} style={{marginRight: '8px'}}/> Command center
          </Link>
          <Link to="/workflows" className={`nav-link ${location.pathname === '/workflows' ? 'active' : ''}`} style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
            <Workflow size={18} style={{marginRight: '8px'}}/> Workflows
          </Link>
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`} style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
            <Settings size={18} style={{marginRight: '8px'}}/> Identity
          </Link>
          <Link to="/configuration" className={`nav-link ${location.pathname === '/configuration' ? 'active' : ''}`} style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
            <Beaker size={18} style={{marginRight: '8px'}}/> Configuration
          </Link>
        </div>

      </nav>
      
      <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
          {(user?.name || 'A').charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{user?.name || 'Admin'}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI Secretary Access</div>
        </div>
      </div>
    </aside>
  );
}
