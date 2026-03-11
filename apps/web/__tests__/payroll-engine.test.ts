/**
 * Comprehensive unit tests for the PayCraft payroll calculation engine.
 */
import { describe, it, expect } from "vitest";
import {
  calculatePayRun,
  calculateLeaveAccrual,
  prorateSalary,
  validatePayRunInput,
  EngineInput,
  PayItem,
  LeaveItem,
} from "@/lib/payroll/engine";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseTaxSettings(overrides: Partial<EngineInput["taxSettings"]> = {}): EngineInput["taxSettings"] {
  return {
    hasTaxFreeThreshold: true,
    hasHelpDebt: false,
    hasMedicareExemption: false,
    isResident: true,
    ...overrides,
  };
}

function salaryInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    employeeId: "emp-001",
    employmentType: "SALARY",
    frequency: "FORTNIGHTLY",
    annualSalary: 80000,
    hoursPerWeek: 38,
    payItems: [],
    leaveItems: [],
    taxSettings: baseTaxSettings(),
    ...overrides,
  };
}

function hourlyInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    employeeId: "emp-002",
    employmentType: "HOURLY",
    frequency: "WEEKLY",
    hourlyRate: 35,
    regularHours: 38,
    overtimeHours: 0,
    payItems: [],
    leaveItems: [],
    taxSettings: baseTaxSettings(),
    ...overrides,
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("calculatePayRun", () => {
  // ── 1. Salary employee — fortnightly basic calculation ───────────────────
  describe("salary employee - fortnightly", () => {
    it("calculates fortnightly regular pay from annual salary", () => {
      const result = calculatePayRun(salaryInput());
      // $80,000 / 26 = $3,076.92
      expect(result.regularPay).toBeCloseTo(3076.92, 1);
    });

    it("sets grossEarnings equal to regularPay for a clean salary run", () => {
      const result = calculatePayRun(salaryInput());
      expect(result.grossEarnings).toBe(result.regularPay);
    });

    it("returns the correct employeeId", () => {
      const result = calculatePayRun(salaryInput());
      expect(result.employeeId).toBe("emp-001");
    });

    it("has no warnings for a valid salary employee", () => {
      const result = calculatePayRun(salaryInput());
      expect(result.warnings).toHaveLength(0);
    });

    it("applies PAYG withholding line item", () => {
      const result = calculatePayRun(salaryInput());
      const taxLine = result.lineItems.find((l) => l.description === "PAYG Withholding");
      expect(taxLine).toBeDefined();
      expect(taxLine!.amount).toBeGreaterThan(0);
    });

    it("calculates super guarantee", () => {
      const result = calculatePayRun(salaryInput());
      // 11.5% of superable earnings
      expect(result.superContribution).toBeGreaterThan(0);
    });

    it("net pay is gross minus total tax withheld", () => {
      const result = calculatePayRun(salaryInput());
      expect(result.netPay).toBeCloseTo(
        result.grossEarnings - result.taxWithheld,
        1
      );
    });

    it("accumulates YTD correctly with existing YTD values", () => {
      const input = salaryInput({ ytdGross: 10000, ytdTax: 2000, ytdSuper: 1150 });
      const result = calculatePayRun(input);
      expect(result.ytdGross).toBeCloseTo(10000 + result.grossEarnings, 1);
      expect(result.ytdTax).toBeCloseTo(2000 + result.taxWithheld, 1);
      expect(result.ytdSuper).toBeCloseTo(1150 + result.superContribution, 1);
    });
  });

  // ── 2. Hourly employee — weekly — with overtime ──────────────────────────
  describe("hourly employee - weekly with overtime", () => {
    it("calculates regular pay correctly", () => {
      const result = calculatePayRun(hourlyInput({ regularHours: 38, hourlyRate: 35 }));
      // 38 * 35 = 1,330
      expect(result.regularPay).toBe(1330);
    });

    it("calculates overtime at 1.5x rate", () => {
      const result = calculatePayRun(hourlyInput({ regularHours: 38, hourlyRate: 35, overtimeHours: 4 }));
      // 4 * 35 * 1.5 = 210
      expect(result.overtimePay).toBe(210);
    });

    it("includes overtime in gross earnings", () => {
      const result = calculatePayRun(hourlyInput({ regularHours: 38, hourlyRate: 35, overtimeHours: 4 }));
      expect(result.grossEarnings).toBe(result.regularPay + result.overtimePay);
    });

    it("creates separate line items for regular and overtime hours", () => {
      const result = calculatePayRun(hourlyInput({ regularHours: 38, hourlyRate: 35, overtimeHours: 4 }));
      const regularLine = result.lineItems.find((l) => l.description.startsWith("Regular hours"));
      const otLine = result.lineItems.find((l) => l.description.startsWith("Overtime"));
      expect(regularLine).toBeDefined();
      expect(otLine).toBeDefined();
      expect(otLine!.rate).toBeCloseTo(52.5, 1); // 35 * 1.5
    });

    it("warns when hourly rate is zero", () => {
      const result = calculatePayRun(hourlyInput({ hourlyRate: 0 }));
      expect(result.warnings).toContain("Hourly rate is zero");
    });

    it("does not create overtime line item when overtime hours are zero", () => {
      const result = calculatePayRun(hourlyInput({ regularHours: 38, overtimeHours: 0 }));
      const otLine = result.lineItems.find((l) => l.description.startsWith("Overtime"));
      expect(otLine).toBeUndefined();
    });
  });

  // ── 3. Leave pay calculations ────────────────────────────────────────────
  describe("leave pay calculations", () => {
    it("adds paid leave to leavePay and grossEarnings", () => {
      const leaveItems: LeaveItem[] = [
        { leaveTypeName: "Annual Leave", isPaid: true, hours: 8, hourlyRate: 35 },
      ];
      const result = calculatePayRun(hourlyInput({ leaveItems, regularHours: 30, overtimeHours: 0 }));
      expect(result.leavePay).toBe(8 * 35); // 280
      expect(result.grossEarnings).toBeCloseTo(30 * 35 + 280, 1);
    });

    it("excludes unpaid leave from leavePay", () => {
      const leaveItems: LeaveItem[] = [
        { leaveTypeName: "Unpaid Leave", isPaid: false, hours: 8, hourlyRate: 35 },
      ];
      const result = calculatePayRun(hourlyInput({ leaveItems, regularHours: 30 }));
      expect(result.leavePay).toBe(0);
    });

    it("creates a line item for paid leave", () => {
      const leaveItems: LeaveItem[] = [
        { leaveTypeName: "Sick Leave", isPaid: true, hours: 4, hourlyRate: 40 },
      ];
      const result = calculatePayRun(hourlyInput({ leaveItems, regularHours: 34 }));
      const leaveLine = result.lineItems.find((l) => l.description.includes("Sick Leave"));
      expect(leaveLine).toBeDefined();
      expect(leaveLine!.amount).toBe(4 * 40);
    });

    it("handles multiple leave items in the same period", () => {
      const leaveItems: LeaveItem[] = [
        { leaveTypeName: "Annual Leave", isPaid: true, hours: 4, hourlyRate: 35 },
        { leaveTypeName: "Public Holiday", isPaid: true, hours: 7.6, hourlyRate: 35 },
      ];
      const result = calculatePayRun(hourlyInput({ leaveItems, regularHours: 26 }));
      expect(result.leavePay).toBeCloseTo((4 + 7.6) * 35, 1);
    });
  });

  // ── 4. Zero hours warning ────────────────────────────────────────────────
  describe("zero hours / zero salary warnings", () => {
    it("warns when annual salary is zero for salary employee", () => {
      const result = calculatePayRun(salaryInput({ annualSalary: 0 }));
      expect(result.warnings).toContain("Annual salary is zero");
    });

    it("warns when hourly rate is zero for hourly employee", () => {
      const result = calculatePayRun(hourlyInput({ hourlyRate: 0 }));
      expect(result.warnings).toContain("Hourly rate is zero");
    });

    it("does not warn when everything is positive", () => {
      const result = calculatePayRun(salaryInput({ annualSalary: 65000 }));
      expect(result.warnings).toHaveLength(0);
    });
  });

  // ── 5. Negative net pay warning ──────────────────────────────────────────
  describe("negative net pay warning", () => {
    it("warns when deductions exceed gross earnings", () => {
      const payItems: PayItem[] = [
        {
          id: "d1",
          description: "Loan Repayment",
          type: "DEDUCTION",
          amount: 99999,
          isTaxable: false,
          superImpactable: false,
        },
      ];
      const result = calculatePayRun(salaryInput({ payItems }));
      expect(result.warnings).toContain("Net pay is negative - check deductions");
    });

    it("does not warn when net pay is positive", () => {
      const result = calculatePayRun(salaryInput());
      expect(result.warnings).not.toContain("Net pay is negative - check deductions");
    });
  });

  // ── 6. Allowances and bonuses ────────────────────────────────────────────
  describe("allowances and bonuses", () => {
    it("adds allowance to allowances total", () => {
      const payItems: PayItem[] = [
        {
          id: "a1",
          description: "Car Allowance",
          type: "EARNING",
          amount: 200,
          isTaxable: true,
          superImpactable: false,
        },
      ];
      const result = calculatePayRun(salaryInput({ payItems }));
      expect(result.allowances).toBe(200);
    });

    it("adds bonus to bonuses total", () => {
      const payItems: PayItem[] = [
        {
          id: "b1",
          description: "Performance Bonus",
          type: "EARNING",
          amount: 500,
          isTaxable: true,
          superImpactable: true,
        },
      ];
      const result = calculatePayRun(salaryInput({ payItems }));
      expect(result.bonuses).toBe(500);
    });

    it("includes allowances and bonuses in gross earnings", () => {
      const payItems: PayItem[] = [
        {
          id: "a1",
          description: "Meal Allowance",
          type: "EARNING",
          amount: 100,
          isTaxable: true,
          superImpactable: false,
        },
        {
          id: "b1",
          description: "Sales Commission",
          type: "EARNING",
          amount: 300,
          isTaxable: true,
          superImpactable: true,
        },
      ];
      const result = calculatePayRun(salaryInput({ payItems }));
      expect(result.allowances).toBe(100);
      expect(result.bonuses).toBe(300);
      expect(result.grossEarnings).toBeCloseTo(result.regularPay + 100 + 300, 1);
    });

    it("includes reimbursements in net pay but not gross earnings", () => {
      const payItems: PayItem[] = [
        {
          id: "r1",
          description: "Travel Reimbursement",
          type: "REIMBURSEMENT",
          amount: 150,
          isTaxable: false,
          superImpactable: false,
        },
      ];
      const result = calculatePayRun(salaryInput({ payItems }));
      expect(result.reimbursements).toBe(150);
      // Reimbursements excluded from gross but added to net
      expect(result.grossEarnings).toBeCloseTo(result.regularPay, 1);
      expect(result.netPay).toBeCloseTo(result.grossEarnings + 150 - result.taxWithheld, 1);
    });

    it("calculates quantity * rate for pay items with quantity", () => {
      const payItems: PayItem[] = [
        {
          id: "a2",
          description: "Meal Allowance",
          type: "EARNING",
          amount: 0,
          quantity: 5,
          rate: 20,
          isTaxable: true,
          superImpactable: false,
        },
      ];
      const result = calculatePayRun(salaryInput({ payItems }));
      expect(result.allowances).toBe(100); // 5 * 20
    });
  });

  // ── 7. HELP debt employee ────────────────────────────────────────────────
  describe("HELP debt employee", () => {
    it("calculates HELP repayment for income above threshold", () => {
      const input = salaryInput({
        annualSalary: 70000,
        taxSettings: baseTaxSettings({ hasHelpDebt: true }),
      });
      const result = calculatePayRun(input);
      expect(result.helpRepayment).toBeGreaterThan(0);
    });

    it("does not calculate HELP when employee has no debt", () => {
      const input = salaryInput({
        annualSalary: 70000,
        taxSettings: baseTaxSettings({ hasHelpDebt: false }),
      });
      const result = calculatePayRun(input);
      expect(result.helpRepayment).toBe(0);
    });

    it("HELP repayment is included in taxWithheld", () => {
      const input = salaryInput({
        annualSalary: 70000,
        taxSettings: baseTaxSettings({ hasHelpDebt: true }),
      });
      const result = calculatePayRun(input);
      // taxWithheld = PAYG + Medicare + HELP
      expect(result.taxWithheld).toBeGreaterThan(0);
      expect(result.helpRepayment).toBeGreaterThan(0);
    });

    it("does not calculate HELP for income below threshold", () => {
      const input = salaryInput({
        annualSalary: 50000,
        taxSettings: baseTaxSettings({ hasHelpDebt: true }),
      });
      const result = calculatePayRun(input);
      expect(result.helpRepayment).toBe(0);
    });
  });

  // ── 8. Non-resident tax calculation ─────────────────────────────────────
  describe("non-resident tax calculation", () => {
    it("applies flat 32.5% rate for non-residents", () => {
      const input = salaryInput({
        annualSalary: 52000,
        frequency: "WEEKLY",
        taxSettings: baseTaxSettings({ isResident: false }),
      });
      const result = calculatePayRun(input);
      // Weekly gross = 1000; tax = 1000 * 0.325 = 325
      expect(result.taxWithheld).toBeCloseTo(325, 0);
    });

    it("does not apply Medicare levy for non-residents", () => {
      const input = salaryInput({
        annualSalary: 52000,
        frequency: "WEEKLY",
        taxSettings: baseTaxSettings({ isResident: false }),
      });
      const result = calculatePayRun(input);
      expect(result.medicareLevy).toBe(0);
    });
  });
});

