import DashboardCard from '@/components/DashboardCard';
import { getDashboardStats } from '@/lib/api';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

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

      <div className="card glass-panel" style={{ marginTop: '24px', borderLeft: '4px solid #3498db' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Data Provenance & Pipeline Truth</span>
          <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-subdued)' }}>
            Mode: {process.env.NEXT_PUBLIC_ANALYSIS_MODE === 'live' ? 'LIVE (Gemini)' : 'MOCK (Offline)'}
          </span>
        </h2>
        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-subdued)', marginBottom: '8px' }}>AI Analysis Status</h3>
            <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><span style={{ display: 'inline-block', width: '100px' }}>Fresh Live:</span> <strong style={{ color: '#ff6b6b' }}>{stats.provenance.live}</strong></div>
              <div><span style={{ display: 'inline-block', width: '100px' }}>Cached Live:</span> <strong style={{ color: '#f39c12' }}>{stats.provenance.cached}</strong></div>
              <div><span style={{ display: 'inline-block', width: '100px' }}>Offline Mock:</span> <strong style={{ color: 'var(--text-subdued)' }}>{stats.provenance.mock}</strong></div>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-subdued)', marginBottom: '8px' }}>Ingestion Sources</h3>
            <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(stats.provenance.sources).map(([src, count]) => (
                <div key={src}><span style={{ display: 'inline-block', width: '100px' }}>{src.replace('_', ' ')}:</span> <strong>{count}</strong></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
