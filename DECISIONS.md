# DECISIONS.md — Architecture & Implementation Decisions

This document records all architectural choices, assumptions, and deviations made during the development of BreatheFresh in accordance with the PRD + TRD.

## 1. Stack & Runtime Design
- **Single AI Provider (Hard Constraint A.3)**: Groq is the exclusive AI provider across all routes. Calls to Groq run server-side only through Vercel serverless endpoints (`/api/plan`, `/api/explain`, `/api/chat`, `/api/vision`). No other AI SDK or endpoint is present or imported.
- **Strict No-Auth Architecture (Hard Constraint A.2)**: In compliance with project rules for automated evaluation, all authentication (`firebase/auth`, OAuth, anonymous sign-in, login screens, session cookies, email walls) is completely excluded and actively prohibited by compile-time rules, ESLint `no-restricted-imports`, and `scripts/check-constraints.js`.
- **Identity via Local UUID**: User session persistence is strictly a random UUID `deviceId` maintained in `localStorage`.
- **Zero-Config Local Run**: A custom Vite development middleware was authored in `vite.config.ts` so that `npm run dev` functions out of the box with zero environment variables, routing `/api/*` to the respective Node functions.

## 2. Impact Engine & Deterministic Physics
- **Pure Client-Side Implementation**: `src/engine/` is completely pure with zero network, zero `Date.now()`, zero `Math.random()`, and zero DOM dependencies.
- **Physical Clamping**: The indoor aerosol model bounds indoor concentration to at least `0.05 × C_out` to reflect real-world mechanical air filtration edge bypass.
- **Berkeley Earth Heuristic**: Translates 22 µg/m³ of 24h PM2.5 into 1 approximate cigarette equivalent per day (Richard & Elizabeth Muller).
- **Number Guard (`numberGuard.ts`)**: To prevent LLM hallucinations from reaching the user, an `allowedNumbers` whitelist is built from the engine's output. Any LLM-generated text containing numbers outside this approved set has the offending statement stripped or replaced with an engine-verified statement.

## 3. Meteorological & Air Quality Data
- **Open-Meteo Integration**: Air quality data (PM2.5, PM10, US AQI) is fetched directly client-side without API keys.
- **Thermal Inversion Detection**: Fetches boundary layer height (`boundary_layer_height`) and 10m wind speed from Open-Meteo's weather endpoint to flag surface inversion risk when nocturnal boundary layer drops below 250m with calm winds (<5 km/h).
- **Graceful Fallback Snapshots**: Built-in verified winter smog snapshots for Ghaziabad, Delhi, and Kraków (`src/data/fallback/`) are loaded if network requests time out or fail, clearly accompanied by a visible "Sample Data" banner.
- **National Air Quality Index (NAQI)**: Implemented using official Central Pollution Control Board (CPCB) linear interpolation sub-index breakpoints across PM2.5 and PM10.
- **CAQM GRAP Stage Estimation**: Automatically maps 24h NAQI to Stages I through IV for Delhi NCR cities with a direct link to official CAQM notifications.

## 4. Dependencies
In accordance with TRD Section 2, only approved libraries are included:
- `react`, `react-dom` (v18)
- `react-router-dom` (routing)
- `recharts` (charts)
- `zustand` (state management)
- `zod` (runtime schema validation)
- `html-to-image` (share card PNG export)
- `clsx` (conditional styling)
- `firebase` (Firestore database only, zero auth)
- `tailwindcss`, `autoprefixer`, `postcss` (styling)
- `vitest` (engine testing)
- `typescript` (strict typing)
Zero external icon packages were installed; all UI icons are custom accessible SVG components in `src/components/icons.tsx`.
