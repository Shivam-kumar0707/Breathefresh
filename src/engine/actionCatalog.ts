import type { Action } from './actionTypes';
import { cloneScenario } from './actions/cloneScenario';
import { ROUTINE_ACTIONS } from './actions/routineActions';
import { INDOOR_ACTIONS } from './actions/indoorActions';
import { ALTERNATIVE_ACTIONS } from './actions/alternativeActions';

export { cloneScenario };

/**
 * Master catalog combining all 20 deterministic air actions across categories.
 */
export const ACTION_CATALOG: Action[] = [
  ...ROUTINE_ACTIONS,
  ...INDOOR_ACTIONS,
  ...ALTERNATIVE_ACTIONS,
];
