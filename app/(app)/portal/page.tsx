'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  CalendarDays,
  DollarSign,
  Clock,
  Download,
  ArrowRight,
  FileText,
} from 'lucide-react';

interface Payslip {
  id: string;
  payPeriod: string;
  payDate: string;
  gross: number;
  net: number;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const recentPayslips: Payslip[] = [
  { id: 'ps-004', payPeriod: '24 Feb–9 Mar 2025',  payDate: '2025-03-10', gross: 6000.00, net: 4520.00 },
  { id: 'ps-010', payPeriod: '10–23 Feb 2025',     payDate: '2025-02-24', gross: 6000.00, net: 4520.00 },
  { id: 'ps-016', payPeriod: '27 Jan–9 Feb 2025',  payDate: '2025-02-10', gross: 6000.00, net: 4520.00 },
];

const pendingLeave: LeaveRequest = {
  id: 'lr-001',
  leaveType: 'Annual Leave',
  startDate: '2025-04-14',
  endDate: '2025-04-18',
  days: 5,
  status: 'PENDING',
};

const statusConfig = {
  PENDING:  { label: 'Pending',  className: 'bg-amber-100 text-amber-700'  },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700'  },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700'     },
};

export default function PortalPage() {
  const ytdEarnings = recentPayslips.length * 6000; // simplified YTD
  const annualLeaveBalance = 15.0;
  const personalLeaveBalance = 10.0;

  return (
    <div>
      <PageHeader
        title="My Payroll"
        description="Welcome back, James Thornton"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/portal/timesheets">
              <Button variant="outline" size="sm" className="h-8">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Submit Timesheet
              </Button>
            </Link>
            <Link href="/portal/leave">
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white h-8">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                Request Leave
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            title="Current Pay Period"
            value="10–23 Mar 2025"
            subtitle="Pay date: 24 Mar 2025"
            icon={CalendarDays}
          />
          <StatsCard
            title="YTD Gross Earnings"
            value={formatCurrency(ytdEarnings)}
            subtitle="Financial year to date"
            icon={DollarSign}
            variant="success"
          />
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Leave Balances</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Annual Leave</span>
                <span className="text-sm font-semibold text-gray-900">{annualLeaveBalance} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Personal Leave</span>
                <span className="text-sm font-semibold text-gray-900">{personalLeaveBalance} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending leave request */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Pending Leave Request</p>
                  <p className="text-xs text-gray-600">
                    {pendingLeave.leaveType} · {formatDate(pendingLeave.startDate)} – {formatDate(pendingLeave.endDate)} · {pendingLeave.days} days
                  </p>
                </div>
              </div>
              <span className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                statusConfig[pendingLeave.status].className
              )}>
                {statusConfig[pendingLeave.status].label}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent payslips */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">Recent Payslips</CardTitle>
            <Link href="/portal/payslips">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-brand-600 hover:text-brand-700">
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase pl-6">Pay Period</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">Pay Date</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Gross</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Net Pay</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right pr-6">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayslips.map((ps) => (
                  <TableRow key={ps.id} className="hover:bg-gray-50">
                    <TableCell className="pl-6 text-sm font-medium text-gray-900">{ps.payPeriod}</TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(ps.payDate)}</TableCell>
                    <TableCell className="text-sm text-right font-mono text-gray-900">{formatCurrency(ps.gross)}</TableCell>
                    <TableCell className="text-sm text-right font-mono font-semibold text-gray-900">{formatCurrency(ps.net)}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/portal/leave">
              <Button variant="outline" size="sm" className="h-9">
                <CalendarDays className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
            </Link>
            <Link href="/portal/timesheets">
              <Button variant="outline" size="sm" className="h-9">
                <Clock className="h-4 w-4 mr-2" />
                Submit Timesheet
              </Button>
            </Link>
            <Link href="/portal/payslips">
              <Button variant="outline" size="sm" className="h-9">
                <FileText className="h-4 w-4 mr-2" />
                View All Payslips
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
