# Sprint 2 - Team Member Contributions

This log is based on our GitHub history (commits, pull requests, reviews and issues) and the meeting minutes from October 1, October 8 and October 22.

## Summary

| Member | GitHub | Commits | Merged PRs | Open PRs | Reviews approved | PRs merged for others | Issues created | Oct 1 meeting | Oct 8 meeting | Oct 22 meeting | Time spent |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Mohamad Alosta | @MAlos616 | 20 | 12 (#85, #86, #87, #93, #98, #99, #100, #101, #112, #113, #116, #117) | 1 (#121) | 1 (#114) | 1 | 13 (#83, #94, #102 to #111, #120) | Present | Present | Present | 39.5 h |
| Paul Fourment | @paulfusa | 4 | 2 (#89, #92) | 0 | 4 (#88, #96, #99, #119) | 5 | 5 (#79 to #82, #91) | Present | Present | Present | ? h |
| Maher Waez | @Maherwaez01 | 9 | 3 (#96, #114, #118) | 0 | 9 (#89, #92, #93, #100, #101, #112, #113, #116, #117) | 9 | 2 (#90, #97) | Present | Present | Absent | ? h |
| Michael Derocher | @MichaelDerocher1551 | 6 | 2 (#88, #119) | 0 | 5 (#85, #86, #87, #98, #118) | 0 | 0 | Present | Present | Present | ? h |
| Kimia Karimiyeganeh | @kimiakarimiy | 0 | 0 | 0 | 0 | 0 | 0 | Present | Present | Present | ? h |
| Andrew Rowe (dropped the course) | @an-rowe54 | 0 | 0 | 0 | 0 | 0 | 0 | Present | Absent | - | - |

Note: Commit counts don't include merge commits, and include commits on branches that are still in review. "PRs merged for others" counts teammates' pull requests that the member merged. Each member fills in their own time spent, in hours, here and next to each activity below.

## Mohamad Alosta
- Took the meeting minutes for the October 1 planning meeting (issue #83, PRs #85, #93), the October 8 meeting (issue #94, PRs #98, #99) and the October 22 meeting (issue #120, PR #121), and revised all three (PRs #101 and #121). (1 h)
- **Implemented US-05 (browse and view job offers)** in PR #100 (merged October 17): added status, published, requirements and deadline (required) and salary (optional) to job postings, with validation and 4 tests; hid unpublished jobs from job seekers; added status and draft badges; showed the new details on the job page. Wrote acceptance tests #108 and #109. Later added the acceptance rate to the job page (offers out of all applications, shown once a decision is made), with 4 tests. (15 h)
- **Implemented US-14 (job search filters)**: search by keyword, company and location, and filter by employment type and work mode, with 4 tests. Also fixed two comments and the closed-job notice from US-05 (PR #116, merged October 17). Wrote acceptance tests #110 and #111. (6 h)
- **Implemented US-03 (clear application outcome message)**: the outcome table and its validation (7 tests); the decision form on the recruiter's applications page, where only the recruiter who posted the job can send an offer or rejection, once per application; the applicant's view of the message with the date and time it was sent; no withdrawing once a decision is sent (1 test); and reminders for applications left more than 7 days without a decision (4 tests). (9 h)
- **Implemented US-15 (apply for a job), task 15.1**: the application table, the application statuses, the application validation and the apply rules, with 6 tests, which Maher built the rest of US-15 on (PR #118). After #118 was merged, fixed the confirmation message being hidden after applying, blocked applying after the deadline (2 tests), showed the withdraw messages, and added Eastern-time times to the dates. (3 h)
- **Set up the CI pipeline** that runs the type check and tests on every pull request (issue #102, PR #112). (0.5 h)
- Wrote user story US-20 (application status tracking, issue #107) to cover the status tracking required in Sprint 2. (0.5 h)
- Created the Sprint 2 tracking issues (#102 to #106) and the `Acceptance Test` label. (0.5 h)
- Updated the task breakdown at the end of Sprint 1 (PR #87), and wrote the Sprint 2 plan, the Sprint 2 task breakdown and this contribution log (issue #104, PRs #113 and #117). (3 h)
- Updated the README for Sprint 2 and drafted the Sprint 2 summary report (issue #106). (1 h)
- Opened and merged PR #86 for Maher's US-08 work.
- Reviewed, approved and merged Maher's US-07 pull request (#114).

## Paul Fourment
- **Implemented US-10 (resume upload) and US-11 (resume management)** in PR #92. (? h)
- Fixed an email verification bug (a redirect loop) and matched its pages to the rest of the app (PR #89). (? h)
- Added the company and city autofill APIs and the "Your postings" tab for recruiters, as fixups on Michael's job postings PR (#88, commit 70ecaa6). (? h)
- **Started the Generative AI feature** (resume AI autofill and review, issue #91) on the `feature/ai-resume` branch. (? h)
- Proposed new features as issues #79 to #82 (search job seekers, following users, messaging, dark mode). (? h)
- Reviewed and approved 4 teammates' pull requests (#88, #96, #99, #119) and merged 5 (#88, #96, #99, #118, #119). (? h)

## Maher Waez
- **Implemented US-08 (account email verification)** (commit 400ed9a, merged in PR #86). (? h)
- Wrote and **implemented US-17 (forgot password)** with the reset code email templates (issue #90, PR #96). (? h)
- Wrote user story US-18 (recruiter verification and approval, issue #97). (? h)
- **Implemented US-07 (recruiter company profile)**: the company profile table, the profile and edit pages, company details on job postings, and tests (PR #114, merged October 17). (? h)
- **Implemented the rest of US-15 (apply for a job), tasks 15.2 to 15.5**, on top of Mohamad's application table: applying with one of your resumes, withdrawing before the deadline, the recruiter's list of applicants with their resumes, and 6 withdrawal tests. Also moved the profile links into the settings page (PR #118, merged October 22). (? h)
- Added AI usage logs for US-08, US-17, US-07 and US-15. (? h)
- Reviewed, approved and merged 9 teammates' pull requests (#89, #92, #93, #100, #101, #112, #113, #116, #117). (? h)

## Michael Derocher
- **Implemented US-12 (job posting creation) and US-13 (job posting management)**: creating, viewing, editing and deleting job postings (PR #88). (? h)
- Added tests for creating, editing and deleting job postings, moving that logic into separate files so it can be tested (PR #119, merged October 22). (? h)
- Added AI prompt logs for the job postings work and its tests. (? h)
- Reviewed and approved 5 teammates' pull requests (#85, #86, #87, #98, #118). (? h)

## Kimia Karimiyeganeh
- Attended the October 1, October 8 and October 22 planning meetings.
- Assigned US-20 (application status tracking, issue #107).

## Andrew Rowe
- Attended the October 1 planning meeting.
- Was assigned US-21 (dark mode, issue #82) for a later sprint; Maher took it over on October 22.
- Dropped the course during Sprint 2.
