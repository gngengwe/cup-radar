import laData from '../data/la.json';
import CityWatchGuide from './CityWatchGuide';

export default function LAWatchGuide() {
  return <CityWatchGuide cityData={laData} cityName="Los Angeles" />;
}
