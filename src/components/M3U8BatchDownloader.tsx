import { useEffect, useMemo, useRef, useState } from 'react';
import './M3U8BatchDownloader.css';
// Uses backend/system ffmpeg (not browser wasm ffmpeg)

type TaskStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'ERROR' | string;

type Job = {
  taskIndex: number;
  episodeNumber: number;
  url: string;
  status: TaskStatus;
  progress: number; // 0..1
  error?: string;
};

const INPUT_COUNT = 10;

function safeFileName(name: string) {
  return name
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractM3U8Links(text: string): string[] {
  if (!text) return [];
  // Matches lines like:
  // [3/18/26 9:54 PM] ... https://...something.m3u8
  const re = /https?:\/\/[^\s"'<>]+?\.m3u8(?:[^\s"'<>]*)?/gi;
  const matches = text.match(re) || [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    const link = m.trim().replace(/[),.]+$/g, '');
    if (!seen.has(link)) {
      seen.add(link);
      out.push(link);
    }
  }
  return out;
}

export default function M3U8BatchDownloader() {
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const downloadedTaskIndicesRef = useRef<Set<number>>(new Set());
  const batchBaseNameRef = useRef<string>('Episode');

  const [baseName, setBaseName] = useState('Episode');
  const [startEpisode, setStartEpisode] = useState<number>(1);
  const [endEpisode, setEndEpisode] = useState<number>(10);

  const [urls, setUrls] = useState<string[]>(() => Array.from({ length: INPUT_COUNT }, () => ''));
  const [pasteText, setPasteText] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const episodeNumbers = useMemo(() => {
    const start = Number.isFinite(startEpisode) ? startEpisode : 1;
    return Array.from({ length: INPUT_COUNT }, (_, i) => start + i);
  }, [startEpisode]);

  useEffect(() => {
    // Keep endEpisode >= startEpisode.
    setEndEpisode((prev) => {
      const s = Number.isFinite(startEpisode) ? startEpisode : 1;
      const e = Number.isFinite(prev) ? prev : s + 9;
      return e < s ? s : e;
    });
  }, [startEpisode]);

  useEffect(() => {
    batchBaseNameRef.current = baseName;
  }, [baseName]);

  useEffect(() => {
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getBackendBase = () => {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
        const raw = String(import.meta.env.VITE_BACKEND_URL);
        return raw.replace(/\/api\/dubbing\/?$/i, '');
      }
    } catch {
      // ignore
    }
    return 'http://localhost:8080';
  };

  const buildJobsForRange = (startEp: number, endEp: number, linksForTasks: string[]) => {
    const s = Number.isFinite(startEp) ? startEp : 1;
    const e = Number.isFinite(endEp) ? endEp : s;
    const maxEpisode = Math.min(e, s + INPUT_COUNT - 1);
    const count = Math.max(0, maxEpisode - s + 1);

    const next: Job[] = [];
    for (let i = 0; i < count; i++) {
      next.push({
        taskIndex: i,
        episodeNumber: s + i,
        url: (linksForTasks[i] ?? '').trim(),
        status: 'QUEUED',
        progress: 0,
      });
    }
    return next;
  };

  const stopPolling = () => {
    if (pollIntervalRef.current != null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    downloadedTaskIndicesRef.current = new Set();
  };

  const parseTaskFileName = (episodeNumber: number) => {
    const safe = safeFileName(`${batchBaseNameRef.current} ${episodeNumber}`) || `Episode ${episodeNumber}`;
    return `${safe}.mp4`;
  };

  const downloadTaskFile = async (batchIdValue: string, taskIndex: number, episodeNumber: number) => {
    const backend = getBackendBase();
    const url = `${backend}/api/m3u8/batch/${batchIdValue}/file/${taskIndex}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      let msg = `File download failed (${resp.status})`;
      try {
        const data = (await resp.json()) as { error?: string };
        if (data?.error) msg = data.error;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }
    const blob = await resp.blob();
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = parseTaskFileName(episodeNumber);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(dlUrl);
  };

  const startBatch = async (startEp: number, endEp: number, linksForTasks: string[]) => {
    stopPolling();
    setGlobalError(null);
    setLoadingBackend(true);

    batchBaseNameRef.current = baseName;

    const jobsInit = buildJobsForRange(startEp, endEp, linksForTasks);
    setJobs(jobsInit);

    const backend = getBackendBase();
    const resp = await fetch(`${backend}/api/m3u8/batch/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseName,
        startEpisode: startEp,
        endEpisode: endEp,
        links: linksForTasks,
        concurrency: 10,
      }),
    });

    if (!resp.ok) {
      let msg = `Backend failed (${resp.status})`;
      try {
        const data = (await resp.json()) as { error?: string };
        if (data?.error) msg = data.error;
      } catch {
        // ignore
      }
      setLoadingBackend(false);
      setGlobalError(msg);
      return;
    }

    const data = (await resp.json()) as { batchId?: string; error?: string };
    if (!data.batchId) {
      setLoadingBackend(false);
      setGlobalError(data.error || 'No batchId returned');
      return;
    }

    setBatchId(data.batchId);
    const currentBatchId = data.batchId;

    downloadedTaskIndicesRef.current = new Set<number>();

    const poll = async () => {
      const statusResp = await fetch(`${backend}/api/m3u8/batch/${currentBatchId}/status`, { method: 'GET' });
      if (!statusResp.ok) return;
      const statusData = (await statusResp.json()) as { tasks?: Job[] };
      const tasks = (statusData.tasks || []) as any[];

      setJobs((prev) => {
        const byIndex = new Map<number, any>();
        for (const t of tasks) byIndex.set(Number(t.taskIndex), t);
        return prev.map((j) => {
          const t = byIndex.get(j.taskIndex);
          if (!t) return j;
          return {
            ...j,
            status: t.status,
            progress: typeof t.progress === 'number' ? t.progress : j.progress,
            error: t.error || undefined,
          };
        });
      });

      // Trigger downloads when tasks complete
      for (const t of tasks) {
        const idx = Number(t.taskIndex);
        const status = String(t.status || '');
        if (status === 'DONE' && !downloadedTaskIndicesRef.current.has(idx)) {
          downloadedTaskIndicesRef.current.add(idx);
          const episodeNumber = startEp + idx;
          downloadTaskFile(currentBatchId, idx, episodeNumber).catch((e) => {
            setJobs((prev) => prev.map((j) => (j.taskIndex === idx ? { ...j, status: 'ERROR', error: String(e) } : j)));
          });
        }
      }

      const allFinished = tasks.length > 0 && tasks.every((t) => {
        const st = String(t.status || '').toUpperCase();
        return st === 'DONE' || st === 'ERROR';
      });
      if (allFinished) {
        stopPolling();
        setLoadingBackend(false);
      }
    };

    await poll();
    pollIntervalRef.current = window.setInterval(() => {
      poll().catch((e) => {
        logConsoleError(e);
      });
    }, 1500);
  };

  // TypeScript doesn't have console.log wrapper; keep a safe function for interval polling.
  const logConsoleError = (e: unknown) => {
    // eslint-disable-next-line no-console
    console.error(e);
  };

  const handleDownloadAll = async () => {
    setBatchId(null);
    await startBatch(startEpisode, endEpisode, urls);
  };

  return (
    <div className="m3u8-proto">
      <h2 className="m3u8-title">HLS Batch Downloader (Backend)</h2>
      <div className="m3u8-endpoint">
        Batch API is on your backend (it will run conversions and return MP4 files).
      </div>
      {batchId && (
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 12, color: '#000000' }}>
          Current batchId: <code>{batchId}</code>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, marginBottom: 6, color: '#000000' }}>
          Paste logs or lines containing HLS playlist URLs (first link will map to <b>start episode</b>)
        </div>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder=""
          className="m3u8-textarea"
        />
        <div className="m3u8-parseRow">
          <button
            className="m3u8-button m3u8-button--row"
            onClick={() => {
              const links = extractM3U8Links(pasteText);
              if (links.length === 0) {
                setGlobalError('No HLS playlist links found in the pasted text.');
                return;
              }
              setGlobalError(null);
              setUrls((prev) => {
                const next = [...prev];
                for (let i = 0; i < INPUT_COUNT; i++) next[i] = links[i] || '';
                return next;
              });
            }}
            type="button"
          >
            Parse links
          </button>
          <div style={{ fontSize: 12, opacity: 0.85, color: '#000000' }}>
            Extracted {extractM3U8Links(pasteText).length} link(s)
          </div>
        </div>
      </div>

      {globalError && (
        <div style={{ marginBottom: 12, padding: 10, border: '1px solid #b91c1c', background: 'rgba(185,28,28,0.12)', color: '#000000' }}>
          {globalError}
        </div>
      )}

      <div className="m3u8-topGrid">
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.85 }}>Base name</span>
          <input
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
            placeholder="Episode"
            className="m3u8-input"
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.85 }}>Start episode</span>
          <input
            type="number"
            value={startEpisode}
            min={1}
            step={1}
            onChange={(e) => {
              const raw = e.target.value;
              const next = parseInt(raw, 10);
              if (Number.isFinite(next)) setStartEpisode(next);
            }}
            className="m3u8-input"
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.85 }}>End episode</span>
          <input
            type="number"
            value={endEpisode}
            min={1}
            step={1}
            onChange={(e) => {
              const raw = e.target.value;
              const next = parseInt(raw, 10);
              if (Number.isFinite(next)) setEndEpisode(next);
            }}
            className="m3u8-input"
          />
        </label>
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={handleDownloadAll}
          disabled={loadingBackend}
          className="m3u8-button"
        >
          {loadingBackend ? 'Working…' : 'Download all'}
        </button>
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          Will download episodes {startEpisode} to {Math.min(endEpisode, startEpisode + 9)} (max 10).
        </div>
      </div>

      <hr className="m3u8-divider" />

      <div style={{ display: 'grid', gap: 10 }}>
        {urls.map((value, idx) => {
          const ep = episodeNumbers[idx];
          return (
            <div key={idx} className="m3u8-row">
              <div style={{ fontSize: 13, color: '#000000' }}>
                {baseName || 'Episode'} {ep}
              </div>
              <input
                value={value}
                onChange={(e) =>
                  setUrls((prev) => {
                    const next = [...prev];
                    next[idx] = e.target.value;
                    return next;
                  })
                }
                className="m3u8-input"
              />
              <button
                onClick={async () => {
                  const value = urls[idx]?.trim() ?? '';
                  if (!value) {
                    setGlobalError('Please paste an HLS playlist link first for this row.');
                    return;
                  }
                  const ep = episodeNumbers[idx];
                  await startBatch(ep, ep, [value]);
                }}
                disabled={loadingBackend}
                className="m3u8-button m3u8-button--row"
              >
                Download
              </button>
            </div>
          );
        })}
      </div>

      <hr className="m3u8-divider" />

      <div style={{ fontSize: 13, marginBottom: 8, color: '#000000' }}>Status</div>
      {jobs.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.85, color: '#000000' }}>No downloads started.</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {jobs.map((j) => (
            <div key={j.taskIndex} style={{ fontSize: 13, color: '#000000' }}>
              <b>
                {safeFileName(`${baseName} ${j.episodeNumber}`) || `Episode ${j.episodeNumber}`}
              </b>{' '}
              - {j.status}
              {(String(j.status).toUpperCase() === 'RUNNING' || String(j.status).toUpperCase() === 'QUEUED') ? ` (${Math.round(j.progress * 100)}%)` : ''}
              {j.error ? ` - ${j.error}` : ''}
              {(String(j.status).toUpperCase() === 'RUNNING' || String(j.status).toUpperCase() === 'QUEUED') && (
                <div className="m3u8-progress" aria-label="Download progress">
                  <div className="m3u8-progressBar" style={{ width: `${Math.round(j.progress * 100)}%` }} />
                </div>
              )}
              {String(j.status).toUpperCase() === 'DONE' && (
                <div className="m3u8-progress" aria-label="Download progress">
                  <div className="m3u8-progressBar m3u8-progressBar--ready" style={{ width: '100%' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

