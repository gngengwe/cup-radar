import matchData from '../data/matches.json';
import laData    from '../data/la.json';
import CityHQTemplate from './CityHQTemplate';

const laMatches = matchData.matches.filter(m => m.laMatch);

export default function LAHQ() {
  return (
    <CityHQTemplate
      cityData={laData}
      matches={laMatches}
      events={[]}
      title="Los Angeles HQ"
      venueName="SoFi Stadium"
      cityId="losangeles"
    />
  );
}
