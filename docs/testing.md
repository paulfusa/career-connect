# Unit Tests

All unit tests use Node's built-in test runner, with no test framework to install.

```bash
pnpm test            # every test in tests/ and src/
pnpm test:coverage   # the same, plus line and branch coverage per file
```

`pnpm test:coverage` fails if line or branch coverage is under **80%**, and the CI/CD pipeline runs it on every pull request (see [CI/CD pipeline](ci-cd.md)).

## No real services

Tests never touch Supabase, Resend or an AI model, so they run anywhere, including CI. [`tests/helpers/fakes.ts`](../tests/helpers/fakes.ts) swaps these for fakes:

| Fake | Stands in for | What a test can do with it |
|---|---|---|
| `fake.db` | the Drizzle database | queue the rows each query returns (`fake.db.results`), then check every query it ran (`fake.db.queries`: table, values, and the WHERE clause with its parameters) |
| `fake.auth.api` | Better Auth | set what `signInEmail`, `changePassword`, … return or throw, and check what they were called with |
| `fake.storage`, `fake.email`, `fake.ai` | Supabase Storage, Resend, the AI model | change a function's result with `.impl`, check its `.calls` |
| `fake.env`, `fake.environment` | `$env/dynamic/private`, `$app/environment` | set environment variables, or pretend to be building |

`event()` builds a request (user, form fields and files, URL params), and `run()` says how a load, action or endpoint ended: `ok`, `fail`, `redirect` or `error`.

A route test looks like this:

```ts
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFakes, resetFakes, fake, event, run, seeker } from './helpers/fakes.ts';

useFakes(); // before importing the code under test
const { actions } = await import('../src/routes/(app)/resumes/+page.server.ts');
beforeEach(resetFakes);

test("delete: someone else's resume is treated as missing", async () => {
	fake.db.results.push([]); // the query is scoped to the user, so it finds nothing
	const r = await run(() => actions.delete(event({ user: seeker, form: { id: '11111111-1111-4111-8111-111111111111' } })));
	assert.equal(r.kind === 'fail' && r.status, 404);
	assert.equal(fake.storage.deleteResume.calls.length, 0);
});
```

Each server module and form action has tests for its normal case, invalid input, and who may use it. Access control is checked through the queries: a test asserts that the WHERE clause contains the signed-in user's id.

## Coverage before and after US-32

Before US-32, `pnpm test:coverage` reported 88.7% of lines, but **30 of the 78 source files were never loaded by any test**, and Node leaves those out of its total. They included the login, register and password pages, the profile, resume and company actions, storage, emails and the AI settings.

Now every server file is tested: **421 tests, 94.4% of lines and 90.5% of branches**. Three files are still not loaded:
- `lib/index.ts`: SvelteKit's empty placeholder.
- `lib/skills.ts`: a fixed list of skill names.
- `lib/suggest.svelte.ts`: autocomplete code that only runs in the browser.

The outdated `src/routes/auth.test.ts`, which `pnpm test` never ran and which expected the behaviour from before email verification, was replaced by `tests/auth-pages.test.ts`. `pnpm test` now also runs any test file under `src/`.

Line / branch coverage per source file:

