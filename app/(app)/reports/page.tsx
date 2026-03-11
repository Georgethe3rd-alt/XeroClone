'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import {
  FileText,
  Users,
  CreditCard,
  CalendarDays,
  Landmark,
  History,
  BookOpen,
  ShieldCheck,
  Download,
} from 'lucide-react';

interface ReportCard {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const reportCards: ReportCard[] = [
  {
    id: 'payroll-summary',
    icon: FileText,
    title: 'Payroll Summary',
    description: 'Total wages, tax, and super for each pay period.',
  },
  {
    id: 'employee-earnings',
    icon: Users,
    title: 'Employee Earnings',
    description: 'Breakdown of gross earnings per employee and period.',
  },
  {
    id: 'deductions-liabilities',
    icon: CreditCard,
    title: 'Deductions & Liabilities',
    description: 'PAYG withholding, super, and other deductions.',
  },
  {
    id: 'leave-balances',
    icon: CalendarDays,
    title: 'Leave Balances',
    description: 'Current accrued leave balances across all employees.',
  },
  {
    id: 'super-contributions',
    icon: Landmark,
    title: 'Super Contributions',
    description: 'Superannuation contributions per employee and fund.',
  },
  {
    id: 'payment-history',
    icon: History,
    title: 'Payment History',
    description: 'History of all bank payments and ABA file exports.',
  },
  {
    id: 'journal-export',
    icon: BookOpen,
    title: 'Journal Export',
    description: 'Accounting journal entries for your general ledger.',
  },
  {
    id: 'audit-events',
    icon: ShieldCheck,
    title: 'Audit Events',
    description: 'Full audit trail of all payroll actions and changes.',
  },
];

interface PayrollSummaryRow {
  period: string;
  payDate: string;
  employees: number;
  grossWages: number;
  paygWithholding: number;
  superContributions: number;
  netPay: number;
}

const payrollSummaryData: PayrollSummaryRow[] = [
  {
    period: '10–23 Feb 2025',
    payDate: '24 Feb 2025',
    employees: 6,
    grossWages: 27200.00,
    paygWithholding: 6528.00,
    superContributions: 2856.00,
    netPay: 20672.00,
  },
  {
    period: '24 Feb–9 Mar 2025',
    payDate: '10 Mar 2025',
    employees: 6,
    grossWages: 27412.50,
    paygWithholding: 6579.00,
    superContributions: 2878.31,
    netPay: 20833.50,
  },
  {
    period: '10–23 Mar 2025',
    payDate: '24 Mar 2025',
    employees: 6,
    grossWages: 27200.00,
    paygWithholding: 6528.00,
    superContributions: 2856.00,
    netPay: 20672.00,
  },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<string | null>('payroll-summary');

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and export payroll reports"
        actions={
          activeReport === 'payroll-summary' ? (
            <Button variant="outline" size="sm" className="h-8">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          ) : null
        }
      />

      <div className="p-6 space-y-6">
        {/* Report cards grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {reportCards.map((report) => {
            const Icon = report.icon;
            const isActive = activeReport === report.id;
            return (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive ? 'ring-2 ring-brand-600 border-brand-200' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setActiveReport(report.id)}
              >
                <CardContent className="p-5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${
                    isActive ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{report.description}</p>
                  <Button
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    className={`h-7 text-xs w-full ${isActive ? 'bg-brand-600 hover:bg-brand-700 text-white' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveReport(report.id); }}
                  >
                    Generate
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sample Payroll Summary Table */}
        {activeReport === 'payroll-summary' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Payroll Summary — Last 3 Pay Periods</h2>
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Period</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Pay Date</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Employees</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Gross Wages</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">PAYG Withheld</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Super</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Net Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollSummaryData.map((row) => (
                    <TableRow key={row.period} className="hover:bg-gray-50">
                      <TableCell className="text-sm font-medium text-gray-900">{row.period}</TableCell>
                      <TableCell className="text-sm text-gray-600">{row.payDate}</TableCell>
                      <TableCell className="text-sm text-right text-gray-900">{row.employees}</TableCell>
                      <TableCell className="text-sm text-right font-mono text-gray-900">{formatCurrency(row.grossWages)}</TableCell>
                      <TableCell className="text-sm text-right font-mono text-red-600">{formatCurrency(row.paygWithholding)}</TableCell>
                      <TableCell className="text-sm text-right font-mono text-amber-600">{formatCurrency(row.superContributions)}</TableCell>
                      <TableCell className="text-sm text-right font-mono font-semibold text-gray-900">{formatCurrency(row.netPay)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                    <TableCell className="text-sm font-semibold text-gray-900" colSpan={3}>Total</TableCell>
                    <TableCell className="text-sm text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(payrollSummaryData.reduce((s, r) => s + r.grossWages, 0))}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono font-semibold text-red-600">
                      {formatCurrency(payrollSummaryData.reduce((s, r) => s + r.paygWithholding, 0))}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono font-semibold text-amber-600">
                      {formatCurrency(payrollSummaryData.reduce((s, r) => s + r.superContributions, 0))}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(payrollSummaryData.reduce((s, r) => s + r.netPay, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeReport && activeReport !== 'payroll-summary' && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {reportCards.find((r) => r.id === activeReport)?.title}
            </p>
            <p className="text-xs text-gray-500 mt-1">Click Generate to build this report with your current data.</p>
            <Button size="sm" className="mt-4 bg-brand-600 hover:bg-brand-700 text-white">
              Generate Report
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
