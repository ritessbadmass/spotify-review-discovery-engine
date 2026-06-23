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

      <form onSubmit={handleSave} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>AI Provider Settings</h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>LLM Provider</label>
            <select 
              value={llmProvider} 
              onChange={(e) => setLlmProvider(e.target.value)}
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude 3)</option>
              <option value="google">Google (Gemini 1.5 Pro)</option>
              <option value="mock">Mock Data (Testing)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>API Key</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p style={{ fontSize: '12px', color: 'var(--text-subdued)', marginTop: '8px' }}>
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          {saved && <span style={{ color: 'var(--spotify-green)', fontSize: '14px' }}>Settings saved successfully.</span>}
          <button type="submit" className="btn-primary">
            Save Changes
          </button>
        </div>
      </form>

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
