import { PRODUCT } from '../config';

export default function FounderClose() {
  return (
    <section className="section founder-close" id="about">
      <div className="container">
        <span className="section-label">Why Cup Radar</span>

        <blockquote className="founder-quote">
          "The World Cup is not just a schedule. It is a{' '}
          <strong>temporary global operating system</strong> layered onto real cities.
          Cup Radar helps you see the signal."
        </blockquote>

        <p className="founder-launch">{PRODUCT.NAME} — launching before kickoff.</p>

        <div className="founder-ctas">
          <a href="#brief"   className="btn btn-primary">{PRODUCT.CTA_PRIMARY}</a>
          <a href="#seattle" className="btn btn-secondary">Explore Seattle HQ</a>
        </div>
      </div>
    </section>
  );
}
