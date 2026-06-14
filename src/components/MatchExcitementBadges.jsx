// ─── MatchExcitementBadges — dominant + secondary badge chips ─────────────
// Renders the result of evaluateMatchBadges(): one dominant badge (larger,
// colored) plus up to MATCH_BADGE_MAX_SECONDARY secondary badges as small chips.

export function MatchExcitementBadges({ badges }) {
  if (!badges) return null;
  const all = [badges.dominant, ...badges.secondary].filter(Boolean);
  if (all.length === 0) return null;

  return (
    <div className="match-badges">
      {all.map((badge, i) => (
        <span
          key={badge.id}
          className={`match-badge${i === 0 ? ' match-badge--dominant' : ''}`}
          style={{ '--badge-color': badge.color }}
          title={badge.explanation}
        >
          <span className="match-badge__icon">{badge.icon}</span>
          <span className="match-badge__name">{badge.name}</span>
        </span>
      ))}
    </div>
  );
}
