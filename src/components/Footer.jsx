export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__logo">Cup<span>Radar</span></div>

          <p className="footer__disclaimer">
            Cup Radar is an independent, fan-built dashboard and is not affiliated with FIFA,
            the FIFA World Cup 2026™, or any official tournament entity. Official schedules,
            tickets, and venue information should be confirmed with official sources.
            Match dates and venue assignments are subject to change.
          </p>

          <div className="footer__meta">
            <span className="footer__copyright">
              © {year} HK Clearway LLC, powered by becomiNG. All rights reserved.
            </span>
            <span className="footer__credit">
              Built by <a href="https://ngengwe.com" target="_blank" rel="noopener noreferrer">HK Clearway</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
