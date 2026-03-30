import { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { orchestratorApi } from '../api/client';

export default function Knowledge() {
  const [docs, setDocs] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/knowledge');
      const data = await response.json();
      setDocs(data.sources || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const resp = await fetch('http://localhost:8000/api/v1/knowledge/upload', {
        method: 'POST',
        body: formData
      });
      if (resp.ok) {
        await fetchDocs();
      } else {
        const errorData = await resp.json();
        alert(`Upload Failed: ${errorData.detail}`);
      }
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Knowledge Base</h1>
        <p className="text-subtle">Securely upload PDFs and text documents. The AI strictly computes dense vector embeddings offline to retrieve exact proprietary facts instantly during conversations.</p>
      </div>

      <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Real Drag & Drop Zone */}
        <div 
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          style={{ 
            border: `2px dashed ${isDragging ? '#8b5cf6' : 'var(--glass-border)'}`, 
            borderRadius: '16px', 
            padding: '40px 20px', 
            textAlign: 'center', 
            background: isDragging ? 'rgba(139, 92, 246, 0.05)' : 'rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '32px'
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFileUpload(e.target.files[0])} 
            style={{ display: 'none' }} 
            accept=".txt,.pdf"
          />
          
          {isUploading ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <div style={{ fontSize: '0.9rem', color: '#a78bfa', fontWeight: 600 }}>Chunking & Vectorizing into ChromaDB...</div>
            </div>
          ) : (
            <>
              <div style={{ background: 'rgba(255,255,255,0.05)', width: 64, height: 64, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                <UploadCloud size={32} color={isDragging ? '#8b5cf6' : 'var(--text-muted)'} />
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Click or drag a file to mathematically embed</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Strictly localized processing. PDF, TXT supported.</div>
            </>
          )}
          
          <style>
            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
          </style>
        </div>

        {/* Database List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>Active Vector Models</h4>
            <span style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', color: '#c4b5fd', padding: '2px 8px', borderRadius: '12px' }}>{docs.length} active documents</span>
          </div>
          
          {docs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed var(--glass-border)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Your ChromaDB instance is currently empty.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {docs.map(doc => (
                <div key={doc.id} className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={18} color="#94a3b8" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>{doc.filename}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                        <span>{doc.size_str}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                      </div>
                    </div>
                  </div>
                  {doc.status === 'active' ? (
                     <CheckCircle2 size={16} color="#34d399" />
                  ) : doc.status === 'failed' ? (
                     <AlertCircle size={16} color="#ef4444" />
                  ) : (
                     <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 2s infinite' }}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
