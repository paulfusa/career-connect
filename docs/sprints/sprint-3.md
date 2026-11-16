# Sprint 3

**Dates:** October 27 - November 16, 2026
**Team:** Paul Fourment, Mohamad Alosta, Michael Derocher, Kimia Karimiyeganeh, Maher Waez

## Sprint Goal

This sprint we want to finish the main features that are left: the recruiter dashboard, a history and stats page for job seekers, and notifications. We also start the AI feature, which we finish in Sprint 4. Every new story gets unit tests that run in CI and two acceptance tests, like in Sprint 2.

## Sprint 3 Scope

| Required feature                               | User stories                                                                                                                              | Status    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1. Recruiter dashboard and posting management  | Most of it was done in Sprint 2 (US-12, US-13, US-15, US-20 and US-03). US-30 (#188) added archiving postings and filtering applications. | Completed |
| 2. Application analytics and history dashboard | US-25 (#160)                                                                                                                              | Completed |
| 3. Notifications and reminders                 | US-26 (#161), plus US-27 (#163) for job offer emails                                                                                      | Completed |
| 4. AI feature (start now, finish in Sprint 4)  | US-24 (#91): resume AI autofill and review                                                                                                | Completed |

We're also doing US-28 (#166, more job search filters), US-19 (#80, following other users) and US-21 (#82, dark mode). On November 15 we added US-30 (#188) for what was still missing from feature 1, and Michael got it done that day. Maher's US-29 (#184, a personalized home dashboard) was added too, but he moved it out of Sprint 3 the next day.

## Team Capacity

We're five people for three weeks. Like in Sprint 2, we plan on about **4-5 hours per person per week**, which gives **60-75 hours**, or about **30-37 story points**. Our Sprint 3 stories add up to 35 points, so we're right at the limit, which is why US-19 and US-21 are low priority.

## Effort Estimation

We kept the same **story points** as in Sprint 2. A point shows how big a story is compared to the others, based on how many tasks it has and whether we have to figure out something new. We use 1, 2, 3, 5, 8 and 13:

| Points | Size       | Roughly   | Example                                                |
| ------ | ---------- | --------- | ------------------------------------------------------ |
| 1      | Tiny       | Under 2 h | A text or style fix, like the long words fix (PR #177) |
| 2      | Small      | 2-4 h     | A small page or form change                            |
| 3      | Medium     | 4-6 h     | US-28: Job filter additions                            |
| 5      | Large      | 8-12 h    | US-19: Following other users                           |
| 8      | Very large | 15-20 h   | US-24: Resume AI autofill and review                   |
| 13     | Too big    | ---       | Split into smaller stories                             |

**Velocity:** Sprint 1 finished 12 points and Sprint 2 finished 50. Sprint 3 is shorter and has fewer people, so we planned 35, and we finished all 35 (US-27, US-26, US-25, US-24, US-28, US-19 and US-21). Then US-30 (5 points) came in on November 15 and was done that night, which brings us to 40.

## Product Backlog

| Priority | Issue | User Story                                              | Points | Status               |
| -------- | ----- | ------------------------------------------------------- | ------ | -------------------- |
| High     | #5    | US-01: Account registration                             | 3      | Completed (Sprint 1) |
| High     | #6    | US-02: Login and logout                                 | 3      | Completed (Sprint 1) |
| Medium   | #29   | US-16: First-login onboarding                           | 3      | Completed (Sprint 1) |
| High     | #9    | US-04: Profile Management                               | 3      | Completed (Sprint 1) |
| High     | #13   | US-08: Account email verification                       | 3      | Completed (Sprint 2) |
| High     | #15   | US-10: Resume Upload                                    | 5      | Completed (Sprint 2) |
| High     | #16   | US-11: Resume Management                                | 3      | Completed (Sprint 2) |
| High     | #17   | US-12: Recruiter Job Posting Creation                   | 5      | Completed (Sprint 2) |
| High     | #18   | US-13: Recruiter Job Posting Management                 | 3      | Completed (Sprint 2) |
| Medium   | #90   | US-17: Forgot password                                  | 5      | Completed (Sprint 2) |
| High     | #10   | US-05: Browse and view job offers                       | 5      | Completed (Sprint 2) |
| High     | #19   | US-14: Job Search Filters                               | 3      | Completed (Sprint 2) |
| High     | #20   | US-15: Apply for a Job                                  | 5      | Completed (Sprint 2) |
| High     | #107  | US-20: Application Status Tracking                      | 5      | Completed (Sprint 2) |
| High     | #12   | US-07: Recruiter company profile                        | 3      | Completed (Sprint 2) |
| High     | #8    | US-03: Clear Application Outcome Message                | 5      | Completed (Sprint 2) |
| High     | #91   | US-24: Resume AI autofill and review                    | 8      | Completed (Sprint 3) |
| High     | #160  | US-25: Application analytics and history dashboard      | 5      | Completed (Sprint 3) |
| High     | #161  | US-26: Notifications and reminders                      | 8      | Completed (Sprint 3) |
| High     | #163  | US-27: Job offer emails                                 | 3      | Completed (Sprint 3) |
| Medium   | #166  | US-28: Job filter additions                             | 3      | Completed (Sprint 3) |
| Low      | #80   | US-19: Recruiters and job seekers can follow each other | 5      | Completed (Sprint 3) |
| Low      | #82   | US-21: Dark mode                                        | 3      | Completed (Sprint 3) |
| High     | #188  | US-30: Archive postings and filter applications         | 5      | Completed (Sprint 3) |

**How we prioritized:** the required features and the AI feature come first, since they're what Sprint 3 is graded on. US-28 builds on the job search from Sprint 2. US-19 and US-21 are extras we only finish once the rest is on track.

**What changed since Sprint 2:** we wrote US-25, US-26 and US-27 on November 5 and US-28 on November 12. The AI feature (#91) became US-24. US-19 moved from Kimia to Mohamad, and US-22 (messaging) from Paul to Kimia. US-18 (recruiter verification) was supposed to be in Sprint 3, but we didn't pick it this sprint, since Maher worked on US-27 and US-21 instead. On November 15, Maher also wrote US-29 (personalized home dashboard, #184). It went into Sprint 3 at first, and Maher took it out the next day. We also wrote US-30 (#188) that day for the parts of feature 1 we were missing (archiving postings and filtering applications), and Michael took it.

The tasks for each story are in its GitHub issue, and who owns what is in [task-breakdown.md](task-breakdown.md).

## Risks

| Risk                                                                                             | Impact | Mitigation                                                                                                                   |
| ------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Testing is 40 of the 100 points:** every story needs unit tests and two acceptance tests | High   | Write the tests with the feature, in the same PR, so CI runs them.                                                           |
| **Short sprint:** three weeks, while other courses get busy too                            | High   | Keep stories small and merge them as soon as they work, instead of at the end.                                               |
| **Big pull requests:** US-26 is almost 3,000 lines                                         | Medium | Review big PRs early, and split the next big stories into smaller PRs.                                                       |
| **Merge conflicts:** dark mode touches almost every page                                   | Medium | Update the dark mode branch from `main` right before merging it, and merge it after the required features.                 |
| **The AI feature depends on an outside AI service** (the key, cost and wrong answers)      | High   | Keep the key out of the repo, check what the AI suggests before showing it, and show a clear message when the service fails. |
| **Breaking the shared database:** the notifications table is new                           | High   | Review database changes in a PR first, and run them in the Supabase SQL editor instead of `pnpm db:push`.                  |
| **The project board falling behind**                                                       | Medium | Move your card when you start or finish something, and check the board at every meeting.                                     |
| **AI mistakes**                                                                            | Medium | Check everything AI suggests before using it, and log every use in `AI_Log/`.                                              |

## Work Plan (Appendix A)

| Issue | Title                                                   | Type       | Responsible | Target Date | Priority | Status      |
| ----- | ------------------------------------------------------- | ---------- | ----------- | ----------- | -------- | ----------- |
| #159  | Sprint 3 meeting minutes (Nov 5)                        | Task       | Mohamad     | Nov 6       | Medium   | Completed   |
| #164  | Sprint 3 meeting minutes (Nov 12)                       | Task       | Mohamad     | Nov 13      | Medium   | Completed   |
| #91   | US-24: Resume AI autofill and review                    | User Story | Paul        | Nov 16      | High     | Completed   |
| #160  | US-25: Application analytics and history dashboard      | User Story | Michael     | Nov 15      | High     | Completed   |
| #161  | US-26: Notifications and reminders                      | User Story | Kimia       | Nov 14      | High     | Completed   |
| #163  | US-27: Job offer emails                                 | User Story | Maher       | Nov 12      | High     | Completed   |
| #166  | US-28: Job filter additions                             | User Story | Mohamad     | Nov 15      | Medium   | Completed   |
| #80   | US-19: Recruiters and job seekers can follow each other | User Story | Mohamad     | Nov 16      | Low      | Completed   |
| #82   | US-21: Dark mode                                        | User Story | Maher       | Nov 15      | Low      | Completed   |
| #188  | US-30: Archive postings and filter applications         | User Story | Michael     | Nov 16      | High     | Completed   |
| #162  | Sprint 3 acceptance tests (two per story)               | Task       | Everyone    | Nov 15      | High     | In Progress |
| -     | Unit tests for every Sprint 3 story, running in CI      | Task       | Everyone    | Nov 15      | High     | Completed   |
| -     | GitHub project board                                    | Task       | Paul        | Nov 14      | High     | Completed   |
| #168  | Sprint 3 plan, task breakdown and contribution log      | Task       | Mohamad     | Nov 15      | High     | Completed   |
| -     | Update the README for Sprint 3                          | Task       | Mohamad     | Nov 15      | Medium   | Completed   |
| #169  | Sprint 3 AI usage logs                                  | Task       | Everyone    | Nov 16      | High     | Completed   |
| #170  | Sprint 3 summary report (one page)                      | Task       | Mohamad     | Nov 16      | High     | Completed   |

## Rubric

|      Done      | Category                                        | Weight (/100)                          |
| :-------------: | :---------------------------------------------- | :------------------------------------- |
|       [X]       | Core Feature Development                        | 20                                     |
|       [X]       | Acceptance Tests                                | 20                                     |
|       [X]       | Continuous Integration Pipeline                 | 10                                     |
|       [X]       | Unit Testing                                    | 20                                     |
|       [X]       | Meeting Minutes                                 | 5                                      |
|       [X]       | Detailed Log of Each Team Member's Contribution | 5                                      |
|       [ ]       | Project Management and GitHub Usage             | 10                                     |
|       [X]       | Individual Contribution                         | 10                                     |
| **Total** |                                                 | **100 (5% of the course grade)** |
