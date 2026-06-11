import atlantaData from '../data/atlanta.json';
import CityWatchGuide from './CityWatchGuide';

export default function AtlantaWatchGuide() {
  return <CityWatchGuide cityData={atlantaData} cityName="Atlanta" />;
}
