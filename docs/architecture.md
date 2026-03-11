# PayCraft Architecture

## Overview
PayCraft is a multi-tenant SMB payroll SaaS built with Next.js 15, TypeScript, Prisma, and PostgreSQL.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI Components | Custom design system + Radix UI primitives |
| State | React hooks, TanStack Table |
| Auth | Auth.js v5 with Credentials provider |
| Database ORM | Prisma 6 |
| Database | PostgreSQL 16+ |
| Validation | Zod schemas |
| Forms | React Hook Form + Zod resolver |
| Tests | Vitest (unit), Playwright (e2e) |
| PDF | (planned: react-pdf or puppeteer) |
| Storage | (planned: S3-compatible) |

## Directory Structure

```
apps/web/
├── app/
│   ├── (app)/           # Authenticated app shell
│   │   ├── layout.tsx   # Sidebar + top bar
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── pay-schedules/
│   │   ├── timesheets/
│   │   ├── leave/
│   │   ├── pay-runs/
│   │   ├── payslips/
│   │   ├── reports/
│   │   ├── payments/
│   │   ├── filing/
│   │   ├── settings/
│   │   └── portal/      # Employee self-service
│   ├── (auth)/          # Unauthenticated pages
│   │   └── login/
│   └── api/             # API routes
├── components/
│   ├── ui/              # Design system primitives
│   └── *.tsx            # Shared feature components
├── lib/
│   ├── payroll/         # Payroll calculation engine
│   ├── auth.ts          # Auth.js configuration
│   ├── prisma.ts        # Prisma client singleton
│   └── utils.ts         # Shared utilities
├── prisma/
│   └── schema.prisma    # Database schema
└── __tests__/           # Unit tests
```

## Multi-Tenancy
All data is scoped to an `Organization`. Every database query in the app layer filters by `orgId`. The tenant is resolved from the authenticated session JWT claim.

## Authentication Flow
1. User navigates to /login
2. Submits credentials → Auth.js Credentials provider
3. bcrypt password verification against DB
4. JWT token issued with user.id
5. Session middleware validates JWT on every request
6. Server components access session via auth()

## Route Protection
Implemented via Next.js middleware at middleware.ts — all /dashboard, /employees, etc. routes require valid session.
