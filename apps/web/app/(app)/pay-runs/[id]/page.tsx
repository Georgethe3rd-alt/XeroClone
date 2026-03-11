"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  Eye,
  MinusCircle,
  DollarSign,
  Save,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { DEMO_PAY_RUNS, DEMO_PAY_RUN_ITEMS } from "@/lib/demo-data";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
  PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
  APPROVED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  POSTED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PROCESSING: "Processing",
  APPROVED: "Approved",
  POSTED: "Posted",
  CANCELLED: "Cancelled",
};

function ExpandableRow({ item }: { item: typeof DEMO_PAY_RUN_ITEMS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const fullName = `${item.employee.firstName} ${item.employee.lastName}`;

  return (
    <>
      <TableRow
        className={cn(
          "cursor-pointer hover:bg-gray-50/60 group",
          expanded && "bg-brand-50/30"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="pl-4 w-6">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          }
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              {getInitials(fullName)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{fullName}</p>
              <p className="text-xs text-gray-500">{item.employee.jobTitle}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right text-sm">{formatCurrency(item.regularPay)}</TableCell>
        <TableCell className="text-right text-sm">
          {item.overtimePay > 0
            ? <span className="font-medium text-amber-600">{formatCurrency(item.overtimePay)}</span>
            : <span className="text-gray-400">—</span>
          }
        </TableCell>
        <TableCell className="text-right text-sm">
          {item.allowances > 0
            ? formatCurrency(item.allowances)
            : <span className="text-gray-400">—</span>
          }
        </TableCell>
        <TableCell className="text-right text-sm font-semibold text-gray-900">
          {formatCurrency(item.grossEarnings)}
        </TableCell>
        <TableCell className="text-right text-sm text-red-600">{formatCurrency(item.taxWithheld)}</TableCell>
        <TableCell className="text-right text-sm text-indigo-600">{formatCurrency(item.superContribution)}</TableCell>
        <TableCell className="text-right text-sm font-bold text-gray-900">{formatCurrency(item.netPay)}</TableCell>
        <TableCell className="text-center">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              item.status === "INCLUDED"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-50 text-gray-600 border-gray-200"
            )}
          >
            {item.status === "INCLUDED" ? "Included" : item.status}
          </Badge>
        </TableCell>
        <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Eye className="mr-1 h-3.5 w-3.5" />
              Breakdown
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50">
              <MinusCircle className="mr-1 h-3.5 w-3.5" />
              Exclude
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-brand-50/20 hover:bg-brand-50/20">
          <TableCell colSpan={11} className="py-0">
            <div className="ml-12 border-l-2 border-brand-200 pl-4 py-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Earnings Breakdown</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Regular Pay</span>
                      <span className="font-medium">{formatCurrency(item.regularPay)}</span>
                    </div>
                    {item.overtimePay > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overtime (1.5x)</span>
                        <span className="font-medium text-amber-600">{formatCurrency(item.overtimePay)}</span>
                      </div>
                    )}
                    {item.allowances > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Allowances</span>
                        <span className="font-medium">{formatCurrency(item.allowances)}</span>
                      </div>
                    )}
                    {item.bonuses > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bonus</span>
                        <span className="font-medium">{formatCurrency(item.bonuses)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold">
                      <span>Gross Earnings</span>
                      <span>{formatCurrency(item.grossEarnings)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Deductions</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">PAYG Withholding</span>
                      <span className="font-medium text-red-600">({formatCurrency(item.taxWithheld)})</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold">
                      <span>Total Deductions</span>
                      <span className="text-red-600">({formatCurrency(item.totalDeductions)})</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Summary</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Pay</span>
                      <span className="font-bold text-lg text-gray-900">{formatCurrency(item.netPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Super Contribution</span>
                      <span className="font-medium text-indigo-600">{formatCurrency(item.superContribution)}</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-gray-400">
                        Bank: {item.employee.bankAccount.bsb} · {item.employee.bankAccount.accountNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function PayRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [notes, setNotes] = useState("");
  const [posted, setPosted] = useState(false);

  const payRun = DEMO_PAY_RUNS.find((r) => r.id === id);
  if (!payRun) notFound();

  const items = DEMO_PAY_RUN_ITEMS.filter((i) => i.payRunId === id);
  const isDraft = payRun.status === "DRAFT";

  const totalWarnings = items.flatMap((i) => i.warnings).length;

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/pay-runs"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Pay Runs
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900">{payRun.period}</span>
            <Badge
              variant="outline"
              className={cn("text-xs font-medium", STATUS_STYLES[payRun.status])}
            >
              {STATUS_LABELS[payRun.status]}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-500">Gross</p>
                <p className="font-semibold text-gray-900">{formatCurrency(payRun.totalGross)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Tax</p>
                <p className="font-semibold text-red-600">{formatCurrency(payRun.totalTax)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Net</p>
                <p className="font-semibold text-gray-900">{formatCurrency(payRun.totalNet)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Super</p>
                <p className="font-semibold text-indigo-600">{formatCurrency(payRun.totalSuper)}</p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            {isDraft && !posted && (
              <>
                <Button variant="outline" size="sm">
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setPosted(true)}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Approve &amp; Post
                </Button>
              </>
            )}
            {(payRun.status === "POSTED" || posted) && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {payRun.postedAt ? `Posted ${formatDate(payRun.postedAt)}` : "Posted"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-5">
        {/* Posted success banner */}
        {posted && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <div className="flex-1 text-sm">
              <span className="font-semibold text-green-800">Pay run approved and posted successfully!</span>{" "}
              <span className="text-green-700">
                Employees will be paid on {formatDate(payRun.payDate)}. STP reporting has been queued.
              </span>
            </div>
          </div>
        )}

        {/* Warnings banner */}
        {totalWarnings > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-700">
              <span className="font-semibold">{totalWarnings} warning(s)</span> found in this pay run. Review before posting.
            </p>
          </div>
        )}

        {/* Pay run info bar */}
        <div className="grid grid-cols-3 gap-4 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 lg:grid-cols-6">
          {[
            { label: "Period", value: payRun.period },
            { label: "Pay Date", value: formatDate(payRun.payDate) },
            { label: "Schedule", value: payRun.paySchedule },
            { label: "Employees", value: `${payRun.employeeCount} included` },
            { label: "Status", value: STATUS_LABELS[payRun.status] },
            { label: "Created", value: "10 Mar 2025" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Gross", value: payRun.totalGross, color: "text-gray-900", bg: "bg-white" },
            { label: "Total Tax", value: payRun.totalTax, color: "text-red-600", bg: "bg-red-50" },
            { label: "Total Net", value: payRun.totalNet, color: "text-gray-900", bg: "bg-green-50" },
            { label: "Total Super", value: payRun.totalSuper, color: "text-indigo-600", bg: "bg-indigo-50" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn("rounded-lg border border-gray-200 px-5 py-4", bg)}>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
              <p className={cn("mt-1 text-2xl font-bold", color)}>{formatCurrency(value)}</p>
            </div>
          ))}
        </div>

        {/* Employee table */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Employee Pay Items ({items.length})
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Click row to expand breakdown</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-gray-50/80">
                  <TableHead className="pl-4 w-6" />
                  <TableHead className="w-56">Employee</TableHead>
                  <TableHead className="text-right">Regular</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Super</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <ExpandableRow key={item.id} item={item} />
                ))}
              </TableBody>
              {/* Totals row */}
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="pl-4" />
                  <td className="py-3 text-sm font-bold text-gray-900 pl-4">Totals</td>
                  <td className="text-right py-3 text-sm font-semibold">
                    {formatCurrency(items.reduce((s, i) => s + i.regularPay, 0))}
                  </td>
                  <td className="text-right py-3 text-sm font-semibold text-amber-600">
                    {formatCurrency(items.reduce((s, i) => s + i.overtimePay, 0))}
                  </td>
                  <td className="text-right py-3 text-sm font-semibold">
                    {formatCurrency(items.reduce((s, i) => s + i.allowances, 0))}
                  </td>
                  <td className="text-right py-3 text-sm font-bold text-gray-900">
                    {formatCurrency(payRun.totalGross)}
                  </td>
                  <td className="text-right py-3 text-sm font-bold text-red-600">
                    {formatCurrency(payRun.totalTax)}
                  </td>
                  <td className="text-right py-3 text-sm font-bold text-indigo-600">
                    {formatCurrency(payRun.totalSuper)}
                  </td>
                  <td className="text-right py-3 text-sm font-bold text-gray-900">
                    {formatCurrency(payRun.totalNet)}
                  </td>
                  <td />
                  <td className="pr-4" />
                </tr>
              </tfoot>
            </Table>
          </CardContent>
        </Card>

        {/* Notes + actions */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or comments about this pay run…"
                className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                rows={4}
                disabled={payRun.status === "POSTED" || posted}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Download Pay Run Summary (PDF)
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                <DollarSign className="mr-2 h-4 w-4" />
                Export ABA Payment File
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                <Send className="mr-2 h-4 w-4" />
                Send Payslips to Employees
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom action bar */}
        {isDraft && !posted && (
          <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-gray-200 bg-white px-6 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {items.length} employees · Total net{" "}
                <span className="font-semibold text-gray-900">{formatCurrency(payRun.totalNet)}</span>
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setPosted(true)}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Approve &amp; Post Pay Run
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
