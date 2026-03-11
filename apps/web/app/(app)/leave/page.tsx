'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, Plus } from 'lucide-react';

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface LeaveRequest {
  id: string;
  employee: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  note: string;
}

interface LeaveBalance {
  employee: string;
  annual: number;
  personal: number;
  longService: number;
}

interface LeaveType {
  id: string;
  name: string;
  accrualRate: string;
  maxBalance: string;
  paid: boolean;
}

const initialRequests: LeaveRequest[] = [
  {
    id: 'lr-001',
    employee: 'James Thornton',
    leaveType: 'Annual Leave',
    startDate: '2025-04-14',
    endDate: '2025-04-18',
    days: 5,
    status: 'PENDING',
    note: 'Family holiday',
  },
  {
    id: 'lr-002',
    employee: 'Sofia Andersen',
    leaveType: 'Personal Leave',
    startDate: '2025-03-25',
    endDate: '2025-03-26',
    days: 2,
    status: 'PENDING',
    note: 'Medical appointment',
  },
  {
    id: 'lr-003',
    employee: 'Marcus Chen',
    leaveType: 'Annual Leave',
    startDate: '2025-03-03',
    endDate: '2025-03-07',
    days: 5,
    status: 'APPROVED',
    note: '',
  },
];

const leaveBalances: LeaveBalance[] = [
  { employee: 'Tyler Nguyen',    annual: 18.5, personal: 8,   longService: 0   },
  { employee: 'Marcus Chen',     annual: 12.0, personal: 10,  longService: 0   },
  { employee: 'Sofia Andersen',  annual: 22.5, personal: 6,   longService: 0   },
  { employee: 'James Thornton',  annual: 15.0, personal: 10,  longService: 0   },
  { employee: 'Priya Patel',     annual: 8.5,  personal: 10,  longService: 0   },
  { employee: 'Liam O\'Brien',   annual: 42.0, personal: 7,   longService: 13  },
];

const leaveTypes: LeaveType[] = [
  { id: 'lt-1', name: 'Annual Leave',       accrualRate: '4 weeks per year',     maxBalance: '40 days',   paid: true  },
  { id: 'lt-2', name: 'Personal Leave',     accrualRate: '10 days per year',     maxBalance: '—',         paid: true  },
  { id: 'lt-3', name: 'Long Service Leave', accrualRate: '1 week per 60 worked', maxBalance: '—',         paid: true  },
  { id: 'lt-4', name: 'Parental Leave',     accrualRate: 'As per NES',           maxBalance: '—',         paid: false },
  { id: 'lt-5', name: 'Unpaid Leave',       accrualRate: 'N/A',                  maxBalance: '—',         paid: false },
];

const statusConfig: Record<LeaveStatus, { label: string; className: string }> = {
  PENDING:  { label: 'Pending',  className: 'bg-amber-100 text-amber-700'  },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700'  },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700'     },
};

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState('requests');

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'APPROVED' } : r));
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r));
  };

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Manage employee leave requests and balances"
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white h-8">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Record Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record Leave</DialogTitle>
                <DialogDescription>Manually record leave for an employee.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <Select>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveBalances.map((b) => (
                        <SelectItem key={b.employee} value={b.employee}>{b.employee}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <Select>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.name}>{lt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <Input type="date" className="h-9" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <Input type="date" className="h-9" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <Input className="h-9" placeholder="Optional note" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white">Save</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="balances">Leave Balances</TabsTrigger>
            <TabsTrigger value="types">Leave Types</TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Employee</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Leave Type</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Dates</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Days</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Note</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => {
                    const cfg = statusConfig[req.status];
                    return (
                      <TableRow key={req.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">{req.employee}</TableCell>
                        <TableCell className="text-sm text-gray-600">{req.leaveType}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(req.startDate)} – {formatDate(req.endDate)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">{req.days}d</TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.className)}>
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{req.note || '—'}</TableCell>
                        <TableCell className="text-right">
                          {req.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Approve"
                                onClick={() => handleApprove(req.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                title="Reject"
                                onClick={() => handleReject(req.id)}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Leave Balances Tab */}
          <TabsContent value="balances">
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Employee</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Annual Leave (days)</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Personal Leave (days)</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Long Service (days)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveBalances.map((bal) => (
                    <TableRow key={bal.employee} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{bal.employee}</TableCell>
                      <TableCell className="text-sm text-right">
                        <span className={cn(bal.annual < 5 ? 'text-amber-600 font-medium' : 'text-gray-900')}>
                          {bal.annual.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-right text-gray-900">{bal.personal.toFixed(1)}</TableCell>
                      <TableCell className="text-sm text-right text-gray-900">
                        {bal.longService > 0 ? bal.longService.toFixed(1) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Leave Types Tab */}
          <TabsContent value="types">
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Leave Type</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Accrual Rate</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Max Balance</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((lt) => (
                    <TableRow key={lt.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{lt.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{lt.accrualRate}</TableCell>
                      <TableCell className="text-sm text-gray-600">{lt.maxBalance}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          lt.paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        )}>
                          {lt.paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
