# Sprint 2 - Team Member Contributions

This log is based on our GitHub history (commits, pull requests, reviews and issues) and the meeting minutes from October 1, October 8 and October 22.

## Summary

| Member | GitHub | Commits | Merged PRs | Open PRs | Reviews approved | PRs merged for others | Issues created | Oct 1 meeting | Oct 8 meeting | Oct 22 meeting | Time spent |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Mohamad Alosta | @MAlos616 | 56 | 18 (#85, #86, #87, #93, #98, #99, #100, #101, #112, #113, #116, #117, #121, #123, #124, #125, #129, #133) | 0 | 4 (#114, #122, #130, #147) | 4 | 16 (#83, #94, #102 to #111, #120, #126 to #128) | Present | Present | Present | 39.5 h |
| Paul Fourment | @paulfusa | 7 | 3 (#89, #92, #130) | 0 | 8 (#88, #96, #99, #119, #123, #124, #125, #129) | 9 | 9 (#79 to #82, #91, #134 to #137) | Present | Present | Present | 5.5 h |
| Maher Waez | @Maherwaez01 | 10 | 4 (#96, #114, #118, #147) | 0 | 10 (#89, #92, #93, #100, #101, #112, #113, #116, #117, #133) | 10 | 11 (#90, #97, #138 to #146) | Present | Present | Absent | 44 h |
| Michael Derocher | @MichaelDerocher1551 | 7 | 2 (#88, #119) | 0 | 6 (#85, #86, #87, #98, #118, #130) | 0 | 0 | Present | Present | Present | 12.5 h |
| Kimia Karimiyeganeh | @kimiakarimiy | 3 | 1 (#122) | 0 | 1 (#121) | 1 | 2 (#131, #132) | Present | Present | Present | 8 h |
| Andrew Rowe (dropped the course) | @an-rowe54 | 0 | 0 | 0 | 0 | 0 | 0 | Present | Absent | - | - |

Note: Commit counts don't include merge commits, and include commits on branches that are still in review. "PRs merged for others" counts teammates' pull requests that the member merged. Each member fills in their own time spent, in hours, here and next to each activity below.

## Mohamad Alosta
- Took the meeting minutes for the October 1 planning meeting (issue #83, PRs #85, #93), the October 8 meeting (issue #94, PRs #98, #99) and the October 22 meeting (issue #120, PR #121), and revised all three (PRs #101 and #121). (1 h)
- **Implemented US-05 (browse and view job offers)** in PR #100 (merged October 17). Job postings got a status, a published switch, requirements, a deadline and an optional salary range, with validation and 4 tests. Job seekers no longer see unpublished jobs, and every job shows whether it is open. Wrote acceptance tests #108 and #109. Later added the acceptance rate and made jobs show as closed after their deadline (PR #123). (15 h)
- **Implemented US-14 (job search filters)**: search by keyword, company and location, and filter by employment type and work mode, with 4 tests. Also fixed two comments and the closed-job notice from US-05 (PR #116, merged October 17). Wrote acceptance tests #110 and #111. Later fixed the filters not resetting on Clear search (PR #123). (6 h)
- **Implemented US-03 (clear application outcome message)** in PR #123. Recruiters can send an offer or a rejection from their applications page, but only for their own jobs and only once per application. The applicant sees it on the job page with the date it was sent, and can no longer withdraw. Sending a decision also sets the application status to Offered or Rejected. Recruiters get a reminder when an application waits more than 7 days. Added 12 tests. Wrote acceptance tests #126 and #127. (9 h)
- **Built the application table for US-15 (task 15.1)**, with the application statuses, validation and apply rules, and 6 tests. Maher built the rest of US-15 on top of it (PR #118). After testing #118, fixed the success message disappearing after applying, blocked applying after the deadline and showed the withdraw messages (PR #123). Wrote acceptance test #128. (3 h)
- **Set up the CI pipeline** that runs the type check and tests on every pull request (issue #102, PR #112). (0.5 h)
- Wrote user story US-20 (application status tracking, issue #107) to cover the status tracking required in Sprint 2. (0.5 h)
- Created the Sprint 2 tracking issues (#102 to #106) and the `Acceptance Test` label. (0.5 h)
- Updated the task breakdown at the end of Sprint 1 (PR #87), and wrote the Sprint 2 plan, the Sprint 2 task breakdown and this contribution log (issue #104, PRs #113 and #117). (3 h)
- Updated the README for Sprint 2 and drafted the Sprint 2 summary report (issue #106). (1 h)
- Wrote his Sprint 2 AI logs for US-05, US-14, US-15, US-03 and the docs review, plus one PDF of all of them (PR #133).
- Opened and merged PR #86 for Maher's US-08 work.
- Reviewed, approved and merged Maher's US-07 pull request (#114), Kimia's US-20 pull request (#122), Paul's AI logs (#130) and Maher's contribution log (#147).

## Paul Fourment
- **Implemented US-10 (resume upload) and US-11 (resume management)** in PR #92. (1 h)
- Fixed an email verification bug (a redirect loop) and matched its pages to the rest of the app (PR #89). (0.5 h)
- Added the company and city autofill APIs and the "Your postings" tab for recruiters, as fixups on Michael's job postings PR (#88, commit 70ecaa6). (0.5 h)
- **Started the Generative AI feature** (resume AI autofill and review, issue #91) on the `feature/ai-resume` branch. (2 h)
- Proposed new features as issues #79 to #82 (search job seekers, following users, messaging, dark mode). (0.5 h)
- Added his Sprint 2 AI logs (PR #130).
- Wrote acceptance tests #134 to #137 for US-10 and US-11.
- Reviewed and approved 8 teammates' pull requests (#88, #96, #99, #119, #123, #124, #125, #129) and merged 9 (#88, #96, #99, #118, #119, #123, #124, #125, #129). (1 h)

## Maher Waez
- **Implemented US-08 (Account Email Verification)** (commit `400ed9a`, PR #86). Developed the email verification workflow using Resend and Better Auth, restricted unverified users from accessing protected routes, and implemented verification and resend functionality. Debugged verification links, email configuration, and authentication redirects. Personally tested registration, verification links, resend functionality, and verified/unverified account access during development. (6 h)
- **Proposed and implemented US-17 (Forgot Password)** (issue #90, PR #96). Designed and developed password recovery using email verification codes. Implemented 10-minute code expiration, a five-attempt limit, single-use codes, a 60-second resend cooldown, password validation, and confirmation checks. Worked on email templates, frontend pages, server actions, database integration, and error handling. Personally tested successful resets, incorrect and expired codes, resend functionality, password validation, and security restrictions. Added automated tests for password reset validation. (8 h)
- **Implemented US-07 (Recruiter Company Profile)** (PR #114, merged October 17). Developed company profile database integration, creation and editing forms, server-side validation, and recruiter authorization. Integrated company information into job postings while maintaining the existing application design. Personally tested profile creation, editing, field validation, and recruiter permissions. Added automated tests for company information validation and authorization. (8 h)
- **Implemented US-15 (Job Applications), tasks 15.2–15.5** (PR #118, merged October 22). Developed application submission using uploaded resumes, duplicate prevention, submission confirmation, and integration with the existing database model. Built the recruiter applicant-viewing page with applicant information and resume links. Implemented authorization checks protecting private PDF resumes. Proposed and developed application withdrawal and reapplication functionality, including deadline restrictions and access revocation. Personally tested applications, database records, recruiter permissions, withdrawals, and resume access using different accounts. Added six automated withdrawal tests and verified the implementation with the project's test suite. (10 h)
- **Improved CareerConnect navigation** by moving Profile from the main sidebar into Settings under Personal Information. Modified the Settings page and application layout, maintained recruiter-only Company Profile access, and verified the implementation using `pnpm check`. Included in PR #118. (1 h)
- **Created AI usage documentation** for US-08, US-17, US-07, US-15, and the profile navigation improvement. Documented development requirements, implementation decisions, AI assistance, coding contributions, and testing activities. (3 h)
- **Participated in GitHub collaboration and code reviews.** Reviewed, approved, and merged ten teammates' pull requests (#89, #92, #93, #100, #101, #112, #113, #116, #117, #133). Reviewed changes, checked integration compatibility, and contributed to maintaining the shared codebase. (3 h)
- **Contributed to sprint planning and feature discussions.** Attended the October 1 and October 8 meetings, proposed US-18 (Recruiter Verification and Approval, issue #97), and participated in discussions about requirements, responsibilities, and implementation priorities. (2 h)
- **Created and performed acceptance tests** for US-07, US-08, US-15, and US-17 (#138 to #146). Documented scenarios using Given, When, Then, and Result, covering successful workflows, validation errors, permissions, and security restrictions. Personally verified functionality through manual testing during implementation, including different user accounts and expected results. (3 h)

**Total estimated time: 44 h**

## Michael Derocher
- **Implemented US-12 (job posting creation) and US-13 (job posting management)**: creating, viewing, editing and deleting job postings (PR #88). (8 h)
- Added tests for creating, editing and deleting job postings, moving that logic into separate files so it can be tested (PR #119, merged October 22). (3 h)
- Added AI prompt logs for the job postings work and its tests. (1 h)
- Reviewed and approved 6 teammates' pull requests (#85, #86, #87, #98, #118, #130). (0.5 h)

## Kimia Karimiyeganeh
- Attended the October 1, October 8 and October 22 planning meetings.
- **Implemented US-20 (application status tracking)** in PR #122 (merged October 25). Every application now has a status that starts at Applied. Recruiters can move it to Under Review or Interview, and job seekers see each status on the new My Applications page. Added 10 tests. (6.5 h)
- Created the Sprint 2 US-20 AI usage log and added it to the shared documentation branch. (0.75 h)
- Reviewed, approved and merged Mohamad's meeting minutes pull request (#121). (0.25 h)
- Wrote US-20 acceptance tests #131 and #132. (0.5 h)

## Andrew Rowe
- Attended the October 1 planning meeting.
- Was assigned US-21 (dark mode, issue #82) for a later sprint. Maher took it over on October 22.
- Dropped the course during Sprint 2.
