'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [llmProvider, setLlmProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate saving
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
          <p style={{ fontSize: '14px', color: 'var(--text-subdued)' }}>
            This application is currently securely configured via server-side Environment Variables (Vercel). 
            Your Gemini API Key is safely hidden from the browser. 
            <br/><br/>
            To switch back to Mock mode or change your API key, update the <code>NEXT_PUBLIC_ANALYSIS_MODE</code> or <code>GEMINI_API_KEY</code> environment variables in your Vercel Dashboard and redeploy.
          </p>
        </div>
      </div>

      <div className="card glass-panel" style={{ marginTop: '32px', borderLeft: '4px solid #ff6b6b' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#ff6b6b' }}>Danger Zone</h2>
        <p style={{ color: 'var(--text-subdued)', marginBottom: '16px', fontSize: '14px' }}>
          This will wipe all imported reviews and analysis results from your local browser storage. This cannot be undone.
        </p>
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all data?')) {
              localStorage.removeItem('spotify_mock_items');
              localStorage.removeItem('spotify_mock_analysis');
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
