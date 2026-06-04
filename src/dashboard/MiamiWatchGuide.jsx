import miamiData from '../data/miami.json';
import CityWatchGuide from './CityWatchGuide';

export default function MiamiWatchGuide() {
  return <CityWatchGuide cityData={miamiData} cityName="Miami" />;
}
