import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
}

export default function DashboardCard({ title, value, subtitle, highlight }: DashboardCardProps) {
  return (
    <div className="card glass-panel animate-fade-in" style={{
      borderLeft: highlight ? '4px solid var(--spotify-green)' : undefined
    }}>
      <h3 style={{ fontSize: '14px', color: 'var(--text-subdued)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {title}
      </h3>
      <div style={{ fontSize: '32px', fontWeight: 700, color: highlight ? 'var(--spotify-green)' : 'var(--text-highlight)' }}>
        {value}
      </div>
      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--text-base)', marginTop: '8px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
