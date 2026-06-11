import matchData   from '../data/matches.json';
import atlantaData from '../data/atlanta.json';
import CityHQTemplate from './CityHQTemplate';

const atlantaMatches = matchData.matches.filter(m => m.atlantaMatch);

export default function AtlantaHQ() {
  return (
    <CityHQTemplate
      cityData={atlantaData}
      matches={atlantaMatches}
      events={[]}
      title="Atlanta HQ"
      venueName="Mercedes-Benz Stadium"
      cityId="atlanta"
    />
  );
}
