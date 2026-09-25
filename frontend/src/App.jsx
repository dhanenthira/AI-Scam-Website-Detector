import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ScannerDashboard from './components/ScannerDashboard';
import ScanningAnimation from './components/ScanningAnimation';
import ScanResultDashboard from './components/ScanResultDashboard';
import AIChatPage from './components/AIChatPage';
import ScanHistoryPage from './components/ScanHistoryPage';
import DetailedReportModal from './components/DetailedReportModal';
import AuthModal from './components/AuthModal';
import { apiScanWebsite, getSavedUser, clearTokens } from './services/api';
import { Shield, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing'); // 'landing', 'scanner', 'result', 'chat', 'history'
  const [isScanning, setIsScanning] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [currentScan, setCurrentScan] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [chatPrompt, setChatPrompt] = useState('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(getSavedUser());

  // Triggered when a scan is initiated anywhere in the UI
  const handleInitiateScan = async (url) => {
    if (!user) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    setScanError(null);
    setTargetUrl(url);
    setIsScanning(true);

    try {
      // Initiate background API call to Django REST backend
      const scanPromise = apiScanWebsite(url);

      // Scanning animation runs simultaneously for realistic visual feedback
      const resultData = await scanPromise;
      setCurrentScan(resultData);
    } catch (err) {
      setScanError(err.message || 'Unable to analyze this website.');
    }
  };

  // Called when the progress checklist finishes
  const handleScanAnimationComplete = () => {
    setIsScanning(false);
    if (!scanError && currentScan) {
      setActiveTab('result');
    }
  };

  const handleAskAI = (promptText) => {
    setChatPrompt(promptText);
    setActiveTab('chat');
  };

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setActiveTab('landing');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'landing' && !user) {
            setAuthMode('login');
            setAuthModalOpen(true);
            return;
          }
          setScanError(null);
          setActiveTab(tab);
        }}
        user={user}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Body */}
      <div style={{ flex: 1 }}>
        {/* 1. Live Scanning Animation View */}
        {isScanning ? (
          <div className="container" style={{ padding: '40px 0' }}>
            <ScanningAnimation
              url={targetUrl}
              onComplete={handleScanAnimationComplete}
            />
          </div>
        ) : scanError ? (
          /* Error State Card */
          <div className="container" style={{ padding: '60px 0' }}>
            <div className="card fade-in" style={{
              maxWidth: '560px',
              margin: '0 auto',
              padding: '40px 32px',
              textAlign: 'center',
              border: '1px solid var(--danger-border)',
              background: '#fff'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <AlertCircle size={32} />
              </div>
              <h2 style={{ fontSize: '1.45rem', marginBottom: '8px' }}>Unable to analyze this website</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginBottom: '24px' }}>
                {scanError}
              </p>
              <div style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.84rem',
                color: 'var(--text-muted)',
                marginBottom: '24px'
              }}>
                <strong>Common causes:</strong>
                <ul style={{ paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Invalid URL syntax or unsupported protocol</li>
                  <li>Target website host is offline or timed out</li>
                  <li>SSRF security restriction triggered</li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setScanError(null);
                    handleInitiateScan(targetUrl);
                  }}
                  className="btn btn-primary"
                >
                  <RefreshCw size={16} /> Try Again
                </button>
                <button
                  onClick={() => {
                    setScanError(null);
                    setActiveTab('scanner');
                  }}
                  className="btn btn-secondary"
                >
                  Enter Different URL
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Views Switch */
          <>
            {activeTab === 'landing' && (
              <LandingPage
                user={user}
                onOpenAuth={(mode) => {
                  setAuthMode(mode);
                  setAuthModalOpen(true);
                }}
                onGoToDashboard={() => setActiveTab('scanner')}
              />
            )}

            {activeTab === 'scanner' && (
              <ScannerDashboard
                activeSidebarItem="scanner"
                onAnalyze={handleInitiateScan}
                onSelectSidebar={(tab) => {
                  if (tab !== 'landing' && !user) {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                    return;
                  }
                  setActiveTab(tab);
                }}
                user={user}
                onLogout={handleLogout}
              />
            )}

            {activeTab === 'result' && (
              <div className="container" style={{ padding: '36px 0' }}>
                <ScanResultDashboard
                  scanData={currentScan}
                  onAskAI={handleAskAI}
                  onScanAgain={() => setActiveTab('scanner')}
                  onViewDetails={() => setDetailsModalOpen(true)}
                />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="container" style={{ padding: '24px 0' }}>
                <AIChatPage
                  scanData={currentScan}
                  initialPrompt={chatPrompt}
                  onBackToScan={() => setActiveTab(currentScan ? 'result' : 'scanner')}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="container" style={{ padding: '36px 0' }}>
                <ScanHistoryPage
                  onSelectScan={(selected) => {
                    setCurrentScan(selected);
                    setActiveTab('result');
                  }}
                  onScanNew={() => setActiveTab('scanner')}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Technical Detail Modal */}
      {detailsModalOpen && currentScan && (
        <DetailedReportModal
          scanData={currentScan}
          onClose={() => setDetailsModalOpen(false)}
          onAskAI={handleAskAI}
        />
      )}

      {/* Auth Modal (Login / Register) */}
      {authModalOpen && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={(userData) => {
            setUser(userData);
            setActiveTab('scanner'); // Fresh Scanner Dashboard upon Login!
          }}
        />
      )}

      {/* Modern Cybersecurity Footer */}
      <footer style={{
        background: '#0F172A',
        color: '#94A3B8',
        padding: '50px 0 30px',
        borderTop: '1px solid #1E293B',
        marginTop: 'auto'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '40px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', marginBottom: '14px' }}>
                <Shield size={24} color="var(--primary)" />
                <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  ScamGuard <span style={{ color: 'var(--secondary)' }}>AI</span>
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '280px' }}>
                Next-generation automated threat intelligence, phishing prevention, and AI security telemetry for modern web users.
              </p>
            </div>

            <div>
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: '14px', fontSize: '0.92rem' }}>
                NAVIGATION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                <span onClick={() => setActiveTab('landing')} style={{ cursor: 'pointer' }}>Home</span>
                <span onClick={() => setActiveTab('scanner')} style={{ cursor: 'pointer' }}>Website Scanner</span>
                <span onClick={() => setActiveTab('history')} style={{ cursor: 'pointer' }}>Threat History</span>
                <span onClick={() => setActiveTab('chat')} style={{ cursor: 'pointer' }}>AI Security Assistant</span>
              </div>
            </div>

            <div>
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: '14px', fontSize: '0.92rem' }}>
                SECURITY ARCHITECTURE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                <span>SSRF Loopback Defense</span>
                <span>Zero Client-side Code Execution</span>
                <span>2048-bit TLS Verification</span>
                <span>ICANN RDAP Domain Registry</span>
              </div>
            </div>

            <div>
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: '14px', fontSize: '0.92rem' }}>
                BACKEND INTEGRATION
              </div>
              <div style={{ fontSize: '0.86rem', lineHeight: 1.6 }}>
                <div>Connected to Django REST API</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)', marginTop: '4px' }}>
                  http://127.0.0.1:8000/api
                </div>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #1E293B',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.82rem'
          }}>
            <div>
              © 2026 ScamGuard AI. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>API Documentation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
