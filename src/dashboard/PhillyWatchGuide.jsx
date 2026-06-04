import phillyData from '../data/philly.json';
import CityWatchGuide from './CityWatchGuide';

export default function PhillyWatchGuide() {
  return <CityWatchGuide cityData={phillyData} cityName="Philadelphia" />;
}
