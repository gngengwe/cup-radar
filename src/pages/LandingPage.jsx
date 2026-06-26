import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TodayMatchHub from '../components/TodayMatchHub';
import TomorrowMatchHub from '../components/TomorrowMatchHub';
import GoalMontage from '../components/GoalMontage';
import CitiesHero from '../components/CitiesHero';
import WhatWeTrack from '../components/WhatWeTrack';
import TicketRadar from '../components/TicketRadar';
import DailyBrief from '../components/DailyBrief';
import FounderClose from '../components/FounderClose';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content">
        <TodayMatchHub />
        <TomorrowMatchHub />
        <Hero />
        <div className="divider" />
        <GoalMontage />
        <div className="divider" />
        <CitiesHero />
        <div className="divider" />
        <WhatWeTrack />
        <div className="divider" />
        <TicketRadar />
        <div className="divider" />
        <DailyBrief />
        <div className="divider" />
        <FounderClose />
      </main>
      <Footer />
    </>
  );
}
