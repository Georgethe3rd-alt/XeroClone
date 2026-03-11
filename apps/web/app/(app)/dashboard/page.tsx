"use client";

import Link from "next/link";
import {
  Users,
  DollarSign,
  Clock,
  Umbrella,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  CalendarDays,
  TrendingUp,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/stats-card";
import { PageHeader } from "@/components/page-header";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  DEMO_ORG,
  DEMO_PAY_RUNS,
  DEMO_LEAVE_REQUESTS,
  DEMO_TIMESHEETS,
  DEMO_NOTIFICATIONS,
  DEMO_PAY_RUN_ITEMS,
} from "@/lib/demo-data";

const nextPayRun = DEMO_PAY_RUNS.find((r) => r.status === "DRAFT")!;
const pendingLeave = DEMO_LEAVE_REQUESTS.filter((r) => r.status === "PENDING");
const pendingTimesheets = DEMO_TIMESHEETS.filter((r) => r.status === "SUBMITTED");
const nextPayRunItems = DEMO_PAY_RUN_ITEMS.filter((i) => i.payRunId === nextPayRun.id);

function NotificationIcon({ type }: { type: string }) {
  if (type === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (type === "success") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (type === "info") return <Info className="h-4 w-4 text-blue-500" />;
  return <Info className="h-4 w-4 text-gray-400" />;
}

export default function DashboardPage() {
  const today = new Date("2025-03-10");
  const formattedToday = today.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Dashboard"
        description={`${DEMO_ORG.name} · ${formattedToday}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/employees">
                <Users className="mr-1.5 h-4 w-4" />
                Employees
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/pay-runs">
                <DollarSign className="mr-1.5 h-4 w-4" />
                Review Pay Run
              </Link>
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            title="Next Pay Date"
            value="2 Apr 2025"
            subtitle={`${nextPayRun.period}`}
            icon={CalendarDays}
            variant="default"
          />
          <StatsCard
            title="Pending Leave"
            value={pendingLeave.length}
            subtitle="Requests awaiting approval"
            icon={Umbrella}
            variant="warning"
          />
          <StatsCard
            title="Pending Timesheets"
            value={pendingTimesheets.length}
            subtitle="Submitted, needs review"
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Payroll Liabilities"
            value={formatCurrency(nextPayRun.totalTax + nextPayRun.totalSuper)}
            subtitle={`Tax ${formatCurrency(nextPayRun.totalTax)} · Super ${formatCurrency(nextPayRun.totalSuper)}`}
            icon={TrendingUp}
            variant="default"
          />
        </div>

        {/* Compliance Alert Banner */}
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-amber-800">STP Filing Due:</span>{" "}
            <span className="text-amber-700">
              Single Touch Payroll report for Q1 2025 must be submitted by{" "}
              <strong>14 April 2025</strong>. Ensure all pay runs are finalised.
            </span>
          </div>
          <Button variant="outline" size="sm" className="border-amber-300 bg-white text-amber-700 hover:bg-amber-50">
            File Now
          </Button>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Next Pay Run card - spans 2 cols */}
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Current Pay Run</CardTitle>
                <CardDescription className="mt-0.5">
                  {nextPayRun.period} · Pay date{" "}
                  <span className="font-medium text-gray-700">
                    {formatDate(nextPayRun.payDate)}
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  Draft
                </Badge>
                <Button size="sm" asChild>
                  <Link href={`/pay-runs/${nextPayRun.id}`}>
                    Review Pay Run
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            {/* Summary totals */}
            <div className="grid grid-cols-4 gap-px border-y border-gray-100 bg-gray-100 mx-0">
              {[
                { label: "Gross", value: nextPayRun.totalGross },
                { label: "Tax", value: nextPayRun.totalTax },
                { label: "Net", value: nextPayRun.totalNet },
                { label: "Super", value: nextPayRun.totalSuper },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white px-4 py-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="mt-0.5 text-base font-bold text-gray-900">{formatCurrency(value)}</p>
                </div>
              ))}
            </div>

            {/* Per-employee preview */}
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Employee</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-right pr-4">Super</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nextPayRunItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                            {getInitials(`${item.employee.firstName} ${item.employee.lastName}`)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.employee.firstName} {item.employee.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{item.employee.jobTitle}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(item.grossEarnings)}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">{formatCurrency(item.taxWithheld)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(item.netPay)}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600 pr-4">{formatCurrency(item.superContribution)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {DEMO_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                    <div className="mt-0.5 shrink-0">
                      <NotificationIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="p-3">
                <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500">
                  View all activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom two-column: Leave + Timesheets */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Pending Leave */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Pending Leave Requests</CardTitle>
                <CardDescription>{pendingLeave.length} awaiting approval</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/leave">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right pr-4">Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeave.map((req) => (
                    <TableRow key={req.id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                            {getInitials(req.employee.name)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{req.employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{req.leaveType}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(req.startDate)}
                        {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium pr-4">{req.days}d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex gap-2 border-t border-gray-100 p-3">
                <Button size="sm" className="flex-1 text-xs">Approve All</Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs">Review</Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Timesheets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Pending Timesheets</CardTitle>
                <CardDescription>{pendingTimesheets.length} submitted for review</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/timesheets">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right pr-4">OT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTimesheets.map((ts) => (
                    <TableRow key={ts.id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                            {getInitials(ts.employee.name)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{ts.employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{ts.period}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{ts.totalHours}h</TableCell>
                      <TableCell className="text-right text-sm text-gray-600 pr-4">
                        {ts.overtimeHours > 0 ? (
                          <span className="font-medium text-amber-600">{ts.overtimeHours}h</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex gap-2 border-t border-gray-100 p-3">
                <Button size="sm" className="flex-1 text-xs">Approve All</Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs">Review</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance & Quick Stats */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Compliance Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  icon: AlertCircle,
                  color: "text-amber-600",
                  bg: "bg-amber-50 border-amber-200",
                  title: "STP Phase 2 Filing",
                  desc: "Due 14 April 2025 — Q1 2025 Single Touch Payroll submission pending",
                  action: "File Now",
                },
                {
                  icon: FileCheck,
                  color: "text-blue-600",
                  bg: "bg-blue-50 border-blue-200",
                  title: "Super Guarantee Payment",
                  desc: "Q1 contributions due 28 April 2025 · Total: $13,327.00",
                  action: "Schedule Payment",
                },
                {
                  icon: CheckCircle2,
                  color: "text-green-600",
                  bg: "bg-green-50 border-green-200",
                  title: "PAYG Withholding",
                  desc: "February 2025 PAYG lodged and paid — no action required",
                  action: null,
                },
              ].map(({ icon: Icon, color, bg, title, desc, action }) => (
                <div key={title} className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", bg)}>
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", color)} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="mt-0.5 text-xs text-gray-600">{desc}</p>
                  </div>
                  {action && (
                    <Button variant="outline" size="sm" className="text-xs bg-white">
                      {action}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* YTD Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">YTD Summary</CardTitle>
              <CardDescription>FY 2024–25 to date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total Gross Paid", value: 225787.84, color: "text-gray-900" },
                { label: "Total PAYG Tax", value: 55957.00, color: "text-red-600" },
                { label: "Total Super", value: 25975.60, color: "text-indigo-600" },
                { label: "Total Net Paid", value: 169830.84, color: "text-green-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={cn("text-sm font-semibold", color)}>{formatCurrency(value)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-500">6 active employees</span>
                <span className="text-xs text-gray-500">FY ends 30 Jun 2025</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
