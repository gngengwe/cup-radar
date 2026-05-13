import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SeattleHQ from './components/SeattleHQ';
import WhatWeTrack from './components/WhatWeTrack';
import TicketRadar from './components/TicketRadar';
import CityJump from './components/CityJump';
import DailyBrief from './components/DailyBrief';
import FounderClose from './components/FounderClose';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
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
    </>
  );
}
