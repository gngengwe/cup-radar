import { PRODUCT } from '../config';
import { useCity } from '../context/CityContext';

export default function FounderClose() {
  const { cityConfig } = useCity();
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
          <a href="/dashboard/today"      className="btn btn-primary">{PRODUCT.CTA_PRIMARY}</a>
          <a href={cityConfig.dashRoute}  className="btn btn-secondary">Explore {cityConfig.name} HQ</a>
        </div>
      </div>
    </section>
  );
}
