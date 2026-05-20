# ADR 0001 — useState-based page routing (no React Router)

**Status:** Superseded  
**Date:** 2026-05-17  
**Superseded by:** React Router in `src/main.tsx` + `src/App.tsx` (2026)

## Context

Early MVP used `useState<NavItemId>` in `App.tsx` to switch pages without shareable URLs.

## Decision (historical)

Use conditional render from sidebar state. No React Router.

## Current state

The app now uses **React Router v7** with paths such as `/dashboard`, `/export-import`, etc. See `src/config/navigation.ts`.

`FinancialDataProvider` wraps the router tree in `main.tsx`.

## Why this ADR remains

Documents the original choice. New work should assume **URL-based routing**, not `useState` page switching.
