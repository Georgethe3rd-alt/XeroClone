/**
 * PayCraft Payroll Calculation Engine
 *
 * This module contains the core payroll calculation logic.
 * All monetary values are in AUD cents or decimal dollars.
 * All calculations use round2() to avoid floating-point drift.
 */

import { round2 } from "@/lib/utils";
import { calculateAUTax, calculateSuper, SUPER_GUARANTEE_RATE } from "./tax-tables-au";

export type PayFrequency = "WEEKLY" | "FORTNIGHTLY" | "MONTHLY";
export type EmploymentType = "SALARY" | "HOURLY";

export interface TaxSettings {
  hasTaxFreeThreshold: boolean;
  hasHelpDebt: boolean;
  hasMedicareExemption: boolean;
  isResident: boolean;
}

export interface PayItem {
  id: string;
  description: string;
  type: "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION" | "REIMBURSEMENT";
  amount: number;
  quantity?: number;
  rate?: number;
  isTaxable: boolean;
  superImpactable: boolean;
}

export interface LeaveItem {
  leaveTypeName: string;
  isPaid: boolean;
  hours: number;
  hourlyRate: number;
}

export interface EngineInput {
  employeeId: string;
  employmentType: EmploymentType;
  frequency: PayFrequency;

  // Salary employees
  annualSalary?: number;
  hoursPerWeek?: number;

  // Hourly employees
  hourlyRate?: number;
  regularHours?: number;
  overtimeHours?: number;

  // Pay items (allowances, bonuses, deductions, etc.)
  payItems: PayItem[];

  // Leave taken this period
  leaveItems: LeaveItem[];

  // Tax settings
  taxSettings: TaxSettings;

  // YTD totals (before this pay run)
  ytdGross?: number;
  ytdTax?: number;
  ytdSuper?: number;

  // Period info
  periodDays?: number; // for proration
  workingDaysInPeriod?: number;
  totalWorkingDays?: number; // in year, for proration
}

export interface EngineLineItem {
  description: string;
  type: "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION" | "REIMBURSEMENT";
  quantity: number;
  rate: number;
  amount: number;
  isTaxable: boolean;
  superImpactable: boolean;
}

export interface EngineResult {
  employeeId: string;

  // Earnings breakdown
  regularPay: number;
  overtimePay: number;
  leavePay: number;
  allowances: number;
  bonuses: number;
  reimbursements: number;
  grossEarnings: number;
  taxableGross: number;

  // Deductions
  totalDeductions: number;
  taxWithheld: number;
  medicareLevy: number;
  helpRepayment: number;

  // Employer contributions
  superContribution: number;
  totalEmployerContributions: number;

  // Net
  netPay: number;

  // YTD
  ytdGross: number;
  ytdTax: number;
  ytdSuper: number;

  // Line items for display
  lineItems: EngineLineItem[];

  // Warnings
  warnings: string[];
}

const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  WEEKLY: 52,
  FORTNIGHTLY: 26,
  MONTHLY: 12,
};

