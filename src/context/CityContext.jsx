import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'cup_radar_hq';

// City config — add new HQ cities here
export const HQ_CITIES = {
  seattle: {
    id:          'seattle',
    name:        'Seattle',
    short:       'SEA',
    emoji:       '🏟️',
    venue:       'Lumen Field',
    dashRoute:   '/dashboard/seattle',
    tagline:     '6 matches · Jun 15 – Jul 6',
    highlight:   'USA vs Australia · Egypt vs Iran',
    matchCount:  6,
    hasQF:       false,
    hasR16:      true,
  },
  kansascity: {
    id:          'kansascity',
    name:        'Kansas City',
    short:       'KC',
    emoji:       '🏈',
    venue:       'Kansas City Stadium',
    dashRoute:   '/dashboard/kansascity',
    tagline:     '6 matches · Jun 16 – Jul 11',
    highlight:   'Argentina vs Algeria · Quarterfinal',
    matchCount:  6,
    hasQF:       true,
    hasR16:      false,
  },
};

const CityContext = createContext({
  city:    'seattle',
  cityConfig: HQ_CITIES.seattle,
  setCity: () => {},
});

export function CityProvider({ children }) {
  const [city, setRawCity] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && HQ_CITIES[stored] ? stored : 'seattle';
    } catch {
      return 'seattle';
    }
  });

  const setCity = (newCity) => {
    if (!HQ_CITIES[newCity]) return;
    setRawCity(newCity);
    try { localStorage.setItem(STORAGE_KEY, newCity); } catch {}
  };

  return (
    <CityContext.Provider value={{ city, cityConfig: HQ_CITIES[city], setCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
}
