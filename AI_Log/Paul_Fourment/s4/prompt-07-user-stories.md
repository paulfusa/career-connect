# Sprint 3 User Stories (US-24, US-31, US-32, US-33)
- **Purpose of AI Use**: Writing user stories for the Sprint 3 requirements (Generative AI feature, AI job matching, unit tests, CI/CD) in the same format as the team's existing stories
- **AI-Suggested Content**: US-24 (Resume AI Autofill & Review) with acceptance criteria matching the posted acceptance tests, US-31 (AI Job Matching Suggestions), a static analysis story, a unit test coverage story and a CI/CD pipeline story, plus a check of which requirements were already covered by existing stories (US-25, US-26) and tooling (the CI workflow from #102)
- **Validation**:
- **Decision**: Partially Accepted / Modified (static analysis story not used; criteria and tasks trimmed in US-31, US-32 and US-33)
- **Reflection**:
- **Responsible Person**: Paul Fourment

# Prompt 1
I never made a user story for US-24. Can you quickly give me one to paste?

# Response 1
A US-24 story in the same format as US-04 (Priority, Sprint 3, Source: team-proposed for the Generative AI requirement):
- **Story**: As a job seeker, I want AI to review my resume and fill in my profile from it so that I can improve my resume and set up my profile faster.
- **Acceptance criteria** for the resume review (written feedback, tailoring to a job posting, no invented experience, saved and private) and for filling the profile (suggested details with dates and bullet points, nothing added until the user chooses, no duplicates, same validation as the profile forms), plus clear messages when the AI or the PDF can't be read, and free to run (local Ollama or a free hosted tier).
- **Tasks 24.1–24.5**: PDF text extraction, the provider-agnostic AI client and team setup guide, the review, the profile autofill, and tests.

# Prompt 2
But the acceptance tests don't align with those tasks. I already put the acceptance tests up.

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
I need to make user stories for these points (matching the other user stories in the repo, https://github.com/paulfusa/career-connect):
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
