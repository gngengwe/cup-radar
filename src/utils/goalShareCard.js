import { VENUE_COORDS } from '../data/venueCoords';
import { projectToRadar } from './radarProjection';
import { GOAL_RADAR_BOUNDS, GOAL_RADAR_WORLD_MAP_PATH } from './goalRadarVisuals';
import { formatGoalDate, getGoalMomentCopy, getTopCities } from './goalRadarStory';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapText(text, maxChars = 22, maxLines = 3) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const testLine = current ? `${current} ${word}` : word;
    if (testLine.length <= maxChars || !current) {
      current = testLine;
      continue;
    }

    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) {
      const remainder = words.slice(index + 1).join(' ');
      if (remainder) current = `${current} ${remainder}`.trim();
      break;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);

  return lines.map((line, index) => {
    const needsTrim = index === maxLines - 1 && line.length > maxChars + 12;
    const content = needsTrim ? `${line.slice(0, maxChars + 9).trimEnd()}...` : line;
    return {
      text: content,
      dy: index === 0 ? 0 : 84,
    };
  });
}

function createRadarDots(cityCounts, activeVenueKey) {
  return Object.entries(VENUE_COORDS).map(([key, venue]) => {
    const { x, y } = projectToRadar(venue.lat, venue.lon, GOAL_RADAR_BOUNDS);
    const count = cityCounts[key] || 0;
    const active = key === activeVenueKey;
    const radius = active ? 10 : Math.max(4, 4 + count * 1.4);
    const fill = active ? '#ffffff' : count ? '#00e676' : 'rgba(143, 168, 160, 0.34)';
    const stroke = active ? 'rgba(255,255,255,0.85)' : 'rgba(0,230,118,0.26)';
    const glow = active ? 'rgba(255,255,255,0.55)' : 'rgba(0,230,118,0.28)';
    return `
      <circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" fill-opacity="${active ? '1' : count ? '0.95' : '1'}" />
      <circle cx="${x}" cy="${y}" r="${active ? 22 : radius + 6}" fill="none" stroke="${stroke}" stroke-width="${active ? '2.2' : '1.3'}" opacity="${active ? '0.9' : count ? '0.75' : '0.45'}" />
      <circle cx="${x}" cy="${y}" r="${active ? 38 : radius + 12}" fill="none" stroke="${glow}" stroke-width="1.4" opacity="${active ? '0.55' : count ? '0.2' : '0.12'}" />
    `;
  }).join('');
}

