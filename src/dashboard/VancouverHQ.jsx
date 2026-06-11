import matchData     from '../data/matches.json';
import vancouverData from '../data/vancouver.json';
import CityHQTemplate from './CityHQTemplate';

const vancouverMatches = matchData.matches.filter(m => m.vancouverMatch);

export default function VancouverHQ() {
  return (
    <CityHQTemplate
      cityData={vancouverData}
      matches={vancouverMatches}
      events={[]}
      title="Vancouver HQ"
      venueName="BC Place"
      cityId="vancouver"
    />
  );
}
