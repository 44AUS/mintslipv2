// State Unemployment Tax (SUTA) rates - New Employer Rates for 2024-2025
// These are the rates employers pay, shown for reference on paystubs
export const stateSUTARates = {
  AL: { rate: 0.027, wageBase: 8000, name: "Alabama" },
  AK: { rate: 0.0278, wageBase: 47100, name: "Alaska" },
  AZ: { rate: 0.027, wageBase: 8000, name: "Arizona" },
  AR: { rate: 0.032, wageBase: 7000, name: "Arkansas" },
  CA: { rate: 0.034, wageBase: 7000, name: "California" },
  CO: { rate: 0.0317, wageBase: 20400, name: "Colorado" },
  CT: { rate: 0.031, wageBase: 15000, name: "Connecticut" },
  DE: { rate: 0.021, wageBase: 10500, name: "Delaware" },
  DC: { rate: 0.027, wageBase: 9000, name: "District of Columbia" },
  FL: { rate: 0.027, wageBase: 7000, name: "Florida" },
  GA: { rate: 0.027, wageBase: 9500, name: "Georgia" },
  HI: { rate: 0.03, wageBase: 56700, name: "Hawaii" },
  ID: { rate: 0.0307, wageBase: 53500, name: "Idaho" },
  IL: { rate: 0.0313, wageBase: 13590, name: "Illinois" },
  IN: { rate: 0.025, wageBase: 9500, name: "Indiana" },
  IA: { rate: 0.01, wageBase: 38200, name: "Iowa" },
  KS: { rate: 0.027, wageBase: 14000, name: "Kansas" },
  KY: { rate: 0.027, wageBase: 11400, name: "Kentucky" },
  LA: { rate: 0.0309, wageBase: 7700, name: "Louisiana" },
  ME: { rate: 0.0269, wageBase: 12000, name: "Maine" },
  MD: { rate: 0.026, wageBase: 8500, name: "Maryland" },
  MA: { rate: 0.0294, wageBase: 15000, name: "Massachusetts" },
  MI: { rate: 0.027, wageBase: 9500, name: "Michigan" },
  MN: { rate: 0.01, wageBase: 42000, name: "Minnesota" },
  MS: { rate: 0.027, wageBase: 14000, name: "Mississippi" },
  MO: { rate: 0.027, wageBase: 10500, name: "Missouri" },
  MT: { rate: 0.0312, wageBase: 43000, name: "Montana" },
  NE: { rate: 0.0275, wageBase: 9000, name: "Nebraska" },
  NV: { rate: 0.0275, wageBase: 40600, name: "Nevada" },
  NH: { rate: 0.025, wageBase: 14000, name: "New Hampshire" },
  NJ: { rate: 0.0279, wageBase: 42300, name: "New Jersey" },
  NM: { rate: 0.027, wageBase: 31700, name: "New Mexico" },
  NY: { rate: 0.041, wageBase: 12500, name: "New York" },
  NC: { rate: 0.01, wageBase: 31400, name: "North Carolina" },
  ND: { rate: 0.0108, wageBase: 43800, name: "North Dakota" },
  OH: { rate: 0.027, wageBase: 9000, name: "Ohio" },
  OK: { rate: 0.015, wageBase: 27000, name: "Oklahoma" },
  OR: { rate: 0.024, wageBase: 52800, name: "Oregon" },
  PA: { rate: 0.0307, wageBase: 10000, name: "Pennsylvania" },
  RI: { rate: 0.0299, wageBase: 29200, name: "Rhode Island" },
  SC: { rate: 0.0054, wageBase: 14000, name: "South Carolina" },
  SD: { rate: 0.012, wageBase: 15000, name: "South Dakota" },
  TN: { rate: 0.027, wageBase: 7000, name: "Tennessee" },
  TX: { rate: 0.027, wageBase: 9000, name: "Texas" },
  UT: { rate: 0.0116, wageBase: 47000, name: "Utah" },
  VT: { rate: 0.01, wageBase: 16100, name: "Vermont" },
  VA: { rate: 0.0254, wageBase: 8000, name: "Virginia" },
  WA: { rate: 0.019, wageBase: 68500, name: "Washington" },
  WV: { rate: 0.027, wageBase: 9000, name: "West Virginia" },
  WI: { rate: 0.0325, wageBase: 14000, name: "Wisconsin" },
  WY: { rate: 0.024, wageBase: 30900, name: "Wyoming" },
};

