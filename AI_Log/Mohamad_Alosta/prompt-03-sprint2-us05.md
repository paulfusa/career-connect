# Prompt 3 - US-05 Browse and View Job Offers (Sprint 2)

- **Tool**: Claude
- **Date**: October 8 - 11, 2026
- **Purpose of AI Use**: Learning the project's tools, and step-by-step guidance and code review for US-05 (#10).
- **Chat Link or Prompt/Response**: No shareable link. My main requests are in the appendix below.
- **AI-Suggested Content**: The AI explained each concept using Michael's job postings as the example, split US-05 into steps with templates to fill in, and reviewed every change I made. Some code was provided directly by the AI (listed below).
- **Validation**: pnpm check (0 errors), pnpm test (31 passing, 4 new), a database check, and manual testing in the browser.
- **Decision**: Modified before use. I wrote most of the code from the templates, and the AI's parts are listed below.
- **Reflection**: I learned more about Svelte and TypeScript, and how my code connects to the database and the website.
- **Responsible Person**: Mohamad Alosta

## Development and Understanding Process

The feature was built one small step at a time. For each step, the AI explained the concept first, I wrote the code, ran `pnpm check` / `pnpm test`, and the AI reviewed the result before moving on. I asked for explanations whenever something was unclear, for example:

- What database defaults are and why required columns added to an existing table need one.
- Why requirements and deadline should be required in the form validation rather than in the database (I chose this option after the AI explained both).
- Why the acceptance rate should be calculated rather than stored.
- How a form field's `name` connects to `data.get(...)` on the server.
- How to read TypeScript error messages (file, line, column, cause).
- Why `FormDataEntryValue` is a type and not a variable name.
- What the spread operator (`...posting`) does, and how to write the same thing field by field.
- How a date without a time is shifted by time zones (why `T00:00` is needed).
- The difference between `status` (can people apply?) and `published` (can job seekers see it?).

## Work Done (by step)

| Step                                                      | What was done                                                                                                                      | Who wrote it                                                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1. Database columns (`schema.ts`)                       | Added `status`, `published`, `requirements`, `applicationDeadline`, `salaryMin`, `salaryMax`                           | Me, from the AI's explanation and a field table                                                  |
| Database migration                                        | `alter table` SQL run in the Supabase SQL Editor                                                                                 | SQL provided by the AI; I ran it and verified the result                                         |
| 2. Validation (`job-posting.ts`)                        | Read and validated the new fields; requirements and deadline required; status open/closed; salary whole number >= 0 and min <= max | Me, from templates with blanks; `toSalary` helper and salary rule structure given as templates |
| 2. Tests (`job-posting.test.ts`)                        | Updated the existing sample data and wrote 4 new tests                                                                             | Me, with the AI explaining failures                                                              |
| 3a. Form (`JobPostingForm.svelte`)                      | Requirements, deadline (date picker), status dropdown, published checkbox, salary min/max                                          | Me, by copying existing fields as the AI explained; salary row structure provided by the AI      |
| 3b. Edit page (`edit/+page.server.ts`)                  | Convert `null` requirements/deadline to empty text for old postings                                                              | Field-by-field mapping provided by the AI; I placed and fixed it                                 |
| 3c. Job list (`jobs/+page.server.ts`, `+page.svelte`) | Hide unpublished jobs from job seekers; Open/Closed and Draft badges                                                               | Me, from templates with blanks                                                                   |
| 3c. Details access (`[id]/+page.server.ts`)             | 404 for unpublished jobs that aren't yours                                                                                         | Me, from a template with one blank                                                               |
| 3d. Details page (`[id]/+page.svelte`)                  | Badges, requirements section, deadline, salary range, closed notice                                                                | Me, from templates; `formatDate` and `formatMoney` helpers provided by the AI                |

## Errors and Bugs Found During Review

- `'application_deadline'` used as the form field name instead of `'applicationDeadline'` (would have made the deadline always "missing").
- `'true'` (text) used instead of `true` (boolean) as a default.
- Optional columns accidentally made required (`.notNull()`), which broke the create page.
- Test inputs that did not match the test's intent (valid values in a "required" test, explicit status in a "default" test), and a missing backtick.
- Status dropdown where both options were "selected" for new postings.
- Published checkbox hard-coded to `checked={true}` (would have published drafts on every edit).
- Draft badge checking `status` instead of `published`.
- Salary-only-maximum shown as "From" instead of "Up to".

## Validation and Testing

- `pnpm check`: 0 errors at the end; `pnpm test`: 31 tests passing (4 new).
- Read-only database check after the migration: 6 new columns present with the right types and defaults; the existing posting stayed open and visible.
- Manual testing in the browser:
  - The browser blocks empty required fields; requirements made of spaces show my server error.
  - Minimum salary above maximum shows my error message.
  - A valid posting saves, and Edit shows all saved values.
  - Unticking Published hides the job from a job seeker's list.
  - Badges, requirements, deadline and salary display on the job pages.

## Code Provided Directly by the AI

- SQL migration for the 6 new columns.
- `formatDate` and `formatMoney` helpers on the job details page.
- The field-by-field object returned by the edit page's `load` function.
- Structure of the salary row in the form and of the first two salary display cases.
- The local-only `vite.local.config.ts` (not committed) that moves Vite's cache outside Dropbox.

## Other AI Use During This Period

- Reviewing my meeting minutes PR (#84) for formatting errors.
- Guidance on branch naming and cleaning up old branches.
- Setting up my development environment (installing Node.js and pnpm, creating `.env`, fixing a Vite cache error caused by Dropbox).
- Preparing for the demo (October 25 - 26): I asked the AI to explain the US-05 code chunk by chunk, split into the code I wrote, the code it wrote and the code we wrote together, and to walk me through the SQL I ran to add the new columns.

# Appendix - Main Prompts

> wait based on the project on git for the milestone we need US-05 not 6 now but can i do browse job offers or does it depend on job application to be done first

> ok so let us move through this one by one and if i understand it i write it down and u check it

> no dont give it to me yet i want to try and do it

> shouldnt requirements be required and also shouldnt we include acceptance rate

> let us go with A

> ok so i save what i have and let us start with step2

> Can u provide an explanation for US-3,5,14,15.1 for the codes u and i wrote separately and together so i can prepare for the demo
