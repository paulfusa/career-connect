# Unit Test Coverage for All Code (US-32)
- **Purpose of AI Use**: Finding the code without unit tests and writing tests so every server module and form action is covered, without using the real database, storage or AI model
- **AI-Suggested Content**: A shared test helper that fakes the database, Better Auth, storage, emails, the AI model and SvelteKit's modules; 7 new test files (73 tests); removal of the outdated `src/routes/auth.test.ts`; test scripts that run every test file; a testing guide with the coverage per file before and after (`docs/testing.md`)
- **Validation**:
- **Decision**:
- **Reflection**:
- **Responsible Person**: Paul Fourment

# Prompt 1
I want to complete US-32 (https://github.com/paulfusa/career-connect/issues/203).

(*US-32 acceptance criteria: `pnpm test:coverage` reports line and branch coverage per file with Node's built-in coverage; every server module and form action has unit tests for its normal case, invalid input and access rules; tests use fakes, never the real Supabase database, storage or an AI model; code without tests is listed and tests are added until coverage reaches the team's target (e.g. 80%); outdated or skipped tests such as `src/routes/auth.test.ts` are fixed or removed.*)

# Response 1
**Starting point**: 348 tests passed, and `pnpm test:coverage` reported 88.7% of lines. But Node's coverage only counts files a test imports: **30 of the 78 source files were never loaded by any test** (about 1,900 lines), so they didn't count. They included the login, register and password pages, the profile, resume and company actions, storage, emails and the AI settings. `src/routes/auth.test.ts` was never run by `pnpm test` and expected the behaviour from before email verification was added.

**Shared test helper** (`tests/helpers/fakes.ts`): each existing test file copied its own ~40-line loader to fake the database. One helper now does it for every test:
- `fake.db` records every query (table, values, and the WHERE clause with its parameters) and returns rows the test queues. Access control is tested by checking that the WHERE clause contains the signed-in user's id.
- Fakes for Better Auth, Supabase Storage, Resend emails, the AI model, environment variables and SvelteKit's `$app` modules, whose results each test can change and whose calls it can check.
- `event()` builds a request (user, form fields and files, URL params) and `run()` reports whether a load, action or endpoint ended in `ok`, `fail`, `redirect` or `error`.

**New tests** (73, in 7 files):
| File | Covers |
|---|---|
| `auth-pages.test.ts` | Register, login, logout, email verification, forgot and reset password, and the real login hook (replaces `src/routes/auth.test.ts`) |
| `profile-actions.test.ts` | The profile page's load and its 10 actions (intro and photo, sections, experience and education, email, password, delete account) and onboarding |
| `resume-routes.test.ts` | Upload, replace and delete, the PDF download with its access rules, and the AI review and fill-profile pages |
| `company-and-job-routes.test.ts` | Company profile pages, creating, editing and deleting job postings, and withdrawing an application |
| `external-services.test.ts` | The real storage, email and AI modules with `fetch` faked, including reading text from a real generated PDF |
| `small-modules.test.ts` | The notifications database layer, the schools search, profile completeness and the form helper |
| `db-connection.test.ts` | The database connection refusing to start without `DATABASE_URL`, except during a build |

**Checking the tests catch real bugs**: five rules were broken on purpose, one at a time, and each made a test fail:
- deleting another user's experience
- any job seeker downloading any resume
- login saying which field was wrong
- the uploaded file name ending up in the storage path
- a job seeker saving a company profile

The first run didn't catch the resume download one, because a later check also returned "not found", so that test was made stricter.

**Other changes**:
- `pnpm test` and `pnpm test:coverage` now run test files anywhere under `src/`, not only `src/lib`, and the helper is excluded from coverage.
- `docs/testing.md`: how to run and write tests, an example test (checked by running it), and the line and branch coverage of every source file before and after.

**Result**: 421 tests pass, with **94.4% of lines and 90.5% of branches** covered (80% minimum, enforced by the CI/CD pipeline). Only 3 files are still not loaded, none of them server code: SvelteKit's empty `lib/index.ts`, the fixed skills list, and the browser-only autocomplete code. Lint and the type check pass.
