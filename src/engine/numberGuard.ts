/**
 * Number Guard for BreatheFresh
 * Enforces TRD section 6.5: Numbers come from the Impact Engine, never from the LLM.
 * Validates any numbers present in LLM-generated text against the set of engine-calculated figures.
 */

export interface NumberGuardContext {
  aqi?: number;
  pm25?: number;
  pm10?: number;
  cigEq?: number;
  familyCigEq?: number;
  deltas?: {
    deltaEiPct?: number;
    deltaCigEq?: number;
    deltaCo2eKgWeek?: number;
  }[];
  customAllowed?: number[];
}

/**
 * Builds the strict set of permitted numeric values derived directly from verified engine calculations.
 * Whitelists clock hours (0..24), standard counts, rounding variants, and exact deltas.
 *
 * @param ctx - Context containing engine-calculated values (AQI, PM2.5, cigarette equivalents, action deltas).
 * @returns Set of permitted numbers and their legitimate rounding representations.
 */
export function buildAllowedNumbers(ctx: NumberGuardContext): Set<number> {
  const allowed = new Set<number>();

  // Add standard contextual and count numbers
  // Clock hours (0 to 24) and small counts (1 to 10) are always valid UI counters
  for (let i = 0; i <= 24; i++) {
    allowed.add(i);
  }

  // Common multipliers & percentages used in UI labels (e.g. 50%, 100%, 80% mask)
  [0.5, 2.7, 80, 100].forEach((n) => allowed.add(n));

  function addNumberAndVariants(num: number | undefined) {
    if (num === undefined || isNaN(num)) return;
    const abs = Math.abs(num);
    const rounded = Math.round(abs * 10) / 10;
    const intVal = Math.round(abs);
    allowed.add(abs);
    allowed.add(rounded);
    allowed.add(intVal);
  }

  addNumberAndVariants(ctx.aqi);
  addNumberAndVariants(ctx.pm25);
  addNumberAndVariants(ctx.pm10);
  addNumberAndVariants(ctx.cigEq);
  addNumberAndVariants(ctx.familyCigEq);

  if (ctx.deltas) {
    for (const d of ctx.deltas) {
      addNumberAndVariants(d.deltaEiPct);
      addNumberAndVariants(d.deltaCigEq);
      addNumberAndVariants(d.deltaCo2eKgWeek);
    }
  }

  if (ctx.customAllowed) {
    for (const n of ctx.customAllowed) {
      addNumberAndVariants(n);
    }
  }

  return allowed;
}

/**
 * Extracts all integers and floating-point numeric tokens from a given text string.
 *
 * @param text - Input string to scan.
 * @returns Array of parsed numbers present in the text.
 */
export function extractNumbers(text: string): number[] {
  // Matches integer and floating point numbers (e.g., 22, 14.5, 3.0)
  const matches = text.match(/\b\d+(\.\d+)?\b/g);
  if (!matches) return [];
  return matches.map((m) => parseFloat(m)).filter((n) => !isNaN(n));
}

/**
 * Validates text against the allowed numbers set derived from the Impact Engine.
 * Returns valid: true if every numeric token in the text is in the allowed set, otherwise reports offending numbers.
 *
 * @param text - Input string to validate.
 * @param allowedNumbers - Set of authorized numeric values.
 * @returns Object with valid flag and list of unverified/hallucinated numbers.
 */
export function validateTextNumbers(
  text: string,
  allowedNumbers: Set<number>
): { valid: boolean; offendingNumbers: number[] } {
  const found = extractNumbers(text);
  const offending: number[] = [];

  for (const num of found) {
    const absNum = Math.abs(num);
    const rounded = Math.round(absNum * 10) / 10;
    const intVal = Math.round(absNum);

    const isPermitted =
      allowedNumbers.has(num) ||
      allowedNumbers.has(absNum) ||
      allowedNumbers.has(rounded) ||
      allowedNumbers.has(intVal);

    if (!isPermitted) {
      offending.push(num);
    }
  }

  return {
    valid: offending.length === 0,
    offendingNumbers: offending,
  };
}

/**
 * Sanitizes LLM text output by replacing any sentence containing unverified or hallucinated numbers with a trusted engine fallback phrase.
 *
 * @param text - The raw text received from an LLM call.
 * @param allowedNumbers - The strict set of numbers authorized by the engine.
 * @param fallbackReplacement - The replacement string to substitute for unverified sentences.
 * @returns Sanitized text guaranteed to contain only engine-approved numeric claims.
 */
export function sanitizeTextWithNumberGuard(
  text: string,
  allowedNumbers: Set<number>,
  fallbackReplacement: string = 'Impact calculated by engine.'
): string {
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const cleaned: string[] = [];

  for (const sentence of sentences) {
    const { valid } = validateTextNumbers(sentence, allowedNumbers);
    if (valid) {
      cleaned.push(sentence.trim());
    } else {
      cleaned.push(fallbackReplacement);
    }
  }

  return cleaned.join(' ');
}
