// Calendar export — generates .ics download + individual Google Calendar links
// Timezone offsets are for June–July 2026 (daylight saving time applies to all US cities).
const TZ_UTC_OFFSETS = { PT: 7, PDT: 7, CT: 5, CDT: 5, ET: 4, EDT: 4, MT: 6, MDT: 6 };

function localToUtc(dateStr, timeStr, timezone) {
  const offset = TZ_UTC_OFFSETS[timezone] ?? 7;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute]     = timeStr.split(':').map(Number);
  let utcHour  = hour + offset;
  let utcDay   = day;
  let utcMonth = month;
  if (utcHour >= 24) { utcHour -= 24; utcDay += 1; }
  const fmt = n => String(n).padStart(2, '0');
  return `${year}${fmt(utcMonth)}${fmt(utcDay)}T${fmt(utcHour)}${fmt(minute)}00Z`;
}

function makeGoogleCalUrl(match) {
  const start = localToUtc(match.date, match.time || '19:00', match.timezone || 'PT');
  const sh       = parseInt(start.slice(9, 11), 10);
  const endHour  = String(sh + 2).padStart(2, '0');
  const end      = start.slice(0, 9) + endHour + start.slice(11);

  const venueName = match.venue || 'Venue TBD';
  const title    = `World Cup 2026 — ${match.stage} at ${venueName}`;
  const details  = `${match.homeTeam} vs ${match.awayTeam}. ${match.notes || ''} ${venueName}. Cup Radar: https://wc.ngengwe.com`;
  const location = venueName;

  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     title,
    dates:    `${start}/${end}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateICS(matches) {
  const events = matches.map(m => {
    const start     = localToUtc(m.date, m.time || '19:00', m.timezone || 'PT');
    const sh        = parseInt(start.slice(9, 11), 10);
    const end       = start.slice(0, 9) + String(sh + 2).padStart(2, '0') + start.slice(11);
    const venueName = m.venue || 'Venue TBD';

    return [
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:World Cup 2026 — ${m.stage} at ${venueName}`,
      `DESCRIPTION:${m.homeTeam} vs ${m.awayTeam}. ${m.notes || ''} Official tickets: https://www.fifa.com/tickets`,
      `LOCATION:${venueName.replace(/,/g, '\\,')}`,
      'URL:https://www.fifa.com/tickets',
      `UID:cup-radar-${m.id}@wc.ngengwe.com`,
      'END:VEVENT',
    ].join('\r\n');
  });

  const city = matches[0]?.city || 'City';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Cup Radar//World Cup 2026 ${city}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadICS(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Components ───────────────────────────────────────────────────────────────

export function AddAllToCalendar({ matches }) {
  const city     = matches[0]?.city?.toLowerCase().replace(/\s+/g, '-') || 'matches';
  const cityName = matches[0]?.city || 'city';
  const handleClick = () => {
    const ics = generateICS(matches);
    downloadICS(ics, `cup-radar-${city}-matches.ics`);
  };

  return (
    <button className="cal-export-btn" onClick={handleClick} title={`Download .ics for all ${cityName} matches`}>
      📅 Add all {cityName} matches to calendar
    </button>
  );
}

export function AddMatchToGoogleCalendar({ match }) {
  return (
    <a
      href={makeGoogleCalUrl(match)}
      target="_blank"
      rel="noopener noreferrer"
      className="cal-gcal-link"
      title="Add to Google Calendar"
    >
      + Google Cal
    </a>
  );
}

export function AddMatchToICS({ match }) {
  const handleClick = () => {
    const ics = generateICS([match]);
    const city      = match.city?.toLowerCase().replace(/\s+/g, '-') || 'match';
    const dateLabel = match.date.replace(/-/g, '');
    downloadICS(ics, `cup-radar-${city}-${dateLabel}.ics`);
  };

  return (
    <button className="cal-gcal-link" onClick={handleClick} title="Download .ics for this match">
      + iCal
    </button>
  );
}
