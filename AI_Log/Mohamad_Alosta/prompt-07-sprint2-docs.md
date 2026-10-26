# Prompt 7 - Sprint 2 Documentation Review and Tracking

- **Tool**: Claude
- **Date**: October 13 - 25, 2026
- **Purpose of AI Use**: Tracking Sprint 2 progress and checking the docs for errors, spelling and grammar.
- **Chat Link or Prompt/Response**: No shareable link. My main requests are in the appendix below.
- **AI-Suggested Content**: The AI compared the Sprint 2 guidelines with our repository and GitHub, pointed out what was missing or out of date, and suggested using the Sprint 1 docs as a base for Sprint 2's, which I reviewed, edited and wrote from its suggestions (see the "Work Done" table below). It also counted each member's contributions and proofread the docs.
- **Validation**: I checked everything against GitHub and the guidelines, and added what the AI couldn't know, like Andrew dropping the course, US-18 moving to Sprint 3 and my hours.
- **Decision**: Modified before use.
- **Reflection**: Docs need regular checks against GitHub. Small mistakes add up, and an early merge can leave fixes behind.
- **Responsible Person**: Mohamad Alosta

## Work Done

| Document                        | What was done                                                                                     | Who did it                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Sprint 2 plan (`sprint-2.md`) | Scope, capacity, story points, velocity, risks and work plan, kept up to date as stories finished | The AI suggested making something similar to sprint-1.md, so I edited it and created a version for Sprint 2. |
| Task breakdown                  | Sprint 2 section, with each story's tasks copied exactly from its GitHub issue                    | The AI suggested adding Sprint 2 to the same breakdown as Sprint 1.                                      |
| Contribution log                | Commits, pull requests, reviews and issues for each member, and the meetings                      | The AI counted from GitHub, and I reviewed them and filled in my own hours                                   |
| Meeting minutes                 | Reviewed my October 22 minutes                                                                    | I wrote them. The AI found the mistakes listed below.                                                        |
| README                          | What's implemented so far, and the Sprint 2 scope                                                 | The AI suggested adding Sprint 2 related links.                                                              |
| Summary report                  | One-page Sprint 2 report, exported to PDF                                                         | The AI suggested example docs, and I edited the file to represent our report.                               |

## Errors Found by AI and Fixed by Me

- "Micheal" instead of "Michael" in all four meeting minutes.
- The October 22 minutes pointed to issue #94 instead of #120, had "the the", and didn't say what was discussed (progress on US-20).
- "corefeatures" in the report and "unkown" in a test title.
- Statuses that were out of date as stories finished (US-05, US-14, US-15, US-20, US-03), and US-18 still listed as a Sprint 2 story.
- Contribution counts that changed after new pull requests and reviews.
- Acceptance tests whose criteria were reworded instead of copied exactly from the user story.
- Tables padded with spaces by VS Code's Format Document, which made every line look changed.

## Validation

- Compared the docs with GitHub after every change (issues, pull requests, merges and reviews).
- Checked that the Sprint 2 docs match each other: same statuses, same PR numbers, same velocity.
- Opened the report PDF to check that it fits on one page and the formatting is right.

# Appendix - Main Prompts

> which docs need to be added/changed?

> can u check the numbers of commits and merged PRs etc

> Andrew dropped the course, so what are necessary changes document wise?

> can u check what requirements are missing for sprint 2 and which are only here
