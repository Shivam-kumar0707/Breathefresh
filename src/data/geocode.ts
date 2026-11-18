import { z } from 'zod';

const GeocodeResultItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  admin1: z.string().optional(),
});

const GeocodeResponseSchema = z.object({
  results: z.array(GeocodeResultItemSchema).optional(),
});

export interface CityLocation {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  country: string;
}

export const DEFAULT_POPULAR_CITIES: CityLocation[] = [
  {
    id: 'ghaziabad-in',
    name: 'Ghaziabad',
    displayName: 'Ghaziabad, Uttar Pradesh, India',
    lat: 28.6692,
    lon: 77.4538,
    country: 'India',
  },
  {
    id: 'delhi-in',
    name: 'Delhi',
    displayName: 'Delhi, National Capital Territory, India',
    lat: 28.6139,
    lon: 77.209,
    country: 'India',
  },
  {
    id: 'noida-in',
    name: 'Noida',
    displayName: 'Noida, Uttar Pradesh, India',
    lat: 28.5355,
    lon: 77.391,
    country: 'India',
  },
  {
    id: 'gurugram-in',
    name: 'Gurugram',
    displayName: 'Gurugram, Haryana, India',
    lat: 28.4595,
    lon: 77.0266,
    country: 'India',
  },
  {
    id: 'krakow-pl',
    name: 'Kraków',
    displayName: 'Kraków, Lesser Poland, Poland',
    lat: 50.0647,
    lon: 19.945,
    country: 'Poland',
  },
  {
    id: 'kolkata-in',
    name: 'Kolkata',
    displayName: 'Kolkata, West Bengal, India',
    lat: 22.5726,
    lon: 88.3639,
    country: 'India',
  },
  {
    id: 'mumbai-in',
    name: 'Mumbai',
    displayName: 'Mumbai, Maharashtra, India',
    lat: 19.076,
    lon: 72.8777,
    country: 'India',
  },
];

export async function searchCities(query: string): Promise<CityLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return DEFAULT_POPULAR_CITIES;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=6&language=en&format=json`;

    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Geocoding failed with status ${res.status}`);
    }

    const data = await res.json();
    const parsed = GeocodeResponseSchema.parse(data);

    if (!parsed.results || parsed.results.length === 0) {
      // Filter defaults as fallback match
      return DEFAULT_POPULAR_CITIES.filter((c) =>
        c.displayName.toLowerCase().includes(trimmed.toLowerCase())
      );
    }

    return parsed.results.map((r) => {
      const parts = [r.name];
      if (r.admin1) parts.push(r.admin1);
      if (r.country) parts.push(r.country);

      return {
        id: `${r.id}`,
        name: r.name,
        displayName: parts.join(', '),
        lat: Math.round(r.latitude * 100) / 100,
        lon: Math.round(r.longitude * 100) / 100,
        country: r.country ?? '',
      };
    });
  } catch (err) {
    clearTimeout(timer);
    console.warn(`Geocoding search failed for "${trimmed}", falling back:`, err);
    return DEFAULT_POPULAR_CITIES.filter((c) =>
      c.displayName.toLowerCase().includes(trimmed.toLowerCase())
    );
  }
}
