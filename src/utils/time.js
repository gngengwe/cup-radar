// Shared time utilities used across Cup Radar

/**
 * Returns a human-readable relative time string.
 * e.g. "Today", "Yesterday", "3 days ago", "2 weeks ago"
 */
export function relativeTime(dateStr) {
  if (!dateStr) return '';
  const date  = new Date(typeof dateStr === 'string' && dateStr.length === 10
    ? dateStr + 'T12:00:00'   // date-only strings: avoid timezone flip
    : dateStr);
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin  < 2)   return 'Just now';
  if (diffMin  < 60)  return `${diffMin} min ago`;
  if (diffHrs  < 24)  return `${diffHrs} hr${diffHrs !== 1 ? 's' : ''} ago`;
  if (diffDay  === 1) return 'Yesterday';
  if (diffDay  < 7)   return `${diffDay} days ago`;
  if (diffDay  < 14)  return '1 week ago';
  if (diffDay  < 30)  return `${Math.floor(diffDay / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Returns "in X days", "TOMORROW", "TODAY", or null if date has passed.
 */
export function daysUntilLabel(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T12:00:00');
  const diffMs = target - Date.now();
  if (diffMs < 0) return null;                        // past
  const days = Math.ceil(diffMs / 86_400_000);
  if (days === 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  if (days <= 30) return `in ${days} day${days !== 1 ? 's' : ''}`;
  return null;
}

/**
 * Returns a live countdown string "Xd Xh Xm" or null if time has passed.
 */
export function liveCountdown(isoTarget) {
  const diff = new Date(isoTarget) - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
