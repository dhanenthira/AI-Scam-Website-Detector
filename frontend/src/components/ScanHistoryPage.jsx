import React, { useState, useEffect } from 'react';
import { Search, Trash2, Eye, ExternalLink, ShieldCheck, ShieldAlert, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { apiGetScanHistory, apiDeleteScan } from '../services/api';

export default function ScanHistoryPage({ onSelectScan, onScanNew }) {
  const [scans, setScans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await apiGetScanHistory();
      setScans(data || []);
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this scan record?")) {
      await apiDeleteScan(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      (scan.domain || scan.url || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterRisk === 'ALL' || (scan.risk_level || '').toUpperCase() === filterRisk;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fade-in" style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header & Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Scan History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
            Review past website risk assessments and threat telemetry records.
          </p>
        </div>

        <button onClick={onScanNew} className="btn btn-primary">
          + Scan New Website
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            flex: '1 1 260px'
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search website or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.92rem'
              }}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterRisk(tier)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: filterRisk === tier ? 'var(--primary)' : 'var(--border-color)',
                  background: filterRisk === tier ? 'var(--primary-light)' : '#fff',
                  color: filterRisk === tier ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'var(--transition)'
                }}
              >
                {tier === 'ALL' ? 'All Risks' : `${tier.charAt(0) + tier.slice(1).toLowerCase()} Risk`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Table / List */}
      {filteredScans.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--text-muted)'
          }}>
            <Search size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No scans yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '360px', margin: '0 auto 20px' }}>
            {searchQuery
              ? "No scan records match your filter criteria. Try adjusting your query."
              : "Enter a website URL above to start your first security analysis."}
          </p>
          <button onClick={onScanNew} className="btn btn-primary">
            Scan a Website
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    WEBSITE
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    RISK TIER
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    SAFETY SCORE
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    DATE
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map((scan) => {
                  const level = (scan.risk_level || 'LOW').toUpperCase();
                  const isLow = level === 'LOW';
                  const isMed = level === 'MEDIUM';
                  const isHigh = level === 'HIGH' || level === 'CRITICAL';

                  return (
                    <tr
                      key={scan.id}
                      onClick={() => onSelectScan(scan)}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.94rem' }}>
                          {scan.domain || scan.url}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {scan.url}
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span className={`badge ${isLow ? 'badge-low' : isMed ? 'badge-medium' : 'badge-high'}`}>
                          {level}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            color: isLow ? 'var(--success)' : isMed ? 'var(--warning)' : 'var(--danger)'
                          }}>
                            {scan.risk_score}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/ 100</span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {new Date(scan.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectScan(scan);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                          >
                            <Eye size={14} /> View Report
                          </button>
                          <button
                            onClick={(e) => handleDelete(scan.id, e)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete Scan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
