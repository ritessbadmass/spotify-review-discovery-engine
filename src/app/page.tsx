'use client';

import { useEffect, useState } from 'react';
import DashboardCard from '@/components/DashboardCard';
import { getDashboardStats } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  if (!stats) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subdued)' }}>Loading dashboard statistics...</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '8px' }}>Dashboard Overview</h1>
      <p style={{ color: 'var(--text-subdued)', marginBottom: '32px' }}>
        High-level insights across all ingested feedback sources.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <DashboardCard 
          title="Total Reviews Analyzed" 
          value={stats.totalReviews} 
        />
        <DashboardCard 
          title="Negative Feedback" 
          value={`${stats.negativeFeedbackPercentage}%`} 
          highlight
        />
        <DashboardCard 
          title="Top Problem" 
          value={stats.topProblem} 
          subtitle="Most frequent discovery issue"
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        <div className="card glass-panel">
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Top Affected Segment</h2>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--spotify-green)', marginBottom: '8px' }}>
            {stats.topSegment}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-subdued)' }}>
            This user group experiences the most discovery friction.
          </p>
        </div>

        <div className="card glass-panel">
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Top Unmet Need</h2>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '8px' }}>
            {stats.topUnmetNeed}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-subdued)' }}>
            Addressing this need will unlock the most value for discovery.
          </p>
        </div>
      </div>

      <div className="card glass-panel" style={{ marginTop: '24px', borderLeft: process.env.NEXT_PUBLIC_ANALYSIS_MODE === 'live' ? '4px solid var(--spotify-green)' : '4px dashed #f39c12' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Data Provenance & Pipeline Truth</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: process.env.NEXT_PUBLIC_ANALYSIS_MODE === 'live' ? 'var(--spotify-green)' : '#f39c12', backgroundColor: 'rgba(243, 156, 18, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
            {process.env.NEXT_PUBLIC_ANALYSIS_MODE === 'live' ? 'LIVE LLM MODE' : 'MOCK HYPOTHESIS MODE'}
          </span>
        </h2>
        
        {process.env.NEXT_PUBLIC_ANALYSIS_MODE !== 'live' && (
          <div style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#f39c12', borderLeft: '2px solid #f39c12' }}>
            <strong>Reviewer Note:</strong> The pipeline is currently running offline mock data. Insights shown are AI-generated hypotheses for demonstration purposes, not validated user findings. Connect to the Live LLM for real processing.
          </div>
        )}

        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-subdued)', marginBottom: '8px' }}>AI Analysis Status</h3>
            <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ display: 'inline-block', width: '120px', color: 'var(--text-subdued)' }}>Fresh Live API:</span> 
                <strong style={{ color: 'var(--spotify-green)', backgroundColor: 'rgba(29, 185, 84, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{stats.provenance.live} records</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ display: 'inline-block', width: '120px', color: 'var(--text-subdued)' }}>Cached Live:</span> 
                <strong style={{ color: '#f39c12', backgroundColor: 'rgba(243, 156, 18, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{stats.provenance.cached} records</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ display: 'inline-block', width: '120px', color: 'var(--text-subdued)' }}>Offline Mock:</span> 
                <strong style={{ color: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{stats.provenance.mock} hypotheses</strong>
              </div>
            </div>
            {stats.provenance.confidenceAverage && (
              <div style={{ marginTop: '16px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-subdued)' }}>Avg LLM Confidence: </span>
                <strong style={{ color: 'var(--text-highlight)' }}>{stats.provenance.confidenceAverage * 100}%</strong>
              </div>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-subdued)', marginBottom: '8px' }}>Ingestion Sources</h3>
            <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(stats.provenance.sources).map(([src, count]: [string, any]) => (
                <div key={src} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ display: 'inline-block', width: '100px', color: 'var(--text-subdued)' }}>{src.replace('_', ' ')}:</span> 
                  <strong style={{ color: 'var(--text-base)' }}>{count} items</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
