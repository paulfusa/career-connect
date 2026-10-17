# Sprint 2 - Team Member Contributions

This log is based on our GitHub history (commits, pull requests, reviews and issues) and the meeting minutes from October 1 and October 8.

## Summary

| Member | GitHub | Commits | Merged PRs | Open PRs | Reviews approved | PRs merged for others | Issues created | Oct 1 meeting | Oct 8 meeting | Time spent |
|---|---|---|---|---|---|---|---|---|---|---|
| Mohamad Alosta | @MAlos616 | 18 | 10 (#85, #86, #87, #93, #98, #99, #100, #101, #112, #113) | 2 (US-14 and the docs update) | 0 | 0 | 12 (#83, #94, #102 to #111) | Present | Present | 33 h |
| Paul Fourment | @paulfusa | 4 | 2 (#89, #92) | 0 | 3 (#88, #96, #99) | 3 | 5 (#79 to #82, #91) | Present | Present | ? h |
| Maher Waez | @Maherwaez01 | 4 | 1 (#96) | 1 (#114) | 7 (#89, #92, #93, #100, #101, #112, #113) | 7 | 2 (#90, #97) | Present | Present | ? h |
| Michael Derocher | @MichaelDerocher1551 | 2 | 1 (#88) | 0 | 4 (#85, #86, #87, #98) | 0 | 0 | Present | Present | ? h |
| Kimia Karimiyeganeh | @kimiakarimiy | 0 | 0 | 0 | 0 | 0 | 0 | Present | Present | ? h |
| Andrew Rowe | @an-rowe54 | 0 | 0 | 0 | 0 | 0 | 0 | Present | Absent | ? h |

Note: Commit counts don't include merge commits, and include commits on branches that are still in review. "PRs merged for others" counts teammates' pull requests that the member merged. Each member fills in their own time spent, in hours, here and next to each activity below.

## Mohamad Alosta
- Took the meeting minutes for the October 1 planning meeting (issue #83, PRs #85, #93) and the October 8 meeting (issue #94, PRs #98, #99), and revised them (PR #101). (0.5 h)
- **Implemented US-05 (browse and view job offers)** in PR #100 (merged October 17): added status, published, requirements and deadline (required) and salary (optional) to job postings, with validation and 4 tests; hid unpublished jobs from job seekers; added status and draft badges; showed the new details on the job page. Wrote acceptance tests #108 and #109. (12 h)
- **Implemented US-14 (job search filters)**: search by keyword, company and location, and filter by employment type and work mode, with 4 tests. Also fixed two comments and the closed-job notice from US-05. In review. Wrote acceptance tests #110 and #111. (6 h)
- **Started US-03 (clear application outcome message)**: outcome validation with 7 tests, the outcome table, the recruiter's decision form and the applicant's message view. The rest depends on US-15. (6 h)
- **Started US-15 (apply for a job), task 15.1**: the application table, the application statuses, and the application validation with 2 tests. The job seeker side (Michael) and the recruiter side (Maher) build on it. (? h)
- **Set up the CI pipeline** that runs the type check and tests on every pull request (issue #102, PR #112). (0.5 h)
- Wrote user story US-20 (application status tracking, issue #107) to cover the status tracking required in Sprint 2. (0.5 h)
- Created the Sprint 2 tracking issues (#102 to #106) and the `Acceptance Test` label. (0.5 h)
- Updated the task breakdown at the end of Sprint 1 (PR #87), and wrote the Sprint 2 plan, the Sprint 2 task breakdown (PR #113) and this contribution log (issue #104). (3 h)
- Updated the README for Sprint 2 and drafted the Sprint 2 summary report (issue #106). (? h)
- Opened and merged PR #86 for Maher's US-08 work.

## Paul Fourment
- **Implemented US-10 (resume upload) and US-11 (resume management)** in PR #92. (? h)
- Fixed an email verification bug (a redirect loop) and matched its pages to the rest of the app (PR #89). (? h)
- Added the company and city autofill APIs and the "Your postings" tab for recruiters, as fixups on Michael's job postings PR (#88, commit 70ecaa6). (? h)
- **Started the Generative AI feature** (resume AI autofill and review, issue #91) on the `feature/ai-resume` branch. (? h)
- Proposed new features as issues #79 to #82 (search job seekers, following users, messaging, dark mode). (? h)
- Reviewed, approved and merged 3 teammates' pull requests (#88, #96, #99). (? h)

## Maher Waez
- **Implemented US-08 (account email verification)** (commit 400ed9a, merged in PR #86). (? h)
- Wrote and **implemented US-17 (forgot password)** with the reset code email templates (issue #90, PR #96). (? h)
- Wrote user story US-18 (recruiter verification and approval, issue #97). (? h)
- **Implemented US-07 (recruiter company profile)**: the company profile table, the profile and edit pages, company details on job postings, and tests (PR #114, in review). (? h)
- Added AI usage logs for US-08 and US-17. (? h)
- Reviewed, approved and merged 7 teammates' pull requests (#89, #92, #93, #100, #101, #112, #113). (? h)

## Michael Derocher
- **Implemented US-12 (job posting creation) and US-13 (job posting management)**: creating, viewing, editing and deleting job postings (PR #88). (? h)
- Added an AI prompt log for the job postings work. (? h)
- Reviewed and approved 4 teammates' pull requests (#85, #86, #87, #98). (? h)

## Kimia Karimiyeganeh
- Attended the October 1 and October 8 planning meetings.
- Assigned US-20 (application status tracking, issue #107).

## Andrew Rowe
- Attended the October 1 planning meeting.
- Assigned US-21 (dark mode, issue #82) for a later sprint.
