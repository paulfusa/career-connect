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
