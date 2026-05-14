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

export default function TicketRadar() {
  const [filter, setFilter] = useState('all');

  const { tickets, lastUpdated, disclaimer } = ticketData;

  const filtered = filter === 'all'
    ? tickets
    : filter === 'seattle'
      ? tickets.filter(t => t.seattleMatch)
      : tickets.filter(t => t.action === filter);

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
        {['all', 'move', 'watch', 'wait', 'seattle'].map(f => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'seattle' ? '🏟️ Seattle' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="tickets-grid">
        {filtered.map(t => <TicketCard key={t.id} ticket={t} />)}
        {filtered.length === 0 && (
          <div className="empty-state">No tickets match this filter.</div>
        )}
      </div>

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
