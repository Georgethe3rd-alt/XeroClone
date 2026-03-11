"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Building2,
  Briefcase,
  User,
  Clock,
  Shield,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { DEMO_EMPLOYEES } from "@/lib/demo-data";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  TERMINATED: "bg-red-100 text-red-700 border-red-200",
};

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />}
      <div className="flex-1 grid grid-cols-2 gap-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
    </div>
  );
}

function LeaveCard({ title, hours, color }: { title: string; hours: number; color: string }) {
  const days = (hours / 7.6).toFixed(1);
  return (
    <div className={cn("rounded-lg border-2 p-4", color)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-current opacity-70">{title}</p>
      <p className="mt-2 text-3xl font-bold">{hours.toFixed(1)}</p>
      <p className="text-sm opacity-80">hours ({days} days)</p>
    </div>
  );
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employee = DEMO_EMPLOYEES.find((e) => e.id === id);

  if (!employee) {
    notFound();
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mb-3">
          <Link
            href="/employees"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Employees
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xl font-bold">
            {getInitials(fullName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
              <Badge
                variant="outline"
                className={cn("text-xs font-medium", STATUS_STYLES[employee.status])}
              >
                {employee.status.charAt(0) + employee.status.slice(1).toLowerCase()}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              {employee.jobTitle} · {employee.department} ·{" "}
              <span className="font-mono">{employee.employeeCode}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Edit Employee</Button>
            <Button size="sm">Run Pay</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="pay-tax">Pay &amp; Tax</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100">
                  <InfoRow label="Email" icon={Mail} value={
                    <a href={`mailto:${employee.email}`} className="text-brand-600 hover:underline">
                      {employee.email}
                    </a>
                  } />
                  <InfoRow label="Phone" icon={Phone} value={employee.phone} />
                  <InfoRow label="Address" icon={MapPin} value={employee.address} />
                  <InfoRow label="Date of Birth" icon={User} value={formatDate(employee.dateOfBirth)} />
                </CardContent>
              </Card>

              {/* Employment Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Employment Summary</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100">
                  <InfoRow label="Department" icon={Building2} value={employee.department} />
                  <InfoRow label="Job Title" icon={Briefcase} value={employee.jobTitle} />
                  <InfoRow label="Employment Type" icon={FileText} value={
                    employee.employmentType.replace("_", "-").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
                  } />
                  <InfoRow label="Start Date" icon={Calendar} value={formatDate(employee.startDate)} />
                  <InfoRow label="Pay Schedule" icon={Clock} value={employee.paySchedule} />
                </CardContent>
              </Card>
            </div>

            {/* YTD Earnings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">YTD Earnings — FY 2024–25</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-px bg-gray-100 rounded-lg overflow-hidden">
                  {[
                    { label: "Gross Earnings", value: employee.ytdGross, color: "text-gray-900" },
                    { label: "Tax Withheld", value: employee.ytdTax, color: "text-red-600" },
                    { label: "Super Contributions", value: employee.ytdSuper, color: "text-indigo-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white px-6 py-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                      <p className={cn("mt-1 text-2xl font-bold", color)}>{formatCurrency(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100">
                  <InfoRow label="Employee Code" value={<span className="font-mono">{employee.employeeCode}</span>} />
                  <InfoRow label="Employment Type" value={
                    employee.employmentType === "FULL_TIME" ? "Full-time" :
                    employee.employmentType === "PART_TIME" ? "Part-time" :
                    employee.employmentType
                  } />
                  <InfoRow label="Employment Basis" value={
                    employee.employmentBasis === "SALARY" ? "Salaried" : "Hourly / Casual"
                  } />
                  <InfoRow label="Start Date" value={formatDate(employee.startDate)} />
                  <InfoRow label="Pay Schedule" value={employee.paySchedule} />
                  <InfoRow label="Department" value={employee.department} />
                  <InfoRow label="Job Title" value={employee.jobTitle} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Remuneration</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100">
                  {employee.employmentBasis === "SALARY" ? (
                    <>
                      <InfoRow label="Annual Salary" value={
                        <span className="font-bold text-gray-900">{formatCurrency(employee.annualSalary!)}</span>
                      } />
                      <InfoRow label="Fortnightly Pay" value={formatCurrency(employee.annualSalary! / 26)} />
                      <InfoRow label="Monthly Pay" value={formatCurrency(employee.annualSalary! / 12)} />
                    </>
                  ) : (
                    <>
                      <InfoRow label="Hourly Rate" value={
                        <span className="font-bold text-gray-900">{formatCurrency(employee.hourlyRate!)} / hr</span>
                      } />
                      <InfoRow label="Standard Hours / Week" value="38h" />
                    </>
                  )}
                  <InfoRow label="Super Rate" value={`${employee.superRate}%`} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pay & Tax Tab */}
          <TabsContent value="pay-tax" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Bank Account</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100">
                  <InfoRow label="Account Name" icon={CreditCard} value={employee.bankAccount.accountName} />
                  <InfoRow label="BSB" value={employee.bankAccount.bsb} />
                  <InfoRow label="Account Number" value={
                    <span className="font-mono">{employee.bankAccount.accountNumber}</span>
                  } />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tax Settings</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100">
                  <InfoRow label="Tax-Free Threshold" icon={Shield} value={
                    <Badge
                      variant="outline"
                      className={employee.taxFreeThreshold
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"}
                    >
                      {employee.taxFreeThreshold ? "Claimed" : "Not Claimed"}
                    </Badge>
                  } />
                  <InfoRow label="HELP/HECS Debt" value={
                    <Badge
                      variant="outline"
                      className={employee.helpDebt
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"}
                    >
                      {employee.helpDebt ? "Yes" : "No"}
                    </Badge>
                  } />
                  <InfoRow label="Super Rate" value={`${employee.superRate}%`} />
                  <InfoRow label="Tax File Number" value={<span className="text-gray-400 italic">On file (masked)</span>} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leave Tab */}
          <TabsContent value="leave" className="space-y-6 mt-0">
            <div className="grid grid-cols-3 gap-4">
              <LeaveCard
                title="Annual Leave"
                hours={employee.leaveBalances.annual}
                color="border-blue-400 text-blue-700 bg-blue-50"
              />
              <LeaveCard
                title="Personal / Sick"
                hours={employee.leaveBalances.personal}
                color="border-purple-400 text-purple-700 bg-purple-50"
              />
              <LeaveCard
                title="Long Service"
                hours={employee.leaveBalances.longService}
                color={employee.leaveBalances.longService > 0
                  ? "border-green-400 text-green-700 bg-green-50"
                  : "border-gray-200 text-gray-500 bg-gray-50"}
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Leave History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 py-4 text-center">No leave history recorded for this period.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-0">
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-600">No documents uploaded</p>
                <p className="mt-1 text-xs text-gray-400">Upload TFN declaration, payslips, and contracts here</p>
                <Button variant="outline" size="sm" className="mt-4">Upload Document</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-600">Change history coming soon</p>
                <p className="mt-1 text-xs text-gray-400">All edits to this employee&apos;s record will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
