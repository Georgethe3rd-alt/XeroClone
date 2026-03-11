import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "warning" | "success" | "danger";
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: StatsCardProps) {
  const variantStyles = {
    default: "border-gray-200",
    warning: "border-amber-200 bg-amber-50",
    success: "border-green-200 bg-green-50",
    danger: "border-red-200 bg-red-50",
  };

  const iconStyles = {
    default: "bg-brand-50 text-brand-600",
    warning: "bg-amber-100 text-amber-600",
    success: "bg-green-100 text-green-600",
    danger: "bg-red-100 text-red-600",
  };

  return (
    <div className={cn("rounded-lg border bg-white p-5 shadow-sm", variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={cn("mt-1 text-xs", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
