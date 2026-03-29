import { useState } from 'react';
import { api } from '../api/client';
import { CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function IntakeForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    outlets: '',
    city: '',
    partnershipType: '',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // We use the auth user if logged in just to get their tenant ID for the demo, 
  // but in reality this would be read from the URL param /intake/:tenantId
  const { user } = useAuth();
  const tenantId = user?.tenantId || "SaaS Provider Admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Fire directly to our Orchestrator python webhook!
      await api.post('/api/v1/workflow/webhook', {
        raw_text: `Intake Form Submission: ${formData.companyName} wants a ${formData.partnershipType} partnership. Notes: ${formData.notes}`,
        tenant_id: formData.companyName,
        contact_email: formData.email,
        context_flags: {
          current_stage: "NEW_LEAD",
          days_in_stage: 0,
          changes_count: 0
        }
      });
      setSubmitted(true);
    } catch (e) {
      alert("Failed to submit intake form. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', maxWidth: '500px', animation: 'slideUp 0.5s ease-out' }}>
          <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>Request Received</h1>
          <p className="text-subtle" style={{ fontSize: '1.1rem', marginBottom: '32px' }}>
            We'll be in touch soon. Expect a meeting invite shortly.
          </p>
          <a href="/" className="btn btn-primary">Return to System</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ background: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
            <Zap size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Partner Intake</h1>
          <p className="text-subtle">Enter your details to initiate a partnership workflow.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Company Name *</label>
              <input required className="input glass-panel" style={{ width: '100%' }} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="e.g. Spice Box" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Your Name *</label>
              <input required className="input glass-panel" style={{ width: '100%' }} value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} placeholder="e.g. Priya" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Work Email *</label>
            <input required type="email" className="input glass-panel" style={{ width: '100%' }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="hello@company.com" />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Number of Outlets</label>
              <input type="number" className="input glass-panel" style={{ width: '100%' }} value={formData.outlets} onChange={e => setFormData({...formData, outlets: e.target.value})} placeholder="50" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>City *</label>
              <input required className="input glass-panel" style={{ width: '100%' }} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Bangalore" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Partnership Type</label>
            <select className="input glass-panel" style={{ width: '100%', appearance: 'none', background: 'rgba(255,255,255,0.05)' }} value={formData.partnershipType} onChange={e => setFormData({...formData, partnershipType: e.target.value})}>
              <option value="Delivery">Delivery / Logistics</option>
              <option value="Procurement">Supplier / Procurement</option>
              <option value="Technology">Technology Integration</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Briefly describe your request</label>
            <textarea className="input glass-panel" rows={3} style={{ width: '100%', resize: 'vertical' }} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Interested in discussing an exclusive regional deal..." />
          </div>

          <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '16px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--primary)' }}>
            <strong>Notice:</strong> I understand this process is assisted by the CoordAI Orchestrator. Scheduling and initial follow-ups may be automated.
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'} <ChevronRight size={16} style={{ marginLeft: '4px' }} />
          </button>
        </form>
      </div>
    </div>
  );
}
