import vancouverData from '../data/vancouver.json';
import CityWatchGuide from './CityWatchGuide';

export default function VancouverWatchGuide() {
  return <CityWatchGuide cityData={vancouverData} cityName="Vancouver" />;
}
