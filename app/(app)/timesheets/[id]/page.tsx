'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
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
import { Separator } from '@/components/ui/separator';
import { cn, formatHours } from '@/lib/utils';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

type Status = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

interface DayEntry {
  date: string;
  day: string;
  start: string;
  end: string;
  breakMin: number;
  regular: number;
  overtime: number;
  notes: string;
}

const dailyEntries: DayEntry[] = [
  { date: '03 Mar 2025', day: 'Monday',    start: '07:00', end: '15:30', breakMin: 30, regular: 8,   overtime: 0,   notes: '' },
  { date: '04 Mar 2025', day: 'Tuesday',   start: '07:00', end: '15:30', breakMin: 30, regular: 8,   overtime: 0,   notes: '' },
  { date: '05 Mar 2025', day: 'Wednesday', start: '07:00', end: '15:30', breakMin: 30, regular: 8,   overtime: 0,   notes: '' },
  { date: '06 Mar 2025', day: 'Thursday',  start: '07:00', end: '15:30', breakMin: 30, regular: 8,   overtime: 0,   notes: '' },
  { date: '07 Mar 2025', day: 'Friday',    start: '07:00', end: '16:30', breakMin: 30, regular: 9,   overtime: 1,   notes: 'Project deadline' },
  { date: '08 Mar 2025', day: 'Saturday',  start: '08:00', end: '10:30', breakMin: 0,  regular: 0,   overtime: 2.5, notes: 'Emergency callout' },
];

const approvalHistory = [
  { date: '09 Mar 2025 17:05', action: 'Submitted', by: 'Tyler Nguyen', note: 'Submitted for review' },
];

export default function TimesheetDetailPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<Status>('SUBMITTED');
  const [comment, setComment] = useState('');
  const [history, setHistory] = useState(approvalHistory);

  const totalRegular = dailyEntries.reduce((s, d) => s + d.regular, 0);
  const totalOvertime = dailyEntries.reduce((s, d) => s + d.overtime, 0);
  const totalHours = totalRegular + totalOvertime;

  const statusConfig: Record<Status, { label: string; className: string }> = {
    SUBMITTED: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
    APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  };

  const cfg = statusConfig[status];

  const handleAction = (action: 'APPROVED' | 'REJECTED') => {
    setStatus(action);
    setHistory((prev) => [
      ...prev,
      {
        date: new Date().toLocaleString('en-AU', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
        action: action === 'APPROVED' ? 'Approved' : 'Rejected',
        by: 'Sarah Admin',
        note: comment || (action === 'APPROVED' ? 'Approved.' : 'Rejected.'),
      },
    ]);
    setComment('');
  };

  return (
    <div>
      <PageHeader
        title="Tyler Nguyen — 3–9 Mar 2025"
        description="Weekly Timesheet"
        actions={
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.className)}>
              {cfg.label}
            </span>
            {status === 'SUBMITTED' && (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white h-8"
                  onClick={() => handleAction('APPROVED')}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 h-8"
                  onClick={() => handleAction('REJECTED')}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Reject
                </Button>
              </>
            )}
            <Link href="/timesheets">
              <Button variant="outline" size="sm" className="h-8">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Daily breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase pl-6">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">Day</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">Start</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">End</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Break</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Regular</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Overtime</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyEntries.map((entry) => (
                  <TableRow key={entry.date} className="hover:bg-gray-50">
                    <TableCell className="pl-6 text-sm text-gray-900">{entry.date}</TableCell>
                    <TableCell className="text-sm text-gray-600">{entry.day}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-900">{entry.start}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-900">{entry.end}</TableCell>
                    <TableCell className="text-sm text-right text-gray-600">
                      {entry.breakMin > 0 ? `${entry.breakMin}m` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono">
                      {entry.regular > 0 ? formatHours(entry.regular) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono">
                      {entry.overtime > 0 ? (
                        <span className="text-amber-600">{formatHours(entry.overtime)}</span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{entry.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Regular Hours</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatHours(totalRegular)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Overtime Hours</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{formatHours(totalOvertime)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Hours</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatHours(totalHours)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments / Notes */}
        {status === 'SUBMITTED' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Add Comment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Optional note for approval or rejection..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </CardContent>
          </Card>
        )}

        {/* Approval history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Approval History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {h.action}{' '}
                    <span className="font-normal text-gray-500">by {h.by}</span>
                  </p>
                  {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                  <p className="text-xs text-gray-400">{h.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
