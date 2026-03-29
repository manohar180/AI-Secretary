import { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Clock, Bot, RefreshCw, Send, Save, Edit3 } from 'lucide-react';
import { orchestratorApi } from '../api/client';

export default function Workflows() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Array of task IDs currently being approved
  const [approved, setApproved] = useState([]);
  
  // ID of the task currently being edited
  const [editingId, setEditingId] = useState(null);
  
  // Temporary state for the draft being edited
  const [editDraft, setEditDraft] = useState("");

  const fetchTasks = async () => {
    try {
      const liveTasks = await orchestratorApi.getWorkflows();
      // Keep approved UI states alive while they fade out
      setTasks(liveTasks.filter(t => !approved.includes(t.id)));
    } catch (e) {
      console.error("Failed to load live workflows:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000); // Live polling!
    return () => clearInterval(interval);
  }, [approved]);

  const handleSyncInbox = async () => {
    setSyncing(true);
    try {
      await orchestratorApi.syncInbox();
      await fetchTasks(); // instantly refresh the dash
    } catch (e) {
      console.error(e);
      alert("Failed to sync inbox. Ensure Google Auth token exists.");
    } finally {
      setSyncing(false);
    }
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditDraft(task.draftContent);
  };

  const handleApprove = async (task) => {
    setApproved((prev) => [...prev, task.id]);
    try {
      // If we are actively editing, save the draft first!
      if (editingId === task.id) {
        await orchestratorApi.updateTask(task.id, editDraft);
        setEditingId(null);
      }
      
      await orchestratorApi.approveTask(task.id);
      
      // Let the glow stay for a second, then remove
      setTimeout(() => {
        setTasks((prev) => prev.filter(t => t.id !== task.id));
      }, 1500);
    } catch (e) {
      console.error("Approval flow failed:", e);
      setApproved((prev) => prev.filter(id => id !== task.id));
    }
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '1000px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1>Approval Queue</h1>
          <p className="text-subtle">Review and manually dispatch AI-proposed administrative actions.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSyncInbox} disabled={syncing}>
          <RefreshCw size={18} className={syncing ? 'spin' : ''} />
          {syncing ? 'Scanning Inbox...' : 'Sync Inbox'}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '16px' }} />
          <h2>All Caught Up!</h2>
          <p className="text-subtle">Click 'Sync Inbox' to pull new emails for AI summarization.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="glass-panel" 
              style={{
                transition: 'all 0.5s ease',
                transform: approved.includes(task.id) ? 'scale(0.98)' : 'scale(1)',
                opacity: approved.includes(task.id) ? 0.7 : 1,
                border: approved.includes(task.id) ? '1px solid var(--success)' : ''
              }}
            >
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {task.daysPending > 0 ? (
                    <span className="badge badge-pending">
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                      {task.daysPending} Days Pending
                    </span>
                  ) : null}
                  <span className="badge badge-ai">
                    <Bot size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    {task.stage === 'INBOUND_EMAIL' ? 'Inbox Scan' : 'Auto-Drafted'}
                  </span>
                </div>
                <div style={{ fontWeight: '600' }}>{task.tenant}</div>
              </div>

              <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                
                {/* Contact Email / Thread Display */}
                {task.contact_email && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Processing Thread with:</div>
                    <strong style={{ fontSize: '1rem' }}>{task.contact_email}</strong>
                  </div>
                )}
                
                {/* Outline AI Summary if it exists */}
                {task.summary && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--text-main)' }}>AI Executive Summary</h3>
                    <div className="text-subtle" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', paddingLeft: '16px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                      {task.summary}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Mail size={18} color="var(--success)" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Proposed Action: Reply</h3>
                </div>
                <p className="text-subtle">AI Confidence Score: <strong style={{color: 'var(--text-main)'}}>{task.confidence}</strong></p>
                
                {editingId === task.id ? (
                  <textarea 
                    className="email-preview"
                    style={{ 
                      width: '100%', 
                      minHeight: '200px', 
                      outline: 'none', 
                      border: '1px solid var(--primary)', 
                      resize: 'vertical' 
                    }}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                  />
                ) : (
                  <div className="email-preview">
                    {task.draftContent}
                  </div>
                )}
              </div>

              <div className="flex-between" style={{ marginTop: '16px' }}>
                {editingId === task.id ? (
                  <button className="btn" onClick={() => setEditingId(null)}>Cancel Edit</button>
                ) : (
                  <button className="btn" onClick={() => startEditing(task)} disabled={approved.includes(task.id)}>
                    <Edit3 size={16} /> Edit Draft
                  </button>
                )}
                
                <button 
                  className="btn btn-success" 
                  onClick={() => handleApprove(task)}
                  disabled={approved.includes(task.id)}
                  style={{ minWidth: '160px', justifyContent: 'center' }}
                >
                  {approved.includes(task.id) ? (
                    'Dispatching...'
                  ) : editingId === task.id ? (
                    <><Save size={18} /> Save & Send</>
                  ) : (
                    <><Send size={18} /> Approve & Send</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
