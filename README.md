# Agro Dashboard MVP

A demo financial and operational dashboard for agricultural businesses. Built as the first MVP to present to an agro company owner in a meeting.

## Product context

This project is the foundation for an AI-powered financial and agro management SaaS — a simpler QuickBooks-style tool tailored to farms with crops, livestock, and mixed operations. **This version is demo-only:** all numbers are mock data.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |

This is **not** Next.js. It is a single-page app (SPA) served by Vite.

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build    # production build → dist/
npm run preview  # preview production build
npm run lint     # TypeScript check (tsc --noEmit)
```

No API key is required for the current demo — AI insights are static mock text.

## Current features

- KPI summary cards (revenue, expenses, profit, receivables, corn, cattle)
- Monthly revenue vs expenses bar chart
- Corn production table by plot
- Livestock groups table
- Expense breakdown by category
- Accounts receivable table with overdue status
- AI insights panel (static demo copy)

## Project structure

```
├── index.html              # HTML shell
├── vite.config.ts          # Vite + Tailwind + path aliases
├── package.json
├── src/
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Root component → DashboardPage
│   ├── index.css           # Tailwind import
│   ├── data/
│   │   ├── types.ts        # Shared TypeScript types
│   │   └── mockData.ts     # All demo data (edit here first)
│   ├── components/
│   │   ├── DashboardPage.tsx   # Main layout & sections
│   │   ├── KPICard.tsx
│   │   ├── FinancialChart.tsx
│   │   ├── CropTable.tsx
│   │   ├── LivestockTable.tsx
│   │   ├── ReceivablesTable.tsx
│   │   ├── ExpenseBreakdown.tsx
│   │   ├── AIInsightsPanel.tsx
│   │   └── ui/card.tsx     # shadcn-style card primitives (partially used)
│   └── lib/utils.ts        # cn() helper for Tailwind classes
└── docs/                   # See PROJECT_CONTEXT, ROADMAP, etc. in repo root
```

## Next steps

1. Replace mock data with the first customer’s real numbers (see `src/data/mockData.ts`).
2. Wire date filter and Export button (currently UI-only).
3. Initialize Git and push to a shared remote (see `COLLABORATION.md`).
4. Follow `ROADMAP.md` for phased product development.

## Related docs

- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) — business vision and mock vs real data
- [ROADMAP.md](./ROADMAP.md) — phased delivery plan
- [TODO.md](./TODO.md) — developer task list
- [ARCHITECTURE.md](./ARCHITECTURE.md) — technical design
- [COLLABORATION.md](./COLLABORATION.md) — Git workflow for two developers
