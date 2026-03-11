/**
 * Unit tests for Australian PAYG withholding tax tables.
 */
import { describe, it, expect } from "vitest";
import {
  calculateAUTax,
  calculateSuper,
  SUPER_GUARANTEE_RATE,
  TaxInput,
} from "@/lib/payroll/tax-tables-au";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function taxInput(overrides: Partial<TaxInput> = {}): TaxInput {
  return {
    annualGross: 60000,
    hasTaxFreeThreshold: true,
    hasHelpDebt: false,
    hasMedicareExemption: false,
    isResident: true,
    ...overrides,
  };
}

// ─── calculateAUTax ───────────────────────────────────────────────────────────

describe("calculateAUTax", () => {
  // ── Resident with tax-free threshold ──────────────────────────────────────
  describe("resident with tax-free threshold (Scale 1)", () => {
    it("returns annualTax > 0 for income above tax-free threshold", () => {
      const result = calculateAUTax(taxInput({ annualGross: 60000 }));
      expect(result.annualTax).toBeGreaterThan(0);
    });

    it("returns weeklyTax equal to annualTax / 52", () => {
      const result = calculateAUTax(taxInput({ annualGross: 60000 }));
      expect(result.weeklyTax).toBeCloseTo(result.annualTax / 52, 5);
    });

    it("returns zero annualTax for income below tax-free threshold", () => {
      // $18,200/yr = ~$350/week — within zero bracket (below $359)
      const result = calculateAUTax(taxInput({ annualGross: 18000 }));
      expect(result.annualTax).toBe(0);
    });

    it("applies Medicare levy for income above threshold", () => {
      const result = calculateAUTax(taxInput({ annualGross: 60000 }));
      expect(result.annualMedicare).toBeGreaterThan(0);
    });

    it("returns effectiveRate between 0 and 1 for ordinary income", () => {
      const result = calculateAUTax(taxInput({ annualGross: 80000 }));
      expect(result.effectiveRate).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeLessThan(1);
    });

    it("higher income has higher effective rate (progressive tax)", () => {
      const low = calculateAUTax(taxInput({ annualGross: 40000 }));
      const high = calculateAUTax(taxInput({ annualGross: 150000 }));
      expect(high.effectiveRate).toBeGreaterThan(low.effectiveRate);
    });

    it("returns annualHelp of 0 when no HELP debt", () => {
      const result = calculateAUTax(taxInput({ annualGross: 80000, hasHelpDebt: false }));
      expect(result.annualHelp).toBe(0);
    });
  });

  // ── Resident without tax-free threshold (Scale 2) ─────────────────────────
  describe("resident without tax-free threshold (Scale 2)", () => {
    it("applies tax from the first dollar of income", () => {
      const result = calculateAUTax(
        taxInput({ annualGross: 20000, hasTaxFreeThreshold: false })
      );
      expect(result.annualTax).toBeGreaterThan(0);
    });

    it("scale 2 tax is higher than scale 1 at the same income (below threshold)", () => {
      const withThreshold = calculateAUTax(
        taxInput({ annualGross: 20000, hasTaxFreeThreshold: true })
      );
      const noThreshold = calculateAUTax(
        taxInput({ annualGross: 20000, hasTaxFreeThreshold: false })
      );
      expect(noThreshold.annualTax).toBeGreaterThanOrEqual(withThreshold.annualTax);
    });

    it("scale 2 at high income returns higher effective rate than scale 1", () => {
      // At very high income, both scales converge — but at low income scale 2 is higher
      const withThreshold = calculateAUTax(
        taxInput({ annualGross: 30000, hasTaxFreeThreshold: true })
      );
      const noThreshold = calculateAUTax(
        taxInput({ annualGross: 30000, hasTaxFreeThreshold: false })
      );
      expect(noThreshold.effectiveRate).toBeGreaterThan(withThreshold.effectiveRate);
    });
  });

  // ── Non-resident ──────────────────────────────────────────────────────────
  describe("non-resident", () => {
    it("applies flat 32.5% effective rate", () => {
      const result = calculateAUTax(taxInput({ annualGross: 100000, isResident: false }));
      expect(result.effectiveRate).toBeCloseTo(0.325, 5);
    });

    it("returns annualTax = annualGross * 0.325 for non-residents", () => {
      const result = calculateAUTax(taxInput({ annualGross: 80000, isResident: false }));
      expect(result.annualTax).toBeCloseTo(80000 * 0.325, 2);
    });

    it("non-residents pay no Medicare levy", () => {
      const result = calculateAUTax(taxInput({ annualGross: 80000, isResident: false }));
      expect(result.annualMedicare).toBe(0);
    });

    it("non-residents have no HELP repayment", () => {
      const result = calculateAUTax(
        taxInput({ annualGross: 80000, isResident: false, hasHelpDebt: true })
      );
      expect(result.annualHelp).toBe(0);
    });

    it("weeklyTax equals annualTax / 52 for non-residents", () => {
      const result = calculateAUTax(taxInput({ annualGross: 52000, isResident: false }));
      expect(result.weeklyTax).toBeCloseTo(result.annualTax / 52, 5);
    });
  });

  // ── HELP debt ─────────────────────────────────────────────────────────────
  describe("HELP debt", () => {
    it("returns annualHelp > 0 for income above HELP threshold", () => {
      const result = calculateAUTax(
        taxInput({ annualGross: 70000, hasHelpDebt: true })
      );
      expect(result.annualHelp).toBeGreaterThan(0);
    });

    it("returns annualHelp = 0 for income below HELP threshold", () => {
      const result = calculateAUTax(
        taxInput({ annualGross: 50000, hasHelpDebt: true })
      );
      expect(result.annualHelp).toBe(0);
    });

    it("higher income triggers higher HELP repayment rate", () => {
      const lower = calculateAUTax(taxInput({ annualGross: 66000, hasHelpDebt: true }));
      const higher = calculateAUTax(taxInput({ annualGross: 82000, hasHelpDebt: true }));
      // Higher income = higher HELP rate applied to larger base
      expect(higher.annualHelp).toBeGreaterThan(lower.annualHelp);
    });

    it("HELP debt does not affect weeklyTax or weeklyMedicare, only weeklyHelp", () => {
      const without = calculateAUTax(taxInput({ annualGross: 70000, hasHelpDebt: false }));
      const withHelp = calculateAUTax(taxInput({ annualGross: 70000, hasHelpDebt: true }));
      expect(withHelp.weeklyTax).toBeCloseTo(without.weeklyTax, 5);
      expect(withHelp.weeklyMedicare).toBeCloseTo(without.weeklyMedicare, 5);
      expect(withHelp.weeklyHelp).toBeGreaterThan(0);
    });
  });

  // ── Medicare exemption ────────────────────────────────────────────────────
  describe("Medicare exemption", () => {
    it("does not apply Medicare levy when exemption is true", () => {
      const result = calculateAUTax(
        taxInput({ annualGross: 80000, hasMedicareExemption: true })
      );
      expect(result.annualMedicare).toBe(0);
      expect(result.weeklyMedicare).toBe(0);
    });

    it("applies Medicare levy when exemption is false and income is above threshold", () => {
      const result = calculateAUTax(
        taxInput({ annualGross: 80000, hasMedicareExemption: false })
      );
      expect(result.annualMedicare).toBeGreaterThan(0);
    });

    it("does not apply Medicare for income below the Medicare levy threshold", () => {
      // Weekly threshold is ~$438; annual ~$22,776
      const result = calculateAUTax(
        taxInput({ annualGross: 20000, hasMedicareExemption: false })
      );
      expect(result.annualMedicare).toBe(0);
    });

    it("annualTax is unchanged by Medicare exemption flag", () => {
      const exempt = calculateAUTax(
        taxInput({ annualGross: 80000, hasMedicareExemption: true })
      );
      const notExempt = calculateAUTax(
        taxInput({ annualGross: 80000, hasMedicareExemption: false })
      );
      expect(exempt.annualTax).toBeCloseTo(notExempt.annualTax, 2);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("returns effectiveRate of 0 for zero income", () => {
      const result = calculateAUTax(taxInput({ annualGross: 0 }));
      expect(result.effectiveRate).toBe(0);
    });

    it("returns all zeros for zero income resident", () => {
      const result = calculateAUTax(taxInput({ annualGross: 0 }));
      expect(result.annualTax).toBe(0);
      expect(result.annualMedicare).toBe(0);
      expect(result.annualHelp).toBe(0);
    });
  });
});

// ─── calculateSuper ───────────────────────────────────────────────────────────

describe("calculateSuper", () => {
  it("calculates super at the correct guarantee rate", () => {
    const gross = 1000;
    const result = calculateSuper(gross);
    expect(result).toBeCloseTo(gross * SUPER_GUARANTEE_RATE, 2);
  });

  it("super guarantee rate is 11.5%", () => {
    expect(SUPER_GUARANTEE_RATE).toBe(0.115);
  });

  it("calculates correctly for a typical fortnightly salary", () => {
    // $80,000 / 26 = ~$3,076.92 fortnightly; super = 3076.92 * 0.115 = ~353.85
    const fortnightly = 80000 / 26;
    const result = calculateSuper(fortnightly);
    expect(result).toBeCloseTo(fortnightly * 0.115, 2);
  });

  it("returns 0 for zero earnings", () => {
    expect(calculateSuper(0)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateSuper(100.555);
    const decimalPlaces = (result.toString().split(".")[1] ?? "").length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it("scales linearly with gross earnings", () => {
    const half = calculateSuper(500);
    const full = calculateSuper(1000);
    expect(full).toBeCloseTo(half * 2, 2);
  });
});
