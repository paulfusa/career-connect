# Sprint 2
**Dates:** September 29 - October 26, 2026
**Team:** Paul Fourment, Mohamad Alosta, Michael Derocher, Kimia Karimiyeganeh, Maher Waez (Andrew Rowe dropped the course during the sprint)

## Sprint Goal
This sprint we wanted to build the features everything else depends on first: resume management, job search and job details, and applying for jobs with status tracking. We also planned to start the recruiter dashboard, write acceptance tests for every Sprint 1 and Sprint 2 story, and set up a CI pipeline that checks every pull request.

## Sprint 2 Scope
| Required feature | User stories | Status |
|---|---|---|
| 1. User profile and resume management | US-04 (#9), US-10 (#15), US-11 (#16) | Completed |
| 2. Job search and job listing interface | US-05 (#10), US-14 (#19) | Completed |
| 3. Job application submission and tracking | US-15 (#20), US-20 (#107), and US-03 (#8) for the Offered and Rejected statuses | Completed |
| 4. Recruiter dashboard and posting management (started this sprint) | US-12 (#17), US-13 (#18), viewing applications (US-15) and updating their status (US-20) | In Progress |

At the October 1 and October 8 meetings we agreed to do the mandatory (P0) features first, since the others build on them. Anyone on the team could also suggest new user stories.

## Team Capacity
We started with six people, all with busy schedules, so we planned on about **4-5 hours per person per week**. Over roughly 4 weeks that's **96-120 hours**, or about **48-60 story points** if one point is about 2 hours. The stories we planned add up to 58 points, so we were close to the limit. Andrew Rowe dropped the course partway through, and we finished with five people. He didn't have any Sprint 2 stories left by then, so nothing had to be reassigned.

In Sprint 1 Paul wrote most of the code because he already knew SvelteKit. This sprint the coding is spread out more: more of us own features, and the people who are new to SvelteKit are learning it on their own stories.

## Effort Estimation
This sprint we switched from hours to **story points**. A point shows how big a story is compared to the others, based on how many tasks it has and whether we have to figure out something new. We use 1, 2, 3, 5, 8 and 13:

| Points | Size | Roughly | Example |
|---|---|---|---|
| 1 | Tiny | Under 2 h | A text or style fix |
| 2 | Small | 2-4 h | A small page or form change |
| 3 | Medium | 4-6 h | US-14: Job search filters |
| 5 | Large | 8-12 h | US-15: Apply for a job |
| 8 | Very large | 15-20 h | Generative AI resume feature |
| 13 | Too big | --- | Split into smaller stories |

Sprint 1 stories that were estimated in hours were converted with this table. Since one point is about 2 hours, we can still compare our estimates with the hours in the contribution log at the end of the sprint.

**Velocity:** Sprint 1 finished 12 points (US-01, US-02, US-16 and US-04). Sprint 2 finished 50 (US-08, US-10, US-11, US-12, US-13, US-17, US-14, US-07, US-05, US-15, US-20 and US-03).

## Product Backlog
| Priority | Issue | User Story | Points | Status |
|---|---|---|---|---|
| High | #5 | US-01: Account registration | 3 | Completed (Sprint 1) |
| High | #6 | US-02: Login and logout | 3 | Completed (Sprint 1) |
| Medium | #29 | US-16: First-login onboarding | 3 | Completed (Sprint 1) |
| High | #9 | US-04: Profile Management | 3 | Completed (Sprint 1) |
| High | #13 | US-08: Account email verification | 3 | Completed (Sprint 2) |
| High | #15 | US-10: Resume Upload | 5 | Completed (Sprint 2) |
| High | #16 | US-11: Resume Management | 3 | Completed (Sprint 2) |
| High | #17 | US-12: Recruiter Job Posting Creation | 5 | Completed (Sprint 2) |
| High | #18 | US-13: Recruiter Job Posting Management | 3 | Completed (Sprint 2) |
| Medium | #90 | US-17: Forgot password | 5 | Completed (Sprint 2) |
| High | #10 | US-05: Browse and view job offers | 5 | Completed (Sprint 2) |
| High | #19 | US-14: Job Search Filters | 3 | Completed (Sprint 2) |
| High | #20 | US-15: Apply for a Job | 5 | Completed (Sprint 2) |
| High | #107 | US-20: Application Status Tracking | 5 | Completed (Sprint 2) |
| High | #91 | Generative AI feature: resume AI autofill and review | 8 | In Progress |
| High | #12 | US-07: Recruiter company profile | 3 | Completed (Sprint 2) |
| High | #8 | US-03: Clear Application Outcome Message | 5 | Completed (Sprint 2) |

**How we prioritized:** same as Sprint 1, whatever other features depend on goes first. You can't apply for a job without resumes and job postings, and you can't send an outcome message without an application.

**What changed since Sprint 1:** US-14 went from Low to High because search and filtering is a required Sprint 2 feature. US-03 went from Medium to High because its outcome messages are what set the Offered and Rejected statuses for Feature 3. The guidelines also ask for application status tracking (Applied, Under Review, Interview, Offered, Rejected), so we made that its own story, US-20, which depends on US-15. Since US-15 was blocking the most work, we first split it three ways: the application table (Mohamad), the job seeker side (Michael) and the recruiter side (Maher). In the end Maher built both sides on top of Mohamad's table.

The tasks for each story are in its GitHub issue, and who owns what is in [task-breakdown.md](task-breakdown.md).

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| **US-15 started late:** it blocks US-03, US-20, part of US-05, and required features 3 and 4 | High | Split it between people, build the application table first so other stories can start, and review US-15 before anything else. |
| **Merge conflicts:** US-05, US-14 and US-15 all touch the same job pages and database tables | Medium | Merge related PRs one after another, and update each branch from `main` before opening a PR. |
| **Leaving things to the last minute** | Medium | Aim to finish the P0 features by the October 15 lab, well before the sprint ends. |
| **Acceptance tests piling up:** two per story for Sprints 1 and 2 is more than 30 issues | High | Whoever owns a story writes its acceptance tests as soon as the story is done. |
| **People being unavailable:** missing meetings or busy with other courses | High | Keep meeting weekly, share the minutes with everyone, and reassign stories that get stuck. |
| **Breaking the shared database:** more of us are changing it now | High | Review database changes in a PR first, and agree on shared tables before building on them. |
| **CI is new to us:** none of us has set up a pipeline before | Medium | Set it up early so `pnpm check` and `pnpm test` run on every PR automatically. |
| **New tools:** most of us are new to SvelteKit and Drizzle | Medium | Copy patterns from features that already work, and review each other's PRs. |
| **AI mistakes:** AI output can be wrong, or go past what the course allows this sprint | Medium | Check everything AI suggests before using it, ask the TA when unsure, and log every use in `AI_Log/`. |
| **Bugs:** more people writing code means more bugs can slip in | Medium | Write unit tests with each feature, and let CI run them on every PR. |

## Work Plan (Appendix A)
| Issue | Title | Type | Responsible | Target Date | Priority | Status |
|---|---|---|---|---|---|---|
| #83 | Sprint 2 meeting minutes (Oct 1) | Task | Mohamad | Oct 2 | Medium | Completed |
| #94 | Sprint 2 meeting minutes (Oct 8) | Task | Mohamad | Oct 9 | Medium | Completed |
| #120 | Sprint 2 meeting minutes (Oct 22) | Task | Mohamad | Oct 23 | Medium | Completed |
| #13 | US-08: Account email verification | User Story | Maher | Oct 6 | High | Completed |
| #17 | US-12: Recruiter job posting creation | User Story | Michael | Oct 6 | High | Completed |
| #18 | US-13: Recruiter job posting management | User Story | Michael | Oct 6 | High | Completed |
| #15 | US-10: Resume upload | User Story | Paul | Oct 8 | High | Completed |
| #16 | US-11: Resume management | User Story | Paul | Oct 8 | High | Completed |
| #90 | US-17: Forgot password | User Story | Maher | Oct 8 | Medium | Completed |
| #10 | US-05: Browse and view job offers | User Story | Mohamad | Oct 22 | High | Completed |
| #19 | US-14: Job search filters | User Story | Mohamad | Oct 17 | High | Completed |
| #20 | US-15: Apply for a job | User Story | Mohamad, Maher | Oct 15 | High | Completed |
| #107 | US-20: Application status tracking | User Story | Kimia | Oct 19 | High | Completed |
| #8 | US-03: Clear application outcome message | User Story | Mohamad | Oct 22 | High | Completed |
| #91 | Resume AI autofill and review | Feature | Paul | (confirm) | High | In Progress |
| #12 | US-07: Recruiter company profile | User Story | Maher | Oct 17 | High | Completed |
| #102 | Add a CI pipeline (checks and tests on every PR) | Task | Mohamad | Oct 15 | High | Completed |
| #103 | Acceptance tests (2 per user story, Sprint 1 and 2) | Task | Everyone | Oct 22 | High | In Progress |
| #104 | Sprint 2 plan, task breakdown, contribution log | Task | Mohamad | Oct 24 | High | Completed |
| #105 | Sprint 2 AI usage logs | Task | Everyone | Oct 25 | High | In Progress |
| #106 | Sprint 2 summary report (one page) | Task | Mohamad | Oct 25 | High | Completed |


## Rubric 
| Done | Category | Weight (/100) |
| :---: | :--- | :--- |
| [X] | Core Feature Development (including acceptance tests) | 25 |
| [X] | Contribution by Team Members | 10 |
| [X] | Continuous Integration Pipeline | 10 |
| [X] | Sprint Planning | 15 |
| [X] | Task Breakdown | 15 |
| [X] | Meeting Minutes | 5 |
| [X] | Detailed Log of Each Team Member Contribution | 5 |
| [X] | Project Management and GitHub Usage | 10 |
| [X] | AI Usage Log and Validation Evidence | 5 |
| **Total** | | **100 (equivalent to 5% course weight)** |
