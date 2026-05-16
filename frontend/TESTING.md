# Frontend Testing Guide

## Unit Tests (Vitest)

Unit tests for pure functions and hooks are located in `src/` alongside the code they test with `.test.ts` extension.

### Running Unit Tests

```bash
npm run test:unit
```

### Current Test Coverage

- **hooks/use-queue.hook.test.ts**: Tests for `useQueueJob`, `useRefreshQueueJob`, and `queueApi`
- **hooks/queue.api.test.ts**: Tests for queue API functions
- **test/example.test.ts**: Example tests

### What to Test

Focus unit tests on:

- Pure function logic
- Hook exports and behavior
- API client functions
- Utility functions

Avoid unit testing component rendering — use E2E tests instead.

## E2E Tests (Playwright)

End-to-end tests simulate real user workflows and test the full page.

### Running E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e
```

### Current E2E Tests

- **e2e/queues.spec.ts**: Tests the Queue Monitor page with mocked API responses

### E2E Test Pattern

E2E tests:

1. Mock backend APIs using `page.route()` to avoid external dependencies
2. Navigate to pages and interact with UI
3. Assert on visible elements and behavior
4. Support local dev server via `playwright.config.ts` webServer config

## Configuration Files

- **vitest.config.ts**: Vitest setup with jsdom environment
- **playwright.config.ts**: Playwright setup with local dev server
- **src/test/setup.ts**: Test environment mocks (window.matchMedia, IntersectionObserver, etc.)

## Dependencies

- `vitest`: Unit test runner
- `@testing-library/react`: React component testing utilities
- `@testing-library/jest-dom`: Custom matchers
- `@testing-library/user-event`: User interaction simulation
- `playwright`: E2E testing framework
- `jsdom`: DOM environment for unit tests

## CI/CD

Tests can be run in CI by:

1. Installing dependencies: `npm install`
2. Running unit tests: `npm run test:unit`
3. Running E2E tests: `npm run test:e2e` (requires running dev server or mock APIs)

## Troubleshooting

**JSX parsing errors in vitest**: Don't import `.tsx` files in `.test.ts` files. Use dynamic imports or refactor to test logic separately from components.

**Playwright tests fail on baseURL**: Ensure the Next.js dev server is running on `http://localhost:3681` or update `baseURL` in `playwright.config.ts`.

**Missing browser binaries**: Run `npx playwright install` to download browser binaries for E2E tests.
