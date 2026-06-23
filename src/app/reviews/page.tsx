'use client';

import { useEffect, useState } from 'react';
import { getReviews, reanalyzeItems } from '@/lib/api';
import { SourceItem, AnalysisResult } from '@/lib/types';

type ReviewWithAnalysis = SourceItem & { analysis?: AnalysisResult };

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithAnalysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const fetchData = async () => {
    const data = await getReviews();
    setReviews(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(reviews.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleReanalyze = async () => {
    if (selectedIds.size === 0) return;
    setIsReanalyzing(true);
    await reanalyzeItems(Array.from(selectedIds));
    await fetchData();
    setSelectedIds(new Set());
    setIsReanalyzing(false);
  };

  const renderBadge = (text: string, colorClass: string) => (
    <span style={{
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }} className={colorClass}>
      {text.replace(/_/g, ' ')}
    </span>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ margin: 0 }}>Review Explorer</h1>
        <button 
          className="btn-primary" 
          onClick={handleReanalyze}
          disabled={selectedIds.size === 0 || isReanalyzing}
          style={{ padding: '8px 16px' }}
        >
          {isReanalyzing ? 'Re-analyzing...' : `Re-run Analysis (${selectedIds.size})`}
        </button>
      </div>
      <p style={{ color: 'var(--text-subdued)', marginBottom: '32px' }}>
        Browse individual feedback items, view the AI's deterministic reasoning, and re-analyze items.
      </p>

      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input 
          type="checkbox" 
          checked={selectedIds.size > 0 && selectedIds.size === reviews.length}
          onChange={handleSelectAll}
          style={{ width: '16px', height: '16px' }}
        />
        <span style={{ fontSize: '14px', color: 'var(--text-subdued)' }}>Select All</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {reviews.map(review => (
          <div key={review.id} className="card glass-panel" style={{ display: 'flex', gap: '16px' }}>
            <div style={{ paddingTop: '4px' }}>
              <input 
                type="checkbox" 
                checked={selectedIds.has(review.id)}
                onChange={() => handleSelect(review.id)}
                style={{ width: '16px', height: '16px' }}
              />
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-highlight)' }}>{review.author}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-subdued)' }}>• {review.sourceType}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-subdued)' }}>• {review.date}</span>
                  {review.analysis?.provenance && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      backgroundColor: review.analysis.provenance.status === 'live' ? 'rgba(29, 185, 84, 0.2)' : 
                                       review.analysis.provenance.status === 'cached' ? 'rgba(243, 156, 18, 0.2)' : 
                                       'rgba(255, 255, 255, 0.1)',
                      color: review.analysis.provenance.status === 'live' ? 'var(--spotify-green)' : 
                             review.analysis.provenance.status === 'cached' ? '#f39c12' : 
                             'var(--text-subdued)'
                    }}>
                      {review.analysis.provenance.status}
                    </span>
                  )}
                </div>
                {review.analysis && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px', 
                      borderRadius: '12px',
                      backgroundColor: review.analysis.sentiment === 'Negative' ? 'rgba(255, 107, 107, 0.1)' : review.analysis.sentiment === 'Positive' ? 'rgba(29, 185, 84, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                      color: review.analysis.sentiment === 'Negative' ? '#ff6b6b' : review.analysis.sentiment === 'Positive' ? 'var(--spotify-green)' : 'var(--text-highlight)'
                    }}>
                      {review.analysis.sentiment}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 600,
                      color: review.analysis.confidence > 0.85 ? 'var(--spotify-green)' : '#f39c12'
                    }}>
                      {Math.round(review.analysis.confidence * 100)}% Conf
                    </div>
                  </div>
                )}
              </div>
              
              <p style={{ fontSize: '15px', lineHeight: 1.6, position: 'relative' }}>
                {isReanalyzing && selectedIds.has(review.id) && (
                  <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: 'var(--spotify-green)', fontWeight: 'bold' }}>
                    Analyzing...
                  </span>
                )}
                {review.rawText}
              </p>

              {review.analysis && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '16px', 
                  backgroundColor: 'var(--bg-elevated)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subdued)', textTransform: 'uppercase', marginBottom: '4px' }}>Problem Type</span>
                      {renderBadge(review.analysis.discoveryProblemType, 'badge-problem')}
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subdued)', textTransform: 'uppercase', marginBottom: '4px' }}>User Intent</span>
                      {renderBadge(review.analysis.userIntent, 'badge-intent')}
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subdued)', textTransform: 'uppercase', marginBottom: '4px' }}>Likely Segment</span>
                      {renderBadge(review.analysis.likelySegment, 'badge-segment')}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subdued)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      AI Reasoning
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--text-base)', fontStyle: 'italic' }}>
                      {review.analysis.reasoning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .badge-problem { background-color: rgba(255, 107, 107, 0.1); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.2); }
        .badge-intent { background-color: rgba(66, 153, 225, 0.1); color: #63b3ed; border: 1px solid rgba(66,153,225,0.2); }
        .badge-segment { background-color: rgba(236, 201, 75, 0.1); color: #f6e05e; border: 1px solid rgba(236,201,75,0.2); }
      `}</style>
    </div>
  );
}
