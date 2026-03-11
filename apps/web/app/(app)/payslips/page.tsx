'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Download, Send } from 'lucide-react';

type PayslipStatus = 'GENERATED' | 'SENT' | 'VIEWED';

interface Payslip {
  id: string;
  employee: string;
  payPeriod: string;
  payDate: string;
  gross: number;
  net: number;
  status: PayslipStatus;
}

const payslips: Payslip[] = [
  // Pay Run 1 — 24 Feb 2025
  { id: 'ps-001', employee: 'Tyler Nguyen',   payPeriod: '10–23 Feb 2025', payDate: '2025-02-24', gross: 4500.00, net: 3487.50, status: 'VIEWED'     },
  { id: 'ps-002', employee: 'Marcus Chen',    payPeriod: '10–23 Feb 2025', payDate: '2025-02-24', gross: 3800.00, net: 2960.00, status: 'VIEWED'     },
  { id: 'ps-003', employee: 'Sofia Andersen', payPeriod: '10–23 Feb 2025', payDate: '2025-02-24', gross: 5200.00, net: 3978.00, status: 'SENT'       },
  { id: 'ps-004', employee: 'James Thornton', payPeriod: '10–23 Feb 2025', payDate: '2025-02-24', gross: 6000.00, net: 4520.00, status: 'SENT'       },
  { id: 'ps-005', employee: 'Priya Patel',    payPeriod: '10–23 Feb 2025', payDate: '2025-02-24', gross: 4200.00, net: 3276.00, status: 'VIEWED'     },
  { id: 'ps-006', employee: "Liam O'Brien",   payPeriod: '10–23 Feb 2025', payDate: '2025-02-24', gross: 3500.00, net: 2730.00, status: 'SENT'       },
  // Pay Run 2 — 10 Mar 2025
  { id: 'ps-007', employee: 'Tyler Nguyen',   payPeriod: '24 Feb–9 Mar 2025', payDate: '2025-03-10', gross: 4712.50, net: 3644.69, status: 'GENERATED' },
  { id: 'ps-008', employee: 'Marcus Chen',    payPeriod: '24 Feb–9 Mar 2025', payDate: '2025-03-10', gross: 3800.00, net: 2960.00, status: 'GENERATED' },
  { id: 'ps-009', employee: 'Sofia Andersen', payPeriod: '24 Feb–9 Mar 2025', payDate: '2025-03-10', gross: 5200.00, net: 3978.00, status: 'GENERATED' },
  { id: 'ps-010', employee: 'James Thornton', payPeriod: '24 Feb–9 Mar 2025', payDate: '2025-03-10', gross: 6000.00, net: 4520.00, status: 'SENT'      },
  { id: 'ps-011', employee: 'Priya Patel',    payPeriod: '24 Feb–9 Mar 2025', payDate: '2025-03-10', gross: 4200.00, net: 3276.00, status: 'GENERATED' },
  { id: 'ps-012', employee: "Liam O'Brien",   payPeriod: '24 Feb–9 Mar 2025', payDate: '2025-03-10', gross: 3500.00, net: 2730.00, status: 'GENERATED' },
];

const employees = Array.from(new Set(payslips.map((p) => p.employee)));
const payRuns = Array.from(new Set(payslips.map((p) => p.payPeriod)));

const statusConfig: Record<PayslipStatus, { label: string; className: string }> = {
  GENERATED: { label: 'Generated', className: 'bg-gray-100 text-gray-600'   },
  SENT:      { label: 'Sent',      className: 'bg-blue-100 text-blue-700'   },
  VIEWED:    { label: 'Viewed',    className: 'bg-green-100 text-green-700' },
};

export default function PayslipsPage() {
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [payRunFilter, setPayRunFilter] = useState('all');

  const filtered = payslips.filter((p) => {
    if (employeeFilter !== 'all' && p.employee !== employeeFilter) return false;
    if (payRunFilter !== 'all' && p.payPeriod !== payRunFilter) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Payslips"
        description="View and distribute employee payslips"
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="h-9 w-48">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={payRunFilter} onValueChange={setPayRunFilter}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="All pay runs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pay Runs</SelectItem>
              {payRuns.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-gray-500">{filtered.length} payslip{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase">Employee</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase">Pay Period</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase">Pay Date</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Gross</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Net</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase">Status</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ps) => {
                const cfg = statusConfig[ps.status];
                return (
                  <TableRow key={ps.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{ps.employee}</TableCell>
                    <TableCell className="text-sm text-gray-600">{ps.payPeriod}</TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(ps.payDate)}</TableCell>
                    <TableCell className="text-sm text-right font-mono text-gray-900">{formatCurrency(ps.gross)}</TableCell>
                    <TableCell className="text-sm text-right font-mono font-medium text-gray-900">{formatCurrency(ps.net)}</TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.className)}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Resend"
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Resend
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500 text-sm">
                    No payslips found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
