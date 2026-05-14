import { CityProvider } from '../context/CityContext';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CitySelector from '../components/CitySelector';
import SeattleHQ from '../components/SeattleHQ';
import WhatWeTrack from '../components/WhatWeTrack';
import TicketRadar from '../components/TicketRadar';
import CityJump from '../components/CityJump';
import DailyBrief from '../components/DailyBrief';
import FounderClose from '../components/FounderClose';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <CityProvider>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <div className="divider" />
        <CitySelector />
        <div className="divider" />
        <SeattleHQ />
        <div className="divider" />
        <WhatWeTrack />
        <div className="divider" />
        <TicketRadar />
        <div className="divider" />
        <CityJump />
        <div className="divider" />
        <DailyBrief />
        <div className="divider" />
        <FounderClose />
      </main>
      <Footer />
    </CityProvider>
  );
}
