# Team Process

How our team works on CareerConnect.

## Workflow
1. Every user story or task is a **GitHub Issue**.
2. At the start of each sprint, we pick the issues to work on and assign an owner to each one.
3. The owner makes a **branch**, does the work, and opens a **pull request (PR)**.
4. A teammate **reviews** the PR.
5. The PR is **merged** into `main`, and the issue is closed.
6. We plan to meet **once a week** (in person or on Discord) and write meeting minutes (other than during the lab session).

## Branching Strategy
- `main` is the working version of the project. **Don't push directly to `main`.**
- Make a new branch from `main` for each issue:
  - `feature/<name>` for new features (e.g. `feature/user-login`)
  - `fix/<name>` for bug fixes (e.g. `fix/login-error`)
  - `docs/<name>` for documentation (e.g. `docs/sprint-1-plan`)
- Pull the latest `main` before you start, so you don't get conflicts.

## Pull Request Process
- Give the PR a clear title and a short description of what you changed.
- Write `Closes #<issue number>` in the description so the issue closes automatically.
- Ask **at least one teammate** to review it.
- Merge only after it's approved.

## Code Review Process
The reviewer checks that:
- It does what the issue asks for.
- The app still runs and nothing else broke.
- No passwords or `.env` files were committed.

If something needs fixing, the reviewer leaves a comment and the author updates the PR. We try to review PRs within **2 days**.

## Definition of Ready
An issue is ready to start when:
- It has a clear description and acceptance criteria.
- It's divided into tasks.
- It has an owner, a priority and an estimate in hours.

## Definition of Done
An issue is done when:
- All acceptance criteria are met.
- The PR was reviewed and merged into `main`.
- The app runs without errors.
- Any AI use is logged in `AI_Log/`.
