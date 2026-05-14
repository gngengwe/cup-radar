// Converts a flag emoji character to a Twemoji CDN SVG URL.
// Fixes Windows desktop where flag emoji render as two-letter codes instead of images.
//
// Works by extracting Unicode code points from the emoji string and building
// the Twemoji CDN URL. Handles both regional indicator pairs (🇺🇸) and
// subdivision flags (🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland, 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England).

const BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/';

// Cache computed URLs — emoji strings are short and repeated many times per render
const cache = new Map();

function emojiToUrl(emoji) {
  if (cache.has(emoji)) return cache.get(emoji);

  const codePoints = [];
  let i = 0;
  while (i < emoji.length) {
    const cp = emoji.codePointAt(i);
    if (cp === undefined) break;
    // Skip variation selector FE0F (changes text → emoji presentation)
    if (cp !== 0xFE0F) {
      codePoints.push(cp.toString(16));
    }
    i += cp > 0xFFFF ? 2 : 1; // surrogate pair = 2 JS chars
  }

  const url = codePoints.length > 0 ? `${BASE}${codePoints.join('-')}.svg` : null;
  cache.set(emoji, url);
  return url;
}

// Accessible label map: raw emoji → descriptive country name for screen readers
const FLAG_LABELS = {
  '🇦🇷': 'Argentina', '🇦🇺': 'Australia', '🇦🇹': 'Austria',
  '🇧🇴': 'Bolivia',   '🇧🇷': 'Brazil',    '🇨🇦': 'Canada',
  '🇨🇲': 'Cameroon',  '🇨🇱': 'Chile',     '🇨🇴': 'Colombia',
  '🇭🇷': 'Croatia',   '🇨🇺': 'Cuba',      '🇨🇮': 'Ivory Coast',
  '🇪🇨': 'Ecuador',   '🇪🇬': 'Egypt',
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿': 'England',  '🇫🇷': 'France',   '🇬🇭': 'Ghana',
  '🇩🇪': 'Germany',  '🇬🇪': 'Georgia',  '🇭🇳': 'Honduras',
  '🇭🇺': 'Hungary',  '🇮🇩': 'Indonesia','🇮🇷': 'Iran',
  '🇮🇶': 'Iraq',     '🇯🇲': 'Jamaica',  '🇯🇵': 'Japan',
  '🇯🇴': 'Jordan',   '🇸🇦': 'Saudi Arabia','🇰🇷': 'South Korea',
  '🇲🇦': 'Morocco',  '🇲🇽': 'Mexico',   '🇳🇱': 'Netherlands',
  '🇳🇿': 'New Zealand','🇳🇬': 'Nigeria', '🇵🇦': 'Panama',
  '🇵🇾': 'Paraguay', '🇵🇪': 'Peru',     '🇵🇱': 'Poland',
  '🇵🇹': 'Portugal', '🇷🇴': 'Romania',  '🇷🇸': 'Serbia',
  '🏴󠁧󠁢󠁳󠁣󠁴󠁿': 'Scotland',  '🇸🇳': 'Senegal',  '🇸🇰': 'Slovakia',
  '🇿🇦': 'South Africa','🇪🇸': 'Spain', '🇸🇪': 'Sweden',
  '🇨🇭': 'Switzerland','🇹🇷': 'Turkey','🇹🇳': 'Tunisia',
  '🇺🇦': 'Ukraine',  '🇺🇾': 'Uruguay', '🇺🇸': 'USA',
  '🇻🇪': 'Venezuela','🏴󠁧󠁢󠁷󠁬󠁳󠁿': 'Wales',
};

// Non-flag emoji we render as-is (no image needed — they render fine everywhere)
const PASSTHROUGH = new Set(['⚽', '🏳️', '🌅', '⭐', '📖', '🚨', '🏆', '📊', '📰', '👕', '🍺', '✈️', '🎫']);

export default function FlagImg({ emoji, size = 18, className = '' }) {
  if (!emoji || PASSTHROUGH.has(emoji)) {
    return <span className={className} style={{ fontSize: size }}>{emoji}</span>;
  }

  const url   = emojiToUrl(emoji);
  const label = FLAG_LABELS[emoji] ? `${FLAG_LABELS[emoji]} flag` : emoji;

  if (!url) return <span className={className}>{emoji}</span>;

  return (
    <img
      src={url}
      alt={label}
      width={size}
      height={size}
      className={`flag-img${className ? ` ${className}` : ''}`}
      loading="lazy"
    />
  );
}
