'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import { Download, FileText, Users } from 'lucide-react';

type PaymentStatus = 'PENDING' | 'PROCESSED';

interface Payment {
  id: string;
  employee: string;
  bsb: string;
  account: string;
  bankName: string;
  netPay: number;
  status: PaymentStatus;
}

const initialPayments: Payment[] = [
  { id: 'pay-001', employee: 'Tyler Nguyen',   bsb: '062-000', account: '1234 5678', bankName: 'Commonwealth',  netPay: 3644.69, status: 'PENDING'   },
  { id: 'pay-002', employee: 'Marcus Chen',    bsb: '033-000', account: '9876 5432', bankName: 'Westpac',        netPay: 2960.00, status: 'PENDING'   },
  { id: 'pay-003', employee: 'Sofia Andersen', bsb: '012-000', account: '1122 3344', bankName: 'ANZ',            netPay: 3978.00, status: 'PENDING'   },
  { id: 'pay-004', employee: 'James Thornton', bsb: '082-000', account: '5566 7788', bankName: 'NAB',            netPay: 4520.00, status: 'PENDING'   },
  { id: 'pay-005', employee: 'Priya Patel',    bsb: '062-000', account: '2233 4455', bankName: 'Commonwealth',  netPay: 3276.00, status: 'PENDING'   },
  { id: 'pay-006', employee: "Liam O'Brien",   bsb: '033-000', account: '6677 8899', bankName: 'Westpac',        netPay: 2730.00, status: 'PENDING'   },
];

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING:   { label: 'Pending',   className: 'bg-amber-100 text-amber-700'  },
  PROCESSED: { label: 'Processed', className: 'bg-green-100 text-green-700'  },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);

  const total = payments.reduce((s, p) => s + p.netPay, 0);
  const pending = payments.filter((p) => p.status === 'PENDING');
  const pendingTotal = pending.reduce((s, p) => s + p.netPay, 0);

  const handleMarkProcessed = (id: string) => {
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: 'PROCESSED' } : p));
  };

  const handleProcessAll = () => {
    setPayments((prev) => prev.map((p) => ({ ...p, status: 'PROCESSED' })));
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Bank payments for the current pay run — 24 Feb–9 Mar 2025"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white h-8">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export ABA File
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            title="Total Pending"
            value={formatCurrency(pendingTotal)}
            subtitle={`${pending.length} employee${pending.length !== 1 ? 's' : ''}`}
            icon={Users}
            variant={pending.length > 0 ? 'warning' : 'success'}
          />
          <StatsCard
            title="Total Pay Run"
            value={formatCurrency(total)}
            subtitle="6 employees"
            icon={Users}
          />
          <StatsCard
            title="Processed"
            value={payments.filter((p) => p.status === 'PROCESSED').length}
            subtitle={`of ${payments.length} payments`}
            icon={Users}
            variant="success"
          />
        </div>

        {/* Process All button */}
        {pending.length > 0 && (
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white h-8"
              onClick={handleProcessAll}
            >
              Mark All as Processed
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase">Employee</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase">Bank</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase">BSB</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase">Account</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Net Pay</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase">Status</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const cfg = statusConfig[p.status];
                return (
                  <TableRow key={p.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{p.employee}</TableCell>
                    <TableCell className="text-sm text-gray-600">{p.bankName}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-600">{p.bsb}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-600">{p.account}</TableCell>
                    <TableCell className="text-sm text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(p.netPay)}
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.className)}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleMarkProcessed(p.id)}
                        >
                          Mark Processed
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
