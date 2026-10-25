# Sprint 2
**Dates:** September 29 - October 26, 2026
**Team:** Paul Fourment, Mohamad Alosta, Michael Derocher, Kimia Karimiyeganeh, Maher Waez (Andrew Rowe dropped the course during the sprint)

## Sprint Goal
For this sprint we will build the most important features first, especially the ones that other features depend on. These features are the core of CareerConnect, and they include: resume management, job search and job details, and job applications with status tracking. We will also start the recruiter dashboard, write acceptance tests for every Sprint 1 and Sprint 2 user story, and set up a CI pipeline that runs our checks and tests on every pull request.

## Sprint 2 Scope
| Required feature | User stories | Status |
|---|---|---|
| 1. User profile and resume management | US-04 (#9), US-10 (#15), US-11 (#16) | Completed |
| 2. Job search and job listing interface | US-05 (#10), US-14 (#19) | In Progress (US-05 merged; US-14 in review) |
| 3. Job application submission and tracking | US-15 (#20), US-20 (#107), and US-03 (#8) for the Offered and Rejected statuses | In Progress |
| 4. Recruiter dashboard and posting management (started this sprint) | US-12 (#17), US-13 (#18); viewing applications needs US-15 | In Progress |

At our October 1 and October 8 planning meetings we agreed to finish the mandatory (P0) features first, since other features depend on them, and to let anyone in the team propose new user stories.

## Team Capacity
There are six of us and everyone has busy schedules, so we planned around roughly **4-5 hours per person per week** on the project. Sprint 2 is about 4 weeks long, which gives us roughly **96-120 hours** as a team, or about **48-60 story points** at roughly 2 hours per point. The stories planned for Sprint 2 add up to 63 points, slightly above our capacity, so US-18 (5 points), which has no milestone yet, is the first story we would postpone if we run short. Andrew Rowe later dropped the course, so the team finished the sprint with five members. He had no Sprint 2 stories left by then, so no work had to be moved.

In Sprint 1, Paul did most of the coding because he already knew SvelteKit. As planned, the coding work is spread out more evenly this sprint: more of us own features, and the members who are new to SvelteKit are learning it while building their own stories.

## Effort Estimation
Starting this sprint we estimate in **story points** instead of hours. A story point measures how big a story is compared to the others, based on the number of tasks it has and whether it requires us to explore something new. We use the scale 1, 2, 3, 5, 8, 13:

| Points | Size | Roughly | Example |
|---|---|---|---|
| 1 | Tiny | Under 2 h | A text or style fix |
| 2 | Small | 2-4 h | A small page or form change |
| 3 | Medium | 4-6 h | US-14: Job search filters |
| 5 | Large | 8-12 h | US-15: Apply for a job |
| 8 | Very large | 15-20 h | Generative AI resume feature |
| 13 | Too big | --- | Split into smaller stories |

Stories that were estimated in hours in Sprint 1 were converted using this table. One point is about 2 hours of work, so at the end of the sprint we can still compare our estimates with the time recorded in the contribution log.

**Velocity:** Sprint 1 finished 12 points (US-01, US-02, US-16 and US-04). So far in Sprint 2 we have finished 24 points (US-08, US-10, US-11, US-12, US-13 and US-17).

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
| High | #10 | US-05: Browse and view job offers | 5 | In Progress (PR #100 merged; acceptance rate left) |
| High | #19 | US-14: Job Search Filters | 3 | In Review |
| High | #20 | US-15: Apply for a Job | 5 | In Progress |
| High | #107 | US-20: Application Status Tracking | 5 | Not Started |
| High | #91 | Generative AI feature: resume AI autofill and review | 8 | In Progress |
| High | #12 | US-07: Recruiter company profile | 3 | In Review (PR #114) |
| High | #8 | US-03: Clear Application Outcome Message | 5 | In Progress (blocked by US-15) |
| Medium | #97 | US-18: Recruiter verification and approval | 5 | Not Started |

**How we prioritized:** the same rule as Sprint 1: anything the other features depend on comes first. You can't apply for a job without resumes and job postings, and you can't send an outcome message without an application.

**What changed since Sprint 1:** US-14 moved from Low to High because search and filtering is one of the mandatory Sprint 2 features. US-03 moved from Medium to High because its outcome messages set the Offered and Rejected statuses that Feature 3 requires. The guidelines also require tracking application status (Applied, Under Review, Interview, Offered, Rejected), which is now its own story, US-20, and depends on US-15. US-15 is now the most important unfinished story, so it is split three ways: the application table (Mohamad), the job seeker side (Michael) and the recruiter side (Maher). It matters because US-03, the acceptance rate in US-05, and the recruiter's list of applications all depend on it.

Each story's tasks are listed in its GitHub issue, and who owns each story is in [task-breakdown.md](task-breakdown.md).

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| **Blocking story started late:** US-15 blocks US-03, US-20, part of US-05, and required features 3 and 4 | High | Split US-15 between three members, build the application table first so dependent stories can start, and review US-15 first. |
| **Merge conflicts:** several stories change the same job pages and database schema (US-05, US-14, US-15) | Medium | Merge related PRs in order, and update each branch from `main` before opening a PR. |
| **Schedule pressure:** work is left until close to the deadline | Medium | Finish the P0 features by the October 15 in-lab meeting, well before the sprint deadline. |
| **Acceptance tests left to the end:** two per story from Sprint 1 and 2 means more than 30 GitHub issues | High | Each story owner writes the acceptance tests for their own stories as soon as the story is done. |
| **Team availability:** members are absent from meetings or can't work due to particular reasons | High | Keep weekly meetings, share the meeting minutes with everyone, and reassign stories that stall. |
| **Data loss or corruption:** more of us now change the shared database | High | Review database changes in a PR before merging, and agree on shared tables before building on them. |
| **CI is new to the team:** nobody has set up a pipeline before | Medium | Set it up early so every PR runs `pnpm check` and `pnpm test` automatically. |
| **Unfamiliar technology:** most of the team is new to SvelteKit and Drizzle | Medium | Use existing features as examples, and review each other's PRs. |
| **AI use and output:** AI content may be wrong, or go beyond what the course allows this sprint | Medium | Review all AI output before use, check the allowed uses with the TA, and log every use in `AI_Log/`. |
| **Software quality:** bugs slip in as more people write code | Medium | Add unit tests with each feature; CI runs them on every PR. |

## Work Plan (Appendix A)
| Issue | Title | Type | Responsible | Target Date | Priority | Status |
|---|---|---|---|---|---|---|
| #83 | Sprint 2 meeting minutes (Oct 1) | Task | Mohamad | Oct 2 | Medium | Completed |
| #94 | Sprint 2 meeting minutes (Oct 8) | Task | Mohamad | Oct 9 | Medium | Completed |
| #13 | US-08: Account email verification | User Story | Maher | Oct 6 | High | Completed |
| #17 | US-12: Recruiter job posting creation | User Story | Michael | Oct 6 | High | Completed |
| #18 | US-13: Recruiter job posting management | User Story | Michael | Oct 6 | High | Completed |
| #15 | US-10: Resume upload | User Story | Paul | Oct 8 | High | Completed |
| #16 | US-11: Resume management | User Story | Paul | Oct 8 | High | Completed |
| #90 | US-17: Forgot password | User Story | Maher | Oct 8 | Medium | Completed |
| #10 | US-05: Browse and view job offers | User Story | Mohamad | Oct 22 | High | In Progress (PR #100 merged) |
| #19 | US-14: Job search filters | User Story | Mohamad | Oct 15 | High | In Review |
| #20 | US-15: Apply for a job | User Story | Mohamad, Michael, Maher | Oct 15 | High | In Progress |
| #107 | US-20: Application status tracking | User Story | Kimia | Oct 19 | High | Not Started |
| #8 | US-03: Clear application outcome message | User Story | Mohamad | Oct 22 | High | In Progress |
| #91 | Resume AI autofill and review | Feature | Paul | (confirm) | High | In Progress |
| #12 | US-07: Recruiter company profile | User Story | Maher | (confirm) | High | In Review (PR #114) |
| #97 | US-18: Recruiter verification and approval | User Story | Maher | (confirm) | Medium | Not Started |
| #102 | Add a CI pipeline (checks and tests on every PR) | Task | Mohamad | Oct 15 | High | Completed |
| #103 | Acceptance tests (2 per user story, Sprint 1 and 2) | Task | Everyone | Oct 22 | High | In Progress |
| #104 | Sprint 2 plan, task breakdown, contribution log | Task | Mohamad | Oct 24 | High | In Progress |
| #105 | Sprint 2 AI usage logs | Task | Everyone | Oct 25 | High | In Progress |
| #106 | Sprint 2 summary report (one page) | Task | Mohamad | Oct 25 | High | In Progress |


## Rubric 
| Done | Category | Weight (/100) |
| :---: | :--- | :--- |
| [] | Core Feature Development (including acceptance tests) | 25 |
| [] | Contribution by Team Members | 10 |
| [] | Continuous Integration Pipeline | 10 |
| [] | Sprint Planning | 15 |
| [] | Task Breakdown | 15 |
| [X] | Meeting Minutes | 5 |
| [] | Detailed Log of Each Team Member Contribution | 5 |
| [X] | Project Management and GitHub Usage | 10 |
| [] | AI Usage Log and Validation Evidence | 5 |
| **Total** | | **100 (equivalent to 5% course weight)** |
