import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ChatDrawer } from './components/ChatDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';

const Onboard = lazy(() => import('./pages/Onboard').then((m) => ({ default: m.Onboard })));
const Today = lazy(() => import('./pages/Today').then((m) => ({ default: m.Today })));
const WhatIf = lazy(() => import('./pages/WhatIf').then((m) => ({ default: m.WhatIf })));
const Community = lazy(() => import('./pages/Community').then((m) => ({ default: m.Community })));
const Method = lazy(() => import('./pages/Method').then((m) => ({ default: m.Method })));

const TitleUpdater: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    switch (location.pathname) {
      case '/':
        document.title = 'BreatheFresh — Know your air. Plan your day.';
        break;
      case '/plan':
        document.title = "Today's Family Air Plan — BreatheFresh";
        break;
      case '/impact':
        document.title = 'What-If Simulator & Action Impact — BreatheFresh';
        break;
      case '/community':
        document.title = 'Community Clean Air Coalition — BreatheFresh';
        break;
      case '/method':
        document.title = 'How We Calculate: Impact Engine Methodology — BreatheFresh';
        break;
      default:
        document.title = 'BreatheFresh — Know your air. Plan your day.';
    }
  }, [location.pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TitleUpdater />
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-teal-200">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-teal-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            Skip to main content
          </a>
          <Header />

          <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 w-full">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                  <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
                    <span className="animate-spin text-lg">🌀</span>
                    <span>Loading BreatheFresh...</span>
                  </div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Onboard />} />
                <Route path="/plan" element={<Today />} />
                <Route path="/impact" element={<WhatIf />} />
                <Route path="/community" element={<Community />} />
                <Route path="/method" element={<Method />} />
                <Route path="*" element={<Onboard />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
          <ChatDrawer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
