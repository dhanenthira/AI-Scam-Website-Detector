import React, { useState, useRef, useEffect } from 'react';
import {
  Shield, Globe, Search, AlertTriangle, CheckCircle2,
  LayoutDashboard, History, Bot, FileText, Settings, LogOut,
  Sparkles, ExternalLink, ShieldCheck, ShieldAlert, Send, User, Loader2
} from 'lucide-react';
import { apiChatWithAI, apiScanWebsite } from '../services/api';

export default function ScannerDashboard({
  onAnalyze,
  activeSidebarItem = 'scanner',
  onSelectSidebar,
  user,
  onLogout
}) {
  const [url, setUrl] = useState('https://example.com');
  const [errorMsg, setErrorMsg] = useState('');

  // Embedded AI Security Assistant State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hi! I'm your ScamGuard AI Security Assistant. Ask me anything about this website, its SSL encryption, potential phishing traps, or if it's safe to enter personal data.",
      timestamp: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [activeScanContext, setActiveScanContext] = useState(null);
  const chatScrollRef = useRef(null);

  const suggestedQuestions = [
    'Is this website safe?',
    'What risks did you find?',
    'Can I enter personal information?',
    'Explain this in simple words'
  ];

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMsg('Please enter a website URL.');
      return;
    }
    setErrorMsg('');
    onAnalyze(url.trim());
  };

  const handleAskAI = async (queryText) => {
    const query = queryText || chatInput;
    if (!query || !query.trim() || isAiTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      // If we don't have a cached scan for this URL, run a background scan first to ground the AI
      let scanData = activeScanContext;
      const targetUrl = url.trim() || 'https://example.com';
      if (!scanData || scanData.url !== targetUrl) {
        scanData = await apiScanWebsite(targetUrl);
        setActiveScanContext(scanData);
      }

      // Query AI assistant with technical scan context
      const answer = await apiChatWithAI(scanData.id, query.trim());

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorReply = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "I was unable to retrieve a response from the security analysis model. Please check the website URL and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const sampleUrls = [
    { label: 'Safe Site (example.com)', url: 'https://example.com', safe: true },
    { label: 'Phishing Threat (paypal-update.xyz)', url: 'http://paypal-security-update.xyz/login', safe: false },
    { label: 'Social Engineering Scam (lottery-claims.top)', url: 'http://lottery-winner-claims.top/verify', safe: false }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      minHeight: 'calc(100vh - 72px)',
      background: 'var(--bg-main)'
    }} className="dashboard-layout">
      {/* Sidebar */}
      <aside style={{
        background: '#0F172A',
        color: '#fff',
        padding: '28px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid #1E293B'
      }} className="sidebar">
        <div>
          {/* Sidebar Brand Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '32px',
            paddingLeft: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Shield size={18} />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              ScamGuard <span style={{ color: 'var(--secondary)' }}>AI</span>
            </span>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'landing', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { id: 'scanner', label: 'Scan Website', icon: <Globe size={18} /> },
              { id: 'history', label: 'Scan History', icon: <History size={18} /> },
              { id: 'chat', label: 'AI Assistant', icon: <Bot size={18} /> },
            ].map((item) => {
              const active = activeSidebarItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSidebar(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    color: active ? '#fff' : '#94A3B8',
                    background: active ? '#1E293B' : 'transparent',
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.92rem',
                    textAlign: 'left',
                    transition: 'var(--transition)'
                  }}
                >
                  <span style={{ color: active ? 'var(--secondary)' : 'inherit' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom items */}
        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {user ? (
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                color: '#EF4444',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            >
              <LogOut size={16} /> Logout ({user.username})
            </button>
          ) : (
            <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#64748B' }}>
              Guest Mode Active
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ padding: '40px 36px' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Scan a Website</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              Enter any URL to analyze its security posture, detect phishing tactics, and calculate its safety rating.
            </p>
          </div>

          {/* Scanner Input Card */}
          <div className="card" style={{ padding: '32px', marginBottom: '28px' }}>
            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-dark)' }}>
                WEBSITE ADDRESS (URL)
              </label>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '2px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                background: '#fff',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '16px'
              }}>
                <Globe size={22} color="var(--primary)" style={{ marginRight: '10px', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '12px 6px',
                    fontSize: '1.05rem',
                    color: 'var(--text-dark)'
                  }}
                />
              </div>

              {errorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '0.88rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 700 }}
              >
                🔍 Analyze Website
              </button>
            </form>

            {/* ========================================================================= */}
            {/* AI Security Assistant - DIRECTLY BELOW "ANALYZE WEBSITE" AS REQUESTED     */}
            {/* ========================================================================= */}
            <div style={{
              marginTop: '28px',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(6, 182, 212, 0.04))',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 'var(--radius-lg)'
            }}>
              {/* AI Assistant Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Bot size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Ask ScamGuard AI Assistant
                      <span className="badge badge-low" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        LIVE
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Ask any question about <strong style={{ color: 'var(--text-dark)' }}>{url || 'target website'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Grounded on Real-time Analysis
                </div>
              </div>

              {/* Chat Conversation Box */}
              <div style={{
                background: '#fff',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                maxHeight: '260px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '14px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                {chatMessages.map((msg) => {
                  const isAI = msg.sender === 'ai';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        flexDirection: isAI ? 'row' : 'row-reverse'
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isAI ? 'var(--primary)' : '#0F172A',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '0.75rem'
                      }}>
                        {isAI ? <Bot size={16} /> : <User size={15} />}
                      </div>

                      <div style={{ maxWidth: '82%' }}>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          borderTopLeftRadius: isAI ? '2px' : '12px',
                          borderTopRightRadius: isAI ? '12px' : '2px',
                          background: isAI ? '#f8fafc' : 'var(--primary)',
                          color: isAI ? 'var(--text-dark)' : '#ffffff',
                          border: isAI ? '1px solid var(--border-light)' : 'none',
                          fontSize: '0.88rem',
                          lineHeight: 1.5
                        }}>
                          {msg.text}
                        </div>
                        <div style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          textAlign: isAI ? 'left' : 'right',
                          paddingLeft: '2px'
                        }}>
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isAiTyping && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={16} />
                    </div>
                    <div style={{ padding: '8px 14px', background: '#f8fafc', borderRadius: '12px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={14} className="spin-slow" /> Analyzing website & typing answer...
                    </div>
                  </div>
                )}

                <div ref={chatScrollRef} />
              </div>

              {/* Clickable Suggested Questions Chips */}
              <div style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '10px',
                scrollbarWidth: 'none'
              }}>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskAI(q)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: '#fff',
                      border: '1px solid var(--border-color)',
                      color: 'var(--primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    <Sparkles size={12} /> {q}
                  </button>
                ))}
              </div>

              {/* Direct AI Question Input Bar */}
              <div style={{
                display: 'flex',
                background: '#fff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 8px',
                boxShadow: 'var(--shadow-xs)',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder={`Ask AI about ${url || 'this website'} (e.g. 'Is this website safe?')...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAskAI();
                    }
                  }}
                  disabled={isAiTyping}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '8px 10px',
                    fontSize: '0.9rem',
                    color: 'var(--text-dark)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAskAI()}
                  disabled={!chatInput.trim() || isAiTyping}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                >
                  <Send size={14} /> Send
                </button>
              </div>
            </div>

            {/* Quick Test Samples */}
            <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px' }}>
                TRY SAMPLE WEBSITES:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sampleUrls.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUrl(s.url);
                      onAnalyze(s.url);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid var(--border-color)',
                      textAlign: 'left',
                      fontSize: '0.88rem'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {s.safe ? <ShieldCheck size={16} color="var(--success)" /> : <ShieldAlert size={16} color="var(--danger)" />}
                      {s.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {s.url}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Security Highlights Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                🛡️ SSRF Safe
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Private IP addresses and loopback destinations are safely blocked.
              </div>
            </div>
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                🔒 0 Execution
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Zero downloaded JavaScript is ever executed on your system.
              </div>
            </div>
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                🤖 AI Grounded
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Insights are strictly grounded in verified technical scan facts.
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 840px) {
          .dashboard-layout {
            grid-template-columns: 1fr !important;
          }
          .sidebar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
