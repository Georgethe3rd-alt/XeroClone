/**
 * PayCraft Demo Seed Data
 *
 * Seeds the database with realistic demo data including:
 * - 1 bookkeeping firm org + 2 small-business client orgs
 * - 12 employees across salary and hourly roles
 * - Pay schedules, leave types, pay items
 * - 2 completed historical pay runs + 1 draft
 * - 2 pending leave requests + 3 timesheets
 *
 * Run: npx prisma db seed
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client.ts";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding PayCraft demo data...");

  // -------------------------------------------------------------------------
  // Clean existing data
  // -------------------------------------------------------------------------
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payRunLineItem.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payRunItem.deleteMany();
  await prisma.payRun.deleteMany();
  await prisma.timesheetEntry.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.leaveBalanceLedger.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.taxProfile.deleteMany();
  await prisma.employment.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.paySchedule.deleteMany();
  await prisma.payItem.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("paycraft123", 10);

  const userSarah = await prisma.user.create({
    data: {
      email: "sarah@sunshineaccounting.com.au",
      name: "Sarah Mitchell",
      password: passwordHash,
    },
  });

  const userAdmin = await prisma.user.create({
    data: {
      email: "admin@techvault.com.au",
      name: "David Park",
      password: passwordHash,
    },
  });

  const userEmployee1 = await prisma.user.create({
    data: {
      email: "j.thornton@techvault.com.au",
      name: "James Thornton",
      password: passwordHash,
    },
  });

  const userEmployee2 = await prisma.user.create({
    data: {
      email: "p.kapoor@techvault.com.au",
      name: "Priya Kapoor",
      password: passwordHash,
    },
  });

  console.log("✓ Users created");

  // -------------------------------------------------------------------------
  // Organizations
  // -------------------------------------------------------------------------
  const orgSunshine = await prisma.organization.create({
    data: {
      name: "Sunshine Bookkeeping Co.",
      abn: "51 824 753 556",
      address: "Level 3, 88 Walker Street, North Sydney NSW 2060",
      country: "AU",
      timezone: "Australia/Sydney",
      currency: "AUD",
    },
  });

  const orgTechVault = await prisma.organization.create({
    data: {
      name: "TechVault Pty Ltd",
      abn: "78 123 456 789",
      address: "42 Market Street, Sydney NSW 2000",
      country: "AU",
      timezone: "Australia/Sydney",
      currency: "AUD",
    },
  });

  const orgFreshBrew = await prisma.organization.create({
    data: {
      name: "FreshBrew Coffee Co.",
      abn: "33 987 654 321",
      address: "15 Bridge Road, Richmond VIC 3121",
      country: "AU",
      timezone: "Australia/Melbourne",
      currency: "AUD",
    },
  });

  console.log("✓ Organizations created");

  // -------------------------------------------------------------------------
  // Memberships
  // -------------------------------------------------------------------------
  await prisma.membership.createMany({
    data: [
      { orgId: orgSunshine.id, userId: userSarah.id, role: "OWNER", status: "ACTIVE" },
      { orgId: orgTechVault.id, userId: userSarah.id, role: "PAYROLL_ADMIN", status: "ACTIVE" },
      { orgId: orgTechVault.id, userId: userAdmin.id, role: "OWNER", status: "ACTIVE" },
      { orgId: orgTechVault.id, userId: userEmployee1.id, role: "EMPLOYEE", status: "ACTIVE" },
      { orgId: orgTechVault.id, userId: userEmployee2.id, role: "EMPLOYEE", status: "ACTIVE" },
      { orgId: orgFreshBrew.id, userId: userSarah.id, role: "PAYROLL_ADMIN", status: "ACTIVE" },
    ],
  });

  console.log("✓ Memberships created");

  // -------------------------------------------------------------------------
  // Pay Schedules — TechVault
  // -------------------------------------------------------------------------
  const scheduleFortnightly = await prisma.paySchedule.create({
    data: {
      orgId: orgTechVault.id,
      name: "Fortnightly — Office Staff",
      frequency: "FORTNIGHTLY",
      firstPayDate: new Date("2025-01-15"),
      nextPayDate: new Date("2025-04-02"),
      isActive: true,
    },
  });

  const scheduleWeekly = await prisma.paySchedule.create({
    data: {
      orgId: orgTechVault.id,
      name: "Weekly — Warehouse",
      frequency: "WEEKLY",
      dayOfWeek: 3, // Wednesday
      firstPayDate: new Date("2025-01-08"),
      nextPayDate: new Date("2025-03-26"),
      isActive: true,
    },
  });

  console.log("✓ Pay schedules created");

  // -------------------------------------------------------------------------
  // Pay Items — TechVault
  // -------------------------------------------------------------------------
  const piBaseSalary = await prisma.payItem.create({
    data: {
      orgId: orgTechVault.id,
      name: "Base Salary",
      code: "BASE_SALARY",
      type: "EARNING",
      isSystemItem: true,
      isTaxable: true,
      superImpactable: true,
      isActive: true,
    },
  });

  const piHourlyRate = await prisma.payItem.create({
    data: {
      orgId: orgTechVault.id,
      name: "Hourly Rate",
      code: "HOURLY_RATE",
      type: "EARNING",
      isSystemItem: true,
      isTaxable: true,
      superImpactable: true,
      isActive: true,
    },
  });

  await prisma.payItem.create({
    data: {
      orgId: orgTechVault.id,
      name: "Overtime (1.5x)",
      code: "OVERTIME_1_5",
      type: "EARNING",
      isSystemItem: false,
      isTaxable: true,
      superImpactable: true,
      isActive: true,
    },
  });

  await prisma.payItem.create({
    data: {
      orgId: orgTechVault.id,
      name: "Tool Allowance",
      code: "TOOL_ALLOWANCE",
      type: "EARNING",
      isSystemItem: false,
      isTaxable: false,
      superImpactable: false,
      isActive: true,
    },
  });

  await prisma.payItem.create({
    data: {
      orgId: orgTechVault.id,
      name: "Performance Bonus",
      code: "PERF_BONUS",
      type: "EARNING",
      isSystemItem: false,
      isTaxable: true,
      superImpactable: true,
      isActive: true,
    },
  });

  await prisma.payItem.create({
    data: {
      orgId: orgTechVault.id,
      name: "Salary Sacrifice (Super)",
      code: "SAL_SAC_SUPER",
      type: "DEDUCTION",
      isSystemItem: false,
      isTaxable: false,
      superImpactable: false,
      isActive: true,
    },
  });

  console.log("✓ Pay items created");

  // -------------------------------------------------------------------------
  // Leave Types — TechVault
  // -------------------------------------------------------------------------
  const ltAnnual = await prisma.leaveType.create({
    data: {
      orgId: orgTechVault.id,
      name: "Annual Leave",
      code: "ANNUAL",
      isPaid: true,
      accrualBased: true,
      accrualRatePerYear: 160, // 4 weeks × 40h
      maxBalance: 320,
      isActive: true,
    },
  });

  const ltPersonal = await prisma.leaveType.create({
    data: {
      orgId: orgTechVault.id,
      name: "Personal / Sick Leave",
      code: "PERSONAL",
      isPaid: true,
      accrualBased: true,
      accrualRatePerYear: 76.92, // 10 days
      maxBalance: 240,
      isActive: true,
    },
  });

  await prisma.leaveType.create({
    data: {
      orgId: orgTechVault.id,
      name: "Long Service Leave",
      code: "LONG_SERVICE",
      isPaid: true,
      accrualBased: true,
      accrualRatePerYear: 20,
      maxBalance: null,
      isActive: true,
    },
  });

  await prisma.leaveType.create({
    data: {
      orgId: orgTechVault.id,
      name: "Unpaid Leave",
      code: "UNPAID",
      isPaid: false,
      accrualBased: false,
      accrualRatePerYear: 0,
      maxBalance: null,
      isActive: true,
    },
  });

  await prisma.leaveType.create({
    data: {
      orgId: orgTechVault.id,
      name: "Parental Leave",
      code: "PARENTAL",
      isPaid: false,
      accrualBased: false,
      accrualRatePerYear: 0,
      maxBalance: null,
      isActive: true,
    },
  });

  console.log("✓ Leave types created");

  // -------------------------------------------------------------------------
  // Employees — TechVault (6 employees)
  // -------------------------------------------------------------------------
  const emp1 = await prisma.employee.create({
    data: {
      orgId: orgTechVault.id,
      userId: userEmployee1.id,
      employeeCode: "EMP1001",
      firstName: "James",
      lastName: "Thornton",
      email: "j.thornton@techvault.com.au",
      phone: "0412 345 678",
      address: "15 Willowbrook Ave, Chatswood NSW 2067",
      dateOfBirth: new Date("1988-06-22"),
      startDate: new Date("2021-03-15"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      jobTitle: "Senior Developer",
      department: "Engineering",
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      orgId: orgTechVault.id,
      userId: userEmployee2.id,
      employeeCode: "EMP1002",
      firstName: "Priya",
      lastName: "Kapoor",
      email: "p.kapoor@techvault.com.au",
      phone: "0421 987 654",
      address: "42 Harbour Crescent, Pyrmont NSW 2009",
      dateOfBirth: new Date("1991-11-14"),
      startDate: new Date("2022-01-10"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      jobTitle: "Product Manager",
      department: "Product",
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      orgId: orgTechVault.id,
      employeeCode: "EMP1003",
      firstName: "Marcus",
      lastName: "Chen",
      email: "m.chen@techvault.com.au",
      phone: "0435 222 111",
      address: "8 Palm Street, Newtown NSW 2042",
      dateOfBirth: new Date("1987-03-05"),
      startDate: new Date("2020-07-20"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      jobTitle: "UX Designer",
      department: "Design",
    },
  });

  const emp4 = await prisma.employee.create({
    data: {
      orgId: orgTechVault.id,
      employeeCode: "EMP1004",
      firstName: "Sofia",
      lastName: "Andersen",
      email: "s.andersen@techvault.com.au",
      phone: "0411 333 444",
      address: "21 Rose Bay Drive, Bondi NSW 2026",
      dateOfBirth: new Date("1994-09-17"),
      startDate: new Date("2023-03-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      jobTitle: "Customer Success Manager",
      department: "Sales",
    },
  });

  const emp5 = await prisma.employee.create({
    data: {
      orgId: orgTechVault.id,
      employeeCode: "EMP1005",
      firstName: "Tyler",
      lastName: "Nguyen",
      email: "t.nguyen@techvault.com.au",
      phone: "0455 777 888",
      address: "33 Park Lane, Parramatta NSW 2150",
      dateOfBirth: new Date("1985-12-29"),
      startDate: new Date("2019-11-04"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      jobTitle: "Warehouse Lead",
      department: "Operations",
    },
  });

  const emp6 = await prisma.employee.create({
    data: {
      orgId: orgTechVault.id,
      employeeCode: "EMP1006",
      firstName: "Aisha",
      lastName: "Okonkwo",
      email: "a.okonkwo@techvault.com.au",
      phone: "0478 999 000",
      address: "57 Oxford Street, Surry Hills NSW 2010",
      dateOfBirth: new Date("1990-02-18"),
      startDate: new Date("2022-08-15"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      jobTitle: "Finance Analyst",
      department: "Finance",
    },
  });

  console.log("✓ Employees created");

  // -------------------------------------------------------------------------
  // Employment records
  // -------------------------------------------------------------------------
  const empl1 = await prisma.employment.create({
    data: {
      employeeId: emp1.id,
      type: "SALARY",
      annualSalary: 125000,
      hoursPerWeek: 38,
      payScheduleId: scheduleFortnightly.id,
      effectiveDate: new Date("2021-03-15"),
    },
  });

  const empl2 = await prisma.employment.create({
    data: {
      employeeId: emp2.id,
      type: "SALARY",
      annualSalary: 110000,
      hoursPerWeek: 38,
      payScheduleId: scheduleFortnightly.id,
      effectiveDate: new Date("2022-01-10"),
    },
  });

  const empl3 = await prisma.employment.create({
    data: {
      employeeId: emp3.id,
      type: "SALARY",
      annualSalary: 95000,
      hoursPerWeek: 38,
      payScheduleId: scheduleFortnightly.id,
      effectiveDate: new Date("2020-07-20"),
    },
  });

  const empl4 = await prisma.employment.create({
    data: {
      employeeId: emp4.id,
      type: "SALARY",
      annualSalary: 88000,
      hoursPerWeek: 38,
      payScheduleId: scheduleFortnightly.id,
      effectiveDate: new Date("2023-03-01"),
    },
  });

  const empl5 = await prisma.employment.create({
    data: {
      employeeId: emp5.id,
      type: "HOURLY",
      hourlyRate: 38.50,
      hoursPerWeek: 40,
      payScheduleId: scheduleWeekly.id,
      effectiveDate: new Date("2019-11-04"),
    },
  });

  const empl6 = await prisma.employment.create({
    data: {
      employeeId: emp6.id,
      type: "SALARY",
      annualSalary: 92000,
      hoursPerWeek: 38,
      payScheduleId: scheduleFortnightly.id,
      effectiveDate: new Date("2022-08-15"),
    },
  });

  console.log("✓ Employment records created");

  // -------------------------------------------------------------------------
  // Tax Profiles
  // -------------------------------------------------------------------------
  await prisma.taxProfile.createMany({
    data: [
      { employeeId: emp1.id, taxFreeThreshold: true, helpDebt: false, seniorOffset: false, medicareExemption: false, residencyStatus: "RESIDENT" },
      { employeeId: emp2.id, taxFreeThreshold: true, helpDebt: true, seniorOffset: false, medicareExemption: false, residencyStatus: "RESIDENT" },
      { employeeId: emp3.id, taxFreeThreshold: true, helpDebt: false, seniorOffset: false, medicareExemption: false, residencyStatus: "RESIDENT" },
      { employeeId: emp4.id, taxFreeThreshold: true, helpDebt: false, seniorOffset: false, medicareExemption: false, residencyStatus: "RESIDENT" },
      { employeeId: emp5.id, taxFreeThreshold: true, helpDebt: false, seniorOffset: false, medicareExemption: false, residencyStatus: "RESIDENT" },
      { employeeId: emp6.id, taxFreeThreshold: true, helpDebt: true, seniorOffset: false, medicareExemption: false, residencyStatus: "RESIDENT" },
    ],
  });

  console.log("✓ Tax profiles created");

  // -------------------------------------------------------------------------
  // Bank Accounts
  // -------------------------------------------------------------------------
  await prisma.bankAccount.createMany({
    data: [
      { employeeId: emp1.id, accountName: "James Thornton", bsb: "062123", accountNumber: "12344521", isPrimary: true, allocationType: "PERCENTAGE", allocationAmount: 100 },
      { employeeId: emp2.id, accountName: "Priya Kapoor", bsb: "063456", accountNumber: "98767892", isPrimary: true, allocationType: "PERCENTAGE", allocationAmount: 100 },
      { employeeId: emp3.id, accountName: "Marcus Chen", bsb: "012789", accountNumber: "55553341", isPrimary: true, allocationType: "PERCENTAGE", allocationAmount: 100 },
      { employeeId: emp4.id, accountName: "Sofia Andersen", bsb: "033001", accountNumber: "11119912", isPrimary: true, allocationType: "PERCENTAGE", allocationAmount: 100 },
      { employeeId: emp5.id, accountName: "Tyler Nguyen", bsb: "084223", accountNumber: "77775512", isPrimary: true, allocationType: "PERCENTAGE", allocationAmount: 100 },
      { employeeId: emp6.id, accountName: "Aisha Okonkwo", bsb: "063456", accountNumber: "44442231", isPrimary: true, allocationType: "PERCENTAGE", allocationAmount: 100 },
    ],
  });

  console.log("✓ Bank accounts created");

  // -------------------------------------------------------------------------
  // Leave Balance Ledgers (opening balances)
  // -------------------------------------------------------------------------
  const leaveData = [
    { emp: emp1.id, annual: 142.5, personal: 38.0, ls: 0 },
    { emp: emp2.id, annual: 87.5, personal: 60.0, ls: 0 },
    { emp: emp3.id, annual: 215.0, personal: 15.0, ls: 80.5 },
    { emp: emp4.id, annual: 52.0, personal: 60.0, ls: 0 },
    { emp: emp5.id, annual: 178.0, personal: 22.0, ls: 120.0 },
    { emp: emp6.id, annual: 94.5, personal: 45.0, ls: 0 },
  ];

  const ltLongService = await prisma.leaveType.findFirst({
    where: { orgId: orgTechVault.id, code: "LONG_SERVICE" },
  });

  for (const ld of leaveData) {
    await prisma.leaveBalanceLedger.create({
      data: {
        orgId: orgTechVault.id,
        employeeId: ld.emp,
        leaveTypeId: ltAnnual.id,
        transactionDate: new Date("2025-01-01"),
        transactionType: "OPENING",
        amount: ld.annual,
        balance: ld.annual,
        description: "Opening balance FY2025",
      },
    });
    await prisma.leaveBalanceLedger.create({
      data: {
        orgId: orgTechVault.id,
        employeeId: ld.emp,
        leaveTypeId: ltPersonal.id,
        transactionDate: new Date("2025-01-01"),
        transactionType: "OPENING",
        amount: ld.personal,
        balance: ld.personal,
        description: "Opening balance FY2025",
      },
    });
    if (ld.ls > 0 && ltLongService) {
      await prisma.leaveBalanceLedger.create({
        data: {
          orgId: orgTechVault.id,
          employeeId: ld.emp,
          leaveTypeId: ltLongService.id,
          transactionDate: new Date("2025-01-01"),
          transactionType: "OPENING",
          amount: ld.ls,
          balance: ld.ls,
          description: "Opening balance FY2025",
        },
      });
    }
  }

  console.log("✓ Leave balances created");

  // -------------------------------------------------------------------------
  // Pay Runs — 2 historical + 1 draft
  // -------------------------------------------------------------------------
  const payRun1 = await prisma.payRun.create({
    data: {
      orgId: orgTechVault.id,
      payScheduleId: scheduleFortnightly.id,
      periodStart: new Date("2025-02-17"),
      periodEnd: new Date("2025-03-02"),
      payDate: new Date("2025-03-05"),
      status: "POSTED",
      totalGross: 19230.77,
      totalTax: 4230.77,
      totalNet: 13000.0,
      totalSuper: 2211.54,
      createdById: userAdmin.id,
      approvedById: userAdmin.id,
      approvedAt: new Date("2025-03-03T09:00:00Z"),
      postedAt: new Date("2025-03-04T09:30:00Z"),
      lockedAt: new Date("2025-03-04T09:30:00Z"),
    },
  });

  const payRun2 = await prisma.payRun.create({
    data: {
      orgId: orgTechVault.id,
      payScheduleId: scheduleFortnightly.id,
      periodStart: new Date("2025-03-03"),
      periodEnd: new Date("2025-03-16"),
      payDate: new Date("2025-03-19"),
      status: "POSTED",
      totalGross: 19384.62,
      totalTax: 4284.62,
      totalNet: 13100.0,
      totalSuper: 2229.23,
      createdById: userAdmin.id,
      approvedById: userAdmin.id,
      approvedAt: new Date("2025-03-17T10:00:00Z"),
      postedAt: new Date("2025-03-18T10:15:00Z"),
      lockedAt: new Date("2025-03-18T10:15:00Z"),
    },
  });

  const payRun3 = await prisma.payRun.create({
    data: {
      orgId: orgTechVault.id,
      payScheduleId: scheduleFortnightly.id,
      periodStart: new Date("2025-03-17"),
      periodEnd: new Date("2025-03-30"),
      payDate: new Date("2025-04-02"),
      status: "DRAFT",
      totalGross: 19461.54,
      totalTax: 4311.54,
      totalNet: 13150.0,
      totalSuper: 2238.08,
      createdById: userAdmin.id,
    },
  });

  console.log("✓ Pay runs created");

  // -------------------------------------------------------------------------
  // Pay Run Items for draft pay run
  // -------------------------------------------------------------------------
  const payRunItemsData = [
    { emp: emp1, empl: empl1, gross: 4807.69, tax: 1307.69, net: 3500.0, super_: 553.08 },
    { emp: emp2, empl: empl2, gross: 4230.77, tax: 1230.77, net: 3000.0, super_: 486.54 },
    { emp: emp3, empl: empl3, gross: 3653.85, tax: 803.85, net: 2850.0, super_: 420.19 },
    { emp: emp4, empl: empl4, gross: 3534.62, tax: 734.62, net: 2800.0, super_: 406.48 },
    { emp: emp5, empl: empl5, gross: 1684.38, tax: 284.38, net: 1400.0, super_: 193.70 },
    { emp: emp6, empl: empl6, gross: 3538.46, tax: 888.46, net: 2650.0, super_: 406.92 },
  ];

  const ytdData = [
    { ytdGross: 48076.92, ytdTax: 14423.08, ytdSuper: 5528.85 },
    { ytdGross: 42307.69, ytdTax: 11307.69, ytdSuper: 4865.38 },
    { ytdGross: 36538.46, ytdTax: 8538.46, ytdSuper: 4201.92 },
    { ytdGross: 33846.15, ytdTax: 7346.15, ytdSuper: 3892.31 },
    { ytdGross: 29634.0, ytdTax: 5463.0, ytdSuper: 3407.91 },
    { ytdGross: 35384.62, ytdTax: 8884.62, ytdSuper: 4069.23 },
  ];

  for (let i = 0; i < payRunItemsData.length; i++) {
    const d = payRunItemsData[i];
    const ytd = ytdData[i];
    const item = await prisma.payRunItem.create({
      data: {
        payRunId: payRun3.id,
        employeeId: d.emp.id,
        employmentId: d.empl.id,
        grossEarnings: d.gross,
        regularPay: d.emp.id === emp5.id ? 1540.0 : d.gross,
        overtimePay: d.emp.id === emp5.id ? 144.38 : 0,
        allowances: d.emp.id === emp4.id ? 150.0 : 0,
        bonuses: 0,
        reimbursements: 0,
        taxWithheld: d.tax,
        superContribution: d.super_,
        totalDeductions: d.tax,
        netPay: d.net,
        ytdGross: ytd.ytdGross + d.gross,
        ytdTax: ytd.ytdTax + d.tax,
        ytdSuper: ytd.ytdSuper + d.super_,
        status: "INCLUDED",
      },
    });

    // Payslip for draft
    await prisma.payslip.create({
      data: {
        payRunItemId: item.id,
        employeeId: d.emp.id,
        payRunId: payRun3.id,
        generatedAt: new Date(),
      },
    });
  }

  console.log("✓ Pay run items + payslips created");

  // -------------------------------------------------------------------------
  // Timesheets
  // -------------------------------------------------------------------------
  const ts1 = await prisma.timesheet.create({
    data: {
      orgId: orgTechVault.id,
      employeeId: emp5.id,
      periodStart: new Date("2025-03-03"),
      periodEnd: new Date("2025-03-09"),
      status: "SUBMITTED",
      submittedAt: new Date("2025-03-10T08:00:00Z"),
      totalHours: 42.5,
      totalOvertimeHours: 2.5,
    },
  });

  const timesheetEntries = [
    { date: "2025-03-03", regularHours: 8, overtimeHours: 0, notes: null },
    { date: "2025-03-04", regularHours: 8, overtimeHours: 0, notes: null },
    { date: "2025-03-05", regularHours: 8, overtimeHours: 0, notes: null },
    { date: "2025-03-06", regularHours: 8, overtimeHours: 0, notes: null },
    { date: "2025-03-07", regularHours: 8, overtimeHours: 1.0, notes: "Month-end stock count" },
    { date: "2025-03-08", regularHours: 0, overtimeHours: 1.5, notes: "Weekend dispatch" },
  ];

  for (const entry of timesheetEntries) {
    const baseDate = new Date(entry.date);
    const startHour = entry.regularHours > 0 ? 7 : 8;
    const endHour = entry.regularHours > 0 ? (entry.overtimeHours > 0 ? 16 : 15) : 9;
    const endMin = entry.regularHours > 0 ? (entry.overtimeHours > 0 ? 30 : 30) : 30;
    const startTime = new Date(baseDate); startTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(baseDate); endTime.setHours(endHour, endMin, 0, 0);
    await prisma.timesheetEntry.create({
      data: {
        timesheetId: ts1.id,
        date: baseDate,
        startTime,
        endTime,
        regularHours: entry.regularHours,
        overtimeHours: entry.overtimeHours,
        breakMinutes: entry.regularHours > 0 ? 30 : 0,
        notes: entry.notes,
      },
    });
  }

  await prisma.timesheet.create({
    data: {
      orgId: orgTechVault.id,
      employeeId: emp5.id,
      periodStart: new Date("2025-03-10"),
      periodEnd: new Date("2025-03-16"),
      status: "DRAFT",
      totalHours: 0,
      totalOvertimeHours: 0,
    },
  });

  await prisma.timesheet.create({
    data: {
      orgId: orgTechVault.id,
      employeeId: emp3.id,
      periodStart: new Date("2025-03-03"),
      periodEnd: new Date("2025-03-09"),
      status: "SUBMITTED",
      submittedAt: new Date("2025-03-10T09:15:00Z"),
      totalHours: 38.0,
      totalOvertimeHours: 0,
    },
  });

  console.log("✓ Timesheets created");

  // -------------------------------------------------------------------------
  // Leave Requests
  // -------------------------------------------------------------------------
  await prisma.leaveRequest.create({
    data: {
      orgId: orgTechVault.id,
      employeeId: emp1.id,
      leaveTypeId: ltAnnual.id,
      startDate: new Date("2025-04-14"),
      endDate: new Date("2025-04-18"),
      totalDays: 5,
      totalHours: 38,
      status: "PENDING",
      reason: "Family vacation to Queensland",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      orgId: orgTechVault.id,
      employeeId: emp4.id,
      leaveTypeId: ltPersonal.id,
      startDate: new Date("2025-03-25"),
      endDate: new Date("2025-03-26"),
      totalDays: 2,
      totalHours: 15.2,
      status: "PENDING",
      reason: "Medical appointment",
    },
  });

  console.log("✓ Leave requests created");

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      {
        orgId: orgTechVault.id,
        userId: userAdmin.id,
        type: "leave_request",
        title: "Leave Request Pending",
        message: "James Thornton has requested 5 days annual leave (14–18 Apr 2025)",
        isRead: false,
        entityType: "LeaveRequest",
      },
      {
        orgId: orgTechVault.id,
        userId: userAdmin.id,
        type: "leave_request",
        title: "Leave Request Pending",
        message: "Sofia Andersen has requested 2 days personal leave (25–26 Mar 2025)",
        isRead: false,
        entityType: "LeaveRequest",
      },
      {
        orgId: orgTechVault.id,
        userId: userAdmin.id,
        type: "timesheet_submitted",
        title: "Timesheets Submitted",
        message: "3 timesheets are awaiting your review",
        isRead: false,
        entityType: "Timesheet",
      },
      {
        orgId: orgTechVault.id,
        userId: userAdmin.id,
        type: "pay_run_ready",
        title: "Pay Run Ready",
        message: "Pay run for 17–30 Mar 2025 is ready for review and approval",
        isRead: true,
        readAt: new Date("2025-03-09T10:00:00Z"),
        entityType: "PayRun",
      },
    ],
  });

  // -------------------------------------------------------------------------
  // Audit Events
  // -------------------------------------------------------------------------
  await prisma.auditEvent.createMany({
    data: [
      {
        orgId: orgTechVault.id,
        userId: userAdmin.id,
        action: "pay_run.posted",
        entityType: "PayRun",
        entityId: payRun2.id,
        newValues: { status: "POSTED", payDate: "2025-03-19", totalNet: 13100 },
        ipAddress: "203.0.113.1",
        userAgent: "Mozilla/5.0",
      },
      {
        orgId: orgTechVault.id,
        userId: userAdmin.id,
        action: "employee.updated",
        entityType: "Employee",
        entityId: emp4.id,
        oldValues: { annualSalary: 85000 },
        newValues: { annualSalary: 88000 },
        ipAddress: "203.0.113.1",
        userAgent: "Mozilla/5.0",
      },
    ],
  });

  console.log("✓ Notifications + audit events created");

  // -------------------------------------------------------------------------
  // FreshBrew — additional employees (6 more)
  // -------------------------------------------------------------------------
  const scheduleFreshBrew = await prisma.paySchedule.create({
    data: {
      orgId: orgFreshBrew.id,
      name: "Weekly — All Staff",
      frequency: "WEEKLY",
      dayOfWeek: 4,
      firstPayDate: new Date("2025-01-09"),
      nextPayDate: new Date("2025-03-27"),
      isActive: true,
    },
  });

  const brewEmpNames = [
    { first: "Liam", last: "Patterson", title: "Head Barista", rate: 32.5 },
    { first: "Emma", last: "Russo", title: "Shift Supervisor", rate: 35.0 },
    { first: "Noah", last: "Williams", title: "Barista", rate: 28.0 },
    { first: "Olivia", last: "Brown", title: "Barista", rate: 28.0 },
    { first: "Charlotte", last: "Taylor", title: "Cafe Assistant", rate: 24.5 },
    { first: "Ethan", last: "Jones", title: "Delivery Driver", rate: 30.0 },
  ];

  for (let i = 0; i < brewEmpNames.length; i++) {
    const e = brewEmpNames[i];
    const code = `FB${(1001 + i).toString()}`;
    const brewEmp = await prisma.employee.create({
      data: {
        orgId: orgFreshBrew.id,
        employeeCode: code,
        firstName: e.first,
        lastName: e.last,
        email: `${e.first.toLowerCase()}.${e.last.toLowerCase()}@freshbrewcoffee.com.au`,
        startDate: new Date("2024-01-01"),
        employmentType: "CASUAL",
        status: "ACTIVE",
        jobTitle: e.title,
        department: "Operations",
      },
    });

    await prisma.employment.create({
      data: {
        employeeId: brewEmp.id,
        type: "HOURLY",
        hourlyRate: e.rate,
        hoursPerWeek: 32,
        payScheduleId: scheduleFreshBrew.id,
        effectiveDate: new Date("2024-01-01"),
      },
    });
  }

  console.log("✓ FreshBrew employees created");

  console.log("\n✅ Seed complete!");
  console.log("   Demo login: sarah@sunshineaccounting.com.au / paycraft123");
  console.log("   Or:         admin@techvault.com.au / paycraft123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
