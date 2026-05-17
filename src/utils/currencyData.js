// Team TLA → currency metadata
// Rates fetched from open.er-api.com (free, no key, 170+ currencies)
export const TEAM_CURRENCY = {
  // North & Central America
  USA: { code: 'USD', name: 'US Dollar',               symbol: '$',    frankfurter: false, note: 'Local currency' },
  CAN: { code: 'CAD', name: 'Canadian Dollar',          symbol: 'CA$',  frankfurter: true  },
  MEX: { code: 'MXN', name: 'Mexican Peso',             symbol: '$',    frankfurter: true  },
  HON: { code: 'HNL', name: 'Honduran Lempira',         symbol: 'L',    frankfurter: false },
  PAN: { code: 'USD', name: 'US Dollar (uses USD)',      symbol: '$',    frankfurter: false, note: 'Uses USD' },
  JAM: { code: 'JMD', name: 'Jamaican Dollar',          symbol: 'J$',   frankfurter: false },
  CRI: { code: 'CRC', name: 'Costa Rican Colón',        symbol: '₡',    frankfurter: false },
  CUW: { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ', frankfurter: false },

  // South America
  ARG: { code: 'ARS', name: 'Argentine Peso',           symbol: '$',    frankfurter: false },
  BRA: { code: 'BRL', name: 'Brazilian Real',           symbol: 'R$',   frankfurter: true  },
  URU: { code: 'UYU', name: 'Uruguayan Peso',           symbol: '$U',   frankfurter: false },
  COL: { code: 'COP', name: 'Colombian Peso',           symbol: '$',    frankfurter: false },
  CHI: { code: 'CLP', name: 'Chilean Peso',             symbol: '$',    frankfurter: false },
  ECU: { code: 'USD', name: 'US Dollar (uses USD)',      symbol: '$',    frankfurter: false, note: 'Uses USD' },
  PER: { code: 'PEN', name: 'Peruvian Sol',             symbol: 'S/',   frankfurter: false },
  BOL: { code: 'BOB', name: 'Bolivian Boliviano',       symbol: 'Bs',   frankfurter: false },
  PAR: { code: 'PYG', name: 'Paraguayan Guaraní',       symbol: '₲',    frankfurter: false },
  VEN: { code: 'VES', name: 'Venezuelan Bolívar',       symbol: 'Bs.S', frankfurter: false },

  // Europe
  BEL: { code: 'EUR', name: 'Euro',                     symbol: '€',    frankfurter: true  },
  FRA: { code: 'EUR', name: 'Euro',                     symbol: '€',    frankfurter: true  },
  ESP: { code: 'EUR', name: 'Euro',                     symbol: '€',    frankfurter: true  },
  GER: { code: 'EUR', name: 'Euro',                     symbol: '€',    frankfurter: true  },
  POR: { code: 'EUR', name: 'Euro',                     symbol: '€',    frankfurter: true  },
  NED: { code: 'EUR', name: 'Euro',                     symbol: '€',    frankfurter: true  },
  AUT: { code: 'EUR', name: 'Euro',                     symbol: '€',    frankfurter: true  },
  SVK: { code: 'EUR', name: 'Euro',                     symbol: '€',    frankfurter: true  },
  ENG: { code: 'GBP', name: 'British Pound',            symbol: '£',    frankfurter: true  },
  SCO: { code: 'GBP', name: 'British Pound',            symbol: '£',    frankfurter: true  },
  WAL: { code: 'GBP', name: 'British Pound',            symbol: '£',    frankfurter: true  },
  CRO: { code: 'EUR', name: 'Euro',                     symbol: '€',    frankfurter: true  },
  SRB: { code: 'RSD', name: 'Serbian Dinar',            symbol: 'дин',  frankfurter: false },
  POL: { code: 'PLN', name: 'Polish Złoty',             symbol: 'zł',   frankfurter: true  },
  UKR: { code: 'UAH', name: 'Ukrainian Hryvnia',        symbol: '₴',    frankfurter: false },
  HUN: { code: 'HUF', name: 'Hungarian Forint',         symbol: 'Ft',   frankfurter: true  },
  ROU: { code: 'RON', name: 'Romanian Leu',             symbol: 'lei',  frankfurter: true  },
  TUR: { code: 'TRY', name: 'Turkish Lira',             symbol: '₺',    frankfurter: true  },
  CZE: { code: 'CZK', name: 'Czech Koruna',             symbol: 'Kč',   frankfurter: true  },
  GEO: { code: 'GEL', name: 'Georgian Lari',            symbol: '₾',    frankfurter: false },
  BIH: { code: 'BAM', name: 'Bosnia Mark (≈ EUR/1.96)', symbol: 'KM',   frankfurter: false, note: 'Pegged to EUR' },

  // Africa
  MAR: { code: 'MAD', name: 'Moroccan Dirham',          symbol: 'د.م.', frankfurter: false },
  SEN: { code: 'XOF', name: 'West African CFA Franc',   symbol: 'CFA',  frankfurter: false },
  NGA: { code: 'NGN', name: 'Nigerian Naira',           symbol: '₦',    frankfurter: false },
  EGY: { code: 'EGP', name: 'Egyptian Pound',           symbol: 'E£',   frankfurter: false },
  TUN: { code: 'TND', name: 'Tunisian Dinar',           symbol: 'DT',   frankfurter: false },
  CMR: { code: 'XAF', name: 'Central African CFA Franc',symbol: 'CFA',  frankfurter: false },
  GHA: { code: 'GHS', name: 'Ghanaian Cedi',            symbol: '₵',    frankfurter: false },
  CIV: { code: 'XOF', name: 'West African CFA Franc',   symbol: 'CFA',  frankfurter: false },
  ALG: { code: 'DZD', name: 'Algerian Dinar',           symbol: 'دج',   frankfurter: false },
  ZAF: { code: 'ZAR', name: 'South African Rand',       symbol: 'R',    frankfurter: true  },
  RSA: { code: 'ZAR', name: 'South African Rand',       symbol: 'R',    frankfurter: true  },

  // Asia & Oceania
  JPN: { code: 'JPY', name: 'Japanese Yen',             symbol: '¥',    frankfurter: true  },
  KOR: { code: 'KRW', name: 'South Korean Won',         symbol: '₩',    frankfurter: true  },
  AUS: { code: 'AUD', name: 'Australian Dollar',        symbol: 'A$',   frankfurter: true  },
  NZL: { code: 'NZD', name: 'New Zealand Dollar',       symbol: 'NZ$',  frankfurter: true  },
  IRN: { code: 'IRR', name: 'Iranian Rial',             symbol: '﷼',    frankfurter: false },
  KSA: { code: 'SAR', name: 'Saudi Riyal',              symbol: '﷼',    frankfurter: false },
  IRQ: { code: 'IQD', name: 'Iraqi Dinar',              symbol: 'ع.د',  frankfurter: false },
  JOR: { code: 'JOD', name: 'Jordanian Dinar',          symbol: 'JD',   frankfurter: false },
  IDN: { code: 'IDR', name: 'Indonesian Rupiah',        symbol: 'Rp',   frankfurter: true  },
  QAT: { code: 'QAR', name: 'Qatari Riyal',            symbol: '﷼',    frankfurter: false },
  SUI: { code: 'CHF', name: 'Swiss Franc',              symbol: 'CHF',  frankfurter: true  },
};

// Currencies the frankfurter API can fetch in one call