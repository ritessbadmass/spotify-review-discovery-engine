'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const items = localStorage.getItem('spotify_mock_items');
      const analysis = localStorage.getItem('spotify_mock_analysis');
      
      if (!items && !analysis) {
        alert('No local data to sync!');
        return;
      }
      
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: items ? JSON.parse(items) : null,
          analysis: analysis ? JSON.parse(analysis) : null
        })
      });
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
    } catch (e) {
      alert('Sync failed!');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '8px' }}>Settings</h1>
      <p style={{ color: 'var(--text-subdued)', marginBottom: '32px' }}>
        Configure external integrations and LLM provider keys.
      </p>

      <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>AI Provider Configuration</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-subdued)', marginBottom: '16px' }}>
            This application is currently securely configured via server-side Environment Variables (Vercel). 
            Your Gemini API Key is safely hidden from the browser.
          </p>
          <button 
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid #1DB954',
              backgroundColor: synced ? '#1DB954' : 'transparent',
              color: synced ? '#000' : '#1DB954',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {syncing ? 'Syncing...' : synced ? '✓ Synced to Cloud' : 'Push Local Data to Cloud'}
          </button>
        </div>
      </div>

      <div className="card glass-panel" style={{ marginTop: '32px', borderLeft: '4px solid #ff6b6b' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#ff6b6b' }}>Danger Zone</h2>
        <p style={{ color: 'var(--text-subdued)', marginBottom: '16px', fontSize: '14px' }}>
          This will wipe all imported reviews and analysis results from your local browser storage. This cannot be undone.
        </p>
        <button 
          onClick={async () => {
            if (window.confirm('Are you sure you want to clear all data from the browser and cloud?')) {
              localStorage.removeItem('spotify_mock_items');
              localStorage.removeItem('spotify_mock_analysis');
              try {
                await fetch('/api/db', { method: 'DELETE' });
              } catch (e) {
                console.error(e);
              }
              window.location.href = '/';
            }
          }}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #ff6b6b',
            color: '#ff6b6b',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Clear All Local Data
        </button>
      </div>
    </div>
  );
}
