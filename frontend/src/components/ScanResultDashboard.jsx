import React from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, AlertTriangle, Lock, Globe,
  ArrowRight, MessageSquare, RefreshCw, FileText, CheckCircle2,
  ExternalLink, Sparkles, AlertOctagon, HelpCircle
} from 'lucide-react';

export default function ScanResultDashboard({ scanData, onAskAI, onScanAgain, onViewDetails }) {
  if (!scanData) return null;

  const {
    id,
    url,
    domain,
    risk_score = 86,
    risk_level = 'LOW',
    ssl_status = true,
    phishing_detected = false,
    malware_detected = false,
    suspicious_redirects = false,
    domain_age = '8 months',
    security_summary = 'No major suspicious indicators were detected.',
    created_at = new Date().toISOString(),
    content_analysis = {}
  } = scanData;

  // Format date
  const formattedDate = new Date(created_at).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Color schemes based on score/level
  const isSafe = risk_score >= 80;
  const isMedium = risk_score >= 60 && risk_score < 80;
  const isDangerous = risk_score < 60;

  const scoreColor = isSafe ? '#16A34A' : isMedium ? '#F59E0B' : '#DC2626';
  const scoreBg = isSafe ? '#f0fdf4' : isMedium ? '#fffbeb' : '#fef2f2';

  // 6 Security cards configuration
  const securityCards = [
    {
      title: 'SSL Certificate',
      status: ssl_status ? 'Secure' : 'Insecure / Missing',
      isGood: ssl_status,
      desc: ssl_status ? 'Valid active TLS encryption verified' : 'No valid SSL certificate found',
      icon: <Lock size={22} color={ssl_status ? 'var(--success)' : 'var(--danger)'} />
    },
    {
      title: 'Phishing Detection',
      status: phishing_detected ? 'Phishing Detected' : 'No Threat Detected',
      isGood: !phishing_detected,
      desc: phishing_detected ? 'Deceptive forms or brand mimicry flagged' : 'No spoofed branding or credential harvesting',
      icon: <ShieldAlert size={22} color={!phishing_detected ? 'var(--success)' : 'var(--danger)'} />
    },
    {
      title: 'Malware Indicators',
      status: malware_detected ? 'Malware Flagged' : 'No Threat Detected',
      isGood: !malware_detected,
      desc: malware_detected ? 'Deceptive overlays or exploits detected' : 'DOM clean of exploit vectors & hidden iframes',
      icon: <AlertOctagon size={22} color={!malware_detected ? 'var(--success)' : 'var(--danger)'} />
    },
    {
      title: 'Suspicious Redirects',
      status: suspicious_redirects ? 'Suspicious Chains' : 'None Detected',
      isGood: !suspicious_redirects,
      desc: suspicious_redirects ? 'Cross-domain hops or protocol downgrade' : 'Direct connection to intended host',
      icon: <RefreshCw size={22} color={!suspicious_redirects ? 'var(--success)' : 'var(--warning)'} />
    },
    {
      title: 'Domain Age',
      status: domain_age,
      isGood: !domain_age.includes('days'),
      isNeutral: domain_age.includes('months'),
      desc: domain_age.includes('days')
        ? 'High risk: Newly created disposable domain'
        : 'Registered domain age from RDAP records',
      icon: <Globe size={22} color={domain_age.includes('days') ? 'var(--danger)' : 'var(--primary)'} />
    },
    {
      title: 'URL Structure',
      status: phishing_detected || suspicious_redirects ? 'Anomalous' : 'Normal',
      isGood: !phishing_detected && !suspicious_redirects,
      desc: 'Standard URL syntax and reputable top-level domain',
      icon: <CheckCircle2 size={22} color={!phishing_detected ? 'var(--success)' : 'var(--danger)'} />
    }
  ];

  return (
    <div className="fade-in" style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Header Card */}
      <div className="card" style={{ padding: '24px 32px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em' }}>
              WEBSITE SECURITY REPORT
            </div>
            <h1 style={{ fontSize: '1.8rem', marginTop: '2px', wordBreak: 'break-all' }}>{domain}</h1>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Target: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-body)' }}>{url}</span> • Scanned on {formattedDate}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => onAskAI(`Why did this website receive a score of ${risk_score}?`)}
              className="btn btn-primary"
            >
              <MessageSquare size={17} /> Ask AI Assistant
            </button>
            <button
              onClick={onScanAgain}
              className="btn btn-secondary"
            >
              Scan Another
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Circular Gauge & Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Risk Score Circular Card */}
        <div className="card" style={{
          padding: '36px 28px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: scoreBg,
          borderColor: isSafe ? 'var(--success-border)' : isMedium ? 'var(--warning-border)' : 'var(--danger-border)'
        }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px' }}>
            OVERALL SAFETY SCORE
          </div>

          {/* Large Circular Gauge */}
          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: `conic-gradient(${scoreColor} 0% ${risk_score}%, #e2e8f0 ${risk_score}% 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px ${scoreColor}25`,
            marginBottom: '20px'
          }}>
            <div style={{
              width: '126px',
              height: '126px',
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '2.8rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                {risk_score}
              </span>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                / 100
              </span>
            </div>
          </div>

          <div style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: scoreColor,
            marginBottom: '6px'
          }}>
            {risk_level} RISK
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
            Based on the automated technical security indicators analyzed.
          </p>
        </div>

        {/* AI Security Summary Card */}
        <div className="card" style={{
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderLeft: '4px solid var(--primary)'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>AI Security Analysis</h3>
            </div>

            <p style={{
              fontSize: '1.02rem',
              color: 'var(--text-dark)',
              lineHeight: 1.6,
              marginBottom: '20px'
            }}>
              “{security_summary}”
            </p>

            {/* AI Risks or Insights */}
            {content_analysis?.ai_risks && content_analysis.ai_risks.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  DETECTED RISK FACTORS:
                </div>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {content_analysis.ai_risks.map((risk, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <button
              onClick={() => onAskAI(`Explain this scan result for ${domain} in simple words.`)}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              <MessageSquare size={16} /> Explain This Result
            </button>
            <button
              onClick={onViewDetails}
              className="btn btn-secondary"
            >
              <FileText size={16} /> Full Report
            </button>
          </div>
        </div>
      </div>

      {/* 6 Security Status Cards Section */}
      <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Security Status Breakdown</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {securityCards.map((card, idx) => (
          <div key={idx} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{card.title}</div>
                <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  marginTop: '4px',
                  color: card.isGood ? 'var(--success)' : card.isNeutral ? 'var(--warning)' : 'var(--danger)'
                }}>
                  {card.status}
                </div>
              </div>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {card.icon}
              </div>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
