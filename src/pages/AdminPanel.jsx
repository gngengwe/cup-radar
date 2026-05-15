import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { verifyToken, getLatestCommit } from '../utils/github';
import AlertsEditor     from '../admin/AlertsEditor';
import NewsEditor       from '../admin/NewsEditor';
import MatchScoreUpdater from '../admin/MatchScoreUpdater';
import ScenarioUpdater  from '../admin/ScenarioUpdater';

const TABS = [
  { id: 'alerts',    icon: '⚡', label: 'Alerts',    desc: 'Daily update'  },
  { id: 'scores',    icon: '⚽', label: 'Scores',    desc: 'Match results' },
  { id: 'news',      icon: '📰', label: 'News',      desc: 'Add article'   },
  { id: 'scenarios', icon: '🎯', label: 'Scenarios', desc: 'Mark outcomes' },
];

// ─── Login screen ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [token,   setToken]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    setLoading(true); setError('');
    const ok = await verifyToken(t).catch(() => false);
    if (ok) {
      sessionStorage.setItem('cr_admin_token', t);
      onLogin(t);
    } else {
      setError('Token invalid or missing repo write access. Check the token and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon">🛠️</div>
        <h1 className="admin-login-title">Cup Radar Admin</h1>
        <p className="admin-login-sub">
          Enter a GitHub Personal Access Token with <strong>repo</strong> read+write access to unlock the data editor.
        </p>

        <form onSubmit={submit}>
          <input
            type="password"
            className="admin-input"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {error && <p className="admin-status error" style={{ marginTop: 8 }}>{error}</p>}
          <button type="submit" className="btn btn-primary admin-login-submit" disabled={!token.trim() || loading}>
            {loading ? 'Verifying…' : 'Unlock Admin'}
          </button>
        </form>

        <div className="admin-login-help">
          <p><strong>How to get a token:</strong></p>
          <ol>
            <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">github.com/settings/tokens</a></li>
            <li>Generate new token (classic) → check <strong>repo</strong></li>
            <li>Copy and paste the token above</li>
          </ol>
          <p>Stored in sessionStorage only — clears when you close the browser.</p>
        </div>

        <Link to="/" className="admin-login-back">← Back to Cup Radar</Link>
      </div>
    </div>
  );
}

// ─── Main admin panel ────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [token,  setToken]  = useState(() => sessionStorage.getItem('cr_admin_token') || '');
  const [tab,    setTab]    = useState('alerts');
  const [commit, setCommit] = useState(null);

  useEffect(() => {
    if (!token) return;
    getLatestCommit(token).then(c => setCommit(c)).catch(() => {});
  }, [token]);

  const logout = () => {
    sessionStorage.removeItem('cr_admin_token');
    setToken('');
  };

  if (!token) return <LoginScreen onLogin={t => setToken(t)} />;

  return (
    <div className="admin-panel">
      {/* ── Top bar ── */}
      <div className="admin-topbar">
        <div className="admin-topbar__left">
          <span className="admin-topbar__logo">🛠️ Admin</span>
          {commit && (
            <span className="admin-topbar__commit">
              Last deploy: <strong>{commit.sha}</strong> — {commit.message}
            </span>
          )}
        </div>
        <div className="admin-topbar__right">
          <Link to="/" className="admin-topbar__link">← View site</Link>
          <button onClick={logout} className="admin-topbar__link danger">Log out</button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="admin-tab__icon">{t.icon}</span>
            <span className="admin-tab__label">{t.label}</span>
            <span className="admin-tab__desc">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="admin-content">
        {tab === 'alerts'    && <AlertsEditor      token={token} key="alerts" />}
        {tab === 'scores'    && <MatchScoreUpdater  token={token} key="scores" />}
        {tab === 'news'      && <NewsEditor          token={token} key="news" />}
        {tab === 'scenarios' && <ScenarioUpdater    token={token} key="scenarios" />}
      </div>
    </div>
  );
}