export function buildGoalShareCardSvg(goal, {
  goalCount = 0,
  cityCounts = {},
  brandLabel = 'Cup Radar',
} = {}) {
  const titleLines = wrapText(goal?.player || 'Goal', 20, 3);
  // Capped at 4 (vs. the main page's top-5) — the fixed-height SVG card has
  // no room for a 5th row without overlapping the "GOAL X OF Y" badge below it.
  const topCities = getTopCities(cityCounts, 4);
  const subtitle = `${goal.homeTeam} vs ${goal.awayTeam}`;
  const momentCopy = getGoalMomentCopy(goal);
  const scoreLabel = `${goal.homeCode} ${goal.homeScoreAfter}  ${goal.awayScoreAfter} ${goal.awayCode}`;
  const venueLabel = `${goal.city}  |  ${formatGoalDate(goal.date, { month: 'short', day: 'numeric' })}`;
  const radarDots = createRadarDots(cityCounts, goal.venueKey);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img" aria-label="${escapeXml(goal.player)} goal card">
      <defs>
        <linearGradient id="card-border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(0,230,118,0.9)" />
          <stop offset="100%" stop-color="rgba(77,142,255,0.68)" />
        </linearGradient>
        <radialGradient id="card-glow" cx="50%" cy="10%" r="70%">
          <stop offset="0%" stop-color="rgba(0,230,118,0.26)" />
          <stop offset="100%" stop-color="rgba(7,16,10,0)" />
        </radialGradient>
        <radialGradient id="card-panel" cx="20%" cy="0%" r="120%">
          <stop offset="0%" stop-color="#123220" />
          <stop offset="100%" stop-color="#07100a" />
        </radialGradient>
      </defs>

      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#07100a" />
      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#card-glow)" />
      <circle cx="880" cy="190" r="260" fill="rgba(77,142,255,0.09)" />
      <circle cx="240" cy="1150" r="360" fill="rgba(0,230,118,0.08)" />

      <rect x="42" y="42" width="${CARD_WIDTH - 84}" height="${CARD_HEIGHT - 84}" rx="40" fill="url(#card-panel)" stroke="url(#card-border)" stroke-opacity="0.55" />
      <rect x="74" y="74" width="${CARD_WIDTH - 148}" height="${CARD_HEIGHT - 148}" rx="28" fill="rgba(9,22,40,0.12)" stroke="rgba(255,255,255,0.08)" />

      <text x="112" y="152" fill="#00e676" font-family="Inter, Segoe UI, sans-serif" font-size="34" font-weight="800" letter-spacing="6">GOAL RADAR</text>
      <text x="112" y="196" fill="#8fa8a0" font-family="Inter, Segoe UI, sans-serif" font-size="26" font-weight="600" letter-spacing="1">${escapeXml(brandLabel)}</text>

      <text x="112" y="330" fill="#8fa8a0" font-family="Inter, Segoe UI, sans-serif" font-size="30" font-weight="700">${escapeXml(subtitle)}</text>
      <text x="112" y="436" fill="#eee8dd" font-family="Inter, Segoe UI, sans-serif" font-size="78" font-weight="900" letter-spacing="-2">
        ${titleLines.map(line => `<tspan x="112" dy="${line.dy}">${escapeXml(line.text)}</tspan>`).join('')}
      </text>

      <rect x="112" y="638" width="244" height="132" rx="24" fill="rgba(0,230,118,0.12)" stroke="rgba(0,230,118,0.34)" />
      <text x="152" y="714" fill="#00e676" font-family="Inter, Segoe UI, sans-serif" font-size="82" font-weight="900">${escapeXml(goal.minute)}'</text>

      <rect x="392" y="638" width="576" height="132" rx="24" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
      <text x="436" y="698" fill="#8fa8a0" font-family="Inter, Segoe UI, sans-serif" font-size="24" font-weight="700" letter-spacing="2">SCORE AFTER THE GOAL</text>
      <text x="436" y="742" fill="#eee8dd" font-family="Inter, Segoe UI, sans-serif" font-size="54" font-weight="900" letter-spacing="-1">${escapeXml(scoreLabel)}</text>

      <text x="112" y="842" fill="#eee8dd" font-family="Inter, Segoe UI, sans-serif" font-size="36" font-weight="700">${escapeXml(momentCopy)}</text>
      <text x="112" y="892" fill="#8fa8a0" font-family="Inter, Segoe UI, sans-serif" font-size="28" font-weight="600">${escapeXml(venueLabel)}</text>
      <text x="112" y="934" fill="#8fa8a0" font-family="Inter, Segoe UI, sans-serif" font-size="28" font-weight="600">${escapeXml(goal.stage)}${goal.isOwnGoal ? '  |  Own goal' : ''}</text>

      <g transform="translate(96 982)">
        <rect width="508" height="252" rx="30" fill="rgba(7,16,10,0.72)" stroke="rgba(0,230,118,0.22)" />
        <circle cx="254" cy="126" r="104" fill="rgba(0,230,118,0.06)" />
        <circle cx="254" cy="126" r="88" fill="none" stroke="rgba(0,230,118,0.18)" />
        <circle cx="254" cy="126" r="58" fill="none" stroke="rgba(0,230,118,0.18)" />
        <path d="${GOAL_RADAR_WORLD_MAP_PATH}" transform="translate(84 20) scale(3.4)" fill="rgba(0,230,118,0.15)" stroke="rgba(0,230,118,0.28)" stroke-width="0.8" />
        <g transform="translate(84 20) scale(3.4)">
          ${radarDots}
        </g>
      </g>

      <g transform="translate(650 990)">
        <text x="0" y="36" fill="#8fa8a0" font-family="Inter, Segoe UI, sans-serif" font-size="24" font-weight="700" letter-spacing="2">TOP SCORING CITIES</text>
        ${topCities.map((city, index) => {
          const width = 220 * (city.count / Math.max(1, topCities[0]?.count || 1));
          const y = 74 + index * 42;
          return `
            <text x="0" y="${y}" fill="#eee8dd" font-family="Inter, Segoe UI, sans-serif" font-size="28" font-weight="700">${escapeXml(city.label)}</text>
            <rect x="200" y="${y - 20}" width="240" height="14" rx="7" fill="rgba(255,255,255,0.08)" />
            <rect x="200" y="${y - 20}" width="${width}" height="14" rx="7" fill="#00e676" />
            <text x="464" y="${y}" fill="#00e676" font-family="Inter, Segoe UI, sans-serif" font-size="28" font-weight="800" text-anchor="end">${city.count}</text>
          `;
        }).join('')}
      </g>

      <rect x="650" y="1160" width="318" height="74" rx="20" fill="rgba(77,142,255,0.12)" stroke="rgba(77,142,255,0.28)" />
      <text x="684" y="1206" fill="#4d8eff" font-family="Inter, Segoe UI, sans-serif" font-size="28" font-weight="700">GOAL ${goal.sequence || goalCount} OF ${goalCount}</text>

      <text x="${CARD_WIDTH - 112}" y="${CARD_HEIGHT - 120}" fill="#8fa8a0" font-family="Inter, Segoe UI, sans-serif" font-size="26" font-weight="600" text-anchor="end">World Cup 2026 host-city montage</text>
      <text x="${CARD_WIDTH - 112}" y="${CARD_HEIGHT - 82}" fill="#00e676" font-family="Inter, Segoe UI, sans-serif" font-size="32" font-weight="800" text-anchor="end">cup radar</text>
    </svg>
  `.trim();
}

async function svgToPngBlob(svg) {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = reject;
      nextImage.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');

    ctx.drawImage(image, 0, 0, CARD_WIDTH, CARD_HEIGHT);

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Unable to create image blob.'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export async function createGoalShareCardFile(goal, options = {}) {
  const svg = buildGoalShareCardSvg(goal, options);
  const pngBlob = await svgToPngBlob(svg);
  const safePlayer = String(goal.player || 'goal')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `cup-radar-${safePlayer || 'goal'}-${goal.minute}.png`;

  if (typeof File === 'function') {
    return new File([pngBlob], filename, { type: 'image/png' });
  }

  pngBlob.name = filename;
  return pngBlob;
}
