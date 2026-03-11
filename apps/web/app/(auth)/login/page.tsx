"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, Eye, EyeOff, ArrowRight, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@sunshinebc.com.au");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate a brief loading then redirect
    setTimeout(() => {
      if (email && password) {
        window.location.href = "/dashboard";
      } else {
        setError("Please enter your email and password.");
        setLoading(false);
      }
    }, 800);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-200">
            <DollarSign className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PayCraft</h1>
          <p className="mt-1 text-sm text-gray-500">Payroll software for Australian small businesses</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">Sign in to your account</h2>
          <p className="mb-6 text-sm text-gray-500">Welcome back. Enter your credentials below.</p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <Info className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com.au"
                autoComplete="email"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Link
                  href="#"
                  className="text-xs text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <Separator className="my-5" />

          {/* Demo credentials */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 mb-1.5">Demo Mode — use these credentials</p>
                <div className="space-y-1 text-xs text-blue-600">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-500">Email:</span>
                    <button
                      type="button"
                      onClick={() => setEmail("admin@sunshinebc.com.au")}
                      className="font-mono font-semibold hover:underline"
                    >
                      admin@sunshinebc.com.au
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-500">Password:</span>
                    <button
                      type="button"
                      onClick={() => setPassword("demo1234")}
                      className="font-mono font-semibold hover:underline"
                    >
                      demo1234
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="#" className="text-brand-600 hover:underline font-medium">
              Start free trial
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            <span>256-bit SSL encryption · ATO compliant · STP Phase 2 ready</span>
          </div>
        </div>
      </div>

      {/* Bottom brand bar */}
      <div className="fixed bottom-0 inset-x-0 border-t border-gray-100 bg-white/80 backdrop-blur-sm py-3">
        <p className="text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} PayCraft Pty Ltd · ABN 12 345 678 901 ·{" "}
          <Link href="#" className="hover:underline">Privacy Policy</Link>{" "}
          ·{" "}
          <Link href="#" className="hover:underline">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
