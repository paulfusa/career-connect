# Prompt 8 - US-28 Job Filter Additions (Sprint 3)

- **Tool**: Claude
- **Date**: November 13 - 14, 2026
- **Purpose of AI Use**: Drafting the user story (#166), the code and the unit tests for US-28, and fixing the problems I found while testing.
- **Chat Link or Prompt/Response**: No shareable link. My main requests are in the appendix below.
- **AI-Suggested Content**: We worked on US-28 together. I outlined what the story should include and gave ideas, and the AI offered templates, then drafted the code and tests when I asked it to and explained the parts I asked about. I also tested everything in the browser and told it what to fix and how to make it better.
- **Validation**: pnpm check (0 errors), pnpm test (18 new tests), manual testing in the browser, acceptance tests #180 and #181, and Maher's review of PR #175.
- **Decision**: Used after testing, with two fixes I asked for (the minimum salary rule and long words breaking out of their boxes).
- **Reflection**: Letting the AI draft the code made this much faster than Sprint 2. I spent my time on what the filters should do and on testing them, and that's how I found the two bugs below.
- **Responsible Person**: Mohamad Alosta

## Development and Understanding Process

I started from the job search I built in Sprint 2 (US-14). I asked the AI to only add what was new, and decided with it what the story should cover. After the AI drafted each part, I tested it in the browser and told it what was wrong. Things I asked it to explain:

- Whether we should also add a maximum salary filter. We kept only the minimum salary.
- Where the company and city suggestions come from. They reuse the same suggestions as the job posting form, plus "Remote" for the location.
- What the `{#key}` block around the suggestion fields does (it resets the field so Clear search empties it).
- Why a job posted on November 13 didn't show up under "Last 24 hours".
- Which commands to run to test it again (`pnpm check`, `pnpm test`, `pnpm run dev`).

## Work Done (by step)

| Step                                                                   | What was done                                                                                                    | Who did what                                                                                            |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| User story (#166)                                                      | A sub-issue of US-14 with the acceptance criteria and tasks 28.1 to 28.6, only for the new filters               | Both of us: I outlined what goes in and asked for plainer wording, and the AI drafted it                |
| 1. Suggestions (`jobs/+page.svelte`)                                 | Company and Location give suggestions while typing, and Location also offers Remote                              | The AI drafted it and explained it to me, and I tested it in the browser                                |
| 2. Reading the filters (`job-search.ts`)                             | Reads minimum salary, date posted, open jobs only and the sort option from the URL, and ignores bad values       | The AI drafted it and explained it to me, and I tested the filters in the browser                       |
| 3. Filtering and sorting (`jobs/+page.server.ts`)                    | The new conditions, plus sorting by the closest deadline or the highest salary, with newest first as the default | The AI drafted it and explained it to me, and I tested it in the browser                                |
| 4. Search form (`jobs/+page.svelte`)                                 | The new fields, kept selected after searching                                                                    | The AI drafted it and explained it to me, and I tested it in the browser                                |
| 5. Unit tests (`job-search.test.ts`, `job-search-filters.test.ts`) | 18 tests for the new filters and sorts                                                                           | I asked for tests that cover everything we added, and the AI drafted them and explained what they check |
| Fix (November 14)                                                      | Minimum salary now checks the job's minimum salary, and jobs with no salary are hidden when a minimum is set     | I found the problem, and the AI fixed it                                                                |
| Fix (PR #177)                                                          | Long words with no spaces now wrap instead of running past the edge of their boxes, on every page                | I found the problem, and the AI fixed it                                                                |
| Acceptance tests (#180, #181)                                          | Two tests in the same style as my Sprint 2 ones                                                                  | The AI drafted them, and I ran each test and posted them                                                |

## Errors and Bugs Found During Testing

- I noticed that the minimum salary filter was checking the job's *maximum* salary, so a job paying 1 to 1,000,000 showed up for a minimum of 50,000. I asked for it to check the job's minimum salary instead, and the AI changed the filter and its tests.
- I noticed that typing a long word with no spaces in a text box made it run past the box. The AI fixed it for the whole site, not just one page.
- A job I posted on November 13 didn't show under "Last 24 hours". The AI checked the database: the job was 24.1 hours old, so the filter was right.
- I couldn't see the company and city suggestions at first. It was an old browser tab, and they worked after a reload.
- The site gave a 500 error while I was testing. It came from temporary test pages the AI had added while I had several dev servers running. The AI removed them.

## Validation and Testing

- `pnpm check`: 0 errors. `pnpm test`: the 18 new US-28 tests pass.
- Manual testing in the browser:
  - Minimum salary 50000 shows only the CEO job at Meta.
  - "Last 7 days" shows only this week's jobs, and "Open jobs only" hides a job whose deadline passed.
  - "Closest deadline" and "Highest salary" put the jobs in the right order, with jobs missing a deadline or salary last.
  - Typing "Sh" in Company suggests Shopify, and Location offers Remote and Montreal.
  - The filters stay selected after searching.
- Acceptance tests #180 and #181 passed on November 14.
- Maher reviewed and merged PR #175 and the long words fix (PR #177).

## Code Provided Directly by the AI

- All of the US-28 code and its 18 unit tests, including the two fixes above.

## Code Walkthrough from the AI

To prepare for the lab, I asked the AI to walk me through the US-28 code block by block. Its explanation, in short:

| Block                                     | What it does                                                                                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dropdown choices (`profile-options.ts`) | The "Date posted" and "Sort by" options. The key goes in the URL (like `7` for 7 days) and the value is the text you see.                                                                                                 |
| `parseJobSearch` (`job-search.ts`)    | Reads the search from the URL and only keeps valid values: allowed dropdown keys, a whole-number salary of up to 7 digits, and `on` for ticked boxes. Anything else means "no filter".                                    |
| `postedAfter` (`job-search.ts`)       | Works out the cutoff date for "Last N days": now minus N days.                                                                                                                                                              |
| Filters (`jobs/+page.server.ts`)        | Adds one condition per filled-in field: the job's minimum salary is at least the amount typed, the job was created after the cutoff, and the job is open with no passed deadline.                                           |
| Sorting (`jobs/+page.server.ts`)        | Closest deadline puts upcoming deadlines first, then passed ones, then jobs with none. Highest salary uses the top of the range and puts jobs with no salary last. Newest first is always the tie-breaker, and the default. |
| Search form (`jobs/+page.svelte`)       | The new fields, filled in from the current search so they stay selected. Company and Location use the posting form's suggestions, and `{#key}` rebuilds them so Clear search empties them.                                |
| Long words (`layout.css`)               | Lets long words wrap anywhere on the site, but not inside buttons.                                                                                                                                                          |
| Tests                                     | One file tests reading the URL and the cutoff date. The other runs the page's `load` against a fake database and checks the query it builds, for example that the salary filter uses `salary_min`.                      |

## Other AI Use During This Period

- Updating the acceptance criteria and tasks of US-19 (#80) to match what we built.
- The Sprint 3 plan, task breakdown, contribution log and the November 5 and November 12 meeting minutes. I told the AI what each meeting was about, and it drafted them.
- Making the comments in the code and the docs read more plainly.
- Preparing for the lab: a walkthrough of the US-28 code, summarized above.

## Appendix - Main Prompts

> ok first let us do fill the issue and make it a sub issue for job filters

> should we also do for max salary

> are there APIs added to the Job search

> what do u mean by key

> before we test there is another problem when we write without spaces in a textebox the text usually exceeds the textboxes dimensions

> shouldnt the min salary provide a min slary job with = or higher minimum?

> Test didnt show up in the last 24 hrs as date posted and it was posted 11/13/2026

> i dont see the API for all the filters like company and city

> Can u give me a summary of what each code block does for what we worked on together and explain them telling me which parts did what?

> Walk me through the code blocks one by one
