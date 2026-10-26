# Prompt 4 - US-14 Job Search Filters (Sprint 2)

- **Tool**: Claude
- **Date**: October 12 - 13, 2026, with one fix on October 25
- **Purpose of AI Use**: Step-by-step guidance and code review for US-14 (#19).
- **Chat Link or Prompt/Response**: No shareable link. My main requests are in the appendix below.
- **AI-Suggested Content**: The AI split US-14 into small steps with templates to fill in and reviewed each one. It also found and fixed a Clear search bug I noticed while testing.
- **Validation**: pnpm check (0 errors), pnpm test (4 new tests), manual searches in the browser, and acceptance tests #110 and #111.
- **Decision**: Modified before use. I wrote the search code from the templates, and the Clear search fix came from the AI.
- **Reflection**: I learned how a search form keeps the search in the URL, and how to build a query from optional filters.
- **Responsible Person**: Mohamad Alosta

## Development and Understanding Process

I worked the same way as in US-05: one step at a time, I wrote the code, ran `pnpm check` and `pnpm test`, and the AI checked it before we moved on. Things I asked about:

- Why the search form uses `method="get"`, so the search is in the URL and survives a reload.
- What `ilike` does and why `%` goes around the text (upper and lower case don't matter, and part of a word is enough).
- Why the dropdown values are checked against the allowed choices before they reach the database.
- What the `mine` option ("Your postings") is for, and why it only filters for recruiters.
- Why a hidden field is needed in the form so "Your postings" stays on after searching.

## Work Done (by step)

| Step                                      | What was done                                                                                                                  | Who wrote it                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1. Reading the search (`job-search.ts`) | Trims the text fields, keeps only valid dropdown choices, cuts very long text, and gives empty values for missing fields       | Me, from a template with blanks                             |
| 1. Tests (`job-search.test.ts`)         | 4 tests for the cases above                                                                                                    | Me                                                          |
| 2. Filtering (`jobs/+page.server.ts`)   | A condition for each filled-in field: keyword in the title or description, company, location, type and work mode               | Me, from a template with blanks                             |
| 3. Search form (`jobs/+page.svelte`)    | The five search fields, a hidden field for "Your postings", and a "No jobs match your search" message with a Clear search link | Me, by copying the existing form fields as the AI explained |
| Fix (October 25)                          | Clear search now puts both dropdowns back to "Any"                                                                             | Provided by the AI and explained after I reported the bug  |

## Errors and Bugs Found

- While testing on October 25: after choosing Remote and clicking Clear search, the dropdown still showed Remote, so the next search filtered by Remote again. The chosen option was marked with `selected`, which the browser ignores once you've picked something yourself. Setting the value on the dropdown itself fixed it.
- Maher reviewed the PR and said the search works well, and that more filters could be added later.

## Validation and Testing

- `pnpm check`: 0 errors. `pnpm test`: the 4 new search tests pass.
- Manual testing in the browser:
  - Part of a title in capitals finds the job.
  - Company and part of a city name find the right jobs.
  - Type and work mode work alone and together with the text fields.
  - A search with no matches shows the message and the Clear search link.
  - Clear search shows every job again with both dropdowns back to "Any".
- Acceptance tests #110 and #111 passed on October 25.

## Code Provided Directly by the AI

- The Clear search fix (setting the value on each dropdown instead of on each option).

## Other AI Use During This Period

- Renaming the test titles in every test file to the same "area: what should happen" style.
- Preparing for the demo (October 25 - 26): I asked the AI to explain the US-14 code chunk by chunk, split into the code I wrote, the code it wrote and the code we wrote together.

# Appendix - Main Prompts

> Can US-14 begin and can u navigate me through it?

> when we do clear search it doesnt revert from remote to any type

> US-14 tests check out

> Can u provide an explanation for US-3,5,14,15.1 for the codes u and i wrote separately and together so i can prepare for the demo
