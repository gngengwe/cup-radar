import { useState } from 'react';
import { PRODUCT } from '../config';

const INCLUDES = [
  { icon: '⚽', text: "Today's matches & kickoff times" },
  { icon: '🏟️', text: 'Seattle logistics when applicable' },
  { icon: '🎫', text: 'Active ticket windows' },
  { icon: '✈️', text: 'Travel opportunities to watch' },
  { icon: '📰', text: 'One story worth reading' },
];

export default function DailyBrief() {
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    if (!email.trim()) return;

    if (PRODUCT.SIGNUP_FORM_ACTION) {
      // Wire to real form endpoint when SIGNUP_FORM_ACTION is set in config.js
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = PRODUCT.SIGNUP_FORM_ACTION;
      const input = document.createElement('input');
      input.name  = 'email';
      input.value = email;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    }

    setSubmitted(true);
  };

  return (
    <section className="section daily-brief pitch-bg" id="brief">
      <div className="container">
        <span className="section-label">Daily Brief</span>
        <h2 className="section-heading">
          One email. One screen.<br />Everything that matters today.
        </h2>
        <p className="section-sub">
          Each morning during the World Cup — and in the weeks leading up to kickoff — Cup Radar
          distills the day into one concise briefing.
        </p>

        <div className="brief-chips">
          {INCLUDES.map(item => (
            <span key={item.text} className="brief-chip">
              {item.icon} {item.text}
            </span>
          ))}
        </div>

        {submitted ? (
          <div className="brief-success">
            <div className="brief-success__icon">✅</div>
            <div className="brief-success__msg">You're on the list.</div>
            <div className="brief-success__sub">
              We'll send your first brief as kickoff approaches.
            </div>
          </div>
        ) : (
          <>
            <form className="brief-form" onSubmit={handleSubmit}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <button type="submit" className="btn btn-primary">
                {PRODUCT.CTA_PRIMARY}
              </button>
            </form>
            <p className="brief-disclaimer">
              No spam. Unsubscribe any time. Cup Radar is not affiliated with FIFA.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