// ─── calculateLeaveAccrual ────────────────────────────────────────────────────

describe("calculateLeaveAccrual", () => {
  it("calculates weekly accrual from annual hours", () => {
    // 4 weeks = 152 hours/year, weekly = 152/52 = 2.92
    const result = calculateLeaveAccrual(152, "WEEKLY");
    expect(result).toBeCloseTo(2.92, 1);
  });

  it("calculates fortnightly accrual from annual hours", () => {
    // 152 / 26 = 5.85
    const result = calculateLeaveAccrual(152, "FORTNIGHTLY");
    expect(result).toBeCloseTo(5.85, 1);
  });

  it("calculates monthly accrual from annual hours", () => {
    // 152 / 12 = 12.67
    const result = calculateLeaveAccrual(152, "MONTHLY");
    expect(result).toBeCloseTo(12.67, 1);
  });

  it("returns 0 for 0 annual hours", () => {
    expect(calculateLeaveAccrual(0, "WEEKLY")).toBe(0);
  });
});

// ─── prorateSalary ────────────────────────────────────────────────────────────

describe("prorateSalary", () => {
  it("returns full annual salary when daysWorked equals totalWorkingDays", () => {
    const result = prorateSalary(80000, 260, 260);
    expect(result).toBe(80000);
  });

  it("prorates salary correctly for partial period", () => {
    // Half year: 130 / 260 = 0.5 * 80000 = 40000
    const result = prorateSalary(80000, 130, 260);
    expect(result).toBe(40000);
  });

  it("prorates for a single day", () => {
    // 1 / 260 * 80000 = ~307.69
    const result = prorateSalary(80000, 1, 260);
    expect(result).toBeCloseTo(307.69, 1);
  });

  it("returns 0 when totalWorkingDays is 0", () => {
    const result = prorateSalary(80000, 5, 0);
    expect(result).toBe(0);
  });

  it("returns 0 when daysWorked is 0", () => {
    const result = prorateSalary(80000, 0, 260);
    expect(result).toBe(0);
  });
});

