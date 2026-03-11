"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Calendar, Clock, Umbrella,
  DollarSign, FileText, BarChart3, Settings, ChevronLeft,
  ChevronRight, Building2, Bell, CreditCard,
  BookOpen
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Pay Schedules", href: "/pay-schedules", icon: Calendar },
  { name: "Timesheets", href: "/timesheets", icon: Clock },
  { name: "Leave", href: "/leave", icon: Umbrella },
  { name: "Pay Runs", href: "/pay-runs", icon: DollarSign },
  { name: "Payslips", href: "/payslips", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Filing", href: "/filing", icon: BookOpen },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ease-in-out",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center border-b border-gray-200 px-4 py-4", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">PayCraft</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn("rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600", collapsed && "hidden")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Org selector */}
        {!collapsed && (
          <div className="border-b border-gray-200 px-3 py-2">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
              <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate font-medium text-gray-700 text-xs">Sunshine Bookkeeping Co.</span>
            </div>
          </div>
        )}

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand-600" : "text-gray-400")} />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom nav */}
        <div className="border-t border-gray-200 px-2 py-3 space-y-0.5">
          {secondaryNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand-600" : "text-gray-400")} />
                {!collapsed && item.name}
              </Link>
            );
          })}

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="flex w-full items-center justify-center rounded-md px-2 py-2 text-gray-400 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* User */}
          {!collapsed && (
            <div className="mt-2 flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 cursor-pointer">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold shrink-0">
                SA
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-xs font-medium text-gray-700">Sarah Admin</p>
                <p className="truncate text-xs text-gray-400">Owner</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-5">
          <div />
          <div className="flex items-center gap-2">
            <button className="relative rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
