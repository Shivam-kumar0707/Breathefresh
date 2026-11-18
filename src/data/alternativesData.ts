export interface AlternativeOption {
  id: string;
  title: string;
  mode: string;
  exposure: number;
  cigs: number;
  co2eWeek: number;
  cost: 'free' | 'low' | 'mid' | 'high';
  desc: string;
}

export const COMMUTE_OPTIONS: AlternativeOption[] = [
  {
    id: 'metro_or_bus_instead_of_car',
    title: 'Shift Car Commute to Delhi Metro / AC Rapid Bus',
    mode: 'Metro vs. Personal Petrol Car',
    exposure: -50,
    cigs: -1.8,
    co2eWeek: -14.2,
    cost: 'free',
    desc: 'Metro stations and coaches use commercial MERV-13 air filtration systems with positive pressurization. Slashes ~14 kg of CO2e per week while bypassing gridlocked exhaust fumes.',
  },
  {
    id: 'carpool',
    title: '3-Person Carpooling for Office Corridors',
    mode: 'Shared Ride vs. Single Occupant',
    exposure: 0,
    cigs: 0,
    co2eWeek: -12.0,
    cost: 'free',
    desc: 'Splits tailpipe emissions across 3 commuters, cutting individual transportation carbon footprint by 66% with zero change in travel time.',
  },
  {
    id: 'cycle_short_trips',
    title: 'Cycling for Short Errands (< 3 km, Moderate Air Only)',
    mode: 'Bicycle vs. Auto/Motorcycle',
    exposure: 15,
    cigs: 0.4,
    co2eWeek: -4.5,
    cost: 'free',
    desc: 'Zero-emission local transport. NOTE: Aerobic respiration increases minute ventilation by 3.5×. Only cycle when AQI is below 150.',
  },
];

export const COOKING_OPTIONS: AlternativeOption[] = [
  {
    id: 'cooking_fuel_switch',
    title: 'Transition Cooking to Electric Induction Cooktop',
    mode: 'Electric Induction vs. Solid Biomass / LPG',
    exposure: -35,
    cigs: -2.4,
    co2eWeek: -20.2,
    cost: 'low',
    desc: 'Biomass chulhas and unvented gas burners release significant particulate matter, carbon monoxide, and NOx indoors. Induction provides zero combustion emissions inside the home.',
  },
  {
    id: 'cook_with_hood_or_window',
    title: 'Install High-Suction Chimney Exhaust Hood',
    mode: 'Cooktop Range Hood with Vent Duct',
    exposure: -25,
    cigs: -1.2,
    co2eWeek: 0,
    cost: 'free',
    desc: 'Venting frying fumes outside prevents greasy fine aerosol accumulation across adjacent bedrooms.',
  },
];

export const HEATING_OPTIONS: AlternativeOption[] = [
  {
    id: 'electric_heating_switch',
    title: 'Electric Oil-Filled Radiator / Inverter Heat Pump',
    mode: 'Electric Radiator vs. Wood/Coal Brazier (Angithi)',
    exposure: -65,
    cigs: -4.2,
    co2eWeek: -34.0,
    cost: 'mid',
    desc: 'Eliminates open glowing coal or charcoal braziers in sleeping areas, which are the leading cause of lethal winter carbon monoxide poisoning and acute severe indoor smog.',
  },
];