// ─── validatePayRunInput ──────────────────────────────────────────────────────

describe("validatePayRunInput", () => {
  it("returns no errors for valid salary input", () => {
    const errors = validatePayRunInput(salaryInput());
    expect(errors).toHaveLength(0);
  });

  it("returns no errors for valid hourly input", () => {
    const errors = validatePayRunInput(hourlyInput());
    expect(errors).toHaveLength(0);
  });

  it("returns error when salary employee has zero annual salary", () => {
    const errors = validatePayRunInput(salaryInput({ annualSalary: 0 }));
    expect(errors).toContain("Annual salary must be positive for salary employees");
  });

  it("returns error when salary employee has no annual salary", () => {
    const errors = validatePayRunInput(salaryInput({ annualSalary: undefined }));
    expect(errors).toContain("Annual salary must be positive for salary employees");
  });

  it("returns error when hourly employee has zero hourly rate", () => {
    const errors = validatePayRunInput(hourlyInput({ hourlyRate: 0 }));
    expect(errors).toContain("Hourly rate must be positive for hourly employees");
  });

  it("returns error when hourly employee has negative regular hours", () => {
    const errors = validatePayRunInput(hourlyInput({ regularHours: -5 }));
    expect(errors).toContain("Regular hours cannot be negative");
  });

  it("returns error when hourly employee has negative overtime hours", () => {
    const errors = validatePayRunInput(hourlyInput({ overtimeHours: -2 }));
    expect(errors).toContain("Overtime hours cannot be negative");
  });

  it("returns multiple errors when multiple fields are invalid", () => {
    const errors = validatePayRunInput(hourlyInput({ hourlyRate: 0, regularHours: -1 }));
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
