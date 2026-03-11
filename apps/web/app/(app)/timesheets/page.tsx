'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn, formatHours, formatDate } from '@/lib/utils';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

interface Timesheet {
  id: string;
  employee: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  overtime: number;
  status: TimesheetStatus;
  submitted: string | null;
}

const timesheets: Timesheet[] = [
  {
    id: 'ts-001',
    employee: 'Tyler Nguyen',
    periodStart: '2025-03-03',
    periodEnd: '2025-03-09',
    totalHours: 42.5,
    overtime: 2.5,
    status: 'SUBMITTED',
    submitted: '2025-03-09',
  },
  {
    id: 'ts-002',
    employee: 'Marcus Chen',
    periodStart: '2025-03-03',
    periodEnd: '2025-03-09',
    totalHours: 38,
    overtime: 0,
    status: 'SUBMITTED',
    submitted: '2025-03-09',
  },
  {
    id: 'ts-003',
    employee: 'Sofia Andersen',
    periodStart: '2025-03-03',
    periodEnd: '2025-03-09',
    totalHours: 40,
    overtime: 0,
    status: 'APPROVED',
    submitted: '2025-03-08',
  },
  {
    id: 'ts-004',
    employee: 'Tyler Nguyen',
    periodStart: '2025-03-10',
    periodEnd: '2025-03-16',
    totalHours: 0,
    overtime: 0,
    status: 'DRAFT',
    submitted: null,
  },
  {
    id: 'ts-005',
    employee: 'James Thornton',
    periodStart: '2025-03-03',
    periodEnd: '2025-03-09',
    totalHours: 0,
    overtime: 0,
    status: 'DRAFT',
    submitted: null,
  },
];

const statusConfig: Record<TimesheetStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  SUBMITTED: { label: 'Submitted', className: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};

export default function TimesheetsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [sheetStatuses, setSheetStatuses] = useState<Record<string, TimesheetStatus>>(
    Object.fromEntries(timesheets.map((t) => [t.id, t.status]))
  );

  const submitted = timesheets.filter((t) => t.status === 'SUBMITTED').length;
  const draft = timesheets.filter((t) => t.status === 'DRAFT').length;
  const approved = timesheets.filter((t) => t.status === 'APPROVED').length;

  const filtered = timesheets.filter((t) => {
    const currentStatus = sheetStatuses[t.id];
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return currentStatus === 'SUBMITTED';
    if (activeTab === 'draft') return currentStatus === 'DRAFT';
    if (activeTab === 'approved') return currentStatus === 'APPROVED';
    return true;
  });

  const handleApprove = (id: string) => {
    setSheetStatuses((prev) => ({ ...prev, [id]: 'APPROVED' }));
  };

  const handleReject = (id: string) => {
    setSheetStatuses((prev) => ({ ...prev, [id]: 'REJECTED' }));
  };

  return (
    <div>
      <PageHeader title="Timesheets" description="Review and approve employee timesheets" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            title="Submitted"
            value={submitted}
            subtitle="Pending review"
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Draft"
            value={draft}
            subtitle="In progress"
            icon={Clock}
          />
          <StatsCard
            title="Approved"
            value={approved}
            subtitle="This period"
            icon={CheckCircle}
            variant="success"
          />
        </div>

        {/* Tabs + Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Employee</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Period</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Total Hours</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Overtime</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Submitted</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ts) => {
                    const currentStatus = sheetStatuses[ts.id];
                    const cfg = statusConfig[currentStatus];
                    return (
                      <TableRow key={ts.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">{ts.employee}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(ts.periodStart)} – {formatDate(ts.periodEnd)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-mono">
                          {ts.totalHours > 0 ? formatHours(ts.totalHours) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-right font-mono">
                          {ts.overtime > 0 ? (
                            <span className="text-amber-600">{formatHours(ts.overtime)}</span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.className)}>
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {ts.submitted ? formatDate(ts.submitted) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/timesheets/${ts.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {currentStatus === 'SUBMITTED' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Approve"
                                  onClick={() => handleApprove(ts.id)}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  title="Reject"
                                  onClick={() => handleReject(ts.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-500 text-sm">
                        No timesheets found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
