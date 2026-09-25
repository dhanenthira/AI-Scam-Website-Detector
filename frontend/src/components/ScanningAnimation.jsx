import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';

export default function ScanningAnimation({ url, onComplete }) {
  const steps = [
    { id: 1, label: 'Checking URL syntax & SSRF safety' },
    { id: 2, label: 'Checking SSL/TLS Certificate validity' },
    { id: 3, label: 'Analyzing Domain age & registration records' },
    { id: 4, label: 'Checking Redirect chains & protocol downgrades' },
    { id: 5, label: 'Detecting Phishing & brand impersonation indicators' },
    { id: 6, label: 'Analyzing Website DOM & credential forms' },
    { id: 7, label: 'Generating AI Security Intelligence Report' },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          const next = prev + 1;
          setProgress(Math.round(((next + 1) / steps.length) * 100));
          return next;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 400);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card fade-in" style={{
      maxWidth: '680px',
      margin: '40px auto',
      padding: '40px 32px',
      textAlign: 'center',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Animated Glowing Radar Icon */}
      <div style={{
        width: '74px',
        height: '74px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(6,182,212,0.1))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        color: 'var(--primary)'
      }}>
        <Loader2 size={38} className="spin-slow" />
      </div>

      <h2 style={{ fontSize: '1.65rem', marginBottom: '8px' }}>Analyzing Website Security...</h2>
      <p style={{
        fontSize: '0.94rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        marginBottom: '28px',
        wordBreak: 'break-all'
      }}>
        Target: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{url}</span>
      </p>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        background: '#e2e8f0',
        borderRadius: '999px',
        overflow: 'hidden',
        marginBottom: '32px'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #2563EB, #06B6D4)',
          borderRadius: '999px',
          transition: 'width 0.35s ease'
        }}></div>
      </div>

      {/* Checklist items */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        textAlign: 'left',
        maxWidth: '480px',
        margin: '0 auto'
      }}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.92rem',
                fontWeight: isCurrent ? 700 : isDone ? 500 : 400,
                color: isDone ? 'var(--text-dark)' : isCurrent ? 'var(--primary)' : 'var(--text-light)',
                transition: 'var(--transition)'
              }}
            >
              {isDone ? (
                <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
              ) : isCurrent ? (
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2px solid var(--primary)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                  flexShrink: 0
                }} />
              ) : (
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2px solid #cbd5e1',
                  flexShrink: 0
                }} />
              )}
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
