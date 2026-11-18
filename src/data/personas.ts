import type { Scenario, Member } from '../engine/exposure';
import type { CookingFuel, HeatingFuel } from '../engine/emissions';

export interface PersonaSeed {
  id: string;
  name: string;
  city: {
    name: string;
    lat: number;
    lon: number;
    country: string;
  };
  description: string;
  lifestyle: {
    homeAreaM2: number;
    hasPurifier: boolean;
    cadrM3h?: number;
    cookingFuel: CookingFuel;
    heatingFuel: HeatingFuel;
    commuteMode: 'car_petrol' | 'two_wheeler' | 'metro' | 'bus';
    commuteKm: number;
    budgetTier: 'zero' | 'low' | 'mid';
    language: 'en' | 'hi' | 'hinglish';
  };
  scenario: Scenario;
}

// 24-hour winter smog profile typical for Ghaziabad / Delhi NCR (peak morning and night, dip in afternoon)
export const NCR_WINTER_SMOG_HOURLY = [
  280, 290, 310, 330, 350, 370, 390, 410, // 00:00 - 07:00 morning inversion peak
  380, 320, 260, 220, 190, 180, 190, 210, // 08:00 - 15:00 afternoon ventilation window
  250, 300, 340, 370, 390, 380, 340, 300, // 16:00 - 23:00 evening rush and cooling trap
];

export const KRAKOW_WINTER_SMOG_HOURLY = [
  120, 130, 140, 150, 160, 150, 140, 130,
  110, 95, 80, 75, 70, 75, 85, 100,
  125, 145, 160, 175, 180, 170, 150, 130,
];

