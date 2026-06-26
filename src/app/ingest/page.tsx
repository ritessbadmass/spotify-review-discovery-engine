'use client';

import { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { fetchExistingItems, bulkIngest } from '@/lib/api';
import { SourceType, SourceItem, DraftSourceItem } from '@/lib/types';
import { cleanText, detectLanguage, flagDuplicates } from '@/lib/ingestUtils';

import { mockSourceItems } from '@/lib/mockData';

const SOURCE_TYPES: { id: SourceType | 'mixed_csv' | 'auto_scraper'; label: string; icon: string }[] = [
  { id: 'auto_scraper', label: 'Run Automated Scrapers (Simulation)', icon: '🤖' },
  { id: 'mixed_csv', label: 'Scraped CSV Upload', icon: '📁' },
];

const PRESET_DATA = [
  "Discover Weekly keeps giving me remasters and covers of songs I already know. It's so frustrating.",
  "My recommendations are stuck in the same mood. I listened to one lo-fi playlist and now that's all I get.",
  "Liked Songs and my daily playlists dominate everything. There is no real discovery anymore.",
  "I want to explore 90s hip hop but the algorithm just pushes the top 5 mainstream hits."
].join('\n');

export default function IngestWizardPage() {
  const [step, setStep] = useState<number>(1);
  const [sourceType, setSourceType] = useState<SourceType | 'mixed_csv' | null>(null);
  
  // Step 2 State
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('upload');
  const [pasteText, setPasteText] = useState('');
  
  // Step 3 State
  const [draftItems, setDraftItems] = useState<DraftSourceItem[]>([]);
  const [existingItems, setExistingItems] = useState<SourceItem[]>([]);
  
  // Step 4 State
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<any>(null);

  useEffect(() => {
    fetchExistingItems().then(setExistingItems);
  }, []);

  const handleNextStep1 = () => {
    if (sourceType) {
      if (sourceType === 'auto_scraper') {
        simulateScraping();
      } else {
        if (sourceType === 'mixed_csv') {
          setInputMode('upload');
        }
        setStep(2);
      }
    }
  };

  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  
  const simulateScraping = async () => {
    setStep(5);
    setSimulationLogs(['[System] Initializing headless browsers...']);
    
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    await delay(800);
    setSimulationLogs(prev => [...prev, '[App Store] Connected to RSS feed. Fetching recent 100 reviews...']);
    
    await delay(1200);
    setSimulationLogs(prev => [...prev, '[Play Store] Navigating to com.spotify.music... Found 250 reviews.']);
    
    await delay(900);
    setSimulationLogs(prev => [...prev, '[Reddit] Authenticating with Snoowrap... Fetching r/spotify top posts...']);
    
    await delay(1500);
    setSimulationLogs(prev => [...prev, '[System] Deduplicating and normalizing data across 3 sources...']);
    
    await delay(1000);
    setSimulationLogs(prev => [...prev, '[System] Success! Items ready for ingestion.']);
    
    await delay(800);
    
    const mockDrafts: DraftSourceItem[] = mockSourceItems.map((item, idx) => ({
      id: `draft-${Date.now()}-${idx}`,
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl || '',
      author: item.author,
      date: item.date,
      rawText: item.rawText,
      normalizedText: item.normalizedText,
      productName: item.productName,
      language: item.language,
      region: item.region,
    }));

    setDraftItems(flagDuplicates(mockDrafts, existingItems));
    setStep(3);
  };

  const handleProcessInput = () => {
    let itemsToProcess: any[] = [];
    
    if (inputMode === 'paste') {
      const lines = pasteText.split('\n').filter(line => line.trim().length > 0);
      itemsToProcess = lines.map(text => ({ rawText: text }));
    }

    // Process and normalize
    let newDrafts: DraftSourceItem[] = itemsToProcess.map((item, idx) => {
      const rawText = item.rawText || '';
      const normalizedText = cleanText(rawText);
      return {
        id: `draft-${Date.now()}-${idx}`,
        sourceType: (sourceType === 'mixed_csv' ? 'forum' : sourceType) as SourceType,
        sourceUrl: item.sourceUrl || '',
        author: item.author || 'Anonymous',
        date: item.date || new Date().toISOString().split('T')[0],
        rawText,
        normalizedText,
        productName: item.productName || 'Spotify App',
        language: detectLanguage(normalizedText),
        region: item.region || 'US',
      };
    });

    newDrafts = flagDuplicates(newDrafts, existingItems);
    setDraftItems(newDrafts);
    setStep(3);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        // Map CSV fields to rawText
        const newDrafts: DraftSourceItem[] = rows.map((row, idx) => {
          const rawText = row.rawText || row.text || row.review || '';
          const normalizedText = cleanText(rawText);
          return {
            id: `draft-${Date.now()}-${idx}`,
            sourceType: (row.sourceType as SourceType) || (sourceType === 'mixed_csv' ? 'forum' : sourceType!),
            sourceUrl: row.sourceUrl || '',
            author: row.author || 'Anonymous',
            date: row.date || new Date().toISOString().split('T')[0],
            rawText,
            normalizedText,
            productName: row.productName || 'Spotify App',
            language: detectLanguage(normalizedText),
            region: row.region || 'US',
          };
        });
        setDraftItems(flagDuplicates(newDrafts, existingItems));
        setStep(3);
      }
    });
  };

  const handleDeleteDraft = (id: string) => {
    setDraftItems(prev => prev.filter(i => i.id !== id));
  };

  const [importProgress, setImportProgress] = useState<string | null>(null);

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportProgress('0%');
    
    const validItems = draftItems.filter(i => !i.isDuplicate);
    const itemsToImport = validItems.map(({ isDuplicate, ...rest }) => rest) as SourceItem[];
    
    await bulkIngest(itemsToImport, (done, total) => {
      setImportProgress(`${Math.round((done / total) * 100)}%`);
    });
    
    setImportStats({
      totalImported: itemsToImport.length,
      duplicatesFlagged: draftItems.length - itemsToImport.length,
      englishCount: itemsToImport.filter(i => i.language === 'en').length,
      nonEnglishCount: itemsToImport.filter(i => i.language !== 'en').length,
      missingAuthor: itemsToImport.filter(i => i.author === 'Anonymous').length
    });
    
    setIsImporting(false);
    setImportProgress(null);
    setStep(4);
  };

  const resetWizard = () => {
    setStep(1);
    setSourceType(null);
    setPasteText('');
    setDraftItems([]);
    setImportStats(null);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Ingestion Wizard</h1>
      <p style={{ color: 'var(--text-subdued)', marginBottom: '32px' }}>
        Import new feedback data. Step {step} of 4.
      </p>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="card glass-panel animate-fade-in">
          <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>1. Choose Source Type</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            {SOURCE_TYPES.map(st => (
              <button
                key={st.id}
                onClick={() => setSourceType(st.id)}
                style={{
                  padding: '24px',
                  backgroundColor: sourceType === st.id ? 'var(--bg-card-hover)' : 'var(--bg-elevated)',
                  border: `2px solid ${sourceType === st.id ? 'var(--spotify-green)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-highlight)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '32px' }}>{st.icon}</span>
                <span style={{ fontWeight: 600 }}>{st.label}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" disabled={!sourceType} onClick={handleNextStep1}>
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="card glass-panel animate-fade-in">
          <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>2. Input Data</h2>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            {sourceType !== 'mixed_csv' && (
              <button 
                className={inputMode === 'paste' ? 'btn-primary' : 'btn-secondary'} 
                onClick={() => setInputMode('paste')}
              >
                Paste Text
              </button>
            )}
            <button 
              className={inputMode === 'upload' ? 'btn-primary' : 'btn-secondary'} 
              onClick={() => setInputMode('upload')}
            >
              Upload CSV
            </button>
          </div>

          {inputMode === 'paste' && sourceType !== 'mixed_csv' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontWeight: 600 }}>Raw Reviews (One per line)</label>
                <button 
                  onClick={() => setPasteText(PRESET_DATA)}
                  style={{ background: 'none', border: 'none', color: 'var(--spotify-green)', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                >
                  Load Spotify Presets
                </button>
              </div>
              <textarea 
                rows={10} 
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your feedback data here..."
                style={{ marginBottom: '24px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary" onClick={handleProcessInput} disabled={!pasteText.trim()}>
                  Process & Preview
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ padding: '40px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '24px' }}>
                <p style={{ marginBottom: '16px', color: 'var(--text-subdued)' }}>
                  Upload a CSV file with columns like: rawText, author, date
                </p>
                <input type="file" accept=".csv" onChange={handleFileUpload} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="card glass-panel animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px' }}>3. Preview & Clean</h2>
            <div style={{ fontSize: '14px', color: 'var(--text-subdued)' }}>
              {draftItems.length} items loaded ({draftItems.filter(i => i.isDuplicate).length} duplicates flagged)
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Review Text (Cleaned)</th>
                  <th style={{ padding: '12px', width: '100px' }}>Author</th>
                  <th style={{ padding: '12px', width: '80px' }}>Lang</th>
                  <th style={{ padding: '12px', width: '80px' }}>Status</th>
                  <th style={{ padding: '12px', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {draftItems.map(item => (
                  <tr key={item.id} style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: item.isDuplicate ? 'rgba(255, 60, 60, 0.05)' : 'transparent'
                  }}>
                    <td style={{ padding: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.normalizedText}
                    </td>
                    <td style={{ padding: '12px' }}>{item.author}</td>
                    <td style={{ padding: '12px' }}>{item.language}</td>
                    <td style={{ padding: '12px' }}>
                      {item.isDuplicate ? (
                        <span style={{ color: '#ff6b6b', fontSize: '12px', fontWeight: 600 }}>DUPLICATE</span>
                      ) : (
                        <span style={{ color: 'var(--spotify-green)', fontSize: '12px', fontWeight: 600 }}>OK</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => handleDeleteDraft(item.id)}
                        style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {draftItems.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subdued)' }}>
                      No items found. Go back and try again.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button 
              className="btn-primary" 
              onClick={handleConfirmImport} 
              disabled={isImporting || draftItems.filter(i => !i.isDuplicate).length === 0}
            >
              {isImporting ? `Importing... ${importProgress}` : 'Confirm Import'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && importStats && (
        <div className="card glass-panel animate-fade-in" style={{ borderLeft: '4px solid var(--spotify-green)' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--spotify-green)' }}>Import Successful!</h2>
          <p style={{ color: 'var(--text-subdued)', marginBottom: '32px' }}>
            The data has been successfully ingested and normalized into the engine.
          </p>

          <h3 style={{ fontSize: '16px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Data Quality Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-highlight)' }}>{importStats.totalImported}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-subdued)' }}>Total Imported</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff6b6b' }}>{importStats.duplicatesFlagged}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-subdued)' }}>Duplicates Filtered</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f39c12' }}>{importStats.missingAuthor}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-subdued)' }}>Missing Author (Anonymous)</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-highlight)' }}>
                {importStats.englishCount} / {importStats.nonEnglishCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-subdued)' }}>EN / Non-EN Split</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn-secondary" onClick={resetWizard}>Import More Data</button>
            <button className="btn-primary" onClick={() => window.location.href = '/'}>Go to Dashboard</button>
          </div>
        </div>
      )}

      {/* STEP 5: SIMULATION */}
      {step === 5 && (
        <div className="card glass-panel animate-fade-in" style={{ borderLeft: '4px solid var(--spotify-green)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid var(--spotify-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            Running Automated Scrapers...
          </h2>
          <div style={{ backgroundColor: '#000', color: '#00ff00', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {simulationLogs.map((log, idx) => (
              <div key={idx} className="animate-fade-in">{log}</div>
            ))}
          </div>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}

    </div>
  );
}
