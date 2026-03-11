'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Building2,
  CreditCard,
  ListChecks,
  CalendarDays,
  ShieldCheck,
  Download,
  Bell,
  Receipt,
} from 'lucide-react';

type SettingsSection =
  | 'organisation'
  | 'payroll'
  | 'pay-items'
  | 'leave-types'
  | 'approvals'
  | 'bank-export'
  | 'notifications'
  | 'billing';

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'organisation',  label: 'Organisation',  icon: Building2   },
  { id: 'payroll',       label: 'Payroll',        icon: CreditCard  },
  { id: 'pay-items',     label: 'Pay Items',      icon: ListChecks  },
  { id: 'leave-types',   label: 'Leave Types',    icon: CalendarDays},
  { id: 'approvals',     label: 'Approvals',      icon: ShieldCheck },
  { id: 'bank-export',   label: 'Bank Export',    icon: Download    },
  { id: 'notifications', label: 'Notifications',  icon: Bell        },
  { id: 'billing',       label: 'Billing',        icon: Receipt     },
];

interface PayItem {
  id: string;
  name: string;
  type: string;
  rate: string;
  taxable: boolean;
}

const payItems: PayItem[] = [
  { id: 'pi-1', name: 'Base Salary',       type: 'Ordinary',  rate: 'Annual salary',    taxable: true  },
  { id: 'pi-2', name: 'Hourly Rate',        type: 'Ordinary',  rate: '$32.50/hr',        taxable: true  },
  { id: 'pi-3', name: 'Tool Allowance',     type: 'Allowance', rate: '$50.00/week',      taxable: false },
  { id: 'pi-4', name: 'Overtime 1.5x',      type: 'Overtime',  rate: '1.5× base rate',  taxable: true  },
  { id: 'pi-5', name: 'Annual Leave Payout', type: 'Leave',    rate: 'Ordinary rate',   taxable: true  },
];

// Organisation form state
interface OrgForm {
  businessName: string;
  abn: string;
  address: string;
  timezone: string;
  currency: string;
}

// Payroll form state
interface PayrollForm {
  superRate: string;
  stpEnabled: boolean;
  roundingRule: string;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('organisation');
  const [orgSaved, setOrgSaved] = useState(false);

  const [orgForm, setOrgForm] = useState<OrgForm>({
    businessName: 'Acme Construction Pty Ltd',
    abn: '51 824 753 556',
    address: '42 Builder St, Sydney NSW 2000',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
  });

  const [payrollForm, setPayrollForm] = useState<PayrollForm>({
    superRate: '11.5',
    stpEnabled: true,
    roundingRule: 'nearest-cent',
  });

  const handleOrgSave = () => {
    setOrgSaved(true);
    setTimeout(() => setOrgSaved(false), 2500);
  };

  return (
    <div>
      <PageHeader title="Settings" description="Configure your PayCraft account" />

      <div className="flex min-h-0 flex-1">
        {/* Left sidebar nav */}
        <aside className="w-52 shrink-0 border-r border-gray-200 bg-gray-50 p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    activeSection === item.id
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">

          {/* Organisation */}
          {activeSection === 'organisation' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Organisation</h2>
                <p className="text-sm text-gray-500 mt-0.5">Basic business details shown on payslips and reports.</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <Input
                    value={orgForm.businessName}
                    onChange={(e) => setOrgForm((f) => ({ ...f, businessName: e.target.value }))}
                    className="h-9 max-w-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ABN</label>
                  <Input
                    value={orgForm.abn}
                    onChange={(e) => setOrgForm((f) => ({ ...f, abn: e.target.value }))}
                    className="h-9 max-w-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input
                    value={orgForm.address}
                    onChange={(e) => setOrgForm((f) => ({ ...f, address: e.target.value }))}
                    className="h-9 max-w-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <Select
                      value={orgForm.timezone}
                      onValueChange={(v) => setOrgForm((f) => ({ ...f, timezone: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                        <SelectItem value="Australia/Melbourne">Australia/Melbourne</SelectItem>
                        <SelectItem value="Australia/Brisbane">Australia/Brisbane</SelectItem>
                        <SelectItem value="Australia/Perth">Australia/Perth</SelectItem>
                        <SelectItem value="Australia/Adelaide">Australia/Adelaide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <Select
                      value={orgForm.currency}
                      onValueChange={(v) => setOrgForm((f) => ({ ...f, currency: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                        <SelectItem value="NZD">NZD — New Zealand Dollar</SelectItem>
                        <SelectItem value="USD">USD — US Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  className="bg-brand-600 hover:bg-brand-700 text-white h-8"
                  onClick={handleOrgSave}
                >
                  {orgSaved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Payroll */}
          {activeSection === 'payroll' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Payroll Settings</h2>
                <p className="text-sm text-gray-500 mt-0.5">Super, STP, and calculation preferences.</p>
              </div>
              <Separator />
              <div className="space-y-5">
                <div className="flex items-center justify-between max-w-sm">
                  <div>
                    <p className="text-sm font-medium text-gray-900">STP Reporting</p>
                    <p className="text-xs text-gray-500">Submit payroll data to the ATO each pay run</p>
                  </div>
                  <Switch
                    checked={payrollForm.stpEnabled}
                    onCheckedChange={(v) => setPayrollForm((f) => ({ ...f, stpEnabled: v }))}
                  />
                </div>
                <Separator />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Superannuation Rate (%)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    value={payrollForm.superRate}
                    onChange={(e) => setPayrollForm((f) => ({ ...f, superRate: e.target.value }))}
                    className="h-9 w-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current mandatory rate: 11.5% (FY2025)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rounding Rule</label>
                  <Select
                    value={payrollForm.roundingRule}
                    onValueChange={(v) => setPayrollForm((f) => ({ ...f, roundingRule: v }))}
                  >
                    <SelectTrigger className="h-9 w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearest-cent">Nearest cent</SelectItem>
                      <SelectItem value="round-up">Always round up</SelectItem>
                      <SelectItem value="round-down">Always round down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white h-8">
                Save Changes
              </Button>
            </div>
          )}

          {/* Pay Items */}
          {activeSection === 'pay-items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Pay Items</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Earnings types used in pay runs.</p>
                </div>
                <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white h-8">
                  + Add Pay Item
                </Button>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase">Rate</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase">Taxable</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{item.type}</TableCell>
                        <TableCell className="text-sm font-mono text-gray-600">{item.rate}</TableCell>
                        <TableCell>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            item.taxable ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {item.taxable ? 'Taxable' : 'Non-taxable'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-600">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Other sections — placeholder */}
          {!['organisation', 'payroll', 'pay-items'].includes(activeSection) && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {navItems.find((n) => n.id === activeSection)?.label}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Configure your {navItems.find((n) => n.id === activeSection)?.label.toLowerCase()} settings.</p>
              </div>
              <Separator />
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-gray-500">
                    {navItems.find((n) => n.id === activeSection)?.label} settings coming soon.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