// Local income tax rates by city/municipality
// Only includes jurisdictions that have local income taxes
export const localTaxRates = {
  // Alabama
  AL: {
    cities: {
      "Birmingham": 0.01,
      "Bessemer": 0.01,
      "Gadsden": 0.02,
      "Macon County": 0.01,
    }
  },
  // Colorado (Occupational Privilege Tax - flat amounts, converted to approximate %)
  CO: {
    cities: {
      "Denver": 0.00575, // $5.75/month OPT converted to approx %
      "Aurora": 0.002,
      "Greenwood Village": 0.004,
    }
  },
  // Delaware (Wilmington only)
  DE: {
    cities: {
      "Wilmington": 0.0125,
    }
  },
  // Indiana (County taxes)
  IN: {
    cities: {
      "Adams County": 0.0175,
      "Allen County": 0.0148,
      "Bartholomew County": 0.0175,
      "Boone County": 0.015,
      "Clark County": 0.02,
      "Delaware County": 0.015,
      "Elkhart County": 0.02,
      "Floyd County": 0.0125,
      "Hamilton County": 0.01,
      "Hancock County": 0.0155,
      "Hendricks County": 0.0175,
      "Howard County": 0.0185,
      "Johnson County": 0.01,
      "Lake County": 0.015,
      "LaPorte County": 0.011,
      "Madison County": 0.0175,
      "Marion County": 0.0202, // Indianapolis
      "Monroe County": 0.0135,
      "Porter County": 0.005,
      "St. Joseph County": 0.0175,
      "Tippecanoe County": 0.012,
      "Vanderburgh County": 0.0125,
      "Vigo County": 0.015,
      "Wayne County": 0.0168,
    }
  },
  // Iowa (School district surtax - varies)
  IA: {
    cities: {
      "Des Moines": 0.0,
    }
  },
  // Kentucky
  KY: {
    cities: {
      "Louisville": 0.0225,
      "Lexington": 0.025,
      "Bowling Green": 0.0185,
      "Owensboro": 0.018,
      "Covington": 0.025,
      "Paducah": 0.02,
      "Florence": 0.02,
      "Hopkinsville": 0.015,
      "Ashland": 0.015,
      "Richmond": 0.02,
    }
  },
  // Maryland (County taxes)
  MD: {
    cities: {
      "Allegany County": 0.0305,
      "Anne Arundel County": 0.0281,
      "Baltimore City": 0.032,
      "Baltimore County": 0.032,
      "Calvert County": 0.03,
      "Caroline County": 0.032,
      "Carroll County": 0.0305,
      "Cecil County": 0.03,
      "Charles County": 0.0303,
      "Dorchester County": 0.032,
      "Frederick County": 0.0296,
      "Garrett County": 0.0265,
      "Harford County": 0.0306,
      "Howard County": 0.032,
      "Kent County": 0.0285,
      "Montgomery County": 0.032,
      "Prince George's County": 0.032,
      "Queen Anne's County": 0.032,
      "Somerset County": 0.032,
      "St. Mary's County": 0.03,
      "Talbot County": 0.024,
      "Washington County": 0.0295,
      "Wicomico County": 0.032,
      "Worcester County": 0.0175,
    }
  },
  // Michigan (City taxes)
  MI: {
    cities: {
      "Detroit": 0.024,
      "Grand Rapids": 0.015,
      "Highland Park": 0.02,
      "Saginaw": 0.015,
      "Flint": 0.01,
      "Lansing": 0.01,
      "Pontiac": 0.01,
      "Port Huron": 0.01,
      "Battle Creek": 0.01,
      "Albion": 0.01,
      "Big Rapids": 0.01,
      "Grayling": 0.01,
      "Hamtramck": 0.01,
      "Hudson": 0.01,
      "Ionia": 0.01,
      "Jackson": 0.01,
      "Lapeer": 0.01,
      "Muskegon": 0.01,
      "Muskegon Heights": 0.01,
      "Portland": 0.01,
      "Springfield": 0.01,
      "Walker": 0.01,
    }
  },
  // Missouri (Kansas City & St. Louis)
  MO: {
    cities: {
      "Kansas City": 0.01,
      "St. Louis": 0.01,
    }
  },
  // New Jersey (Newark payroll tax)
  NJ: {
    cities: {
      "Newark": 0.01,
    }
  },
  // New York
  NY: {
    cities: {
      "New York City": 0.03876, // Highest bracket
      "Yonkers": 0.01959, // 16.75% of state tax, approx
    }
  },
  // Ohio (Many cities)
  OH: {
    cities: {
      "Columbus": 0.025,
      "Cleveland": 0.025,
      "Cincinnati": 0.0191,
      "Toledo": 0.025,
      "Akron": 0.025,
      "Dayton": 0.025,
      "Parma": 0.025,
      "Canton": 0.025,
      "Youngstown": 0.0275,
      "Lorain": 0.025,
      "Hamilton": 0.02,
      "Springfield": 0.02,
      "Elyria": 0.02,
      "Lakewood": 0.015,
      "Kettering": 0.0225,
      "Cuyahoga Falls": 0.02,
      "Euclid": 0.0285,
      "Middletown": 0.0215,
      "Mansfield": 0.02,
      "Newark": 0.0175,
      "Lima": 0.015,
      "Mentor": 0.02,
      "Beavercreek": 0.0125,
      "Strongsville": 0.02,
      "Dublin": 0.02,
      "Fairfield": 0.015,
      "Warren": 0.025,
      "Findlay": 0.015,
      "Grove City": 0.02,
      "Westerville": 0.02,
      "Delaware": 0.0185,
      "Mason": 0.0115,
      "Reynoldsburg": 0.025,
      "Upper Arlington": 0.025,
      "Gahanna": 0.025,
      "Hilliard": 0.02,
      "Westlake": 0.015,
      "Stow": 0.02,
      "Brunswick": 0.02,
      "Wooster": 0.015,
      "North Olmsted": 0.02,
      "Trotwood": 0.02,
      "Sandusky": 0.015,
      "Bowling Green": 0.0195,
      "Avon": 0.0175,
      "Avon Lake": 0.015,
      "Solon": 0.02,
      "North Royalton": 0.02,
      "Hudson": 0.02,
      "Green": 0.02,
      "Tiffin": 0.015,
      "Wadsworth": 0.015,
      "Oregon": 0.0225,
      "Sylvania": 0.015,
      "Perrysburg": 0.015,
      "Maumee": 0.015,
      "Vermilion": 0.0175,
      "Ashland": 0.015,
      "Cambridge": 0.02,
      "Marietta": 0.015,
      "Portsmouth": 0.02,
      "Zanesville": 0.02,
      "Chillicothe": 0.02,
      "Lancaster": 0.0175,
      "Athens": 0.02,
      "Circleville": 0.0175,
      "New Philadelphia": 0.015,
      "Dover": 0.015,
    }
  },
  // Oregon (Metro tax for Portland area)
  OR: {
    cities: {
      "Portland Metro": 0.01, // Supportive Housing Services Tax
      "Multnomah County": 0.015, // Preschool for All Tax (high earners)
    }
  },
  // Pennsylvania (Many municipalities)
  PA: {
    cities: {
      "Philadelphia": 0.03879,
      "Pittsburgh": 0.03,
      "Scranton": 0.032,
      "Reading": 0.032,
      "Allentown": 0.0185,
      "Bethlehem": 0.01,
      "Erie": 0.0185,
      "Lancaster": 0.012,
      "Harrisburg": 0.02,
      "Wilkes-Barre": 0.03,
      "York": 0.012,
      "Chester": 0.02,
      "Easton": 0.015,
      "Altoona": 0.015,
      "Williamsport": 0.017,
      "McKeesport": 0.01,
      "Johnstown": 0.015,
      "Hazleton": 0.01,
      "New Castle": 0.015,
      "Pottsville": 0.0195,
      "Norristown": 0.015,
      "Lebanon": 0.0128,
    }
  },
  // West Virginia (Municipal B&O tax - employer paid, not shown on employee stub typically)
  WV: {
    cities: {}
  },
};

