// ─── GoalLog — minute + scorer for each goal in a finished match ──────────
// Renders match.goals (if present) as a compact chronological list:
// "⚽ 23' Player Name (OG) 🇲🇽". Returns null if the match has no goal data.

import FlagImg from './FlagImg';

const NOTE_LABELS = {
  og: 'OG',
  pen: 'pen',
};

function minuteSortValue(minute) {
  const m = String(minute).match(/^(\d+)(?:\+(\d+))?/);
  if (!m) return 0;
  return Number(m[1]) + (m[2] ? Number(m[2]) / 100 : 0);
}

export function GoalLog({ match }) {
  const goals = match?.goals;
  if (!goals?.length) return null;

  const sorted = [...goals].sort((a, b) => minuteSortValue(a.minute) - minuteSortValue(b.minute));

  return (
    <div className="match-goal-log">
      {sorted.map((goal, i) => (
        <span key={i} className="match-goal-log__entry">
          <span className="match-goal-log__icon">⚽</span>
          <span className="match-goal-log__minute">{goal.minute}&apos;</span>
          <span className="match-goal-log__player">
            {goal.player}
            {goal.note && NOTE_LABELS[goal.note] && (
              <span className="match-goal-log__note"> ({NOTE_LABELS[goal.note]})</span>
            )}
          </span>
          <FlagImg emoji={goal.team === 'home' ? match.homeFlag : match.awayFlag} size={12} />
        </span>
      ))}
    </div>
  );
}