// 1. Primary Persona: The Sharma Family (Ghaziabad NCR)
const sharmaMembers: Member[] = [
  {
    id: 'm-rajesh',
    name: 'Rajesh (Dad)',
    ageGroup: 'adult',
    conditions: [],
    blocks: [
      { startHour: 0, endHour: 8, place: 'home', activity: 'sleep', mask: 'none' },
      { startHour: 8, endHour: 9, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
      { startHour: 9, endHour: 18, place: 'work_school', activity: 'light', mask: 'none' },
      { startHour: 18, endHour: 19, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
      { startHour: 19, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
    ],
  },
  {
    id: 'm-priya',
    name: 'Priya (Mom)',
    ageGroup: 'adult',
    conditions: [],
    blocks: [
      { startHour: 0, endHour: 7, place: 'home', activity: 'sleep', mask: 'none' },
      { startHour: 7, endHour: 8, place: 'outdoor', activity: 'brisk', mask: 'none' }, // morning walk
      { startHour: 8, endHour: 9, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
      { startHour: 9, endHour: 17, place: 'work_school', activity: 'light', mask: 'none' },
      { startHour: 17, endHour: 18, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
      { startHour: 18, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
    ],
  },
  {
    id: 'm-aarav',
    name: 'Aarav (Age 9)',
    ageGroup: 'child',
    conditions: [],
    blocks: [
      { startHour: 0, endHour: 7, place: 'home', activity: 'sleep', mask: 'none' },
      { startHour: 7, endHour: 8, place: 'commute', activity: 'rest', commuteMode: 'bus', mask: 'none' },
      { startHour: 8, endHour: 14, place: 'work_school', activity: 'light', mask: 'none' },
      { startHour: 14, endHour: 15, place: 'commute', activity: 'rest', commuteMode: 'bus', mask: 'none' },
      { startHour: 15, endHour: 17, place: 'outdoor', activity: 'exercise', mask: 'none' }, // outdoor sports
      { startHour: 17, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
    ],
  },
  {
    id: 'm-ananya',
    name: 'Ananya (Age 14)',
    ageGroup: 'teen',
    conditions: [],
    blocks: [
      { startHour: 0, endHour: 7, place: 'home', activity: 'sleep', mask: 'none' },
      { startHour: 7, endHour: 8, place: 'commute', activity: 'rest', commuteMode: 'bus', mask: 'none' },
      { startHour: 8, endHour: 15, place: 'work_school', activity: 'light', mask: 'none' },
      { startHour: 15, endHour: 16, place: 'commute', activity: 'rest', commuteMode: 'bus', mask: 'none' },
      { startHour: 16, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
    ],
  },
  {
    id: 'm-dadaji',
    name: 'Dadaji (Age 72)',
    ageGroup: 'senior',
    conditions: ['asthma_copd'],
    blocks: [
      { startHour: 0, endHour: 6, place: 'home', activity: 'sleep', mask: 'none' },
      { startHour: 6, endHour: 7, place: 'outdoor', activity: 'light', mask: 'none' }, // early morning walk
      { startHour: 7, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
    ],
  },
];

export const DEMO_PERSONAS: PersonaSeed[] = [
  {
    id: 'sharma-ghaziabad',
    name: 'Sharma Family (Ghaziabad NCR)',
    city: {
      name: 'Ghaziabad, Uttar Pradesh',
      lat: 28.6692,
      lon: 77.4538,
      country: 'India',
    },
    description: '2 working adults, 2 school kids, and grandfather with COPD. Heavy traffic corridor.',
    lifestyle: {
      homeAreaM2: 110,
      hasPurifier: false,
      cookingFuel: 'lpg',
      heatingFuel: 'none',
      commuteMode: 'car_petrol',
      commuteKm: 22,
      budgetTier: 'mid',
      language: 'en',
    },
    scenario: {
      outdoorPm25: NCR_WINTER_SMOG_HOURLY,
      distanceKmPerDay: 22,
      occupancy: 2,
      home: {
        areaM2: 110,
        windows: 'closed',
        sources: {
          cooking_no_hood: [7, 8, 19, 20],
          incense: [7, 19],
        },
      },
      members: sharmaMembers,
    },
  },
  {
    id: 'student-delhi',
    name: 'Kabir (Hostel Student, North Delhi)',
    city: {
      name: 'Delhi, India',
      lat: 28.6139,
      lon: 77.209,
      country: 'India',
    },
    description: 'College student commuting by 2-wheeler, living in rented hostel with zero budget for purifiers.',
    lifestyle: {
      homeAreaM2: 25,
      hasPurifier: false,
      cookingFuel: 'induction',
      heatingFuel: 'none',
      commuteMode: 'two_wheeler',
      commuteKm: 12,
      budgetTier: 'zero',
      language: 'hinglish',
    },
    scenario: {
      outdoorPm25: NCR_WINTER_SMOG_HOURLY,
      distanceKmPerDay: 12,
      occupancy: 1,
      home: {
        areaM2: 25,
        windows: 'open',
        sources: {},
      },
      members: [
        {
          id: 'm-kabir',
          name: 'Kabir (Age 20)',
          ageGroup: 'adult',
          conditions: [],
          blocks: [
            { startHour: 0, endHour: 8, place: 'home', activity: 'sleep', mask: 'none' },
            { startHour: 8, endHour: 9, place: 'commute', activity: 'light', commuteMode: 'two_wheeler', mask: 'none' },
            { startHour: 9, endHour: 17, place: 'work_school', activity: 'light', mask: 'none' },
            { startHour: 17, endHour: 18, place: 'commute', activity: 'light', commuteMode: 'two_wheeler', mask: 'none' },
            { startHour: 18, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
          ],
        },
      ],
    },
  },
  {
    id: 'nowak-krakow',
    name: 'Nowak Family (Kraków, Poland)',
    city: {
      name: 'Kraków, Lesser Poland',
      lat: 50.0647,
      lon: 19.945,
      country: 'Poland',
    },
    description: 'Suburban family dealing with European winter coal smoke inversion in the Vistula river valley.',
    lifestyle: {
      homeAreaM2: 120,
      hasPurifier: true,
      cadrM3h: 220,
      cookingFuel: 'induction',
      heatingFuel: 'coal_wood',
      commuteMode: 'car_petrol',
      commuteKm: 18,
      budgetTier: 'mid',
      language: 'en',
    },
    scenario: {
      outdoorPm25: KRAKOW_WINTER_SMOG_HOURLY,
      distanceKmPerDay: 18,
      occupancy: 2,
      home: {
        areaM2: 120,
        windows: 'closed',
        purifier: {
          cadrM3h: 220,
          hours: [21, 22, 23, 0, 1, 2, 3, 4, 5, 6],
        },
        sources: {
          wood_coal_heater: [6, 7, 8, 17, 18, 19, 20, 21],
        },
      },
      members: [
        {
          id: 'm-jan',
          name: 'Jan (Dad)',
          ageGroup: 'adult',
          conditions: [],
          blocks: [
            { startHour: 0, endHour: 7, place: 'home', activity: 'sleep', mask: 'none' },
            { startHour: 7, endHour: 8, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
            { startHour: 8, endHour: 17, place: 'work_school', activity: 'light', mask: 'none' },
            { startHour: 17, endHour: 18, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
            { startHour: 18, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
          ],
        },
        {
          id: 'm-zofia',
          name: 'Zofia (Mom - Pregnant)',
          ageGroup: 'adult',
          conditions: ['pregnant'],
          blocks: [
            { startHour: 0, endHour: 8, place: 'home', activity: 'sleep', mask: 'none' },
            { startHour: 8, endHour: 16, place: 'work_school', activity: 'light', mask: 'none' },
            { startHour: 16, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
          ],
        },
      ],
    },
  },
];
