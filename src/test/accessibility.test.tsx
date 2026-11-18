import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Onboard } from '../pages/Onboard';
import { Today } from '../pages/Today';
import { WhatIf } from '../pages/WhatIf';
import { Community } from '../pages/Community';
import { Method } from '../pages/Method';
import { useStore } from '../store/useStore';
import type { AirState } from '../data/airApi';
import type { DailyPlan } from '../store/types';

describe('Accessibility & WCAG Compliance Suite', () => {
  const mockAir: AirState = {
    current: { time: '2026-11-19T10:00:00Z', pm2_5: 220, pm10: 340, us_aqi: 270 },
    naqi: {
      aqi: 280,
      category: 'Poor',
      color: '#f97316',
      pm25SubIndex: 280,
      pm10SubIndex: 240,
      responsiblePollutant: 'PM2.5',
    },
    grapStage: null,
    hourlySeries: Array.from({ length: 24 }, (_, i) => ({
      time: `2026-11-19T${i.toString().padStart(2, '0')}:00:00Z`,
      hour: i,
      pm2_5: 200 + (i % 5) * 10,
      pm10: 300,
      aqi: 250,
      isBestWindow: i === 14,
      isWorstWindow: i === 7,
    })),
    today24hPm25: new Array(24).fill(220),
    forecastDays: [],
    bestWindow: { hour: 14, pm25: 140, aqi: 190, timeLabel: '14:00 - 15:00' },
    worstWindow: { hour: 7, pm25: 290, aqi: 350, timeLabel: '07:00 - 08:00' },
    isNcr: true,
    inversionRisk: false,
    isSampleData: false,
    dataSourceLabel: 'Live Open-Meteo Air Quality API',
  };

  const mockPlan: DailyPlan = {
    headline: 'High Pollution Alert: Immediate Defense Plan',
    summary: 'Prioritize indoor HEPA filtration and limit early morning commute exposure.',
    riskLevel: 'severe',
    timeline: [
      {
        startHour: 7,
        endHour: 9,
        title: 'Morning Commute: N95 Required',
        actionId: 'n95_commute',
        why: 'Peak traffic and morning inversion push PM2.5 above 280 µg/m³.',
      },
    ],
    members: [
      {
        memberId: 'm1',
        tips: ['Keep bedroom door shut with purifier on medium speed.'],
        avoid: ['Do not exercise outdoors before 10 AM.'],
      },
    ],
    topActions: ['n95_commute'],
    isFallback: false,
    generatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    useStore.setState({
      air: mockAir,
      plan: mockPlan,
      isLoadingAir: false,
      isGeneratingPlan: false,
      isRuleBasedFallback: false,
      smogOverride: null,
      selectedActions: ['n95_commute'],
    });
  });

  const renderWithLayout = (element: React.ReactNode, path = '/') => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-teal-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 w-full">
            {element}
          </main>
          <Footer />
        </div>
      </MemoryRouter>
    );
  };

  const checkAxeViolations = async (container: HTMLElement) => {
    const results = await axe.run(container, {
      rules: {
        // Color-contrast rule requires real layout/CSS rendering in browser (handled in Lighthouse audit)
        'color-contrast': { enabled: false },
      },
    });
    return results.violations;
  };

  describe('Axe Route Audits (0 Violations)', () => {
    it('passes axe audit on / (Onboard route)', async () => {
      const { container } = renderWithLayout(<Onboard />, '/');
      const violations = await checkAxeViolations(container);
      expect(violations).toEqual([]);
    });

    it('passes axe audit on /plan (Today route)', async () => {
      const { container } = renderWithLayout(<Today />, '/plan');
      const violations = await checkAxeViolations(container);
      expect(violations).toEqual([]);
    });

    it('passes axe audit on /impact (WhatIf route)', async () => {
      const { container } = renderWithLayout(<WhatIf />, '/impact');
      const violations = await checkAxeViolations(container);
      expect(violations).toEqual([]);
    });

    it('passes axe audit on /community (Community route)', async () => {
      const { container } = renderWithLayout(<Community />, '/community');
      const violations = await checkAxeViolations(container);
      expect(violations).toEqual([]);
    });

    it('passes axe audit on /method (Method route)', async () => {
      const { container } = renderWithLayout(<Method />, '/method');
      const violations = await checkAxeViolations(container);
      expect(violations).toEqual([]);
    });
  });

  describe('Landmarks and Structural Navigation', () => {
    it('contains valid landmarks: skip-link, header/banner, navigation, main, and footer', () => {
      renderWithLayout(<Today />, '/plan');

      // Skip link
      const skipLink = screen.getByRole('link', { name: /Skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');

      // Landmarks
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /Main Navigation/i })).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Interactive Controls & ARIA Attributes', () => {
    it('enforces ARIA slider semantics with aria-valuetext on smog slider', () => {
      renderWithLayout(<WhatIf />, '/impact');

      const slider = screen.getByRole('slider', { name: /Outdoor PM2.5/i });
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('aria-valuemin', '50');
      expect(slider).toHaveAttribute('aria-valuemax', '500');
      expect(slider).toHaveAttribute('aria-valuenow');
      expect(slider).toHaveAttribute('aria-valuetext');
      expect(slider.getAttribute('aria-valuetext')).toContain('micrograms per cubic meter');
    });

    it('ensures accessible text summaries accompany charts', () => {
      renderWithLayout(<Today />, '/plan');

      // Check for screen-reader text alternatives for charts
      const summaries = screen.getAllByRole('table');
      expect(summaries.length).toBeGreaterThan(0);
    });
  });
});
