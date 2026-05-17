import matchData   from '../data/matches.json';
import seattleData from '../data/seattle.json';
import eventsData  from '../data/events.json';
import CityHQTemplate from './CityHQTemplate';

const seattleMatches = matchData.matches.filter(m => m.seattleMatch);

export default function SeattleHQ() {
  return (
    <CityHQTemplate
      cityData={seattleData}
      matches={seattleMatches}
      events={eventsData.events}
      title="Seattle HQ"
      venueName="Lumen Field"
      cityId="seattle"
    />
  );
}
