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
    </div>
  );
}