export function calculatePayRun(input: EngineInput): EngineResult {
  const warnings: string[] = [];
  const lineItems: EngineLineItem[] = [];
  const periodsPerYear = PERIODS_PER_YEAR[input.frequency];

  // --- Base earnings ---
  let regularPay = 0;
  let overtimePay = 0;

  if (input.employmentType === "SALARY") {
    const annualSalary = input.annualSalary ?? 0;
    if (annualSalary <= 0) warnings.push("Annual salary is zero");
    regularPay = round2(annualSalary / periodsPerYear);

    lineItems.push({
      description: `Salary (${input.frequency.toLowerCase()})`,
      type: "EARNING",
      quantity: 1,
      rate: regularPay,
      amount: regularPay,
      isTaxable: true,
      superImpactable: true,
    });
  } else {
    // Hourly
    const rate = input.hourlyRate ?? 0;
    const regular = input.regularHours ?? 0;
    const overtime = input.overtimeHours ?? 0;

    if (rate <= 0) warnings.push("Hourly rate is zero");

    regularPay = round2(rate * regular);
    overtimePay = round2(rate * 1.5 * overtime); // standard 1.5x OT

    if (regular > 0) {
      lineItems.push({
        description: `Regular hours (${regular}h @ $${rate.toFixed(2)}/h)`,
        type: "EARNING",
        quantity: regular,
        rate,
        amount: regularPay,
        isTaxable: true,
        superImpactable: true,
      });
    }

    if (overtime > 0) {
      lineItems.push({
        description: `Overtime (${overtime}h @ $${(rate * 1.5).toFixed(2)}/h)`,
        type: "EARNING",
        quantity: overtime,
        rate: round2(rate * 1.5),
        amount: overtimePay,
        isTaxable: true,
        superImpactable: true,
      });
    }
  }

  // --- Leave pay ---
  let leavePay = 0;
  for (const leave of input.leaveItems) {
    if (!leave.isPaid) continue;
    const leaveAmount = round2(leave.hours * leave.hourlyRate);
    leavePay = round2(leavePay + leaveAmount);
    lineItems.push({
      description: `${leave.leaveTypeName} (${leave.hours}h)`,
      type: "EARNING",
      quantity: leave.hours,
      rate: leave.hourlyRate,
      amount: leaveAmount,
      isTaxable: true,
      superImpactable: true,
    });
  }

  // --- Extra pay items ---
  let allowances = 0;
  let bonuses = 0;
  let reimbursements = 0;
  let totalDeductions = 0;
  let totalEmployerContributions = 0;

  for (const item of input.payItems) {
    const amount = item.quantity
      ? round2(item.quantity * (item.rate ?? item.amount))
      : item.amount;

    lineItems.push({
      description: item.description,
      type: item.type,
      quantity: item.quantity ?? 1,
      rate: item.rate ?? amount,
      amount,
      isTaxable: item.isTaxable,
      superImpactable: item.superImpactable,
    });

    switch (item.type) {
      case "EARNING":
        if (item.description.toLowerCase().includes("allowance")) {
          allowances = round2(allowances + amount);
        } else if (item.description.toLowerCase().includes("bonus") || item.description.toLowerCase().includes("commission")) {
          bonuses = round2(bonuses + amount);
        } else {
          regularPay = round2(regularPay + amount);
        }
        break;
      case "DEDUCTION":
        totalDeductions = round2(totalDeductions + amount);
        break;
      case "EMPLOYER_CONTRIBUTION":
        totalEmployerContributions = round2(totalEmployerContributions + amount);
        break;
      case "REIMBURSEMENT":
        reimbursements = round2(reimbursements + amount);
        break;
    }
  }

  // --- Gross earnings ---
  const grossEarnings = round2(regularPay + overtimePay + leavePay + allowances + bonuses);
  const taxableGross = round2(grossEarnings); // reimbursements excluded from taxable

  // --- Tax calculation ---
  // Convert this period's taxable gross to annual equivalent
  const annualizedGross = round2(taxableGross * periodsPerYear);

  const taxResult = calculateAUTax({
    annualGross: annualizedGross,
    hasTaxFreeThreshold: input.taxSettings.hasTaxFreeThreshold,
    hasHelpDebt: input.taxSettings.hasHelpDebt,
    hasMedicareExemption: input.taxSettings.hasMedicareExemption,
    isResident: input.taxSettings.isResident,
  });

  const taxWithheld = round2(taxResult.weeklyTax * (52 / periodsPerYear));
  const medicareLevy = round2(taxResult.weeklyMedicare * (52 / periodsPerYear));
  const helpRepayment = round2(taxResult.annualHelp / periodsPerYear);
  const totalTaxWithheld = round2(taxWithheld + medicareLevy + helpRepayment);

  lineItems.push({
    description: "PAYG Withholding",
    type: "DEDUCTION",
    quantity: 1,
    rate: totalTaxWithheld,
    amount: totalTaxWithheld,
    isTaxable: false,
    superImpactable: false,
  });

  // --- Super ---
  const superableEarnings = lineItems
    .filter((l) => l.type === "EARNING" && l.superImpactable)
    .reduce((sum, l) => sum + l.amount, 0);
  const superContribution = round2(calculateSuper(superableEarnings));

  lineItems.push({
    description: `Super Guarantee (${(SUPER_GUARANTEE_RATE * 100).toFixed(1)}%)`,
    type: "EMPLOYER_CONTRIBUTION",
    quantity: 1,
    rate: SUPER_GUARANTEE_RATE,
    amount: superContribution,
    isTaxable: false,
    superImpactable: false,
  });

  // --- Net pay ---
  const netPay = round2(
    grossEarnings + reimbursements - totalTaxWithheld - totalDeductions
  );

  if (netPay < 0) {
    warnings.push("Net pay is negative - check deductions");
  }

  // --- YTD ---
  const ytdGross = round2((input.ytdGross ?? 0) + grossEarnings);
  const ytdTax = round2((input.ytdTax ?? 0) + totalTaxWithheld);
  const ytdSuper = round2((input.ytdSuper ?? 0) + superContribution);

  return {
    employeeId: input.employeeId,
    regularPay,
    overtimePay,
    leavePay,
    allowances,
    bonuses,
    reimbursements,
    grossEarnings,
    taxableGross,
    totalDeductions: round2(totalDeductions + totalTaxWithheld),
    taxWithheld: totalTaxWithheld,
    medicareLevy,
    helpRepayment,
    superContribution,
    totalEmployerContributions: round2(totalEmployerContributions + superContribution),
    netPay,
    ytdGross,
    ytdTax,
    ytdSuper,
    lineItems,
    warnings,
  };
}

/**
 * Calculate leave accrual for a pay period
 */
export function calculateLeaveAccrual(
  annualLeaveHoursPerYear: number,
  frequency: PayFrequency
): number {
  const periods = PERIODS_PER_YEAR[frequency];
  return round2(annualLeaveHoursPerYear / periods);
}

/**
 * Prorate salary for partial period
 */
export function prorateSalary(
  annualSalary: number,
  daysWorked: number,
  totalWorkingDays: number
): number {
  if (totalWorkingDays <= 0) return 0;
  return round2((annualSalary / totalWorkingDays) * daysWorked);
}

/**
 * Validate pay run inputs before calculation
 */
export function validatePayRunInput(input: EngineInput): string[] {
  const errors: string[] = [];

  if (input.employmentType === "SALARY") {
    if (!input.annualSalary || input.annualSalary <= 0) {
      errors.push("Annual salary must be positive for salary employees");
    }
  } else {
    if (!input.hourlyRate || input.hourlyRate <= 0) {
      errors.push("Hourly rate must be positive for hourly employees");
    }
    if ((input.regularHours ?? 0) < 0) {
      errors.push("Regular hours cannot be negative");
    }
    if ((input.overtimeHours ?? 0) < 0) {
      errors.push("Overtime hours cannot be negative");
    }
  }

  return errors;
}
