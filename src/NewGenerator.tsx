import React, { useState } from 'react';

interface PipelineStatus {
  type: 'success' | 'error' | '';
  message: string;
}

interface ApiResponse {
  message?: string;
  error?: string;
  originalText?: string;
  translatedText?: string;
  imageBase64?: string;
}

interface PipelineResult {
  originalText: string;
  translatedText: string;
  imageBase64: string;
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<PipelineStatus>({ type: '', message: '' });
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [source, setSource] = useState<string>('google-news');
  
  // States for copy button feedback
  const [copiedOriginal, setCopiedOriginal] = useState<boolean>(false);
  const [copiedTranslated, setCopiedTranslated] = useState<boolean>(false);

  const handleTriggerPipeline = async (): Promise<void> => {
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    setResult(null);

    try {
      const response = await fetch('http://localhost:8080/api/automation/run-news-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: source }) 
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong on the server.');
      }

      setStatus({ type: 'success', message: data.message || 'Pipeline completed successfully!' });
      
      if (data.originalText && data.translatedText && data.imageBase64) {
        setResult({
          originalText: data.originalText,
          translatedText: data.translatedText,
          imageBase64: data.imageBase64
        });
      }
      
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'An unknown error occurred.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: Copy to Clipboard Function ---
  const handleCopy = (text: string, type: 'original' | 'translated') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'original') {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 2000);
      } else {
        setCopiedTranslated(true);
        setTimeout(() => setCopiedTranslated(false), 2000);
      }
    });
  };

  // --- NEW: Download Image Function ---
  const handleDownloadImage = () => {
    if (!result?.imageBase64) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${result.imageBase64}`;
    link.download = `AI_News_Illustration_${new Date().getTime()}.png`; // Unique filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerCard}>
        <h2 style={styles.heading}>AI Content Pipeline Demo</h2>
        <p style={styles.description}>
          Select a platform to fetch the latest content, process a professional Burmese translation using AI, and generate context-aware imagery.
        </p>

        <div style={styles.inputGroup}>
          <label htmlFor="sourceSelect" style={styles.label}>Select News Source:</label>
          <select 
            id="sourceSelect" 
            value={source} 
            onChange={(e) => setSource(e.target.value)}
            disabled={isLoading}
            style={styles.select}
          >
            <option value="google-news">Google News SG (Live API)</option>
            <option value="bbc">BBC World News (Live RSS)</option>
          </select>
        </div>

        <button 
          onClick={handleTriggerPipeline} 
          disabled={isLoading}
          style={{ ...styles.button, ...(isLoading ? styles.buttonDisabled : {}) }}
        >
          {isLoading ? 'Processing Pipeline (This takes a few seconds)...' : 'Run Automation Now'}
        </button>

        {status.message && (
          <div style={{
            ...styles.alert, 
            backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: status.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            <strong>{status.type === 'success' ? 'Success: ' : 'Error: '}</strong>
            {status.message}
          </div>
        )}
      </div>

      {result && (
        <div style={styles.resultContainer}>
          <h3 style={styles.resultHeading}>Pipeline Output</h3>
          
          <div style={styles.contentGrid}>
            <div style={styles.textColumn}>
              {/* Original Content Card */}
              <div style={styles.textCard}>
                <div style={styles.cardHeader}>
                  <h4 style={styles.cardTitle}>Original Content</h4>
                  <button 
                    onClick={() => handleCopy(result.originalText, 'original')}
                    style={styles.actionButton}
                  >
                    {copiedOriginal ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <p style={styles.textContent}>{result.originalText}</p>
              </div>

              {/* Translated Content Card */}
              <div style={styles.textCard}>
                <div style={styles.cardHeader}>
                  <h4 style={styles.cardTitle}>Burmese Translation</h4>
                  <button 
                    onClick={() => handleCopy(result.translatedText, 'translated')}
                    style={styles.actionButton}
                  >
                    {copiedTranslated ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <p style={styles.textContent}>{result.translatedText}</p>
              </div>
            </div>
            
            <div style={styles.imageColumn}>
              {/* Image Card */}
              <div style={styles.textCard}>
                <div style={styles.cardHeader}>
                  <h4 style={styles.cardTitle}>Generated AI Image</h4>
                  <button 
                    onClick={handleDownloadImage}
                    style={{...styles.actionButton, backgroundColor: '#10b981', color: 'white', border: 'none'}}
                  >
                    Download Image
                  </button>
                </div>
                <img 
                  src={`data:image/png;base64,${result.imageBase64}`} 
                  alt="AI Generated News Context" 
                  style={styles.generatedImage}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles mapping
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  headerCard: { padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', textAlign: 'center', marginBottom: '30px' },
  heading: { marginTop: '0', color: '#1f2937' },
  description: { color: '#4b5563', marginBottom: '24px', lineHeight: '1.5' },
  inputGroup: { marginBottom: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' },
  label: { fontWeight: 600, color: '#374151', fontSize: '14px' },
  select: { padding: '10px 16px', fontSize: '16px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', maxWidth: '300px', backgroundColor: '#f9fafb', outline: 'none' },
  button: { padding: '12px 24px', fontSize: '16px', fontWeight: 600, color: '#ffffff', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' },
  buttonDisabled: { backgroundColor: '#93c5fd', cursor: 'not-allowed' },
  alert: { marginTop: '20px', padding: '12px', borderRadius: '8px', textAlign: 'left', fontSize: '14px' },
  resultContainer: { padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', backgroundColor: '#f9fafb' },
  resultHeading: { marginTop: '0', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px', color: '#111827' },
  contentGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  textColumn: { flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' },
  imageColumn: { flex: '1 1 300px' },
  textCard: { backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  
  // NEW STYLES FOR BUTTON HEADERS
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' },
  cardTitle: { margin: '0', color: '#1f2937' },
  actionButton: { padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#374151', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' },
  
  textContent: { whiteSpace: 'pre-wrap', color: '#374151', lineHeight: '1.6', margin: '0', fontSize: '15px' },
  generatedImage: { width: '100%', height: 'auto', borderRadius: '6px', marginTop: '10px', display: 'block' }
};

export default App;