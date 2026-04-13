# Tej — History

## Learnings

- Project is PizzaAppDemo — pizza ordering website built with Next.js 15, TypeScript, Tailwind CSS
- User: AJ Enns
- Unit tests: Jest 30 + React Testing Library, co-located in `__tests__/` directories
- E2E tests: Playwright in `e2e/`, Chromium only, 5 parallel workers
- E2E config: `fullyParallel: true`, retries: 2 in CI / 0 locally
- Web server auto-starts `npm run dev` for E2E, waits for localhost:3000
- Run unit tests: `npx jest`
- Run E2E: `npm run test:e2e`
- Full pipeline: `./runtests.ps1` (lint → tsc → build → Jest → Playwright)
- E2E must be parallel-safe: no shared state, use SPA navigation for stateful flows
- Use `{ exact: true }` for Playwright text matching
