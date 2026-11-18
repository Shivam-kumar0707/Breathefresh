import React, { useState, useEffect, useRef } from 'react';
import { searchCities, type CityLocation, DEFAULT_POPULAR_CITIES } from '../data/geocode';
import { useStore } from '../store/useStore';
import { MapPinIcon } from './icons';

export const CitySearch: React.FC = () => {
  const { profile, setProfile, refreshAirData } = useStore();
  const [query, setQuery] = useState(profile.city.name);
  const [results, setResults] = useState<CityLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(profile.city.name);
  }, [profile.city.name]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setResults(DEFAULT_POPULAR_CITIES);
      setIsOpen(true);
      return;
    }

    setIsSearching(true);
    setIsOpen(true);
    try {
      const items = await searchCities(val);
      setResults(items);
    } catch {
      setResults(DEFAULT_POPULAR_CITIES);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCity = (city: CityLocation) => {
    setProfile({
      city: {
        name: city.name,
        displayName: city.displayName,
        lat: city.lat,
        lon: city.lon,
        country: city.country,
      },
    });
    setQuery(city.name);
    setIsOpen(false);
    refreshAirData();
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 100) / 100;
        const lon = Math.round(pos.coords.longitude * 100) / 100;
        setProfile({
          city: {
            name: `Location (${lat}, ${lon})`,
            displayName: `My Location (${lat}, ${lon})`,
            lat,
            lon,
            country: 'Local',
          },
        });
        setQuery(`Location (${lat}, ${lon})`);
        refreshAirData();
      },
      (err) => {
        console.warn('Geolocation denied or unavailable, falling back:', err.message);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            data-testid="city-search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (results.length === 0) setResults(DEFAULT_POPULAR_CITIES);
              setIsOpen(true);
            }}
            placeholder="Search city (e.g. Ghaziabad, Delhi, Kraków)..."
            className="w-full px-4 py-2.5 pl-10 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 font-medium placeholder-slate-400"
          />
          <MapPinIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          {isSearching && (
            <span className="absolute right-3 top-3 text-xs text-slate-400 animate-spin">
              ⌛
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleGeolocation}
          title="Use current GPS location"
          className="px-3 py-2.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5"
        >
          <span>📍 GPS</span>
        </button>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto py-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Popular & Matching Smog Regions
          </div>
          {results.map((c) => (
            <button
              key={`${c.lat}-${c.lon}-${c.name}`}
              type="button"
              onClick={() => selectCity(c)}
              className="w-full text-left px-3.5 py-2 hover:bg-teal-50 flex items-center justify-between text-xs transition-colors"
            >
              <div className="font-medium text-slate-800">{c.displayName}</div>
              <span className="text-[10px] text-slate-400 font-mono">
                {c.lat}, {c.lon}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
