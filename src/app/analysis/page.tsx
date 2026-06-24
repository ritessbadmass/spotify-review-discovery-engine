'use client';

import { useEffect, useState } from 'react';
import { getInsightClusters, getSynthesis, fetchExistingItems } from '@/lib/api';
import { InsightCluster, PMSynthesis, SourceItem } from '@/lib/types';

export default function AnalysisPage() {
  const [clusters, setClusters] = useState<InsightCluster[]>([]);
  const [synthesis, setSynthesis] = useState<PMSynthesis | null>(null);
  const [sourceItems, setSourceItems] = useState<SourceItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  const QUERIES = [
    { id: 'q1', label: 'Why do users struggle to discover new music?', filterType: 'frustration' },
    { id: 'q2', label: 'What drives repetitive listening?', filterType: 'repetitive' },
    { id: 'q3', label: 'Which segments are most affected by stale recommendations?', filterType: 'segments' },
    { id: 'q4', label: 'What unmet needs are consistent across sources?', filterType: 'needs' }
  ];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [cData, sData, itemsData] = await Promise.all([
        getInsightClusters(),
        getSynthesis(),
        fetchExistingItems()
      ]);
      setClusters(cData);
      setSynthesis(sData);
      setSourceItems(itemsData);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subdued)' }}>Loading insights and synthesis...</div>;
  }

  // Filter clusters based on active query (MVP basic mapping)
  let visibleClusters = clusters;
  if (activeQuery === 'q2') {
    visibleClusters = clusters.filter(c => c.label.includes('Loop') || c.relatedProblemTypes.includes('discover_weekly_repetition'));
  } else if (activeQuery === 'q3') {
    visibleClusters = clusters.filter(c => c.relatedProblemTypes.includes('stale_recommendations'));
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '64px' }}>
      <h1 style={{ marginBottom: '8px' }}>Analysis & Synthesis</h1>
      <p style={{ color: 'var(--text-subdued)', marginBottom: '32px' }}>
        High-level PM insights automatically synthesized from row-level feedback.
      </p>

      {/* Query Panel */}
      <div style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={() => setActiveQuery(null)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: activeQuery === null ? 'var(--text-highlight)' : 'var(--bg-elevated)',
            color: activeQuery === null ? 'var(--bg-main)' : 'var(--text-base)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          Overview
        </button>
        {QUERIES.map(q => (
          <button 
            key={q.id}
            onClick={() => setActiveQuery(q.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              backgroundColor: activeQuery === q.id ? 'var(--spotify-green)' : 'var(--bg-elevated)',
              color: activeQuery === q.id ? '#000' : 'var(--text-base)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* PM Insight Synthesis Cards */}
      {synthesis && activeQuery === null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          <div className="card glass-panel" style={{ borderTop: '3px solid #ff6b6b' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-subdued)', marginBottom: '16px' }}>Top Frustrations</h3>
            <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {synthesis.topFrustrations.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <div className="card glass-panel" style={{ borderTop: '3px solid #f39c12' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-subdued)', marginBottom: '16px' }}>Top Unmet Needs</h3>
            <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {synthesis.topUnmetNeeds.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <div className="card glass-panel" style={{ borderTop: '3px solid #3498db' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-subdued)', marginBottom: '16px' }}>Repetitive Listening Drivers</h3>
            <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {synthesis.repetitiveDrivers.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Cluster Cards */}
      <h2 style={{ fontSize: '18px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        Theme Clusters ({visibleClusters.length})
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {visibleClusters.map((cluster) => {
          const isExpanded = expandedClusterId === cluster.id;
          const evidenceItems = sourceItems.filter(si => cluster.sourceItemIdList.includes(si.id));
          
          return (
            <div key={cluster.id} className="card glass-panel" style={{ borderLeft: '4px solid var(--spotify-green)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '20px', margin: 0 }}>{cluster.label}</h2>
                    {cluster.provenance && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        backgroundColor: cluster.provenance.status === 'live' ? 'rgba(29, 185, 84, 0.2)' : 
                                         cluster.provenance.status === 'cached' ? 'rgba(243, 156, 18, 0.2)' : 
                                         'rgba(255, 255, 255, 0.1)',
                        color: cluster.provenance.status === 'live' ? 'var(--spotify-green)' : 
                               cluster.provenance.status === 'cached' ? '#f39c12' : 
                               'var(--text-subdued)'
                      }}>
                        {cluster.provenance.status}
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-subdued)', maxWidth: '600px' }}>{cluster.description}</p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: cluster.severityAverage === 'Critical' ? '#ff6b6b' : cluster.severityAverage === 'High' ? '#f39c12' : 'var(--text-highlight)' }}>
                      {cluster.severityAverage}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-subdued)', textTransform: 'uppercase' }}>Severity</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-highlight)' }}>
                      {cluster.volume}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-subdued)', textTransform: 'uppercase' }}>Occurrences</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {/* Segments & Problems */}
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '11px', color: 'var(--text-subdued)', marginBottom: '8px', textTransform: 'uppercase' }}>Top Segments</h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {cluster.relatedSegments.map(seg => (
                          <span key={seg} style={{ backgroundColor: 'rgba(236, 201, 75, 0.1)', color: '#f6e05e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid rgba(236,201,75,0.2)' }}>
                            {seg.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '11px', color: 'var(--text-subdued)', marginBottom: '8px', textTransform: 'uppercase' }}>Problem Types</h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {cluster.relatedProblemTypes.map(pt => (
                          <span key={pt} style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid rgba(255,107,107,0.2)' }}>
                            {pt.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CSS Chart for Source Distribution */}
                <div>
                  <h3 style={{ fontSize: '11px', color: 'var(--text-subdued)', marginBottom: '8px', textTransform: 'uppercase' }}>Source Distribution</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {Object.entries(cluster.sourceDistribution).map(([source, count]) => {
                      const percentage = Math.round((count / cluster.volume) * 100);
                      return (
                        <div key={source} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                          <span style={{ width: '80px', color: 'var(--text-subdued)' }}>{source.replace('_', ' ')}</span>
                          <div style={{ flex: 1, backgroundColor: 'var(--bg-elevated)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, backgroundColor: 'var(--spotify-green)', height: '100%' }}></div>
                          </div>
                          <span style={{ width: '30px', textAlign: 'right', fontWeight: 600 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sample Quotes (always visible) */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '11px', color: 'var(--text-subdued)', marginBottom: '12px', textTransform: 'uppercase' }}>Sample Evidence</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cluster.sampleQuotes.map((quote, i) => (
                    <blockquote key={i} style={{ 
                      borderLeft: '2px solid var(--border-color)', 
                      paddingLeft: '12px', 
                      color: 'var(--text-base)',
                      fontStyle: 'italic',
                      fontSize: '13px',
                      margin: 0
                    }}>
                      &quot;{quote}&quot;
                    </blockquote>
                  ))}
                </div>
              </div>

              {/* Traceability View Toggle */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                <button 
                  className="btn-secondary"
                  onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
                  style={{ fontSize: '13px', padding: '6px 12px' }}
                >
                  {isExpanded ? 'Hide Evidence' : `View Evidence (${cluster.sourceItemIdList.length} rows)`}
                </button>

                {isExpanded && (
                  <div className="animate-fade-in" style={{ marginTop: '16px', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-subdued)', marginBottom: '12px' }}>Raw Source Data</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-subdued)' }}>
                          <th style={{ padding: '8px', width: '80px' }}>Source</th>
                          <th style={{ padding: '8px' }}>Raw Text</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evidenceItems.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px', color: 'var(--text-subdued)' }}>{(item.sourceType || 'unknown').replace(/_/g, ' ')}</td>
                            <td style={{ padding: '8px', lineHeight: 1.5 }}>{item.rawText}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
