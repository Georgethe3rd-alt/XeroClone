'use client';

import { useState } from 'react';
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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Send, Download } from 'lucide-react';

type FilingStatus = 'ACCEPTED' | 'PENDING' | 'FAILED' | 'NOT_SUBMITTED';

interface FilingRecord {
  id: string;
  type: string;
  payRun: string;
  submittedDate: string;
  status: FilingStatus;
  reference: string;
}

const filingHistory: FilingRecord[] = [
  { id: 'f-001', type: 'STP Full File',  payRun: '24 Feb–9 Mar 2025',  submittedDate: '10 Mar 2025',  status: 'PENDING',        reference: 'STP-2025-0310-A' },
  { id: 'f-002', type: 'STP Full File',  payRun: '10–23 Feb 2025',     submittedDate: '24 Feb 2025',  status: 'ACCEPTED',       reference: 'STP-2025-0224-A' },
  { id: 'f-003', type: 'STP Full File',  payRun: '27 Jan–9 Feb 2025',  submittedDate: '10 Feb 2025',  status: 'ACCEPTED',       reference: 'STP-2025-0210-B' },
  { id: 'f-004', type: 'STP Full File',  payRun: '13–26 Jan 2025',     submittedDate: '27 Jan 2025',  status: 'ACCEPTED',       reference: 'STP-2025-0127-A' },
  { id: 'f-005', type: 'STP Update',     payRun: '30 Dec–12 Jan 2025', submittedDate: '13 Jan 2025',  status: 'ACCEPTED',       reference: 'STP-2025-0113-C' },
];

const statusConfig: Record<FilingStatus, { label: string; className: string; icon: React.ElementType }> = {
  ACCEPTED:      { label: 'Accepted',      className: 'bg-green-100 text-green-700', icon: CheckCircle2  },
  PENDING:       { label: 'Pending',       className: 'bg-amber-100 text-amber-700', icon: AlertCircle   },
  FAILED:        { label: 'Failed',        className: 'bg-red-100 text-red-700',     icon: AlertCircle   },
  NOT_SUBMITTED: { label: 'Not Submitted', className: 'bg-gray-100 text-gray-600',   icon: AlertCircle   },
};

interface ComplianceItem {
  id: string;
  label: string;
  checked: boolean;
  due?: string;
}

const initialChecklist: ComplianceItem[] = [
  { id: 'c-1', label: 'TFN declarations filed',           checked: true  },
  { id: 'c-2', label: 'Super payments up to date',        checked: true  },
  { id: 'c-3', label: 'STP finalisation due 14 Jul 2025', checked: false, due: '14 Jul 2025' },
  { id: 'c-4', label: 'FY2025 PAYG Summaries',            checked: false },
];

export default function FilingPage() {
  const [checklist, setChecklist] = useState<ComplianceItem[]>(initialChecklist);
  const [basPeriod, setBasPeriod] = useState('Q3-FY2025');

  const lastAccepted = filingHistory.find((f) => f.status === 'ACCEPTED');

  const toggleCheck = (id: string) => {
    setChecklist((prev) => prev.map((c) => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  return (
    <div>
      <PageHeader
        title="Filing & Compliance"
        description="ATO Single Touch Payroll submissions and compliance tracking"
      />

      <div className="p-6 space-y-6">
        {/* STP Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">ATO Single Touch Payroll (STP)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">STP Connected — ATO Portal Active</p>
                  <p className="text-xs text-gray-500">
                    Last accepted submission: {lastAccepted?.submittedDate ?? '—'} &nbsp;·&nbsp; Ref: {lastAccepted?.reference ?? '—'}
                  </p>
                </div>
              </div>
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white h-8">
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Submit New Declaration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filing History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Filing History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase pl-6">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">Pay Run</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">Submitted</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">Reference</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filingHistory.map((record) => {
                  const cfg = statusConfig[record.status];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="pl-6 text-sm font-medium text-gray-900">{record.type}</TableCell>
                      <TableCell className="text-sm text-gray-600">{record.payRun}</TableCell>
                      <TableCell className="text-sm text-gray-600">{record.submittedDate}</TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.className)}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-500">{record.reference}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-600">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* BAS / PAYG Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">BAS / PAYG Withholding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
                <Select value={basPeriod} onValueChange={setBasPeriod}>
                  <SelectTrigger className="h-9 w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q3-FY2025">Q3 FY2025 (Jan–Mar)</SelectItem>
                    <SelectItem value="Q2-FY2025">Q2 FY2025 (Oct–Dec)</SelectItem>
                    <SelectItem value="Q1-FY2025">Q1 FY2025 (Jul–Sep)</SelectItem>
                    <SelectItem value="Q4-FY2024">Q4 FY2024 (Apr–Jun)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-5">
                <Button variant="outline" size="sm" className="h-9">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export PAYG Summary
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Gross Wages</p>
                <p className="mt-1 text-xl font-bold text-gray-900">$81,612.50</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">PAYG Withheld</p>
                <p className="mt-1 text-xl font-bold text-red-600">$19,635.00</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Super Contributions</p>
                <p className="mt-1 text-xl font-bold text-amber-600">$8,590.31</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Compliance Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={() => toggleCheck(item.id)}
                />
                <label
                  htmlFor={item.id}
                  className={cn(
                    'text-sm cursor-pointer flex-1',
                    item.checked ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'
                  )}
                >
                  {item.label}
                  {item.due && !item.checked && (
                    <span className="ml-2 text-xs text-amber-600 font-normal no-underline">Due {item.due}</span>
                  )}
                </label>
                {item.checked && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                )}
                {!item.checked && (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
