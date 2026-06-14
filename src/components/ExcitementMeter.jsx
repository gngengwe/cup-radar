// ─── ExcitementMeter — compact live "Match Excitement" gauge ──────────────
// Renders the 0-100 score from useMatchExcitement() as a filled bar plus a
// numeric score + label. `compact` shrinks it for grid cards; the default
// size is used on the larger MatchDayHero.

function levelClass(score) {
  if (score >= 85) return 'goal';
  if (score >= 75) return 'high';
  if (score >= 60) return 'tense';
  if (score >= 40) return 'live';
  return 'calm';
}

export function ExcitementMeter({ excitement, compact = false }) {
  if (!excitement) return null;
  const { score, shortLabel } = excitement;

  return (
    <div
      className={`excitement-meter${compact ? ' excitement-meter--compact' : ''}`}
      data-level={levelClass(score)}
    >
      <div className="excitement-meter__bar">
        <div className="excitement-meter__fill" style={{ width: `${score}%` }} />
      </div>
      <div className="excitement-meter__label">
        <span className="excitement-meter__score">{score}</span>
        <span className="excitement-meter__text">{shortLabel}</span>
      </div>
    </div>
  );
}
