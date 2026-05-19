# ADR 0002 — React Router for client-side navigation

**Status:** Accepted  
**Date:** 2026-05-19

## Context

The MVP grew to seven navigable modules plus a Settings placeholder. Demo users and developers need:

- Bookmarkable URLs (`/revenue`, `/accounts-receivable`, etc.)
- Working browser refresh on each page
- Sidebar active state tied to the current path

Phase 2 added domain modules and multiple page components; conditional rendering from a single `activePage` state became harder to maintain.

## Decision

Adopt **React Router** (`react-router-dom` v7):

- `BrowserRouter` in `src/main.tsx`
- Route table in `src/App.tsx` with nested layout (`AppLayout` + `<Outlet />`)
- Path constants in `src/config/navigation.ts`
- `NavLink` in `SidebarNavItem` for active styling

**Settings** remains a disabled sidebar item with **no route** (product placeholder).

Shared receivables and customers state stay in `App.tsx` and are passed as props to AR and Customers pages.

## Routes

| Path | Page |
|------|------|
| `/` | Redirect → `/dashboard` |
| `/dashboard` | Dashboard |
| `/export-import` | Export/Import |
| `/expenses` | Expenses |
| `/revenue` | Revenue |
| `/accounts-receivable` | Accounts Receivable |
| `/reports` | Reports |
| `/customers` | Customers |

## Consequences

**Positive**

- Direct links and refresh work in dev (Vite SPA fallback)
- Clear separation between layout and page components
- Aligns with future auth-protected routes

**Negative / follow-ups**

- Production static hosts need SPA rewrite rules for unknown paths
- `/settings` is not defined — manual navigation shows blank content unless a catch-all is added
- No route-based code splitting yet (single large bundle)

## Related

- Supersedes [ADR 0001](./0001-useState-routing.md)
- Documented in `README.md`, `ARCHITECTURE.md`, `DEMO.md`