// States that do not allow local income taxes
export const noLocalTaxStates = [
  "AK", "AZ", "AR", "CA", "CT", "FL", "GA", "HI", "ID", "IL", 
  "KS", "LA", "ME", "MA", "MN", "MS", "MT", "NE", "NV", "NH",
  "NM", "NC", "ND", "OK", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WI", "WY"
];

// Get local tax rate for a city/state combination
export function getLocalTaxRate(state, city) {
  if (!state || !city) return 0;
  
  const stateUpper = state.toUpperCase();
  
  // Check if state allows local taxes
  if (noLocalTaxStates.includes(stateUpper)) {
    return 0;
  }
  
  const stateData = localTaxRates[stateUpper];
  if (!stateData || !stateData.cities) return 0;
  
  // Try exact match first
  if (stateData.cities[city]) {
    return stateData.cities[city];
  }
  
  // Try case-insensitive match
  const cityLower = city.toLowerCase();
  for (const [cityName, rate] of Object.entries(stateData.cities)) {
    if (cityName.toLowerCase() === cityLower) {
      return rate;
    }
  }
  
  return 0;
}

// Get SUTA rate for a state
export function getSUTARate(state) {
  if (!state) return 0.027; // Default rate
  
  const stateUpper = state.toUpperCase();
  const stateData = stateSUTARates[stateUpper];
  
  return stateData ? stateData.rate : 0.027;
}

// Get list of cities with local tax for a state
export function getCitiesWithLocalTax(state) {
  if (!state) return [];
  
  const stateUpper = state.toUpperCase();
  
  if (noLocalTaxStates.includes(stateUpper)) {
    return [];
  }
  
  const stateData = localTaxRates[stateUpper];
  if (!stateData || !stateData.cities) return [];
  
  return Object.keys(stateData.cities).sort();
}

// Check if a state has local taxes
export function stateHasLocalTax(state) {
  if (!state) return false;
  return !noLocalTaxStates.includes(state.toUpperCase());
}
