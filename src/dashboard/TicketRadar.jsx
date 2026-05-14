import { useState } from 'react';
import ticketData from '../data/tickets.json';

const ACTION_CONFIG = {
  move:  { label: 'MOVE',  color: '#041208', bg: 'var(--accent)' },
  watch: { label: 'WATCH', color: '#4d8eff', bg: 'var(--blue-soft)' },
  wait:  { label: 'WAIT',  color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.06)' },
};

const AVAIL_CONFIG = {
  available: { label: 'Available',   color: 'var(--accent)' },
  limited:   { label: 'Limited',     color: '#ffb84d' },
  scarce:    { label: 'Scarce',      color: '#f87171' },
  soldout:   { label: 'Sold out',    color: 'var(--text-dim)' },
};

function TicketCard({ ticket }) {
  const action = ACTION_CONFIG[ticket.action] || ACTION_CONFIG.wait;
  const avail  = AVAIL_CONFIG[ticket.availability] || AVAIL_CONFIG.available;
  const stars  = ticket.opportunityScore;

  return (
    <div className={`ticket-card${ticket.seattleMatch ? ' seattle' : ''}`}>
      <div className="ticket-card__top">
        <span className="ticket-card__action" style={{ background: action.bg, color: action.color }}>
          {action.label}
        </span>
        <span className="ticket-card__avail" style={{ color: avail.color }}>
          ● {avail.label}
        </span>
        {ticket.seattleMatch && <span className="ticket-card__seattle-tag">SEA</span>}
      </div>

      <div className="ticket-card__match">{ticket.match}</div>
      <div className="ticket-card__meta">{ticket.date} · {ticket.venue} · {ticket.city}</div>

      <div className="ticket-card__prices">
        <div>
          <span className="ticket-card__price-label">Face value</span>
          <span className="ticket-card__price">{ticket.officialFaceValue}</span>
        </div>
        <div>
          <span className="ticket-card__price-label">Resale from</span>
          <span className="ticket-card__price resale">{ticket.observedResaleFrom}</span>
        </div>
      </div>

      <div className="ticket-card__note">{ticket.actionNote}</div>

      <div className="ticket-card__footer">
        <div className="ticket-card__score">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`score-dot${i < stars ? ' active' : ''}`} />
          ))}
          <span className="ticket-card__score-label">Opportunity {stars}/5</span>
        </div>
        <a
          href={ticket.officialLink || 'https://www.fifa.com/tickets'}
          target="_blank"
          rel="noopener noreferrer"
          className="ticket-card__cta"
        >
          Official tickets ↗
        </a>
      </div>
    </div>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return 999;
  return (new Date(dateStr + 'T12:00:00') - Date.now()) / 86_400_000;
}

function UrgentBoard({ tickets }) {
  const upcoming = tickets
    .filter(t => {
      const days = daysUntil(t.date);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));

  const todayOrTomorrow = upcoming.filter(t => daysUntil(t.date) < 2);
  const thisWeek        = upcoming.filter(t => daysUntil(t.date) >= 2);

  if (upcoming.length === 0) {
    const nextMatch = tickets
      .filter(t => daysUntil(t.date) > 0)
      .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0];

    const daysToNext = nextMatch ? Math.ceil(daysUntil(nextMatch.date)) : null;

    return (
      <div className="urgent-board urgent-board--empty">
        <div className="urgent-board__icon">🎫</div>
        <div className="urgent-board__msg">No same-week ticket windows right now.</div>
        {daysToNext && (
          <div className="urgent-board__next">
            Next tracked opportunity: <strong>{nextMatch.match}</strong> in {daysToNext} day{daysToNext !== 1 ? 's' : ''}.
          </div>
        )}
        {!nextMatch && (
          <div className="urgent-board__next">
            The tournament hasn't started yet — check back closer to match days.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="urgent-board">
      {todayOrTomorrow.length > 0 && (
        <div className="urgent-section">
          <div className="urgent-section__label">🔴 Today / Tomorrow</div>
          <div className="tickets-grid">
            {todayOrTomorrow.map(t => <TicketCard key={t.id} ticket={t} urgent />)}
          </div>
        </div>
      )}
      {thisWeek.length > 0 && (
        <div className="urgent-section">
          <div className="urgent-section__label">🟡 This week</div>
          <div className="tickets-grid">
            {thisWeek.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketRadar() {
  const [filter, setFilter] = useState('all');

  const { tickets, lastUpdated, disclaimer } = ticketData;

  const filtered = (() => {
    if (filter === 'urgent')  return tickets; // UrgentBoard handles its own filtering
    if (filter === 'seattle') return tickets.filter(t => t.seattleMatch);
    if (filter === 'all')     return tickets;
    return tickets.filter(t => t.action === filter);
  })();

  const updatedStr = new Date(lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div>
      <div className="dash-section-header">
        <h1 className="dash-section-title">Ticket Radar</h1>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <div className="filter-bar">
        {['all', 'urgent', 'move', 'watch', 'wait', 'seattle'].map(f => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}${f === 'urgent' ? ' urgent-chip' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All'
              : f === 'urgent'  ? '🔴 Urgent — same week'
              : f === 'seattle' ? '🏟️ Seattle'
              : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filter === 'urgent' ? (
        <UrgentBoard tickets={tickets} />
      ) : (
        <div className="tickets-grid">
          {filtered.map(t => <TicketCard key={t.id} ticket={t} />)}
          {filtered.length === 0 && (
            <div className="empty-state">No tickets match this filter.</div>
          )}
        </div>
      )}

      <div className="ticket-disclaimer-box">
        <span className="ticket-disclaimer-icon">⚠️</span>
        <p>{disclaimer}</p>
      </div>

      <p className="dash-disclaimer">
        Cup Radar is an independent fan-built dashboard and is not affiliated with FIFA.
        Official tickets at <a href="https://www.fifa.com/tickets" target="_blank" rel="noopener noreferrer">fifa.com/tickets</a>.
      </p>
    </div>
  );
}
