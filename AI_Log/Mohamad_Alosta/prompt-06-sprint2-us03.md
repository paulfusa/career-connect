# Prompt 6 - US-03 Clear Application Outcome Message (Sprint 2)

- **Tool**: Claude
- **Date**: October 17 - 25, 2026
- **Purpose of AI Use**: Guidance, templates and code review for US-03 (#8), plus the acceptance rate from US-05 (task 5.4).
- **Chat Link or Prompt/Response**: No shareable link. My main requests are in the appendix below.
- **AI-Suggested Content**: The AI planned US-03 around the existing features, gave me templates for the new rules, set up the parts that follow existing patterns, reviewed my code, and combined my page with Kimia's US-20 page.
- **Validation**: pnpm check (0 errors), pnpm test (101 passing), database checks, and manual testing with a recruiter and two job seekers.
- **Decision**: Modified before use. I wrote the rules and the database helpers, and the AI's code is listed below.
- **Reflection**: US-03 is what makes our project different, so I kept the rules strict: real reasons, no changes after sending, and a status that always matches the message.
- **Responsible Person**: Mohamad Alosta

## Development and Understanding Process

US-03 had to wait for US-15, so I built the parts that didn't need applications first (the validation and the acceptance rate), then finished it once applications existed. Things I asked about or decided:

- Whether the message limit counts characters or words. I set the minimum to 100 characters because 30 was too short to explain a decision, and the maximum to 2000.
- Why next steps are required only for an offer, and cleared for a rejection.
- That `nextSteps` is a field of the form, not a function.
- How to count the days between two dates with `getTime()`, and why the order of the subtraction matters.
- Why the reminder uses `>`, so an application exactly 7 days old doesn't get a reminder yet.
- Whether a decision should be editable. I decided to keep it final, so the applicant never sees a message change after reading it, and to add a confirmation popup to catch mistakes instead.
- What a transaction is: saving the decision and the application's status together, so one is never saved without the other.
- That the acceptance rate belongs to US-05, even though it needs US-03's decisions.

## Work Done (by step)

| Step                                                  | What was done                                                                               | Who wrote it                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Validation (`application-outcome.ts`)               | Offer or rejection, reasons between 100 and 2000 characters, next steps required for offers | Me, from templates                                                   |
| Validation tests                                      | 7 tests                                                                                     | Me                                                                   |
| Database helpers (`outcomes.ts`)                    | Find a decision, check that the recruiter owns the application, count decisions for a job   | Me, from templates                                                   |
| Acceptance rate (`acceptance-rate.ts`)              | Offers out of all applications, nothing shown before the first decision                     | Me                                                                   |
| Acceptance rate tests                                 | 4 tests                                                                                     | Me                                                                   |
| Reminder rule (`reminders.ts`)                      | An application with no decision gets a reminder after 7 days                                | Me, from a template                                                  |
| Reminder tests                                        | 4 tests                                                                                     | 3 set up by the AI, the 7-day one by me                              |
| No withdrawing after a decision (`withdrawProblem`) | One new rule                                                                                | Me                                                                   |
| Withdraw test                                         | 1 test                                                                                      | Filled in by the AI at my request                                    |
| Status update (`saveOutcome`)                       | Sending a decision sets the application's status to Offered or Rejected                     | Me (the update line)                                                 |
| Database                                              | The `application_outcome` table, and fixing the status of decisions sent while testing    | SQL provided by the AI. I ran it in Supabase and checked the result. |

## Errors and Bugs Found During Review

- Validation: `<=` instead of `<` for the minimum, checking the reasons where I meant the next steps (a copy mistake), raising the limit to 10000 and then putting it back, and test messages that didn't exactly match the rules.
- Database helpers: joining the application's own id to the job's id instead of `jobPostingId`, filtering by the wrong id, and using `findIndex` where I needed `.length` to count.
- Acceptance rate: the division was flipped, and my test expected the wrong rounding (33 vs 34).
- Reminder rule: `getTime` without `()`, then subtracting in the wrong order, which gave negative days. My 7-day test was empty at first, so it passed without checking anything.
- Withdraw rule: I wrote `!decided`, which blocked every normal withdrawal. Four existing tests failed and showed the problem. The message also described the opposite case.
- Status update: I first used the table itself instead of the decision, then a `status` that only exists in browsers (it would have crashed on the server), then the function's own name, and then the word "Applied" instead of the application's id.

## Validation and Testing

- `pnpm check`: 0 errors. `pnpm test`: 101 tests passing at the end.
- Database checks: the new table has the right columns and rules, and every decided application's status matches its decision (0 mismatches).
- Manual testing with a recruiter and two job seekers:
  - A reason under 100 characters is refused, and next steps are required for an offer.
  - The confirmation popup names the applicant, and Cancel sends nothing.
  - After sending, the form turns into the sent message, and it can't be sent twice.
  - The job seeker sees Offered or Rejected, the reasons and when it was sent, and can't withdraw anymore.
  - My Applications shows Offered or Rejected.
  - The acceptance rate goes from "not available yet" to 0% to 50%.
  - Another recruiter can't open the applications page.
- Acceptance tests 3.1 and 3.2.

## Code Provided Directly by the AI

To save time, the AI wrote the parts below, which follow patterns already in the project. I read and tested each one.

- The `application_outcome` table in `schema.ts`.
- The decision form, the message the applicant sees, and the acceptance rate display.
- The decide action and the recruiter's page that shows each applicant's form or decision, and the decision on the job seeker's page.
- The confirmation popup, the "can't be changed" note and clearer error messages.
- The transaction around saving a decision, which my status update line runs inside.
- Combining my page with Kimia's US-20 status dropdown when both changed the same files.

## Other AI Use During This Period

- Preparing for the demo (October 25 - 26): I asked the AI to explain the US-03 code chunk by chunk, split into the code I wrote, the code it wrote and the code we wrote together, and to walk me through the two SQL statements I ran (creating the decision table and fixing the status of old test decisions) line by line.

# Appendix - Main Prompts

> can we do US3 or does it depend on something

> is the message limit in characters or words and what abt min

> 30 is too short

> nextsteps is a function?

> so u want me to do an if else statement ?

> are u sure we shouldnt make the decision outcome editable

> can u explain each line and walk me through them

> Can u provide an explanation for US-3,5,14,15.1 for the codes u and i wrote separately and together so i can prepare for the demo
