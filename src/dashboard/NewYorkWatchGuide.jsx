import newYorkData from '../data/newyork.json';
import CityWatchGuide from './CityWatchGuide';

export default function NewYorkWatchGuide() {
  return <CityWatchGuide cityData={newYorkData} cityName="New York" />;
}
