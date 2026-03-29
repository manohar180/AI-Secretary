import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Calendar, Mail, Zap } from 'lucide-react';

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I am your AI Secretary. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userText = input.trim();
    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { text: data.response_text, isBot: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Error connecting to AI Orchestrator.", isBot: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="animate-slide-up"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
        >
          <Bot size={30} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="animate-slide-up glass-panel" style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '380px',
          height: '550px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.15)',
          backgroundColor: 'rgba(15, 23, 42, 0.85)'
        }}>
          {/* Header */}
          <div style={{ background: 'var(--primary)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%' }}>
                <Bot size={20} color="white" />
              </div>
              <span style={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>AI Command Center</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={20} />
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', overflowX: 'auto', borderBottom: '1px solid var(--border-dark)' }}>
            <button onClick={() => setInput('Block tomorrow from 3 PM to 5 PM')} className="btn" style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', whiteSpace: 'nowrap' }}>
              <Calendar size={12} /> Block Time
            </button>
            <button onClick={() => setInput('Draft an email to client about project updates')} className="btn" style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)', whiteSpace: 'nowrap' }}>
              <Mail size={12} /> Draft Email
            </button>
            <button onClick={() => setInput('What is CoordAI?')} className="btn" style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)', whiteSpace: 'nowrap' }}>
              <Zap size={12} /> Questions
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div key={i} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isBot ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  background: msg.isBot ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: msg.isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                  maxWidth: '85%',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: msg.isBot ? '1px solid var(--border-dark)' : 'none'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
                <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '16px 16px 16px 4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', marginRight: '4px', animation: 'fadeIn 1s infinite alternate' }}></span>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', marginRight: '4px', animation: 'fadeIn 1s infinite alternate 0.2s' }}></span>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'fadeIn 1s infinite alternate 0.4s' }}></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-dark)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a command..."
                className="input"
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-dark)', background: 'rgba(255,255,255,0.05)', outline: 'none', color: 'white', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-dark)'}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                style={{ width: '44px', height: '44px', borderRadius: '12px', background: input.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
