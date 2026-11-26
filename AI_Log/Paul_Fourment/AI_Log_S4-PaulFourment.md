# Sprint 3 User Stories (US-24, US-31, US-32, US-33)
- **Purpose of AI Use**: Writing user stories for the Sprint 3 requirements (Generative AI feature, AI job matching, unit tests, CI/CD) in the same format as the team's existing stories
- **AI-Suggested Content**: US-24 (Resume AI Autofill & Review) with acceptance criteria matching the posted acceptance tests, US-31 (AI Job Matching Suggestions), a static analysis story, a unit test coverage story and a CI/CD pipeline story, plus a check of which requirements were already covered by existing stories (US-25, US-26) and tooling (the CI workflow from #102)
- **Validation**: Reviewed and modified User Stories to a;lign properly with the assignment
- **Decision**: Partially Accepted / Modified (static analysis story not used; criteria and tasks trimmed in US-31, US-32 and US-33)
- **Reflection**: AI Helped create user stories to follow to implement development
- **Responsible Person**: Paul Fourment

# Prompt 1
I never made a user story for US-24. Can you give me the outline for it?

# Response 1
A US-24 story in the same format as US-04 (Priority, Sprint 3, Source: team-proposed for the Generative AI requirement):
- **Story**: As a job seeker, I want AI to review my resume and fill in my profile from it so that I can improve my resume and set up my profile faster.
- **Acceptance criteria** for the resume review (written feedback, tailoring to a job posting, no invented experience, saved and private) and for filling the profile (suggested details with dates and bullet points, nothing added until the user chooses, no duplicates, same validation as the profile forms), plus clear messages when the AI or the PDF can't be read, and free to run (local Ollama or a free hosted tier).
- **Tasks 24.1–24.5**: PDF text extraction, the provider-agnostic AI client and team setup guide, the review, the profile autofill, and tests.

# Prompt 2
Acceptance tests don't align with those tasks.

# Response 2
Rewrote the story so it lines up with the acceptance tests already posted (#192, #193):
- The acceptance criteria are now the tests' "criteria covered" bullets word for word, split into **Resume review** (4) and **Fill profile from resume** (3).
- The tasks were reordered so they split cleanly between the two tests:
  - Task 24.1: AI client (local Ollama or free hosted tier, chosen in `.env`) and team setup guide
  - Task 24.2: PDF text extraction
  - Task 24.3: AI resume review with optional job tailoring, saved per resume
  - Task 24.4: Fill profile from resume with a checklist before anything is added
  - Task 24.5: Tests for the AI client, AI output checks and import rules
- Suggested adding a **Tasks:** line to each posted test, like the other acceptance tests: 24.1 → Tasks 24.1, 24.2, 24.3; 24.2 → Tasks 24.2, 24.4, 24.5 (PDF reading is shared by both features).

# Prompt 3
I need to make user stories for these points:
- Receive in-app notifications and reminders for application updates, interview invitations, upcoming deadlines, and recruiter actions.
- View an analytics dashboard with application history, a status breakdown (pending, interview, rejected, etc.), and activity metrics such as applications submitted over time.
- AI job matching suggestions: recommend relevant jobs based on user profiles and resumes.

# Response 3
Checked the repo first: the first two points are already covered by existing stories, **US-26: Notifications and Reminders** (#161, Kimia) and **US-25: Application Analytics and History Dashboard** (#160, Michael), so no new stories were needed for them.

Wrote **US-31: AI Job Matching Suggestions** (US-29 was already taken by #184), in the format of US-25 and US-26:
- **Story**: As a job seeker, I want AI to suggest jobs that match my profile and resume so that I can find relevant openings without searching through every posting.
- **Acceptance criteria**: suggestions picked from open, published postings; based on the profile and optionally a resume; each with title, company, location, a match level and a short reason; missing skills listed; closed, unpublished and already-applied-to jobs excluded; saved, refreshable and private; clear messages for an empty profile, no matches or the AI being unavailable.
- **Tasks 31.1–31.5**: gather profile, resume and open postings; AI matching with the existing US-24 client and checks on its output (only real job ids, fixed match levels); store and refresh suggestions; suggestions UI; tests.
- **Notes**: reuses the free provider switch from US-24, and suggestions never apply to a job or change the profile.

# Prompt 4
Okay, I need some for these:
- Use static analysis tools to identify and repair code issues, and link commits to analysis reports
- Ensure use of unit tests for all code
- CI/CD pipeline on GitHub

# Response 4
Checked what the repo already had: a GitHub Actions workflow running the type check and tests on every pull request (#102), no linter or formatter, 36 test files on Node's built-in test runner but no coverage measurement, and no deployment yet. Wrote three stories that build on this:
- **Static analysis and code quality reports**: ESLint and Prettier with `pnpm lint` and `pnpm format`, code scanning (GitHub CodeQL or SonarQube Cloud) on every push with a report per commit, existing issues fixed in separate commits that link to their report, and a document summarising what was found and fixed.
- **Unit test coverage for all code**: a `pnpm test:coverage` script with Node's built-in coverage (no new dependency), tests for every server module and form action with fakes instead of the real database, storage or AI, a coverage target agreed by the team (e.g. 80%), fixing the outdated `auth.test.ts`, and a testing guide.
- **CI/CD pipeline on GitHub**: lint, coverage and build steps added to the existing workflow, branch protection on main, a coverage threshold, automatic deployment of main and preview deployments to a free host (e.g. Vercel), secrets kept out of the code, and a status badge in the README.
- Noted that a deployed site can't reach a local Ollama model, so the AI features would need the hosted option on the live site.

**Used**: the unit test story became **US-32: Unit Test Coverage for All Code** (#203) and the CI/CD story became **US-33: CI/CD Pipeline on GitHub** (#204), both trimmed. The static analysis story was not used.

---
---

# CI/CD Pipeline and Static Analysis (US-33)
- **Purpose of AI Use**: Implementing the CI/CD pipeline on GitHub Actions, with static analysis, unit test coverage and continuous delivery
- **AI-Suggested Content**: A CI/CD workflow (lint, type check, unit tests with an 80% coverage minimum, production build, build package published on every merge to main), a CodeQL static analysis workflow, ESLint setup, a switch to `adapter-node` so the build is runnable, fixes for the issues ESLint found, a CI/CD guide (`docs/ci-cd.md`), README badges, and branch protection steps
- **Validation**: Reviewed and saw a proper working pipeline in GitHub after every push
- **Decision**: Accepted
- **Reflection**: AI helped produce the CI/CD pipeline and fix Lint issues that went unoticed previously
- **Responsible Person**: Paul Fourment

# Prompt 1
I want to do the CI/CD implementation. Make sure it is implemented correctly for what the course asks. They also ask for a CD, but we were told we're not expected to have a proper production system: it's a test app to demo, no servers needed, and models can run locally.

# Response 1
**Starting point**: the existing CI workflow ran the type check and tests on every pull request. There was no linter, no coverage measurement, no build check and no delivery, and `main` had no branch protection.

**CI/CD workflow** (`.github/workflows/ci.yml`), on every pull request and push to `main`:
1. **Lint and type check**: ESLint (new, `pnpm lint`) and `svelte-check`.
2. **Unit tests and coverage**: all 314 tests with Node's built-in coverage (`pnpm test:coverage`, no new dependency). Fails if line or branch coverage drops under 80% (currently 88.7% lines, 90.6% branches), and shows the coverage table in the run's summary.
3. **Production build**: runs only after the first two jobs pass.

**CD without a server**: on every merge to `main`, the build job publishes the built app as a downloadable package (kept 30 days) that anyone can run with `node build`. This needed a switch from `adapter-auto`, which produces nothing runnable outside a known host, to `adapter-node`. AI features keep using the model set in `.env`, such as local Ollama.

**Static analysis**:
- **ESLint** (SvelteKit's standard setup with TypeScript and Svelte rules) blocks merging on any error.
- **CodeQL** (`.github/workflows/codeql.yml`), GitHub's free security and quality analysis for public repositories, runs on every pull request, push and weekly. Its alerts are numbered under Security → Code scanning, so commits that fix them can link to the report.

**ESLint's first run** found 104 errors in 37 files:
- 79 from one rule, `svelte/no-navigation-without-resolve`, which only matters for apps served under a sub-path.
- 25 others: `any` types, repeated spaces in regexes, control characters in regexes, `{#each}` blocks without keys, `Set`/`Map` reactivity suggestions, and unneeded `{' · '}` mustaches.

**Checked locally**: workflows pass actionlint; lint, type check, tests with coverage and build pass; lowering the coverage minimum below the real value was confirmed to fail the run; the built server starts and serves the login page.

**Documentation**: `docs/ci-cd.md` (what each check does, how to run a delivered build, how to link commits to analysis reports, branch protection), CI/CD and CodeQL badges in the README.

**Manual step on GitHub**: protect `main` (Settings → Branches) so a pull request needs 1 approval and the four checks (Lint and type check, Unit tests and coverage, Production build, Static analysis (CodeQL)) before merging.

# Prompt 2
(*Choosing how to handle the 104 ESLint errors*) Turn off the one rule and fix the other 25.

# Response 2
- **Turned off** `svelte/no-navigation-without-resolve`, with the reason written in `eslint.config.js` (CareerConnect is served from the root, so `resolve()` changes nothing).
- **Allowed `any` only in `*.test.ts` files**, since the test fakes stand in for SvelteKit and better-auth objects (9 errors).
- **Fixed**:
  - Added keys to the two `{#each}` blocks (job application resume picker, theme options in Settings).
  - Rewrote repeated spaces in four test regexes as `{2}`, `{4}`, `{8}`, matching the same text.
  - Replaced one unneeded `{' · '}` with plain text on the Resumes page.
- **Kept with a disable comment explaining why**, where the rule doesn't apply:
  - Three `{' · '}` separators that Svelte 5 needs, because it drops plain whitespace at the start of a tag or block.
  - Two control-character checks that deliberately reject control characters in notification links (security).
  - Three temporary `Set`/`Map` lookups in the autocomplete code that are never rendered or read reactively.
- **Result**: lint, type check, 314/314 tests and the build all pass. The compiled pages were checked to confirm the `·` separators still render with their spaces.
- **Suggested commits** for the "commits linked to analysis reports" evidence: the pipeline in one commit, then one commit per ESLint rule naming it in the message (e.g. "Add keys to {#each} blocks (ESLint svelte/require-each-key)"), then the docs.


---
---

# Unit Test Coverage for All Code (US-32)
- **Purpose of AI Use**: Finding the code without unit tests and writing tests so every server module and form action is covered, without using the real database, storage or AI model
- **AI-Suggested Content**: A shared test helper that fakes the database, Better Auth, storage, emails, the AI model and SvelteKit's modules; 7 new test files (73 tests); removal of the outdated `src/routes/auth.test.ts`; test scripts that run every test file; a testing guide with the coverage per file before and after (`docs/testing.md`)
- **Validation**: Reviewed and passed all unit tests myself
- **Decision**: Accepted
- **Reflection**: AI helped produce soldi unit tests tht cover the entire project, which is beneficial for the pipeline checks we now run.
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


---
---

# Demo Data, UI Polish, AI Job Matching (US-31) and Acceptance Tests
- **Purpose of AI Use**: Preparing the app for the final demo (realistic demo data, a cleaner interface and navigation), implementing the second Generative AI feature, and writing the remaining acceptance tests
- **AI-Suggested Content**: A seed script with demo recruiters, job seekers, postings, resumes and applications (`scripts/seed.ts`, `docs/seed-data.md`); sidebar icons and button styles; a fix for the gap above every page; AI job matching reusing the US-24 AI client (`src/lib/server/job-match.ts`, `/matches` page, `job_match` table); a reorganized sidebar with tabs inside each area; 8 acceptance tests for US-16, US-31, US-32 and US-33
- **Validation**: reviewed all changes, tests ai model, and published the acceptance tests
- **Decision**: accepted
- **Reflection**: AI helped build the final ai generative feature from what was already built before, and helped polish the final changes as well.
- **Responsible Person**: Paul Fourment

# Prompt 1
Can you seed data for the website so it looks more professional rather than test data? I can give you the logins for my recruiter and job seeker accounts, or do you prefer doing it through the database?

# Response 1
Recommended a seed script over clicking through the site: it can be rerun on a fresh database, teammates can use it, passwords are hashed the same way as the sign-up page, and it can be reviewed before anything is written. The account passwords weren't needed; the data was attached to the two accounts by email.

Choices made: only add data (never change or delete existing rows), create about 12 extra demo people, review a dry run first, and work on a new branch from main.

**`scripts/seed.ts`** (`pnpm db:seed`, `--dry-run` to preview):
- **4 recruiters** at fictional companies (Northwind Labs, Maple Health Analytics, Lumen Financial, Boreal Robotics), each with a company profile and 3 postings with realistic descriptions, requirements, salaries and deadlines (one closed). Fictional companies with `.example` websites, so no real employer gets fake postings.
- **8 job seekers** with complete profiles (headline, about, skills, job preferences, experience with bullet points, education) and a generated text resume PDF uploaded to the private `resumes` bucket, readable by the AI features.
- **22 applications** at every stage, **5 offers and rejections** with full recruiter messages, **38 notifications** matching what the app sends, **23 follows** and **3 feature suggestions**.
- **The two team accounts** only had their empty fields filled, plus postings and applications.
- Dates are relative to the day it runs, so deadlines stay in the future. Running it again adds nothing.

**Verification**: the dry run rolled back and left every table count unchanged; the real run added exactly the expected rows and uploaded 8 of 8 PDFs; a generated PDF was read back with accents, bullets and wrapped lines intact; signing in as a demo job seeker showed her applications, the new postings and a working resume download. `docs/seed-data.md` lists the demo accounts (shared password) and how to run it.

# Prompt 2
What does seed.ts do? Do I need to commit it?

# Response 2
It creates the demo accounts, fills in their profiles, postings and resumes, then builds the activity between them, and only ever adds. The data is already in the database, so the site doesn't need the script, but committing it lets anyone rebuild the demo with one command, shows teammates the demo logins, and is evidence of where the data came from. The demo password in it only works for the fake `.test` accounts.

# Prompt 3
Can you improve the UI buttons, especially the sidebar with matching icons?

# Response 3
- **Icons**: an `Icon` component with outline icons copied from Lucide (open-source), so no new dependency; one icon per sidebar link and an exit icon on Log out.
- **Sidebar**: the current page gets a tinted background and a teal icon; Log out turns red on hover; on phones the links sit in a two-column grid instead of uneven wrapped rows (one column under 360px).
- **Buttons**: the shared primary and secondary styles lift slightly on hover, press down when clicked and have softer shadows. Their size and layout were left alone because about 25 places combine them with other classes.
- Checked in dark mode, light mode and at phone width. One existing test looked for the old `flex-wrap` class; it was updated to the new grid while keeping what it protects (the notification bell stays in the header).

# Prompt 4
The top of the main pages is lower than the sidebar. Fix that gap.

# Response 4
All 21 logged-in pages added the same `md:mt-14` (56px) of top margin, left over from an earlier layout. Removing it makes every page start level with the sidebar card; measured in the browser on two pages (both at the same height). Phone layouts were unaffected.

# Prompt 5
This is the last feature I need to implement. Reuse the AI system we already built.

(*US-31 pasted: suggestions picked from open, published postings, based on the profile and optionally a resume; each shows title, company, location, a match level and a reason; missing skills listed; closed, unpublished and already-applied jobs excluded; saved, refreshable and private; clear messages for an empty profile, no fit, or the AI being unavailable. Tasks 31.1 to 31.5.*)

# Response 5
**Design**: the server decides which jobs are allowed before the AI sees anything, and the AI only ranks and explains.
1. **Eligible jobs** (`isMatchable`): published, open, not archived, deadline not passed, not posted by the user and not already applied to. The same rule runs again whenever saved matches are shown, so a job that closes or is applied to disappears without refreshing.
2. **Shortlist**: the 12 eligible jobs sharing the most terms with the candidate's skills, roles and job titles, so the prompt stays small enough for a local model.
3. **Prompt**: the profile (skills, experience, education, preferences; no name, email or phone), the optional resume text, and the jobs labelled `J1`, `J2`… instead of database ids. The model is told the data is untrusted, not to invent anything, and not to pad the list.
4. **Output checks** (`normalizeMatches`): references that weren't sent are dropped, levels must be Strong, Good or Partial, each job appears once, "missing" skills the candidate already has are removed, and results are sorted strongest first (max 6).
5. **Saved** per job seeker in a new `job_match` table (SQL to run on Supabase), with the resume used and the model name.

**Page** (`/matches`): resume picker (or profile only), **Find my matches** / **Refresh matches**, cards with company logo, details, a coloured level badge, the reason and **Missing for this job**, and a note that AI can be wrong. Messages for an empty profile (with a link to complete it), no jobs that fit, AI not set up, unreadable PDFs and AI failures (the previous matches stay). Recruiters get "not found". The Home page button for job seekers now leads there, and `docs/ai-setup.md` documents the feature and its privacy and validation rules.

**Validation with the real local model** (seeded profiles, read-only):
- The first version ranked unrelated jobs highly (it counted common words like "experience"), padded the list with weak "partial" matches, and described one candidate with a trait the profile didn't contain.
- Fixed by ignoring common words and weighting the candidate's own skills and titles, and by telling the model not to pad the list or describe unstated traits.
- After the fix: a full-stack profile got five sensible, ranked matches with real gaps in about 30 seconds; three profiles got none because they had already applied to the postings in their field.

**Tests**: 13 new unit tests (eligibility rules, ranking, prompt content, output checks, saving, access control, every error message), with the AI faked. 472 tests pass.

**SQL to run in the Supabase SQL Editor**
```sql
create table public.job_match (
  user_id    text primary key references public."user"(id) on delete cascade,
  resume_id  uuid references public.resume(id) on delete set null,
  matches    jsonb not null,
  model      text not null,
  updated_at timestamp not null default now()
);
alter table public.job_match enable row level security;
```

# Prompt 6
The sidebar is a bit full now. Reorganize it, maybe by moving things into the Jobs tab. Same with Recruiters and Following: merge those.

# Response 6
The sidebar now has one link per area, and related pages became tabs at the top of each area (a shared `SectionTabs` component, no URLs changed):

| Sidebar | Tabs (job seeker) | Tabs (recruiter) |
|---|---|---|
| Home | | |
| Jobs | All jobs, Job matches, My reviews | All postings, Active, Archived, Company reviews |
| My Applications | | |
| Resumes | | |
| People | Recruiters, Following | Job seekers, Following |
| Settings | Settings, Suggest a feature (+ Review suggestions for admins) | same |

Job seekers went from 10 sidebar links to 6, recruiters from 7 to 4. The sidebar keeps its area highlighted on every tab (e.g. Jobs stays selected on Job matches). Checked every tab as a demo job seeker and a demo recruiter, and at phone width.

# Prompt 7
Now I need to wrap up all the acceptance tests for my user stories that I'm missing. Create them in a Markdown file so I can create the issues myself under my name.

# Response 7
Compared the stories assigned to me with the existing "Acceptance Test" issues: US-16, US-31 and US-33 had none, and US-32 (written by me but unassigned) had none either. Wrote two tests per story in the team's format (Tasks, criteria covered, Given / When / Then with checkboxes, Result left empty), with messages and button names taken from the code:

| Story | Tests | Covers |
|---|---|---|
| US-16 Onboarding | 16.1, 16.2 | Questions per role, saving, answers on the card and profile; skipping, and the window never coming back |
| US-31 Job matching | 31.1, 31.2 | Levels, reasons, missing skills, saving and refreshing with a resume; applied and closed jobs removed, recruiters blocked, every error message |
| US-32 Unit tests | 32.1, 32.2 | The coverage report and the 80% minimum, the removed outdated test, the fakes, and deliberate bugs caught by tests |
| US-33 CI/CD | 33.1, 33.2 | Checks on every pull request, a failing test blocking the merge, the coverage summary, and the downloadable build after a merge |

Two steps were corrected after checking the code: the onboarding field already stops typing at 100 characters, and the exact coverage error text was used. The file gives each issue's title and body ready to paste.

Issues found along the way: the `main` ruleset requires a pull request and an approval but not passing checks (needed for 33.1); #204 still asks for hosted deployment while the team agreed on a downloadable build; #203 and #204 use the wrong task numbers; #203 has no assignee.
