# ADR 0001 — useState-based page routing (no React Router)

**Status:** Accepted  
**Date:** 2026-05-17

## Context

The app needs to navigate between multiple pages (Dashboard, Accounts Receivable, Reports, Customers). We are in the UI demo phase — no real users, no auth, no need for shareable URLs yet.

## Decision

Use a single `useState<NavItemId>` in `App.tsx` to track the active page and conditionally render the correct page component. No React Router.

## Consequences

- Simple to implement, zero added dependencies
- Browser back button does not work
- URLs do not reflect the current page (cannot share a link to a specific page)
- **Must be replaced with React Router** when auth, real users, or deep-linking are introduced (Phase 3 / Supabase integration)
