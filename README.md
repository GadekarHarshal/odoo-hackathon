# EcoSphere — ESG Management Platform

A unified ESG (Environmental, Social, Governance) management platform built with Next.js 14, Prisma, PostgreSQL, and NextAuth.js.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (credentials provider, roles: Admin / Manager / Employee)
- **Charts**: Recharts
- **Reports**: exceljs (Excel), pdf-lib (PDF), native CSV
- **Forms**: react-hook-form + zod

## Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string to a hosted instance)

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ecosphere"
NEXTAUTH_SECRET="generate-a-strong-secret"   # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Run database migration

```bash
npx prisma migrate dev --name init
```

### 5. Seed demo data

```bash
npx prisma db seed
```

This creates:
- 4 departments (Engineering, Operations, HR, Finance)
- 15 employees across roles (Admin, Manager, Employee)
- Emission factors, CSR activities, challenges
- Sample carbon transactions
- Compliance issues (one overdue)
- OrgESGConfig with default weights (40/30/30)

### 6. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials

| Role     | Email                    | Password   |
|----------|--------------------------|------------|
| Admin    | admin@ecosphere.dev      | password123 |
| Manager  | manager@ecosphere.dev    | password123 |
| Employee | employee@ecosphere.dev   | password123 |

## Available Scripts

| Script            | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start dev server                   |
| `npm run build`   | Production build                   |
| `npm run db:migrate` | Run Prisma migrations           |
| `npm run db:seed` | Seed demo data                     |
| `npm run db:studio` | Open Prisma Studio               |
| `npm run db:generate` | Regenerate Prisma client       |

## ESG Score Assumptions

- **DepartmentScore.totalScore** = `(envScore × envWeight + socialScore × socialWeight + govScore × govWeight) / 100`
- **Overall ESG Score** = weighted average of all department `totalScore` values, weighted by `department.employeeCount`
- Default weights: Environmental 40%, Social 30%, Governance 30% (configurable in Settings → ESG Config)

## Project Structure

```
app/
  (auth)/login/          # Login page
  (dashboard)/           # Authenticated layout with sidebar
    dashboard/           # Org dashboard (Step 10)
    environmental/       # Environmental module (Steps 3-4)
    social/              # Social module (Step 5)
    governance/          # Governance module (Step 8)
    gamification/        # Gamification module (Steps 6-7)
    reports/             # Reports module (Step 12)
    settings/            # Settings & admin (Steps 3, 9)
components/
  ui/                    # shadcn/ui base components
  layout/                # Sidebar, Navbar
lib/
  prisma.ts              # Prisma client singleton
  utils.ts               # cn() helper
prisma/
  schema.prisma          # Full data model
  seed.ts                # Demo data seed (Step 2)
```
