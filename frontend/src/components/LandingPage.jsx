import React, { useState } from 'react';
import {
  Shield, Search, CheckCircle2, ArrowRight, AlertTriangle, Lock,
  Globe, Zap, Bot, BarChart3, FileSearch, MessageSquareText, History,
  ShieldCheck, ShieldAlert
} from 'lucide-react';

export default function LandingPage({ user, onOpenAuth, onGoToDashboard }) {

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section style={{
        padding: '70px 0 90px',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.08), rgba(255,255,255,0))',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '50px',
          alignItems: 'center'
        }}>
          {/* Left Column: Heading & Scanner Bar */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-light)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              color: 'var(--primary)',
              fontSize: '0.84rem',
              fontWeight: 700,
              marginBottom: '20px'
            }}>
              <Zap size={15} /> NEXT-GEN AI WEBSITE THREAT DETECTOR
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.12,
              marginBottom: '20px'
            }}>
              Know Before <br />
              <span style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                You Click.
              </span>
            </h1>

            <p style={{
              fontSize: '1.12rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '520px',
              marginBottom: '32px'
            }}>
              AI-powered website security analysis that helps you identify suspicious, deceptive, and potentially dangerous websites before sharing your personal information.
            </p>

            {/* Call to Action Buttons (Login Required to Scan) */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {user ? (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="btn btn-primary"
                  style={{
                    padding: '14px 32px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <Globe size={20} /> Open Scanner Dashboard <ArrowRight size={18} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('register')}
                    className="btn btn-primary"
                    style={{
                      padding: '14px 32px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <Sparkles size={18} /> Get Started Free <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="btn btn-secondary"
                    style={{
                      padding: '14px 28px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '1.02rem'
                    }}
                  >
                    <Lock size={18} /> Login to Scan
                  </button>
                </>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
              marginBottom: '28px'
            }}>
              <Lock size={15} color="var(--primary)" />
              <span>Authentication required to analyze URLs and store security telemetry reports.</span>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-body)' }}>
                <CheckCircle2 size={18} color="var(--success)" /> AI Powered
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-body)' }}>
                <CheckCircle2 size={18} color="var(--success)" /> Security Analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-body)' }}>
                <CheckCircle2 size={18} color="var(--success)" /> Fast Results
              </div>
            </div>
          </div>

          {/* Right Column: Dashboard Preview Card */}
          <div style={{ position: 'relative' }}>
            <div style={{
              background: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Header inside preview */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }}></div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>Live Security Telemetry</span>
                </div>
                <span className="badge badge-low">SAFE VERIFIED</span>
              </div>

              {/* Gauge Preview */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr',
                gap: '20px',
                alignItems: 'center',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                marginBottom: '20px'
              }}>
                {/* Simulated circular gauge */}
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'conic-gradient(#16a34a 0% 86%, #e2e8f0 86% 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
                }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)' }}>86</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>SAFETY SCORE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success)' }}>LOW RISK</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    SSL active • Zero malware • Domain age: 8 months
                  </div>
                </div>
              </div>

              {/* Mini Status Rows */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>SSL CERTIFICATE</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--success)' }}>🟢 2048-bit TLS</div>
                </div>
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>PHISHING SCAN</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--success)' }}>🟢 Clean</div>
                </div>
              </div>

              {/* AI assistant teaser message */}
              <div style={{
                marginTop: '16px',
                padding: '12px 14px',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(6, 182, 212, 0.06))',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(37, 99, 235, 0.15)',
                display: 'flex',
                gap: '10px'
              }}>
                <Bot size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dark)', lineHeight: 1.45 }}>
                  <strong>ScamGuard AI:</strong> "No major phishing or credential harvesting indicators detected. Safe to browse with standard care."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border-color)', background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 60px' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '12px' }}>How ScamGuard AI Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              Three automated steps protect you from fraudulent domains, malware traps, and phishing schemes.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px',
            position: 'relative'
          }}>
            {/* Step 1 */}
            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontWeight: 800,
                fontSize: '1.2rem'
              }}>
                01
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Enter URL</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.5 }}>
                Paste any website address or link you received via SMS, email, or social media before opening it.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--secondary-light)',
                color: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontWeight: 800,
                fontSize: '1.2rem'
              }}>
                02
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>AI Security Analysis</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.5 }}>
                ScamGuard analyzes SSL status, domain age, redirects, credential harvesting forms, and threat heuristics.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#f0fdf4',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontWeight: 800,
                fontSize: '1.2rem'
              }}>
                03
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Understand Risk</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.5 }}>
                Review a clean risk score, risk level, and ask questions to the dedicated AI security chat assistant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 0', background: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 60px' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '12px' }}>Comprehensive Threat Detection</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              Engineered with modern cybersecurity standards to detect deceptive tactics before damage occurs.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Feature 1 */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Shield size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Scam Detection</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Identify suspicious indicators such as brand impersonation, urgent social engineering language, and fake login requests.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ color: 'var(--secondary)', marginBottom: '16px' }}><Bot size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>AI Analysis</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Get plain-English summaries that explain why a website received its rating without confusing cybersecurity jargon.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ color: 'var(--success)', marginBottom: '16px' }}><BarChart3 size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Risk Score (0 - 100)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                View immediate safety scores and tiered categorizations: LOW, MEDIUM, HIGH, or CRITICAL threat levels.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ color: '#8b5cf6', marginBottom: '16px' }}><FileSearch size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Detailed Inspection</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Inspect SSL certificate validity, domain registration age via RDAP, multi-hop redirect chains, and insecure forms.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><MessageSquareText size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>AI Security Chat</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Ask specific questions about the website, like “Can I enter my payment info?” or “Why is the domain age flagged?”.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ color: 'var(--warning)', marginBottom: '16px' }}><History size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Scan History</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Revisit past scan reports, filter by risk level, export records, or delete past telemetry data at any time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
