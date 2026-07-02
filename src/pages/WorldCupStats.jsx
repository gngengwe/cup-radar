import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FlagImg from '../components/FlagImg';
import matchesData from '../data/matches.json';
import {
  computeTournamentStats,
  computeGoalMinuteBands,
  computeComebacks,
  computeLateGoals,
  computeTeamStats,
  computeTopScorers,
} from '../utils/statsEngine';

const IMPACT_LABEL = {
  winner: 'WINNER',
  equalizer: 'EQUALIZER',
  insurance: 'INSURANCE',
  consolation: 'CONSOLATION',
};
const IMPACT_COLOR = {
  winner: 'var(--accent)',
  equalizer: '#4d8eff',
  insurance: '#ffd700',
  consolation: 'var(--text-muted)',
};

const STAGE_ORDER = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WorldCupStats() {
  const tournamentStats = useMemo(() => computeTournamentStats(), []);
  const minuteBands = useMemo(() => computeGoalMinuteBands(), []);
  const comebacks = useMemo(() => computeComebacks(), []);
  const lateGoals = useMemo(() => computeLateGoals(), []);
  const teamStats = useMemo(() => computeTeamStats(), []);
  const topScorers = useMemo(() => computeTopScorers(10), []);

  const [sortKey, setSortKey] = useState('points');
  const [sortDir, setSortDir] = useState(1);

  // Filter TBD placeholder bracket teams; sortDir 1 = desc, -1 = asc
  const sortedTeams = useMemo(() => {
    return teamStats
      .filter(t => t.team && t.team !== 'TBD')
      .sort((a, b) => {
        const av = a[sortKey] ?? 0;
        const bv = b[sortKey] ?? 0;
        if (typeof av === 'string') return sortDir * av.localeCompare(bv);
        if (bv !== av) return sortDir * (bv - av);
        if (sortKey !== 'goalDiff') return (b.goalDiff - a.goalDiff);
        return b.goalsFor - a.goalsFor;
      });
  }, [teamStats, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(1); }
  }

  const maxBandCount = useMemo(() => Math.max(...minuteBands.map(b => b.count), 1), [minuteBands]);
  const totalBandGoals = useMemo(() => minuteBands.reduce((s, b) => s + b.count, 0), [minuteBands]);
  const maxScorer = topScorers[0]?.count || 1;

  const homeGoals = useMemo(() => {
    let h = 0, a = 0;
    for (const m of (matchesData.matches || [])) {
      if (m.status !== 'finished') continue;
      for (const g of m.goals || []) {
        if (g.note !== 'og') {
          if (g.team === 'home') h++;
          else a++;
        } else {
          if (g.team === 'home') a++;
          else h++;
        }
      }
    }
    return { home: h, away: a };
  }, []);

  const comebackRate = tournamentStats.matchesPlayed
    ? (((tournamentStats.comebackWins + tournamentStats.comebackDraws) / tournamentStats.matchesPlayed) * 100).toFixed(1)
    : '0.0';
  const lateGoalRate = tournamentStats.totalGoals
    ? ((tournamentStats.lateGoals / tournamentStats.totalGoals) * 100).toFixed(1)
    : '0.0';

  const headerCell = (label, key) => (
    <th
      className={`stats-page__table-th${sortKey === key ? ' is-sorted' : ''}`}
      onClick={() => handleSort(key)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {label}{sortKey === key ? (sortDir > 0 ? ' ↓' : ' ↑') : ''}
    </th>
  );

  return (
    <>
      <Navbar />
      <main className="stats-page">
        <div className="container">
          <Link to="/" className="stats-page__back">← Cup Radar</Link>
        </div>

        <section className="stats-page__hero container">
          <span className="section-label">World Cup 2026 · All {tournamentStats.matchesPlayed} Matches</span>
          <h1 className="stats-page__hero-title">World Cup by the Numbers</h1>
          <p className="section-sub">
            Every goal, comeback, and late-drama moment — computed live from the match feed.
          </p>
          <div className="stats-page__stat-grid">
            <div className="stats-page__stat-card">
              <span className="stats-page__stat-label">Matches Played</span>
              <strong className="stats-page__stat-value">{tournamentStats.matchesPlayed}</strong>
              <span className="stats-page__stat-note">of 104 total</span>
            </div>
            <div className="stats-page__stat-card">
              <span className="stats-page__stat-label">Total Goals</span>
              <strong className="stats-page__stat-value">{tournamentStats.totalGoals}</strong>
              <span className="stats-page__stat-note">all finished matches</span>
            </div>
            <div className="stats-page__stat-card">
              <span className="stats-page__stat-label">Goals / Match</span>
              <strong className="stats-page__stat-value">{tournamentStats.goalsPerMatch.toFixed(1)}</strong>
              <span className="stats-page__stat-note">tournament average</span>
            </div>
            <div className="stats-page__stat-card">
              <span className="stats-page__stat-label">Comeback Wins</span>
              <strong className="stats-page__stat-value stats-page__stat-value--accent">{tournamentStats.comebackWins}</strong>
              <span className="stats-page__stat-note">came from behind</span>
            </div>
            <div className="stats-page__stat-card">
              <span className="stats-page__stat-label">Late Goals</span>
              <strong className="stats-page__stat-value stats-page__stat-value--accent">{tournamentStats.lateGoals}</strong>
              <span className="stats-page__stat-note">after the 80th minute</span>
            </div>
            <div className="stats-page__stat-card">
              <span className="stats-page__stat-label">Extra Time Goals</span>
              <strong className="stats-page__stat-value">{tournamentStats.extraTimeGoals}</strong>
              <span className="stats-page__stat-note">after 90 minutes</span>
            </div>
          </div>
        </section>

        <section className="stats-page__section container">
          <span className="section-label">Goal Timing</span>
          <h2>Goals by the Numbers</h2>
          <p className="section-sub">When goals happen — broken into 15-minute bands across all matches.</p>

          <div className="stats-page__bar-list">
            {minuteBands.map(({ band, count }) => {
              const pct = totalBandGoals > 0 ? ((count / totalBandGoals) * 100).toFixed(1) : '0.0';
              const fillPct = maxBandCount > 0 ? (count / maxBandCount) * 100 : 0;
              return (
                <div key={band} className="stats-page__bar-row">
                  <span className="stats-page__bar-label">{band}</span>
                  <div className="stats-page__bar-track">
                    <div className="stats-page__bar-fill" style={{ width: `${fillPct}%` }} />
                  </div>
                  <span className="stats-page__bar-count">{count}</span>
                  <span className="stats-page__bar-pct">{pct}%</span>
                </div>
              );
            })}
          </div>

          <div className="stats-page__pill-row">
            <div className="stats-page__pill">
              <span className="stats-page__pill-label">Own Goals</span>
              <strong>{tournamentStats.ownGoals}</strong>
            </div>
            <div className="stats-page__pill">
              <span className="stats-page__pill-label">Penalties</span>
              <strong>{tournamentStats.penGoals}</strong>
            </div>
            <div className="stats-page__pill">
              <span className="stats-page__pill-label">Clean Sheets</span>
              <strong>{tournamentStats.cleanSheets}</strong>
            </div>
            <div className="stats-page__pill">
              <span className="stats-page__pill-label">4+ Goal Matches</span>
              <strong>{tournamentStats.highScoringMatches}</strong>
            </div>
            <div className="stats-page__pill">
              <span className="stats-page__pill-label">Stoppage Goals</span>
              <strong>{tournamentStats.stoppageGoals}</strong>
            </div>
            <div className="stats-page__pill">
              <span className="stats-page__pill-label">2nd Half Goals</span>
              <strong>{tournamentStats.secondHalfGoals}</strong>
            </div>
          </div>
        </section>

        <section className="stats-page__section container">
          <span className="section-label">Drama Index</span>
          <h2>Comeback Tracker</h2>
          <p className="section-sub">Teams that fell behind and clawed their way back.</p>

          <div className="stats-page__pill-row" style={{ marginBottom: 24 }}>
            <div className="stats-page__pill stats-page__pill--accent">
              <span className="stats-page__pill-label">Come-from-behind Wins</span>
              <strong>{tournamentStats.comebackWins}</strong>
            </div>
            <div className="stats-page__pill">
              <span className="stats-page__pill-label">Comeback Draws</span>
              <strong>{tournamentStats.comebackDraws}</strong>
            </div>
            <div className="stats-page__pill">
              <span className="stats-page__pill-label">Multi-goal Comebacks</span>
              <strong>{comebacks.filter(c => c.multiGoal).length}</strong>
            </div>
            <div className="stats-page__pill">
              <span className="stats-page__pill-label">Comeback Rate</span>
              <strong>{comebackRate}%</strong>
            </div>
          </div>

          {comebacks.length === 0 ? (
            <p className="stats-page__empty">No comebacks recorded yet in the current dataset.</p>
          ) : (
            <div className="stats-page__comeback-list">
              {comebacks.slice(0, 20).map(cb => {
                const cbTeam = cb.comebackTeam === 'home' ? cb.homeTeam : cb.awayTeam;
                const cbFlag = cb.comebackTeam === 'home' ? cb.homeFlag : cb.awayFlag;
                return (
                  <div key={cb.matchId} className="stats-page__comeback-item">
                    <div className="stats-page__comeback-matchup">
                      <FlagImg emoji={cb.homeFlag} size={18} />
                      <span className="stats-page__comeback-team">{cb.homeTeam}</span>
                      <span className="stats-page__comeback-score">{cb.homeScore}–{cb.awayScore}</span>
                      <span className="stats-page__comeback-team">{cb.awayTeam}</span>
                      <FlagImg emoji={cb.awayFlag} size={18} />
                    </div>
                    <div className="stats-page__comeback-meta">
                      <FlagImg emoji={cbFlag} size={14} />
                      <span>{cbTeam} came back</span>
                      {cb.multiGoal && <span className="stats-page__comeback-chip stats-page__comeback-chip--multi">Multi-goal</span>}
                      <span className="stats-page__comeback-chip">{cb.type === 'win' ? 'Win' : 'Draw'}</span>
                      <span className="stats-page__comeback-date">{formatDate(cb.date)} · {cb.stage}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="stats-page__section container">
          <span className="section-label">After the 80th Minute</span>
          <h2>Late Drama</h2>
          <p className="section-sub">Goals scored in the 80th minute or later — sorted by most dramatic first.</p>

          {lateGoals.length === 0 ? (
            <p className="stats-page__empty">No late goals in the current dataset.</p>
          ) : (
            <div className="stats-page__late-list">
              {lateGoals.slice(0, 30).map((g, i) => (
                <div key={`${g.matchId}-${i}`} className="stats-page__late-item">
                  <span className="stats-page__late-minute">{g.minute}'</span>
                  <FlagImg emoji={g.flag} size={20} />
                  <div className="stats-page__late-body">
                    <span className="stats-page__late-player">{g.player}</span>
                    <span className="stats-page__late-context">
                      {g.team} vs {g.opponent} · {g.scoreBefore} → {g.scoreAfter} · {formatDate(g.date)}
                    </span>
                  </div>
                  <span
                    className="stats-page__late-impact"
                    style={{ color: IMPACT_COLOR[g.impact] }}
                  >
                    {IMPACT_LABEL[g.impact]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="stats-page__section container">
          <span className="section-label">All 48 Teams</span>
          <h2>Country Performance</h2>
          <p className="section-sub">Click column headers to sort. Showing all teams in the tournament.</p>

          <div className="stats-page__table-wrap">
            <table className="stats-page__table">
              <thead>
                <tr>
                  <th className="stats-page__table-th">#</th>
                  <th className="stats-page__table-th">Flag</th>
                  {headerCell('Country', 'team')}
                  {headerCell('MP', 'matchesPlayed')}
                  {headerCell('W', 'wins')}
                  {headerCell('D', 'draws')}
                  {headerCell('L', 'losses')}
                  {headerCell('GF', 'goalsFor')}
                  {headerCell('GA', 'goalsAgainst')}
                  {headerCell('GD', 'goalDiff')}
                  {headerCell('Pts', 'points')}
                  <th className="stats-page__table-th">Stage</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((t, idx) => {
                  const stageIdx = STAGE_ORDER.indexOf(t.stageReached);
                  const highlight = stageIdx >= 1;
                  return (
                    <tr key={t.code} className={`stats-page__table-row${highlight ? ' stats-page__table-row--advanced' : ''}`}>
                      <td className="stats-page__table-td stats-page__table-td--dim">{idx + 1}</td>
                      <td className="stats-page__table-td"><FlagImg emoji={t.flag} size={18} /></td>
                      <td className="stats-page__table-td stats-page__table-td--name">{t.team}</td>
                      <td className="stats-page__table-td">{t.matchesPlayed}</td>
                      <td className="stats-page__table-td">{t.wins}</td>
                      <td className="stats-page__table-td">{t.draws}</td>
                      <td className="stats-page__table-td">{t.losses}</td>
                      <td className="stats-page__table-td">{t.goalsFor}</td>
                      <td className="stats-page__table-td">{t.goalsAgainst}</td>
                      <td className={`stats-page__table-td${t.goalDiff > 0 ? ' stats-page__table-td--pos' : t.goalDiff < 0 ? ' stats-page__table-td--neg' : ''}`}>
                        {t.goalDiff > 0 ? `+${t.goalDiff}` : t.goalDiff}
                      </td>
                      <td className="stats-page__table-td stats-page__table-td--pts">{t.points}</td>
                      <td className="stats-page__table-td stats-page__table-td--stage">{t.stageReached}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stats-page__section container">
          <span className="section-label">Top Scorers</span>
          <h2>Golden Boot Race</h2>
          <p className="section-sub">Own goals excluded. Penalties counted.</p>

          {topScorers.length === 0 ? (
            <p className="stats-page__empty">No scorers in the current dataset.</p>
          ) : (
            <div className="stats-page__gb-list">
              {topScorers.map((scorer, idx) => {
                const fillPct = (scorer.count / maxScorer) * 100;
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1;
                const barColor = idx === 0
                  ? 'linear-gradient(90deg,#FFD700,#FFA500)'
                  : idx === 1
                    ? 'linear-gradient(90deg,#C0C0C0,#9ba3af)'
                    : idx === 2
                      ? 'linear-gradient(90deg,#cd7f32,#b5651d)'
                      : 'linear-gradient(90deg,var(--accent),#4d8eff)';
                return (
                  <div key={`${scorer.player}-${scorer.code}`} className="stats-page__gb-row">
                    <span className="stats-page__gb-medal">{medal}</span>
                    <FlagImg emoji={scorer.flag} size={20} />
                    <div className="stats-page__gb-identity">
                      <span className="stats-page__gb-name">{scorer.player}</span>
                      <span className="stats-page__gb-team">{scorer.team}</span>
                    </div>
                    <div className="stats-page__gb-bar-wrap">
                      <div className="stats-page__gb-bar-fill" style={{ width: `${fillPct}%`, background: barColor }} />
                    </div>
                    <strong className="stats-page__gb-count">{scorer.count}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="stats-page__section container">
          <span className="section-label">Analytics</span>
          <h2>Deeper Analytics</h2>
          <p className="section-sub">What we can compute from the goal feed vs. what needs additional data.</p>

          <h3 className="stats-page__sub-heading">What we track in real-time</h3>
          <div className="stats-page__analytics-grid">
            <div className="stats-page__analytics-card">
              <span className="stats-page__analytics-label">Goals / Game</span>
              <strong className="stats-page__analytics-value">{tournamentStats.goalsPerMatch.toFixed(2)}</strong>
            </div>
            <div className="stats-page__analytics-card">
              <span className="stats-page__analytics-label">Comeback Rate</span>
              <strong className="stats-page__analytics-value">{comebackRate}%</strong>
            </div>
            <div className="stats-page__analytics-card">
              <span className="stats-page__analytics-label">Late Goal Rate</span>
              <strong className="stats-page__analytics-value">{lateGoalRate}%</strong>
            </div>
            <div className="stats-page__analytics-card">
              <span className="stats-page__analytics-label">Home Goals</span>
              <strong className="stats-page__analytics-value">{homeGoals.home}</strong>
            </div>
            <div className="stats-page__analytics-card">
              <span className="stats-page__analytics-label">Away Goals</span>
              <strong className="stats-page__analytics-value">{homeGoals.away}</strong>
            </div>
            <div className="stats-page__analytics-card">
              <span className="stats-page__analytics-label">Home Advantage</span>
              <strong className="stats-page__analytics-value">
                {homeGoals.home + homeGoals.away > 0
                  ? `${((homeGoals.home / (homeGoals.home + homeGoals.away)) * 100).toFixed(0)}%`
                  : '—'}
              </strong>
            </div>
            <div className="stats-page__analytics-card">
              <span className="stats-page__analytics-label">1st Half Goals</span>
              <strong className="stats-page__analytics-value">{tournamentStats.firstHalfGoals}</strong>
            </div>
            <div className="stats-page__analytics-card">
              <span className="stats-page__analytics-label">2nd Half Goals</span>
              <strong className="stats-page__analytics-value">{tournamentStats.secondHalfGoals}</strong>
            </div>
          </div>

          <h3 className="stats-page__sub-heading stats-page__sub-heading--muted">Advanced metrics (data pending)</h3>
          <div className="stats-page__pending-grid">
            {[
              { label: 'Expected Goals (xG)', note: 'Requires shot location + quality data' },
              { label: 'Possession %', note: 'Requires time-series tracking per match' },
              { label: 'Shots on Target', note: 'Requires per-match shot log' },
              { label: 'Passes Completed', note: 'Requires event-level pass data' },
              { label: 'Yellow / Red Cards', note: 'Discipline feed not yet in dataset' },
              { label: 'Offsides', note: 'Requires lineups + event tracking' },
              { label: 'Big Chances', note: 'Requires xG model integration' },
              { label: 'High Press Events', note: 'Requires positional / tracking data' },
            ].map(({ label, note }) => (
              <div key={label} className="stats-page__pending-card">
                <span className="stats-page__pending-chip">PENDING</span>
                <span className="stats-page__pending-label">{label}</span>
                <span className="stats-page__pending-note">{note}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="stats-page__section container">
          <span className="section-label">Match-Level Data</span>
          <h2>Match Stats Dashboard</h2>
          <p className="section-sub">Per-match breakdowns — possession, shots, saves — are not in the current dataset.</p>
          <div className="stats-page__coming-soon">
            <span className="stats-page__coming-soon-icon">📊</span>
            <p className="stats-page__coming-soon-text">
              Coming when match-level stats (possession, shots on target, corners, saves) are tracked.
              The goal feed currently records: goal scorer, minute, team, and goal type (open play / OG / pen).
            </p>
          </div>
        </section>

        <div className="stats-page__footer container">
          <p>All stats auto-computed from the Cup Radar match feed. Updated as matches finish.</p>
          <Link to="/" className="btn btn-secondary">← Back to Cup Radar</Link>
        </div>
      </main>
    </>
  );
}
