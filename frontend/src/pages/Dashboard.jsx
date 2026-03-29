import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, ChevronDown, Edit3, Trash2, XCircle } from 'lucide-react';
import { orchestratorApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [metrics, setMetrics] = useState({ active_workflows: 0, emails_drafted: 0, hours_saved: 0.0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  const [approved, setApproved] = useState([]);
  const [discarded, setDiscarded] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  const fetchData = async () => {
    try {
      const liveTasks = await orchestratorApi.getWorkflows();
      const liveActivity = await orchestratorApi.getActivityFeed();
      const liveMetrics = await orchestratorApi.getMetrics();
      setTasks(liveTasks.filter(t => !approved.includes(t.id) && !discarded.includes(t.id)));
      setActivity(liveActivity);
      setMetrics(liveMetrics);
    } catch (e) {
      console.error("Dashboard fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [approved, discarded]);

  const handleSyncInbox = async () => {
    setSyncing(true);
    try {
      await orchestratorApi.syncInbox();
      await fetchData();
    } catch (e) {
      alert("Failed to sync inbox.");
    } finally {
      setSyncing(false);
    }
  };

  const handleApprove = async (task) => {
    setApproved((prev) => [...prev, task.id]);
    try {
      if (editingId === task.id) {
        await orchestratorApi.updateTask(task.id, editDraft);
        setEditingId(null);
      }
      await orchestratorApi.approveTask(task.id);
      setTimeout(() => setTasks((prev) => prev.filter(t => t.id !== task.id)), 1500);
    } catch (e) {
      setApproved((prev) => prev.filter(id => id !== task.id));
    }
  };

  const handleDiscard = async (taskId) => {
    setDiscarded((prev) => [...prev, taskId]);
    try {
      await orchestratorApi.discardTask(taskId);
      setEditingId(null);
    } catch (e) {
      setDiscarded((prev) => prev.filter(id => id !== taskId));
    }
  };

  const handleTrashGmail = async (taskId) => {
    setDiscarded((prev) => [...prev, taskId]);
    try {
      await orchestratorApi.trashTask(taskId);
      setEditingId(null);
    } catch (e) {
      setDiscarded((prev) => prev.filter(id => id !== taskId));
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', gap: '32px', maxWidth: '1200px', margin: '0 auto', alignItems: 'flex-start' }}>
      
      {/* Center Feed Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Welcome Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2.4rem', margin: '0 0 12px 0', lineHeight: 1.1 }}>Hi,<br/>{user?.name.split(' ')[0] || 'Admin'}</h1>
            <p className="text-subtle" style={{ maxWidth: '280px', lineHeight: 1.5 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })} — {tasks.length} {tasks.length === 1 ? 'action' : 'actions'} needing review
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn" onClick={handleSyncInbox} disabled={syncing}>
               <RefreshCw size={16} className={syncing ? 'spin' : ''} /> {syncing ? 'Scanning...' : 'Sync Inbox'}
            </button>
            <button className="btn btn-primary" onClick={handleSyncInbox} disabled={syncing}>
              + New deal
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="glass-panel" style={{ flex: 1, padding: '20px' }}>
            <div style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: 300 }}>{metrics.active_workflows}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Deals</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}>Live Negotiations</div>
          </div>
          <div className="glass-panel" style={{ flex: 1, padding: '20px', borderLeft: '3px solid var(--warning)' }}>
            <div style={{ fontSize: '2rem', color: 'var(--warning)', fontWeight: 300 }}>{tasks.length}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--warning)' }}>Awaiting approval</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px' }}>Action needed</div>
          </div>
          <div className="glass-panel" style={{ flex: 1, padding: '20px' }}>
            <div style={{ fontSize: '2rem', color: 'var(--success)', fontWeight: 300 }}>{metrics.emails_drafted}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total AI Actions</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}>Saved {metrics.hours_saved} hours</div>
          </div>
        </div>

        {/* Needs Your Decision (Approval Queue) */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Needs your decision <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'normal' }}>({tasks.length})</span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {tasks.length === 0 && !loading && (
              <div className="glass-panel text-subtle" style={{ textAlign: 'center', padding: '32px' }}>
                <CheckCircle2 size={32} style={{margin: '0 auto 12px', color: 'var(--success)'}}/>
                Inbox is clear. Press "Share intake form" (Sync) to poll Gmail!
              </div>
            )}
            
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="glass-panel animate-slide-up" 
                style={{
                  borderLeft: '4px solid var(--warning)',
                  padding: '24px',
                  opacity: discarded.includes(task.id) || approved.includes(task.id) ? 0.5 : 1,
                  transform: discarded.includes(task.id) ? 'scale(0.95)' : 'scale(1)',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>{task.tenant}</h4>
                    {task.contact_email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.contact_email}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence {task.confidence}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.stage === 'INBOUND_EMAIL' ? 'Inbox Scan' : 'Auto'}</div>
                  </div>
                </div>

                {task.summary && (
                  <div style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '4px', fontWeight: 600 }}>AI Executive Summary</div>
                    <div className="text-subtle" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{task.summary}</div>
                  </div>
                )}

                {editingId === task.id ? (
                  <textarea 
                    style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--primary)', resize: 'vertical', fontSize: '0.9rem', lineHeight: '1.5', outline: 'none', marginBottom: '16px' }}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                  />
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                    {task.draftContent}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="btn" 
                    style={{ background: 'white', color: 'black', fontWeight: 600, padding: '10px 20px' }}
                    onClick={() => handleApprove(task)}
                    disabled={approved.includes(task.id)}
                  >
                    {approved.includes(task.id) ? 'Sending...' : editingId === task.id ? 'Save & Send' : 'Approve & Send'}
                  </button>
                  
                  {editingId !== task.id ? (
                    <button className="btn" onClick={() => { setEditingId(task.id); setEditDraft(task.draftContent); }}>
                      <Edit3 size={16} style={{ marginRight: '6px' }} /> Edit first
                    </button>
                  ) : (
                    <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                  )}

                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button className="btn" style={{ color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.3)' }} onClick={() => handleDiscard(task.id)}>
                      <XCircle size={16} style={{ marginRight: '6px' }} /> Discard Draft
                    </button>
                    <button className="btn" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => handleTrashGmail(task.id)}>
                      <Trash2 size={16} style={{ marginRight: '6px' }} /> Trash original Gmail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>What AI did while you were away</h3>
          <div className="glass-panel" style={{ padding: '0' }}>
            {activity.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity.</div>
            ) : (
              activity.map((act, i) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', borderBottom: i < activity.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.type === 'trashed' ? 'var(--danger)' : 'var(--success)', marginTop: '6px' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px' }}>{act.message}</div>
                    <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>{act.type === 'trashed' ? 'trashed' : 'auto'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.time}</div>
                </div>
              ))
            )}
            
            {/* Removed hardcoded history matching design */}
          </div>
        </div>
      </div>

      {/* Right Deal Health Column */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0' }}>Active Deals</h3>
        
        {tasks.length === 0 ? (
          <div className="glass-panel text-subtle" style={{ textAlign: 'center', padding: '24px', fontSize: '0.9rem' }}>
            Pipeline is clean. Hook an inbox or share your intake form.
          </div>
        ) : (
          tasks.slice(0, 4).map((task, i) => (
            <div key={`${task.id}-deal`} className="glass-panel" style={{ padding: '20px' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <h4 style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                  {task.tenant}
                </h4>
                <span style={{ 
                  fontSize: '0.7rem', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold',
                  background: i === 0 ? 'var(--primary)' : 'rgba(245, 158, 11, 0.2)',
                  color: i === 0 ? 'white' : '#fcd34d'
                }}>
                  {i === 0 ? 'New Lead' : 'Negotiating'}
                </span>
              </div>
              <p className="text-subtle" style={{ fontSize: '0.8rem', marginBottom: '12px' }}>
                {task.contact_email} · Day {task.daysPending}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--success)' }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%' }}></div> 
                AI drafting: {task.actionElected}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
