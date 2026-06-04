import matchData  from '../data/matches.json';
import phillyData from '../data/philly.json';
import CityHQTemplate from './CityHQTemplate';

const phillyMatches = matchData.matches.filter(m => m.phillyMatch);

export default function PhillyHQ() {
  return (
    <CityHQTemplate
      cityData={phillyData}
      matches={phillyMatches}
      events={[]}
      title="Philadelphia HQ"
      venueName="Lincoln Financial Field"
      cityId="philly"
    />
  );
}
