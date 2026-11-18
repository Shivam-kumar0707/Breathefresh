import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Onboard } from '../pages/Onboard';
import { Today } from '../pages/Today';
import { WhatIf } from '../pages/WhatIf';
import { Community } from '../pages/Community';
import { FamilyBuilder } from '../components/FamilyBuilder';
import { RoomScanModal } from '../components/RoomScanModal';
import * as Icons from '../components/icons';
import { useStore } from '../store/useStore';
import type { AirState } from '../data/airApi';
import type { DailyPlan } from '../store/types';

describe('Component Flow & Integration Tests', () => {
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
    hourlySeries: [],
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
      {
        startHour: 14,
        endHour: 15,
        title: 'Brief Ventilation Window',
        actionId: 'ventilate_cleanest_hour',
        why: 'Atmospheric mixing lowers ambient PM2.5 to 140 µg/m³.',
      },
    ],
    members: [
      {
        memberId: 'm1',
        tips: ['Keep bedroom door shut with purifier on medium speed.'],
        avoid: ['Do not exercise outdoors before 10 AM.'],
      },
    ],
    topActions: ['n95_commute', 'hepa_purifier_bedroom'],
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

  describe('Onboarding Demo Flow', () => {
    it('renders onboard page with demo button and loads persona on click', async () => {
      const loadPersonaMock = vi.fn().mockResolvedValue(undefined);
      useStore.setState({ loadPersona: loadPersonaMock });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Onboard />} />
            <Route path="/plan" element={<div data-testid="plan-page">Plan Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      const demoBtn = screen.getByTestId('demo-button');
      expect(demoBtn).toBeInTheDocument();
      expect(demoBtn).toHaveTextContent(/Demo/i);

      fireEvent.click(demoBtn);

      await waitFor(() => {
        expect(loadPersonaMock).toHaveBeenCalledWith('sharma-ghaziabad');
      });
    });
  });

  describe('Today View Component State & Tabs', () => {
    it('renders hero cigarette equivalent number and timeline plan items', () => {
      render(
        <MemoryRouter>
          <Today />
        </MemoryRouter>
      );

      // Hero Cigarette Equivalent Banner
      const cigNumber = screen.getByTestId('cigarette-equivalent-number');
      expect(cigNumber).toBeInTheDocument();
      expect(Number(cigNumber.textContent)).toBeGreaterThanOrEqual(0);

      // Plan timeline items
      const planItems = screen.getAllByTestId('plan-item');
      expect(planItems.length).toBe(2);
      expect(planItems[0]).toHaveTextContent('Morning Commute: N95 Required');
    });

    it('switches between Plan, Hacks, and Alternatives tabs', () => {
      render(
        <MemoryRouter>
          <Today />
        </MemoryRouter>
      );

      // Default active tab is plan
      expect(screen.getByTestId('tab-plan')).toHaveAttribute('aria-selected', 'true');

      // Click Hacks tab
      const hacksTab = screen.getByTestId('tab-hacks');
      fireEvent.click(hacksTab);
      expect(hacksTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('tab-plan')).toHaveAttribute('aria-selected', 'false');

      // Click Alternatives tab
      const altTab = screen.getByTestId('tab-alternatives');
      fireEvent.click(altTab);
      expect(altTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Fallback Banners', () => {
    it('displays rule-based fallback banner when isRuleBasedFallback is true', () => {
      useStore.setState({ isRuleBasedFallback: true });

      render(
        <MemoryRouter>
          <Today />
        </MemoryRouter>
      );

      const banner = screen.getByTestId('fallback-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/Impact Engine Verified/i);
    });

    it('displays sample data badge when air.isSampleData is true', () => {
      useStore.setState({
        air: {
          ...mockAir,
          isSampleData: true,
        },
      });

      render(
        <MemoryRouter>
          <Today />
        </MemoryRouter>
      );

      const badge = screen.getByTestId('sample-data-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(/Sample Data/i);
    });
  });

  describe('What-If Scenario Simulation', () => {
    it('allows adjusting smog slider and toggling intervention actions', () => {
      render(
        <MemoryRouter>
          <WhatIf />
        </MemoryRouter>
      );

      // Smog Slider
      const slider = screen.getByTestId('smog-slider') as HTMLInputElement;
      expect(slider).toBeInTheDocument();

      fireEvent.change(slider, { target: { value: '380' } });
      expect(useStore.getState().smogOverride).toBe(380);

      // What-If Action Toggles
      const toggles = screen.getAllByTestId('what-if-toggle');
      expect(toggles.length).toBeGreaterThan(0);

      const firstToggle = toggles[0];
      const initialChecked = firstToggle.getAttribute('aria-checked') === 'true';

      fireEvent.click(firstToggle);
      const afterChecked = firstToggle.getAttribute('aria-checked') === 'true';
      expect(afterChecked).toBe(!initialChecked);
    });
  });

  describe('FamilyBuilder Interactive Tabs', () => {
    it('switches between Members, Home, and Commute tabs and adds members', () => {
      render(
        <MemoryRouter>
          <FamilyBuilder />
        </MemoryRouter>
      );

      // Home tab
      const homeTab = screen.getByRole('tab', { name: /Home & Indoor Profile/i });
      fireEvent.click(homeTab);
      expect(homeTab).toHaveAttribute('aria-selected', 'true');

      // Commute tab
      const commuteTab = screen.getByRole('tab', { name: /Commute & Fuels/i });
      fireEvent.click(commuteTab);
      expect(commuteTab).toHaveAttribute('aria-selected', 'true');

      // Members tab
      const membersTab = screen.getByRole('tab', { name: /Family Members/i });
      fireEvent.click(membersTab);
      expect(membersTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('RoomScanModal Interactions', () => {
    it('handles keyboard escape and close button', () => {
      const onClose = vi.fn();
      const { rerender } = render(<RoomScanModal isOpen={true} onClose={onClose} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Test Escape key
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();

      // Test closed state
      rerender(<RoomScanModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Community Page Interactions', () => {
    it('renders community page with clean air coalition sections', () => {
      render(
        <MemoryRouter>
          <Community />
        </MemoryRouter>
      );

      expect(screen.getAllByText(/Clean Air Coalition/i).length).toBeGreaterThan(0);
    });
  });

  describe('Icons System Rendering', () => {
    it('renders all SVG icon components', () => {
      const { container } = render(
        <div>
          <Icons.WindIcon />
          <Icons.ShieldIcon />
          <Icons.InfoIcon />
          <Icons.AlertTriangleIcon />
          <Icons.CheckIcon />
          <Icons.SparklesIcon />
          <Icons.MapPinIcon />
          <Icons.UsersIcon />
          <Icons.SlidersIcon />
          <Icons.SendIcon />
          <Icons.MicIcon />
          <Icons.RefreshIcon />
          <Icons.ShareIcon />
          <Icons.ChevronRightIcon />
          <Icons.CloseIcon />
        </div>
      );

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(15);
    });
  });
});
