import React from 'react';
import { X, Download, MessageSquare, Shield, CheckCircle2, AlertTriangle, Lock, Globe, FileText } from 'lucide-react';

export default function DetailedReportModal({ scanData, onClose, onAskAI }) {
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
    security_summary = '',
    content_analysis = {},
    created_at = new Date().toISOString()
  } = scanData;

  const handlePrintDownload = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }}>
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        background: '#fff',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Detailed Security Audit</h2>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Report ID: #{id} • Generated on {new Date(created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Target Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>DOMAIN / HOST</div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-dark)' }}>{domain}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>SAFETY SCORE</div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: risk_score >= 80 ? 'var(--success)' : 'var(--danger)' }}>
              {risk_score}/100 ({risk_level} RISK)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>DOMAIN REGISTRATION</div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-dark)' }}>{domain_age}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>SSL/TLS ENCRYPTION</div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: ssl_status ? 'var(--success)' : 'var(--danger)' }}>
              {ssl_status ? 'Active & Valid' : 'Insecure / Missing'}
            </div>
          </div>
        </div>

        {/* AI Synthesis */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>Executive AI Assessment</h4>
          <p style={{
            fontSize: '0.92rem',
            lineHeight: 1.6,
            color: 'var(--text-body)',
            padding: '16px',
            background: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #bfdbfe'
          }}>
            {security_summary}
          </p>
        </div>

        {/* Technical Checks Table */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Telemetry & Threat Indicators</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-muted)' }}>Phishing Flag:</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: phishing_detected ? 'var(--danger)' : 'var(--success)' }}>
                  {phishing_detected ? '⚠️ DETECTED' : '✓ CLEAN'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-muted)' }}>Malware Flag:</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: malware_detected ? 'var(--danger)' : 'var(--success)' }}>
                  {malware_detected ? '⚠️ FLAGGED' : '✓ CLEAN'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-muted)' }}>Redirect Integrity:</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: suspicious_redirects ? 'var(--warning)' : 'var(--success)' }}>
                  {suspicious_redirects ? '⚠️ Suspicious Hops Flagged' : '✓ Normal Route'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-muted)' }}>Form Security:</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600 }}>
                  {content_analysis?.insecure_password_form ? 'Insecure Password Field' : 'No credential harvesting identified'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recommendations */}
        {content_analysis?.ai_recommendations && content_analysis.ai_recommendations.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>Actionable Precautions</h4>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {content_analysis.ai_recommendations.map((rec, i) => (
                <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button
            onClick={() => {
              onClose();
              onAskAI(`Tell me more about the technical details of the scan for ${domain}.`);
            }}
            className="btn btn-primary"
          >
            <MessageSquare size={16} /> Ask AI About This Report
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrintDownload}
              className="btn btn-secondary"
            >
              <Download size={16} /> Print / Download
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
