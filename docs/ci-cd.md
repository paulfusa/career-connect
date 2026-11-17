# CI/CD Pipeline

Every pull request to `main` and every push to `main` runs two GitHub Actions workflows. A pull request can only be merged when all their checks pass.

| Workflow | Job | What it does | Fails when |
|---|---|---|---|
| [CI/CD](../.github/workflows/ci.yml) | Lint and type check | ESLint static analysis (`pnpm lint`), then `svelte-check` (`pnpm check`) | Any ESLint error, or any type error |
| | Unit tests and coverage | Runs every unit test with Node's built-in coverage (`pnpm test:coverage`) and shows the coverage table in the run's summary | Any test fails, or line or branch coverage is under 80% |
| | Production build | Builds the app (`pnpm build`), only after the two jobs above pass | The build fails |
| [CodeQL](../.github/workflows/codeql.yml) | Static analysis (CodeQL) | GitHub's security and code quality analysis; also runs every Monday | Results appear under **Security → Code scanning** |

## Continuous delivery

Delivery stops at a ready-to-run package. On every merge to `main`, the Production build job publishes the built app as an artifact named `career-connect-<commit>`, kept for 30 days. To run it:

1. Open the run under **Actions → CI/CD** and download the artifact.
2. Unzip it, add a `.env` file (see `.env.example`), and run:
   ```bash
   pnpm install --prod
   node --env-file=.env build
   ```
3. Open http://localhost:3000.

AI features still use the model set in `.env`, such as Ollama on your own computer (see [AI setup](ai-setup.md)).

## Running the checks locally

Run the same checks before opening a pull request:

```bash
pnpm lint
pnpm check
pnpm test:coverage
pnpm build
```

## Static analysis reports

- **ESLint** runs on every push. Its errors are listed in the failing job's log.
- **CodeQL** reports are under **Security → Code scanning** on GitHub, each alert with a number and a link to the commit that introduced it.

When a commit fixes an issue, link the report in the commit message, for example `Fix unsafe regex in job search (CodeQL alert #4)` or `Add keys to {#each} blocks (ESLint svelte/require-each-key)`. GitHub closes a CodeQL alert automatically once the fixing commit reaches `main`.

## Branch protection

`main` is protected (**Settings → Branches**): a pull request needs the CI/CD and CodeQL checks to pass and one approving review before it can be merged.
