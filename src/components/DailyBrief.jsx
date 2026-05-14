import { useState } from 'react';
import { PRODUCT } from '../config';

const INCLUDES = [
  { icon: '⚽', text: "Today's matches & kickoff times" },
  { icon: '🏟️', text: 'Seattle logistics when applicable' },
  { icon: '🎫', text: 'Active ticket windows' },
  { icon: '✈️', text: 'Travel opportunities to watch' },
  { icon: '📰', text: 'One story worth reading' },
];

const PREFERENCES = [
  { id: 'daily',   label: 'Daily Brief',       desc: 'Every morning during the tournament' },
  { id: 'seattle', label: 'Seattle Match Days', desc: 'Only when Seattle has a match' },
  { id: 'tickets', label: 'Ticket Alerts',      desc: 'When a good window opens up' },
  { id: 'upsets',  label: 'Upset Watch',        desc: 'When a big result is about to happen' },
];

export default function DailyBrief() {
  const [step,      setStep]      = useState(1); // 1=email, 2=prefs, 3=success
  const [email,     setEmail]     = useState('');
  const [prefs,     setPrefs]     = useState(['daily', 'seattle']);

  const togglePref = id =>
    setPrefs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleEmailSubmit = e => {
    e.preventDefault();
    if (!email.trim()) return;
    setStep(2);
  };

  const handlePrefsSubmit = () => {
    if (PRODUCT.SIGNUP_FORM_ACTION) {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = PRODUCT.SIGNUP_FORM_ACTION;
      const emailInput = document.createElement('input');
      emailInput.name  = 'email';
      emailInput.value = email;
      form.appendChild(emailInput);
      const prefsInput = document.createElement('input');
      prefsInput.name  = 'tags';
      prefsInput.value = prefs.join(',');
      form.appendChild(prefsInput);
      document.body.appendChild(form);
      form.submit();
    }
    setStep(3);
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

        {step === 1 && (
          <>
            <form className="brief-form" onSubmit={handleEmailSubmit}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <button type="submit" className="btn btn-primary">
                Continue →
              </button>
            </form>
            <p className="brief-disclaimer">
              No spam. Unsubscribe any time. Cup Radar is not affiliated with FIFA.
            </p>
          </>
        )}

        {step === 2 && (
          <div className="brief-prefs">
            <p className="brief-prefs__heading">What do you want to receive?</p>
            <div className="brief-prefs__list">
              {PREFERENCES.map(p => (
                <label key={p.id} className={`brief-pref${prefs.includes(p.id) ? ' selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={prefs.includes(p.id)}
                    onChange={() => togglePref(p.id)}
                  />
                  <div className="brief-pref__text">
                    <span className="brief-pref__label">{p.label}</span>
                    <span className="brief-pref__desc">{p.desc}</span>
                  </div>
                  <span className="brief-pref__check">{prefs.includes(p.id) ? '✓' : ''}</span>
                </label>
              ))}
            </div>
            <div className="brief-prefs__actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn btn-primary"
                onClick={handlePrefsSubmit}
                disabled={prefs.length === 0}
              >
                {PRODUCT.CTA_PRIMARY}
              </button>
            </div>
            <p className="brief-disclaimer" style={{ marginTop: 12 }}>
              Signing up for: <strong>{email}</strong>
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="brief-success">
            <div className="brief-success__icon">✅</div>
            <div className="brief-success__msg">You're on the list.</div>
            <div className="brief-success__sub">
              Receiving: {prefs.join(', ')}. First brief as kickoff approaches.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
