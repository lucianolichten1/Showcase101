# ADR 0001 — useState-based page routing (no React Router)

**Status:** Superseded by [ADR 0002](./0002-react-router.md)  
**Date:** 2026-05-17

## Context

The app needed navigation between multiple pages (Dashboard, Accounts Receivable, Reports, Customers). Early MVP used in-component state only.

## Decision

Use a single `useState<NavItemId>` in `App.tsx` to track the active page and conditionally render the correct page component. No React Router.

## Consequences

- Simple to implement, zero added routing dependencies at the time
- Browser back button did not work
- URLs did not reflect the current page

## Superseded

React Router was adopted for shareable URLs, refresh-safe navigation, and `NavLink` active states. See ADR 0002.
