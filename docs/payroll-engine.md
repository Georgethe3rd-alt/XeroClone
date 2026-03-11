# PayCraft Payroll Engine

## Overview

The payroll engine (`lib/payroll/engine.ts`) is a set of pure, deterministic functions that compute gross earnings, tax withholding, super, and net pay for a single employee in a single pay period. It has no side effects and no database dependency — the caller is responsible for supplying all required inputs and persisting the result.

## Key Exports

| Export | Signature | Purpose |
|--------|-----------|---------|
| `calculatePayRun` | `(input: EngineInput) => EngineResult` | Main calculation entry point |
| `calculateLeaveAccrual` | `(annualHours, frequency) => number` | Leave hours to accrue per period |
| `prorateSalary` | `(annualSalary, daysWorked, totalWorkingDays) => number` | Partial-period salary proration |
| `validatePayRunInput` | `(input: EngineInput) => string[]` | Input validation (returns error strings) |

## Input: EngineInput

```typescript
interface EngineInput {
  employeeId: string;
  employmentType: "SALARY" | "HOURLY";
  frequency: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY";

  // Salary employees
  annualSalary?: number;
  hoursPerWeek?: number;

  // Hourly employees
  hourlyRate?: number;
  regularHours?: number;
  overtimeHours?: number;

  payItems: PayItem[];       // allowances, bonuses, deductions, reimbursements
  leaveItems: LeaveItem[];   // paid/unpaid leave taken this period

  taxSettings: TaxSettings;  // residency, HELP, Medicare exemption, tax-free threshold

  ytdGross?: number;         // YTD totals BEFORE this pay run
  ytdTax?: number;
  ytdSuper?: number;

  periodDays?: number;
  workingDaysInPeriod?: number;
  totalWorkingDays?: number;
}
```

## Output: EngineResult

```typescript
interface EngineResult {
  employeeId: string;

  // Earnings
  regularPay: number;
  overtimePay: number;
  leavePay: number;
  allowances: number;
  bonuses: number;
  reimbursements: number;
  grossEarnings: number;   // regularPay + overtimePay + leavePay + allowances + bonuses
  taxableGross: number;    // same as grossEarnings (reimbursements excluded)

  // Deductions
  totalDeductions: number; // non-tax deductions + totalTaxWithheld
  taxWithheld: number;     // PAYG + Medicare + HELP
  medicareLevy: number;
  helpRepayment: number;

  // Employer
  superContribution: number;
  totalEmployerContributions: number;

  // Net
  netPay: number;          // grossEarnings + reimbursements - taxWithheld - totalDeductions

  // YTD (updated after this run)
  ytdGross: number;
  ytdTax: number;
  ytdSuper: number;

  lineItems: EngineLineItem[];  // full breakdown for payslip display
  warnings: string[];           // non-fatal issues (e.g. "Net pay is negative")
}
```

## Calculation Algorithm

### Step 1 — Base Earnings
- **SALARY**: `regularPay = annualSalary / periodsPerYear` (26 for FORTNIGHTLY, 52 WEEKLY, 12 MONTHLY)
- **HOURLY**: `regularPay = hourlyRate * regularHours`; `overtimePay = hourlyRate * 1.5 * overtimeHours`

### Step 2 — Leave Pay
For each `LeaveItem` where `isPaid = true`: `leaveAmount = hours * hourlyRate`. Accumulated into `leavePay`.

### Step 3 — Extra Pay Items
Pay items are classified by description keywords:
- Contains "allowance" → `allowances`
- Contains "bonus" or "commission" → `bonuses`
- Type `DEDUCTION` → `totalDeductions`
- Type `REIMBURSEMENT` → `reimbursements` (excluded from taxableGross)
- Type `EMPLOYER_CONTRIBUTION` → `totalEmployerContributions`

### Step 4 — Gross Earnings
```
grossEarnings = regularPay + overtimePay + leavePay + allowances + bonuses
taxableGross  = grossEarnings  (reimbursements deliberately excluded)
```

### Step 5 — Tax Calculation
The taxable gross is annualised: `annualizedGross = taxableGross * periodsPerYear`. This is passed to `calculateAUTax()` which returns weekly tax amounts. These are then scaled back:
```
taxWithheld   = weeklyTax * (52 / periodsPerYear)
medicareLevy  = weeklyMedicare * (52 / periodsPerYear)
helpRepayment = annualHelp / periodsPerYear
totalTaxWithheld = taxWithheld + medicareLevy + helpRepayment
```

### Step 6 — Super Guarantee
Super is calculated on superable earnings (line items where `superImpactable = true`):
```
superContribution = superableEarnings * 0.115  (11.5% for 2024-25)
```

### Step 7 — Net Pay
```
netPay = grossEarnings + reimbursements - totalTaxWithheld - totalDeductions
```
If `netPay < 0`, a warning is added.

### Step 8 — YTD
```
ytdGross = (input.ytdGross ?? 0) + grossEarnings
ytdTax   = (input.ytdTax ?? 0) + totalTaxWithheld
ytdSuper = (input.ytdSuper ?? 0) + superContribution
```

## Warnings
The engine never throws — it returns `warnings[]` for non-fatal issues:
- `"Annual salary is zero"` — salary employee with zero/missing annualSalary
- `"Hourly rate is zero"` — hourly employee with zero/missing hourlyRate
- `"Net pay is negative - check deductions"` — deductions exceed gross

## Validation
`validatePayRunInput()` returns errors (not warnings). Errors indicate inputs that would produce meaningless results:
- Salary employee: annualSalary must be > 0
- Hourly employee: hourlyRate must be > 0; regularHours and overtimeHours must be >= 0

## AU Tax Tables

Tax calculation is delegated to `lib/payroll/tax-tables-au.ts`.

### Scales
- **Scale 1** (resident, tax-free threshold claimed): Brackets starting at $359/week
- **Scale 2** (resident, no tax-free threshold): Tax from the first dollar
- **Non-resident**: Flat 32.5%

### Medicare Levy
2% applied to weekly earnings above $438/week (~$22,776/year). Zero for exempt employees or non-residents.

### HELP/HECS Repayment
Annual repayment calculated against annualised gross using FY2025 thresholds (starting at $54,435). Threshold rates range from 1% to 10%.

### Super Guarantee
11.5% for 2024-25. Applied to all superable earnings as defined by `superImpactable` flag on pay items.

## Jurisdiction Notes

**IMPORTANT**: The AU tax brackets in `tax-tables-au.ts` are simplified placeholders for development and demonstration. Before using in production:
1. Obtain official ATO Schedule 1 coefficients for the relevant income year
2. Implement the precise ATO formula: `weekly_withholding = (a × weekly_earnings) - b` using official `a` and `b` values
3. Verify Medicare levy low-income thresholds and shading-in rates
4. Use official HELP repayment thresholds (updated annually by ATO)
5. Confirm super guarantee rate for the applicable year (scheduled to rise to 12% by 2025-26)
6. Consider ATO's Tax Withheld Calculator API for production-grade accuracy

## Leave Accrual

```typescript
calculateLeaveAccrual(annualLeaveHoursPerYear, frequency)
// Example: 152 hours/year (4 weeks × 38h), FORTNIGHTLY → 5.85 hours per fortnight
```

## Salary Proration

```typescript
prorateSalary(annualSalary, daysWorked, totalWorkingDays)
// Example: $80,000 annual, 130 days worked out of 260 → $40,000
// Returns 0 if totalWorkingDays <= 0
```
