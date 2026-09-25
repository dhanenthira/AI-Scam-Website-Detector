import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, Sparkles, AlertCircle, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { apiChatWithAI } from '../services/api';

export default function AIChatPage({ scanData, initialPrompt, onBackToScan }) {
  const currentDomain = scanData?.domain || 'example.com';
  const scanId = scanData?.id || 12;
  const score = scanData?.risk_score || 86;

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hi! I've analyzed ${currentDomain} (Safety Score: ${score}/100, ${scanData?.risk_level || 'LOW'} Risk). Ask me anything about its security, risk factors, or detected indicators.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'Is this website safe?',
    `Why is the risk score ${score}?`,
    'What risks did you find?',
    'Can I enter personal information?',
    'Explain this result simply'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle incoming initial prompt from result page
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text || !text.trim() || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const answer = await apiChatWithAI(scanId, text.trim());
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "I was unable to retrieve a response from the security model. Please verify your connection or try rephrasing your question.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fade-in" style={{
      maxWidth: '920px',
      margin: '0 auto',
      height: 'calc(100vh - 120px)',
      minHeight: '620px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Chat Header Card */}
      <div className="card" style={{
        padding: '16px 24px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToScan}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            title="Back to Scan Result"
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem' }}>ScamGuard AI Assistant</h2>
              <span className="badge badge-low" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                LIVE
              </span>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Analyzing: <strong style={{ color: 'var(--text-dark)' }}>{currentDomain}</strong> • Scan #{scanId}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--success)', fontWeight: 600 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span>
          Context Grounded
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="card" style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '16px'
      }}>
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: isAI ? 'row' : 'row-reverse'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isAI ? 'var(--primary)' : '#0f172a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isAI ? <Bot size={20} /> : <User size={18} />}
              </div>

              {/* Message Bubble */}
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '16px',
                  borderTopLeftRadius: isAI ? '4px' : '16px',
                  borderTopRightRadius: isAI ? '16px' : '4px',
                  background: isAI ? '#f8fafc' : 'var(--primary)',
                  color: isAI ? 'var(--text-dark)' : '#ffffff',
                  border: isAI ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.94rem',
                  lineHeight: 1.55,
                  boxShadow: 'var(--shadow-xs)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  textAlign: isAI ? 'left' : 'right',
                  paddingLeft: '4px'
                }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Bubble Animation */}
        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} />
            </div>
            <div style={{
              padding: '12px 18px',
              borderRadius: '16px',
              borderTopLeftRadius: '4px',
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              display: 'flex',
              gap: '6px'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s 0.2s infinite' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s 0.4s infinite' }}></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        scrollbarWidth: 'none'
      }}>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: '#fff',
              border: '1px solid var(--border-color)',
              color: 'var(--primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={13} /> {q}
          </button>
        ))}
      </div>

      {/* Fixed Bottom Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          display: 'flex',
          background: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          placeholder="Ask anything about this website (e.g. 'Why should I be careful?')..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isTyping}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '10px 14px',
            fontSize: '0.96rem',
            color: 'var(--text-dark)'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="btn btn-primary"
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            opacity: !inputText.trim() || isTyping ? 0.6 : 1
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
