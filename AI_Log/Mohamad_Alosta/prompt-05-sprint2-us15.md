# Prompt 5 - US-15 Apply for a Job, Task 15.1 and Fixes (Sprint 2)

- **Tool**: Claude
- **Date**: October 17 - 25, 2026
- **Purpose of AI Use**: Guidance and code review for my part of US-15 (#20), task 15.1, and fixing problems found after Maher's PR #118.
- **Chat Link or Prompt/Response**: No shareable link. My main requests are in the appendix below.
- **AI-Suggested Content**: The AI gave me some templates for the application table, the validation and the apply rules, and reviewed my code. After PR #118, it found three bugs and set up the code for my deadline rule.
- **Validation**: pnpm check (0 errors), pnpm test, a database check for duplicate applications, and manual testing with a recruiter and a job seeker.
- **Decision**: Modified before use. I wrote the table, the validation and the apply rules with their tests, and the AI's fixes are listed below.
- **Reflection**: I learned how a unique rule in the database stops duplicate applications, and the difference between a function's parameters and the values passed to it.
- **Responsible Person**: Mohamad Alosta

## Development and Understanding Process

US-15 was split between Maher and me. I built the application table first so the rest of US-15, and US-03 and US-20, could build on it. Things I asked about:

- Whether US-15 could start, and what it depended on (resumes and job postings already existed).
- How `unique(...).on(...)` makes one application per job per user, which is the point of the table.
- Why the tests use `{ ...openJob, status: 'closed' }`: `openJob` is a sample job, and the spread copies it and changes one field.
- Why a test file can't import the database schema file (it crashed the test run).
- Which time zone to use for "today": I asked about UTC or EST, and kept Eastern time (EST/EDT) so the deadline day ends at midnight in Montreal.
- What the page shows from that date, and adding the time to dates like "Applied Oct 22, 2026, 3:45 p.m. ET".

## Work Done (by step)

| Step                              | What was done                                                                               | Who wrote it                    |
| --------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| Application table (`schema.ts`) | Links each application to a job, a user and a resume, with one application per job per user | Me, from a template             |
| Statuses (`profile-options.ts`) | The five statuses, starting at Applied                                                      | Me, from a template             |
| Validation (`application.ts`)   | Checks that the chosen resume is a real id                                                  | Me, from a template             |
| Apply rules (`applyProblem`)    | Job not found, job closed, already applied                                                  | Me, from a template with blanks |
| Tests (`application.test.ts`)   | 6 tests for the validation and the rules                                                    | Me                              |
| Review of PR #118                 | Found the three problems listed above                                                       | The AI                          |
| Deadline rule (October 22 - 23)   | No applying after the deadline, but still allowed on the deadline day                       | Me                              |
| Deadline tests                    | The day after the deadline is refused, the deadline day is fine                             | Me                              |

## Errors and Bugs Found During Review

- The unique rule was outside the table's list of rules and on the wrong columns.
- I passed values like `published: true` inside the function call instead of using the function's parameters.
- I imported the schema file in a test, which made the whole test file fail.
- In the deadline rule:
  - VS Code auto-imported an unrelated MySQL `date`, which I removed.
  - I first compared `alreadyApplied` (true or false) with a date.
  - Then I compared today with today, which is never later, before using the job's deadline.
- In the deadline tests, the expected message didn't match the rule's exact text, and I expected `true` where the rule returns `null` when nothing is wrong.

## Validation and Testing

- `pnpm check`: 0 errors. `pnpm test`: all tests pass, including my 6 tests and the 2 deadline tests.
- Database check: the one-application-per-job rule is in place, and there are no duplicate applications.
- Manual testing with a recruiter and a job seeker:
  - "Application submitted successfully." stays on screen after applying.
  - Opening the job again, or in another tab, says "You have already applied to this job."
  - Cancel in the withdraw popup does nothing, and OK withdraws and shows a message.
  - A closed job, or one past its deadline, shows why you can't apply.
  - The recruiter sees the application and the resume.
- Acceptance test 15.1 passed on October 25.

## Code Provided Directly by the AI

To save time, the AI wrote the parts below, which follow patterns already in the project. I read and tested each one.

- Passing the job's deadline and today's date to the apply rule, and a small helper that gives today's date in Eastern time.
- Keeping the success message on screen after applying, and showing messages when withdrawing.
- The time and "ET" on application dates and on the deadline.

## Other AI Use During This Period

- Preparing for the demo (October 25 - 26): I asked the AI to explain my part of US-15 chunk by chunk, split into the code I wrote, the code it wrote and the code we wrote together.

# Appendix - Main Prompts

> can US15 start or does it depend on anything

> ok let us do US 15 my part and do whatever we can do further for 3 and 5

> so what we're doing is basically creating the uniqueness of applications

> since US-15 is done can u check it and see if it has any error

> u cant submit multiple applications to same role right?

> Can u provide an explanation for US-3,5,14,15.1 for the codes u and i wrote separately and together so i can prepare for the demo
