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
          <a href="/#choose-city" className="btn btn-primary">Choose your city</a>
        </div>
      </div>
    </section>
  );
}
