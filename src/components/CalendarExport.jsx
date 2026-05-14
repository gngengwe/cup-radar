// Calendar export — generates .ics download + individual Google Calendar links
// Seattle matches are in PDT (UTC-7) during June–July 2026.

const PDT_OFFSET_HOURS = 7; // PDT = UTC-7

function pdtToUtc(dateStr, timeStr) {
  // dateStr: '2026-06-15', timeStr: '19:00'
  const [year, month, day]   = dateStr.split('-').map(Number);
  const [hour, minute]       = timeStr.split(':').map(Number);
  let utcHour = hour + PDT_OFFSET_HOURS;
  let utcDay  = day;
  let utcMonth = month;
  if (utcHour >= 24) { utcHour -= 24; utcDay += 1; }

  const fmt = n => String(n).padStart(2, '0');
  return `${year}${fmt(utcMonth)}${fmt(utcDay)}T${fmt(utcHour)}${fmt(minute)}00Z`;
}

function makeGoogleCalUrl(match) {
  const start = pdtToUtc(match.date, match.time || '19:00');
  // Assume 2-hour match duration
  const sh = parseInt(start.slice(9, 11), 10);
  const endHour  = String(sh + 2).padStart(2, '0');
  const end      = start.slice(0, 9) + endHour + start.slice(11);

  const title    = `World Cup 2026 — ${match.stage} at Lumen Field`;
  const details  = `${match.homeTeam} vs ${match.awayTeam}. ${match.notes || ''} Lumen Field, Seattle. Cup Radar: https://wc.ngengwe.com/dashboard/seattle`;
  const location = 'Lumen Field, 800 Occidental Ave S, Seattle, WA 98134';

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
    const start = pdtToUtc(m.date, m.time || '19:00');
    const [sh]  = [parseInt(start.slice(9,11))];
    const end   = start.slice(0, 9) + String(sh + 2).padStart(2, '0') + start.slice(11);

    return [
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:World Cup 2026 — ${m.stage} at Lumen Field`,
      `DESCRIPTION:${m.homeTeam} vs ${m.awayTeam}. ${m.notes || ''} Official tickets: https://www.fifa.com/tickets`,
      'LOCATION:Lumen Field\\, 800 Occidental Ave S\\, Seattle\\, WA 98134',
      'URL:https://www.fifa.com/tickets',
      `UID:cup-radar-${m.id}@wc.ngengwe.com`,
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cup Radar//World Cup 2026 Seattle//EN',
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
  const handleClick = () => {
    const ics = generateICS(matches);
    downloadICS(ics, 'cup-radar-seattle-matches.ics');
  };

  return (
    <button className="cal-export-btn" onClick={handleClick} title="Download .ics for all 6 Seattle matches">
      📅 Add all Seattle matches to calendar
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
    const dateLabel = match.date.replace(/-/g, '');
    downloadICS(ics, `cup-radar-seattle-${dateLabel}.ics`);
  };

  return (
    <button className="cal-gcal-link" onClick={handleClick} title="Download .ics for this match">
      + iCal
    </button>
  );
}
