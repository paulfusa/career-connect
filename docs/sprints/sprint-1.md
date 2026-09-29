# Sprint 1

**Dates:** September 17 - September 28, 2026
**Team:** Paul Fourment, Mohamad Alosta, Michael Derocher, Kimia Karimiyeganeh, Andrew Rowe, Maher Waez

## Sprint Goal
Project initiation: set up the repo and tech stack, figure out the scope and goal of CareerConnect, write our user stories, and have at least two working features to demo (account registration, login/logout, first-login onboarding, profile management).

## Team Capacity
There are six of us and everyone has busy schedules, so we planned around roughly **4-5 hours per person per week** on the project. That gives us roughly **36-45 hours** for Sprint 1 (about 1.5 weeks) as a team.

Not everyone had the same availability this sprint. Paul already knew SvelteKit and used it before, so he took the coding side. The rest of us worked on documentation, user stories, and the AI logs while we get comfortable with the stack. However, we expect the coding work to be spread out more evenly starting from Sprint 2.

## Effort Estimation
We estimated how many hours each user story will take, based on the number of tasks it has and whether it requires us to explore something new. These are first guesses, and we'll update them if any changes are made.

## Product Backlog
| Priority | Issue | User Story | Estimate | Status |
|---|---|---|---|---|
| High | #5 | US-01: Account registration | 4-6 h | Completed (Sprint 1) |
| High | #6 | US-02: Login and logout | 4-6 h | Completed (Sprint 1) |
| Medium | #29 | US-16: First-login onboarding | 4-6 h | Completed (Sprint 1) |
| High | #9 | US-04: Profile Management | 4-6 h | Completed (Sprint 1) |
| High | #10 | US-05: Browse and view job offers | 8-12 h | Not Started |
| High | #13 | US-08: Account email verification | 4-6 h | Not Started |
| High | #15 | US-10: Resume Upload | 8-12 h | Not Started |
| High | #17 | US-12: Recruiter Job Posting Creation | 8-12 h | Not Started |
| High | #12 | US-07: Recruiter company profile | 4-6 h | Not Started |
| High | #16 | US-11: Resume Management | 4-6 h | Not Started |
| High | #18 | US-13: Recruiter Job Posting Management | 4-6 h | Not Started |
| High | #20 | US-15: Apply for a Job | 8-12 h | Not Started |
| High | --- | Generative AI feature (AI resume feedback, to be confirmed) | 15-20 h | Not Started |
| Medium | #8 | US-03: Clear Application Outcome Message | 8-12 h | Not Started |
| Low | #19 | US-14: Job Search Filters | 4-6 h | Not Started |
| Low | #11 | US-06: Submit feature suggestion | 2-4 h | Not Started |
| Low | #14 | US-09: Company reviews | 8-12 h | Not Started |

**How we prioritized:** anything the other features depend on comes first. You can't apply for a job without resumes and job postings, and you can't send an outcome message without an application, so accounts, profiles, resumes and job postings are at our highest priorities. Features that are nice to have but don't block anything (search filters, feature suggestions, company reviews) are lower.

Stories for later sprints will be chosen from this backlog at each sprint planning. Each story's tasks are listed in its GitHub issue, and who owns each story is in [task-breakdown.md](task-breakdown.md).

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Team availability:** members are absent from meetings or can't work due to particular reasons | Medium | High | Hold weekly meetings online (Discord) so it's easier to attend, and share meeting minutes with everyone. |
| **Uneven workload:** work depends on one or two people | High | High | Give every user story an owner and review progress at each weekly meeting. |
| **Unfamiliar technology:** the team is new to the tech stack | High | Medium | Share knowledge within the team and pair up on first features. |
| **Schedule pressure:** work is left until close to the deadline | High | Medium | Set internal deadlines a few days before each sprint deadline. |
| **Data loss or corruption:** shared database changes can break things for everyone | Low | High | Review database changes in a PR before merging. |
| **Unreliable AI output:** AI-generated content may be wrong | Medium | Medium | Review all AI output before use, and log every use in `AI_Log/`. |
| **Software quality:** bugs go unnoticed without tests | High | Medium | Add automated tests for completed features. |

## Work Plan (Appendix A)
| Issue | Title | Type | Responsible | Target Date | Priority | Status |
|---|---|---|---|---|---|---|
| #61 | GitHub setup, SvelteKit app, database connection | Task | Paul | Sep 21 | High | Completed |
| #3 | Update README with member names and IDs | Task | Paul | Sep 24 | Medium | Completed |
| #7 | Sprint 1 meeting minutes (Sept 24) | Task | Mohamad | Sep 25 | Medium | Completed |
| #5 | US-01: Account registration | User Story | Paul | Sep 27 | High | Completed |
| #6 | US-02: Login and logout | User Story | Paul | Sep 27 | High | Completed |
| #29 | US-16: First-login onboarding | User Story | Paul | Sep 27 | Medium | Completed |
| #9 | US-04: Profile Management | User Story | Paul | Sep 28 | High | Completed |
| #70 | Automated tests for registration, login and profile | Task | Paul | Sep 28 | High | Completed |
| #8-#11 | US-03 to US-06 (writing the user stories) | Task | Mohamad | Sep 26 | High | Completed |
| #12-#14 | US-07 to US-09 (writing the user stories) | Task | Maher | Sep 27 | High | Completed |
| #15-#20 | US-10 to US-15 (writing the user stories) | Task | Michael | Sep 27 | High | Completed |
| #62 | README: project description, problem, solution, features | Task | Mohamad | Sep 27 | High | Completed |
| #63 | README: setup instructions and repo link | Task | Paul and Mohamad | Sep 28 | High | Completed |
| #64 | Sprint 1 work plan, backlog, risks | Task | Mohamad | Sep 28 | High | Completed |
| #65 | Task breakdown | Task | Mohamad | Sep 27 | High | Completed |
| #66 | Contribution log | Task | Mohamad | Sep 28 | High | Completed |
| #67 | Team process (workflow, branching, PRs, DoR, DoD) | Task | Mohamad | Sep 27 | High | Completed |
| #68 | Team-generated user stories and features | Task | Everyone | Sep 28 | High | Completed |
| #69 | AI usage log PDF | Task | Everyone | Sep 28 | High | Completed |
| #71 | Sprint 1 submission document | Task | Mohamad | Sep 28 | High | Completed |


## Rubric 
| Done | Category | Weight (/15) |
| :---: | :--- | :--- |
| [x] | Team Members and Repository Setup | 0.5 |
| [x] | README File | 0.5 |
| [x] | Feature Identification and Scope Definition | 1.0 |
| [x] | User Stories | 3.0 |
| [x] | Sprint Planning | 3.0 |
| [x] | Task Breakdown | 1.5 |
| [x] | AI Usage Log and Validation Evidence | 2.0 |
| [x] | Detailed Log of Each Team Member Contribution | 0.5 |
| [x] | Meeting Minutes | 1.0 |
| [x] | Organization and Presentation | 1.0 |
| [ ] | Project Demo (Two Basic Features) | 1.0 |
| **Total** | | **15 (equivalent to 3% course weight)** |
