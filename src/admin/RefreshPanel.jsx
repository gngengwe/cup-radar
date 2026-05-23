import { useState, useCallback } from 'react';
import { dispatchWorkflow, getWorkflowRuns } from '../utils/github';

const VERTICALS = [
  { id: 'scores',     icon: '⚽', label: 'Scores',     desc: 'Match results & status from football-data.org' },
  { id: 'news',       icon: '📰', label: 'News',       desc: 'Latest WC2026 articles from Google News RSS' },
  { id: 'upsets',     icon: '🚨', label: 'Upsets',     desc: 'Auto-resolve upsets based on finished matches' },
  { id: 'bracket',    icon: '🏆', label: 'Bracket',    desc: 'Sync knockout results from match data' },
  { id: 'narratives', icon: '📖', label: 'Narratives', desc: 'Add draft chapters from player/team news search' },
  { id: 'all',        icon: '🔄', label: 'All',        desc: 'Run every refresh in sequence' },
];

function timeAgo(iso) {
  if (!iso) return 'never';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function statusBadge(run) {
  if (!run) return null;
  const { status, conclusion } = run;
  if (status === 'in_progress' || status === 'queued')
    return <span className="refresh-badge running">⟳ Running</span>;
  if (conclusion === 'success')
    return <span className="refresh-badge success">✓ Done</span>;
  if (conclusion === 'failure')
    return <span className="refresh-badge failure">✗ Failed</span>;
  return <span className="refresh-badge">{status}</span>;
}

export default function RefreshPanel({ token }) {
  const [dispatching, setDispatching] = useState({});
  const [runs,        setRuns]        = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [error,       setError]       = useState('');
  const [lastCheck,   setLastCheck]   = useState(null);

  const dispatch = async (vertical) => {
    setDispatching(d => ({ ...d, [vertical]: true }));
    setError('');
    try {
      await dispatchWorkflow(token, 'refresh.yml', { vertical });
      // Brief wait then fetch runs so user sees the queued job
      setTimeout(() => checkStatus(), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDispatching(d => ({ ...d, [vertical]: false }));
    }
  };

  const checkStatus = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const data = await getWorkflowRuns(token, 'refresh.yml', 8);
      setRuns(data);
      setLastCheck(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRuns(false);
    }
  }, [token]);

  // Group runs by vertical (input.vertical or 'all')
  const latestByVertical = {};
  for (const run of runs) {
    const v = run.inputs?.vertical || 'all';
    if (!latestByVertical[v]) latestByVertical[v] = run;
  }

  return (
    <div className="refresh-panel">
      <div className="refresh-panel__header">
        <div>
          <h3 className="refresh-panel__title">Web Refresh</h3>
          <p className="refresh-panel__sub">
            Triggers a GitHub Actions job that fetches live data, commits updated JSON,
            and redeploys the site (~60–90s end-to-end).
            News &amp; narrative items land as <strong>drafts</strong> — review in their tabs before publishing.
          </p>
        </div>
        <button
          className="btn btn-secondary refresh-status-btn"
          onClick={checkStatus}
          disabled={loadingRuns}
        >
          {loadingRuns ? 'Checking…' : '↻ Check status'}
        </button>
      </div>

      {error && <p className="admin-status error">{error}</p>}

      <div className="refresh-grid">
        {VERTICALS.map(v => {
          const latestRun = latestByVertical[v.id];
          const busy      = dispatching[v.id];
          return (
            <div key={v.id} className={`refresh-card${v.id === 'all' ? ' refresh-card--all' : ''}`}>
              <div className="refresh-card__top">
                <span className="refresh-card__icon">{v.icon}</span>
                <div className="refresh-card__info">
                  <span className="refresh-card__label">{v.label}</span>
                  <span className="refresh-card__desc">{v.desc}</span>
                </div>
                {statusBadge(latestRun)}
              </div>
              {latestRun && (
                <div className="refresh-card__meta">
                  Last run {timeAgo(latestRun.createdAt)}
                  {latestRun.url && (
                    <a href={latestRun.url} target="_blank" rel="noopener noreferrer" className="refresh-card__link">
                      View logs ↗
                    </a>
                  )}
                </div>
              )}
              <button
                className={`btn ${v.id === 'all' ? 'btn-primary' : 'btn-secondary'} refresh-card__btn`}
                onClick={() => dispatch(v.id)}
                disabled={busy}
              >
                {busy ? 'Dispatching…' : `Refresh ${v.label}`}
              </button>
            </div>
          );
        })}
      </div>

      {lastCheck && (
        <p className="refresh-panel__checked">Status checked {timeAgo(lastCheck)}</p>
      )}

      <div className="refresh-panel__note">
        <strong>How it works:</strong> Each button triggers a GitHub Actions workflow that runs
        on GitHub's servers — not in your browser. Scores pull from football-data.org.
        News and narratives search Google News RSS and land as drafts for your review.
        Upsets and bracket are computed automatically from match results.
      </div>
    </div>
  );
}
