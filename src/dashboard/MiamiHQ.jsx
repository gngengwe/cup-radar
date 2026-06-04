import matchData  from '../data/matches.json';
import miamiData  from '../data/miami.json';
import CityHQTemplate from './CityHQTemplate';

const miamiMatches = matchData.matches.filter(m => m.miamiMatch);

export default function MiamiHQ() {
  return (
    <CityHQTemplate
      cityData={miamiData}
      matches={miamiMatches}
      events={[]}
      title="Miami HQ"
      venueName="Hard Rock Stadium"
      cityId="miami"
    />
  );
}
