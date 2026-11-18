import type { Scenario } from './exposure';
import { familyExposure } from './exposure';
import { computeEmissions, type CookingFuel, type HeatingFuel } from './emissions';
import { ACTION_CATALOG, cloneScenario } from './actionCatalog';
import type { ActionImpact } from './actionTypes';

export * from './actionTypes';
export * from './actionCatalog';

/**
 * Applies an action by ID to a scenario without mutating the original scenario.
 * Returns the modified scenario copy, or the original scenario if the action is unknown.
 *
 * @param scenario - The input scenario representing building, members, and ambient air.
 * @param actionId - The unique ID of the action to execute.
 * @returns A new immutable scenario instance reflecting the action's interventions.
 */
export function applyAction(scenario: Scenario, actionId: string): Scenario {
  const action = ACTION_CATALOG.find((a) => a.id === actionId);
  if (!action) return scenario;
  return action.transform(scenario);
}

/**
 * Overrides outdoor PM2.5 across all 24 hours with a constant value or scaled series.
 * Used for instant client-side Smog Simulator.
 * Pure function: returns a new scenario without mutating the input.
 *
 * @param scenario - The baseline scenario.
 * @param outdoorPm25 - The constant PM2.5 concentration (in µg/m³) to apply.
 * @returns A fresh scenario clone with the updated 24h outdoor air quality array.
 */
export function smogOverride(scenario: Scenario, outdoorPm25: number): Scenario {
  const next = cloneScenario(scenario);
  next.outdoorPm25 = Array(24).fill(outdoorPm25);
  return next;
}

/**
 * Compares a list of actions in isolation against the baseline scenario.
 * Calculates delta in Exposure Index (EI %), cigarette equivalents, and weekly CO2e.
 * Pure function: baseline scenario is strictly NOT modified.
 *
 * @param baseline - The reference baseline scenario.
 * @param actionIds - Array of action IDs to evaluate individually.
 * @param cookingFuel - Current household cooking fuel tier.
 * @param heatingFuel - Current household heating fuel tier.
 * @returns Array of evaluated ActionImpact objects with quantitative deltas.
 */
export function compareActions(
  baseline: Scenario,
  actionIds: string[],
  cookingFuel: CookingFuel = 'lpg',
  heatingFuel: HeatingFuel = 'none'
): ActionImpact[] {
  const baseExposure = familyExposure(baseline);
  const baseEmissions = computeEmissions(baseline, cookingFuel, heatingFuel);

  const results: ActionImpact[] = [];

  for (const id of actionIds) {
    const action = ACTION_CATALOG.find((a) => a.id === id);
    if (!action) continue;

    // Apply action to an isolated deep copy of the baseline
    const scenarioCopy = cloneScenario(baseline);
    const modifiedScenario = action.transform(scenarioCopy);

    // Compute updated fuels if action was an explicit fuel transition
    let effCooking = cookingFuel;
    let effHeating = heatingFuel;
    if (id === 'cooking_fuel_switch') effCooking = 'induction';
    if (id === 'electric_heating_switch') effHeating = 'electric';

    const modExposure = familyExposure(modifiedScenario);
    const modEmissions = computeEmissions(modifiedScenario, effCooking, effHeating);

    const deltaEiPct =
      baseExposure.averageEi > 0
        ? Math.round(
            ((modExposure.averageEi - baseExposure.averageEi) / baseExposure.averageEi) * 1000
          ) / 10
        : 0;

    const deltaCigEq = Math.round((modExposure.totalCigEq - baseExposure.totalCigEq) * 10) / 10;
    const deltaCo2e =
      Math.round((modEmissions.totalCo2eKgWeek - baseEmissions.totalCo2eKgWeek) * 10) / 10;

    let notes: string | undefined;
    if (deltaEiPct > 0) {
      notes = 'Higher physical ventilation/activity during smog may increase lung dose.';
    }

    results.push({
      id: action.id,
      title: action.title,
      category: action.category,
      costTier: action.cost,
      deltaEiPct,
      deltaCigEq,
      deltaCo2eKgWeek: deltaCo2e,
      notes,
    });
  }

  return results;
}
