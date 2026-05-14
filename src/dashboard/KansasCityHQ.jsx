import matchData from '../data/matches.json';
import kcData    from '../data/kansascity.json';
import CityHQTemplate from './CityHQTemplate';

const kcMatches = matchData.matches.filter(m => m.kcMatch);

export default function KansasCityHQ() {
  return (
    <CityHQTemplate
      cityData={kcData}
      matches={kcMatches}
      events={[]}
      title="Kansas City HQ"
      venueName="Kansas City Stadium"
    />
  );
}
