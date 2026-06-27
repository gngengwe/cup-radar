import { VENUE_COORDS } from '../data/venueCoords';
import { computeBounds } from './radarProjection';

export const GOAL_RADAR_BOUNDS = computeBounds(VENUE_COORDS);

export const GOAL_RADAR_WORLD_MAP_PATH =
  'M25.2,7.6 L12.0,12.0 L13.1,16.3 L11.0,19.8 L13.0,41.2 L19.0,50.9 L20.7,54.0 ' +
  'L21.5,56.2 L31.4,78.9 L38.2,84.6 L46.0,94.2 L53.9,96.4 L65.2,83.3 L49.0,80.7 ' +
  'L53.5,62.7 L60.4,61.0 L64.6,59.9 L71.6,66.1 L72.6,74.7 L74.9,71.6 L73.6,55.6 ' +
  'L75.3,53.8 L80.6,43.5 L84.0,33.7 L88.3,29.5 L89.5,26.2 L95.7,22.8 L88.1,18.3 ' +
  'L68.6,21.6 L50.1,10.4 Z';
