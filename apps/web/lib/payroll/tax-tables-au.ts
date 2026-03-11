/**
 * Australian PAYG Withholding Tax Tables (2024-25)
 *
 * IMPORTANT: These are simplified placeholder tax brackets for development/demo
 * purposes. DO NOT use in production without obtaining official ATO tax table
 * coefficients and implementing the full ATO Schedule 1 algorithm.
 *
 * For production: use ATO Tax Withheld Calculator API or official tax tables.
 */

export interface TaxBracket {
  min: number;
  max: number;
  /** Coefficient a (used in ATO formula: weekly withholding = a * weekly_earnings - b) */
  a: number;
  /** Coefficient b */
  b: number;
}

/**
 * Scale 1 - Weekly earnings (residents, with tax-free threshold)
 * Source: ATO Schedule 1, Scale 1 (2024-25) - simplified
 */
const SCALE_1_WEEKLY_WITH_THRESHOLD: TaxBracket[] = [
  { min: 0, max: 359, a: 0, b: 0 },
  { min: 359, max: 438, a: 0.19, b: 68.21 },
  { min: 438, max: 548, a: 0.29, b: 112.01 },
  { min: 548, max: 865, a: 0.21, b: 68.25 },
  { min: 865, max: 1282, a: 0.3477, b: 158.68 },
  { min: 1282, max: 2596, a: 0.345, b: 155.22 },
  { min: 2596, max: 3653, a: 0.39, b: 271.90 },
  { min: 3653, max: 99999, a: 0.47, b: 564.42 },
];

/**
 * Scale 2 - Weekly earnings (residents, no tax-free threshold)
 */
const SCALE_2_WEEKLY_NO_THRESHOLD: TaxBracket[] = [
  { min: 0, max: 88, a: 0.19, b: 0.19 },
  { min: 88, max: 371, a: 0.23, b: 3.72 },
  { min: 371, max: 515, a: 0.33, b: 40.84 },
  { min: 515, max: 865, a: 0.34, b: 45.99 },
  { min: 865, max: 1282, a: 0.3477, b: 44.31 },
  { min: 1282, max: 2596, a: 0.345, b: 40.85 },
  { min: 2596, max: 3653, a: 0.39, b: 157.53 },
  { min: 3653, max: 99999, a: 0.47, b: 450.05 },
];

/** Medicare levy rate */
const MEDICARE_LEVY_RATE = 0.02;

/** Medicare levy low income threshold (weekly, 2024-25) */
const MEDICARE_LEVY_WEEKLY_THRESHOLD = 438; // approx $22,801 / 52

/** Super guarantee rate (2024-25) */
export const SUPER_GUARANTEE_RATE = 0.115; // 11.5%

/** FY2025 HELP repayment thresholds (annual) */
const HELP_THRESHOLDS = [
  { min: 54435, rate: 0.01 },
  { min: 62739, rate: 0.02 },
  { min: 66153, rate: 0.025 },
  { min: 70005, rate: 0.03 },
  { min: 74001, rate: 0.035 },
  { min: 78137, rate: 0.04 },
  { min: 82457, rate: 0.045 },
  { min: 861319, rate: 0.05 },
  { min: 91435, rate: 0.055 },
  { min: 96418, rate: 0.06 },
  { min: 101900, rate: 0.065 },
  { min: 107567, rate: 0.07 },
  { min: 113428, rate: 0.075 },
  { min: 119502, rate: 0.08 },
  { min: 125813, rate: 0.085 },
  { min: 132388, rate: 0.09 },
  { min: 139247, rate: 0.095 },
  { min: 146407, rate: 0.1 },
];

export interface TaxInput {
  annualGross: number;
  hasTaxFreeThreshold: boolean;
  hasHelpDebt: boolean;
  hasMedicareExemption: boolean;
  isResident: boolean;
}

export interface TaxResult {
  annualTax: number;
  annualMedicare: number;
  annualHelp: number;
  weeklyTax: number;
  weeklyMedicare: number;
  weeklyHelp: number;
  effectiveRate: number;
}

function applyBrackets(weeklyEarnings: number, brackets: TaxBracket[]): number {
  for (const bracket of brackets) {
    if (weeklyEarnings <= bracket.max) {
      const tax = bracket.a * weeklyEarnings - bracket.b;
      return Math.max(0, tax);
    }
  }
  return 0;
}

export function calculateAUTax(input: TaxInput): TaxResult {
  const { annualGross, hasTaxFreeThreshold, hasHelpDebt, hasMedicareExemption, isResident } = input;

  if (!isResident) {
    // Flat 32.5% for non-residents (simplified)
    const annualTax = annualGross * 0.325;
    const weeklyTax = annualTax / 52;
    return {
      annualTax,
      annualMedicare: 0,
      annualHelp: 0,
      weeklyTax,
      weeklyMedicare: 0,
      weeklyHelp: 0,
      effectiveRate: 0.325,
    };
  }

  const weeklyEarnings = annualGross / 52;

  // Select tax table scale
  const brackets = hasTaxFreeThreshold
    ? SCALE_1_WEEKLY_WITH_THRESHOLD
    : SCALE_2_WEEKLY_NO_THRESHOLD;

  const weeklyTax = applyBrackets(weeklyEarnings, brackets);

  // Medicare levy
  let weeklyMedicare = 0;
  if (!hasMedicareExemption) {
    if (weeklyEarnings > MEDICARE_LEVY_WEEKLY_THRESHOLD) {
      weeklyMedicare = weeklyEarnings * MEDICARE_LEVY_RATE;
    }
  }

  // HELP/HECS repayment (annual calculation)
  let annualHelp = 0;
  if (hasHelpDebt) {
    const threshold = HELP_THRESHOLDS.findLast((t) => annualGross >= t.min);
    if (threshold) {
      annualHelp = annualGross * threshold.rate;
    }
  }
  const weeklyHelp = annualHelp / 52;

  const annualTax = weeklyTax * 52;
  const annualMedicare = weeklyMedicare * 52;

  const totalAnnualTax = annualTax + annualMedicare + annualHelp;
  const effectiveRate = annualGross > 0 ? totalAnnualTax / annualGross : 0;

  return {
    annualTax,
    annualMedicare,
    annualHelp,
    weeklyTax,
    weeklyMedicare,
    weeklyHelp,
    effectiveRate,
  };
}

/**
 * Calculate super guarantee contribution
 */
export function calculateSuper(grossEarnings: number): number {
  return Math.round(grossEarnings * SUPER_GUARANTEE_RATE * 100) / 100;
}