| File | Before | After |
|---|---|---|
| `hooks.server.ts` | 100% / 100% | 100% / 100% |
| `lib/completeness.ts` | not tested | 100% / 100% |
| `lib/feature-suggestions.ts` | 100% / 100% | 100% / 100% |
| `lib/forms.ts` | not tested | 100% / 100% |
| `lib/index.ts` | not tested | not tested |
| `lib/notification-ui.ts` | 95% / 93% | 95% / 93% |
| `lib/onboarding.ts` | not tested | 100% / 100% |
| `lib/profile-options.ts` | 100% / 100% | 100% / 100% |
| `lib/resume.ts` | 100% / 94% | 100% / 94% |
| `lib/server/acceptance-rate.ts` | 100% / 100% | 100% / 100% |
| `lib/server/ai.ts` | not tested | 100% / 92% |
| `lib/server/application-analytics.ts` | 100% / 95% | 100% / 95% |
| `lib/server/application-outcome.ts` | 100% / 82% | 100% / 82% |
| `lib/server/application.ts` | 100% / 98% | 100% / 98% |
| `lib/server/auth.ts` | 88% / 75% | 88% / 75% |
| `lib/server/company-profile-permissions.ts` | 100% / 100% | 100% / 100% |
| `lib/server/company-profile-validation.ts` | 94% / 93% | 100% / 100% |
| `lib/server/db/auth.schema.ts` | 89% / 100% | 93% / 100% |
| `lib/server/db/index.ts` | not tested | 100% / 33% |
| `lib/server/db/schema.ts` | 98% / 100% | 93% / 100% |
| `lib/server/deadline-reminders-db.ts` | 100% / 100% | 100% / 100% |
| `lib/server/email-template.ts` | 62% / 100% | 100% / 100% |
| `lib/server/email.ts` | not tested | 100% / 100% |
| `lib/server/feature-suggestions.ts` | 100% / 95% | 100% / 95% |
| `lib/server/follow.ts` | 100% / 100% | 100% / 100% |
| `lib/server/job-posting-create.ts` | 100% / 100% | 100% / 100% |
| `lib/server/job-posting-delete.ts` | 100% / 100% | 100% / 100% |
| `lib/server/job-posting-edit.ts` | 100% / 100% | 100% / 100% |
| `lib/server/job-posting.ts` | 96% / 80% | 96% / 80% |
| `lib/server/job-search.ts` | 100% / 100% | 100% / 100% |
| `lib/server/llm.ts` | 97% / 84% | 97% / 89% |
| `lib/server/notifications-db.ts` | not tested | 100% / 100% |
| `lib/server/notifications.ts` | 100% / 100% | 100% / 100% |
| `lib/server/outcomes.ts` | 95% / 100% | 95% / 100% |
| `lib/server/password-reset-validation.ts` | 100% / 100% | 100% / 100% |
| `lib/server/profile-data.ts` | 100% / 100% | 100% / 100% |
| `lib/server/profile.ts` | 97% / 96% | 99% / 97% |
| `lib/server/reminders.ts` | 100% / 100% | 100% / 100% |
| `lib/server/resume-ai.ts` | 93% / 96% | 100% / 97% |
| `lib/server/resumes.ts` | not tested | 100% / 100% |
| `lib/server/role-guard.ts` | 100% / 100% | 100% / 100% |
| `lib/server/storage.ts` | not tested | 100% / 100% |
| `lib/server/view-as.ts` | 100% / 89% | 100% / 89% |
| `lib/skills.ts` | not tested | not tested |
| `lib/suggest.svelte.ts` | not tested | not tested |
| `lib/theme.ts` | 100% / 85% | 100% / 85% |
| `lib/ui.ts` | 100% / 100% | 100% / 100% |
| `routes/(app)/+layout.server.ts` | 100% / 80% | 100% / 80% |
| `routes/(app)/+page.server.ts` | not tested | 100% / 87% |
| `routes/(app)/applications/+page.server.ts` | 100% / 100% | 100% / 100% |
| `routes/(app)/applications/analytics/+page.server.ts` | 100% / 100% | 100% / 100% |
| `routes/(app)/company/+page.server.ts` | not tested | 100% / 100% |
| `routes/(app)/company/edit/+page.server.ts` | not tested | 100% / 75% |
| `routes/(app)/following/+page.server.ts` | 100% / 100% | 100% / 100% |
| `routes/(app)/jobs/+page.server.ts` | 100% / 74% | 100% / 74% |
| `routes/(app)/jobs/[id]/+page.server.ts` | 78% / 71% | 99% / 77% |
| `routes/(app)/jobs/[id]/applications/+page.server.ts` | 99% / 94% | 99% / 94% |
| `routes/(app)/jobs/[id]/edit/+page.server.ts` | not tested | 100% / 100% |
| `routes/(app)/jobs/new/+page.server.ts` | not tested | 100% / 100% |
| `routes/(app)/logout/+page.server.ts` | not tested | 100% / 100% |
| `routes/(app)/notifications/+page.server.ts` | 100% / 85% | 100% / 85% |
| `routes/(app)/people/+page.server.ts` | 100% / 100% | 100% / 100% |
| `routes/(app)/profile/+page.server.ts` | not tested | 100% / 87% |
| `routes/(app)/profile/[id]/+page.server.ts` | 100% / 92% | 100% / 92% |
| `routes/(app)/resumes/+page.server.ts` | not tested | 98% / 88% |
| `routes/(app)/resumes/[id]/+server.ts` | not tested | 100% / 100% |
| `routes/(app)/resumes/[id]/import/+page.server.ts` | not tested | 100% / 82% |
| `routes/(app)/resumes/[id]/review/+page.server.ts` | not tested | 100% / 95% |
| `routes/(app)/suggestions/+page.server.ts` | 100% / 100% | 100% / 100% |
| `routes/(app)/suggestions/review/+page.server.ts` | 100% / 100% | 100% / 100% |
| `routes/(app)/view-as/+server.ts` | 100% / 100% | 100% / 100% |
| `routes/api/schools/+server.ts` | not tested | 100% / 89% |
| `routes/forgot-password/+page.server.ts` | not tested | 100% / 90% |
| `routes/login/+page.server.ts` | not tested | 100% / 87% |
| `routes/register/+page.server.ts` | not tested | 100% / 76% |
| `routes/reset-password/+page.server.ts` | not tested | 100% / 56% |
| `routes/verification-sent/+page.server.ts` | not tested | 100% / 100% |
| `routes/verify-email/+page.server.ts` | not tested | 100% / 75% |
