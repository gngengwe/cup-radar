import matchData    from '../data/matches.json';
import newYorkData  from '../data/newyork.json';
import CityHQTemplate from './CityHQTemplate';

const nyMatches = matchData.matches.filter(m => m.nyMatch);

export default function NewYorkHQ() {
  return (
    <CityHQTemplate
      cityData={newYorkData}
      matches={nyMatches}
      events={[]}
      title="New York HQ"
      venueName="MetLife Stadium"
      cityId="newyork"
    />
  );
}
