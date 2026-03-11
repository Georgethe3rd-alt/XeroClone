'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalendarDays, Users, Edit, Plus } from 'lucide-react';

interface PaySchedule {
  id: string;
  name: string;
  frequency: 'Weekly' | 'Fortnightly' | 'Monthly' | 'Semi-monthly';
  nextPayDate: string;
  nextPeriodStart: string;
  nextPeriodEnd: string;
  employeeCount: number;
  employees: string[];
  active: boolean;
}

const schedules: PaySchedule[] = [
  {
    id: 'ps-1',
    name: 'Fortnightly',
    frequency: 'Fortnightly',
    nextPayDate: '2 Apr 2025',
    nextPeriodStart: '17 Mar 2025',
    nextPeriodEnd: '30 Mar 2025',
    employeeCount: 5,
    employees: ['Tyler Nguyen', 'Marcus Chen', 'Sofia Andersen', 'James Thornton', 'Priya Patel'],
    active: true,
  },
  {
    id: 'ps-2',
    name: 'Weekly',
    frequency: 'Weekly',
    nextPayDate: '26 Mar 2025',
    nextPeriodStart: '17 Mar 2025',
    nextPeriodEnd: '23 Mar 2025',
    employeeCount: 1,
    employees: ["Liam O'Brien"],
    active: true,
  },
];

const frequencyColors: Record<PaySchedule['frequency'], string> = {
  Weekly:       'bg-blue-100 text-blue-700',
  Fortnightly:  'bg-indigo-100 text-indigo-700',
  Monthly:      'bg-purple-100 text-purple-700',
  'Semi-monthly': 'bg-violet-100 text-violet-700',
};

export default function PaySchedulesPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingSchedule = schedules.find((s) => s.id === editingId) ?? null;

  return (
    <div>
      <PageHeader
        title="Pay Schedules"
        description="Manage pay frequencies for your employees"
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white h-8">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Pay Schedule</DialogTitle>
                <DialogDescription>Create a new pay schedule for your employees.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
                  <Input className="h-9" placeholder="e.g. Monthly Salaried" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <Select>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="semi-monthly">Semi-monthly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Pay Date</label>
                  <Input type="date" className="h-9" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white">Create Schedule</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">{schedule.name}</CardTitle>
                    <span className={cn(
                      'mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      frequencyColors[schedule.frequency]
                    )}>
                      {schedule.frequency}
                    </span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingId(schedule.id)}
                      >
                        <Edit className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit {editingSchedule?.name ?? 'Schedule'}</DialogTitle>
                        <DialogDescription>Update pay schedule settings.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
                          <Input className="h-9" defaultValue={editingSchedule?.name} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                          <Select defaultValue={editingSchedule?.frequency.toLowerCase()}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="fortnightly">Fortnightly</SelectItem>
                              <SelectItem value="semi-monthly">Semi-monthly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
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
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Next Pay Date</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-brand-600" />
                      {schedule.nextPayDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Employees</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-brand-600" />
                      {schedule.employeeCount}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Next Period</p>
                  <p className="text-sm text-gray-700">
                    {schedule.nextPeriodStart} – {schedule.nextPeriodEnd}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Employees on this schedule</p>
                  <div className="flex flex-wrap gap-1.5">
                    {schedule.employees.map((emp) => (
                      <span
                        key={emp}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {emp}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                  View Pay Runs
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
