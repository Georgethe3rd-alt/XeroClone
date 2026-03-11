"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Eye, ArrowRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { DEMO_PAY_RUNS } from "@/lib/demo-data";

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

function PayRunTable({ runs }: { runs: typeof DEMO_PAY_RUNS }) {
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <DollarSign className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-gray-900">No pay runs found</h3>
        <p className="mt-1 text-sm text-gray-500">No pay runs match this filter.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent bg-gray-50/80">
          <TableHead className="pl-6">Status</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Pay Date</TableHead>
          <TableHead>Schedule</TableHead>
          <TableHead className="text-right">Employees</TableHead>
          <TableHead className="text-right">Total Gross</TableHead>
          <TableHead className="text-right">Total Net</TableHead>
          <TableHead className="text-right">Super</TableHead>
          <TableHead className="pr-6 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id} className="hover:bg-gray-50/60 group">
            <TableCell className="pl-6">
              <Badge
                variant="outline"
                className={cn("text-xs font-medium", STATUS_STYLES[run.status])}
              >
                {STATUS_LABELS[run.status] ?? run.status}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium text-gray-900">{run.period}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">{formatDate(run.payDate)}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">{run.paySchedule}</span>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-sm text-gray-700">{run.employeeCount}</span>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-sm font-medium text-gray-900">{formatCurrency(run.totalGross)}</span>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(run.totalNet)}</span>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-sm text-gray-600">{formatCurrency(run.totalSuper)}</span>
            </TableCell>
            <TableCell className="pr-6 text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <Link href={`/pay-runs/${run.id}`}>
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    View
                  </Link>
                </Button>
                {run.status === "DRAFT" && (
                  <Button size="sm" className="h-7 px-2 text-xs" asChild>
                    <Link href={`/pay-runs/${run.id}`}>
                      Continue
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function PayRunsPage() {
  const [tab, setTab] = useState("all");

  const filtered = tab === "all"
    ? DEMO_PAY_RUNS
    : DEMO_PAY_RUNS.filter((r) => r.status === tab.toUpperCase());

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pay Runs"
        description={`${DEMO_PAY_RUNS.length} pay runs · FY 2024–25`}
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Pay Run
          </Button>
        }
      />

      <div className="flex-1 overflow-auto bg-white">
        <div className="border-b border-gray-200 px-6 pt-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-9 bg-transparent p-0 gap-0 border-0">
              {[
                { value: "all", label: "All", count: DEMO_PAY_RUNS.length },
                { value: "draft", label: "Draft", count: DEMO_PAY_RUNS.filter((r) => r.status === "DRAFT").length },
                { value: "posted", label: "Posted", count: DEMO_PAY_RUNS.filter((r) => r.status === "POSTED").length },
              ].map(({ value, label, count }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    "relative h-9 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-gray-500 shadow-none data-[state=active]:border-brand-600 data-[state=active]:text-brand-600 data-[state=active]:shadow-none"
                  )}
                >
                  {label}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0 pt-0">
              <div className="pt-1">
                <PayRunTable runs={DEMO_PAY_RUNS} />
              </div>
            </TabsContent>
            <TabsContent value="draft" className="mt-0 pt-0">
              <div className="pt-1">
                <PayRunTable runs={DEMO_PAY_RUNS.filter((r) => r.status === "DRAFT")} />
              </div>
            </TabsContent>
            <TabsContent value="posted" className="mt-0 pt-0">
              <div className="pt-1">
                <PayRunTable runs={DEMO_PAY_RUNS.filter((r) => r.status === "POSTED")} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
