# Sprint 3 - Team Member Contributions

This log is based on our GitHub history (commits, pull requests, reviews and issues) since October 27, and the meeting minutes from November 5 and November 12.

## Summary

| Member              | GitHub               | Commits | Merged PRs                       | Open PRs | Reviews approved                                         | PRs merged for others | Issues created                                            | Nov 5 meeting | Nov 12 meeting | Time spent       |
| ------------------- | -------------------- | ------- | -------------------------------- | -------- | -------------------------------------------------------- | --------------------- | --------------------------------------------------------- | ------------- | -------------- | ---------------- |
| Mohamad Alosta      | @MAlos616            | 17      | 5 (#174, #175, #177, #182, #187) | 1 (#199) | 4 (#165, #183, #191, #198)                               | 4                     | 15 (#159 to #164, #166, #168 to #170, #178 to #181, #188) | Present       | Present        | 34 h and 10 mins |
| Paul Fourment       | @paulfusa            | 6       | 2 (#176, #194)                   | 0        | 0                                                        | 0                     | 8 (#153 to #158, #192, #193)                              | Absent        | Present        | 5 h and 15 mins  |
| Maher Waez          | @Maherwaez01         | 9       | 2 (#165, #183)                   | 1 (#195) | 9 (#167, #173, #174, #175, #176, #177, #182, #187, #194) | 8                     | 3 (#184 to #186)                                          | Present       | Present        | 22 h             |
| Michael Derocher    | @MichaelDerocher1551 | 11      | 2 (#173, #191)                   | 0        | 0                                                        | 0                     | 8 (#149 to #152, #171, #172, #189, #190)                  | Present       | Absent         | 21 h             |
| Kimia Karimiyeganeh | @kimiakarimiy        | 10      | 2 (#167, #198)                   | 0        | 1 (#195)                                                 | 0                     | 2 (#196, #197)                                            | Present       | Present        | 30 h             |

Note: The counts are from November 16. Commit counts don't include merge commits, and include commits on branches that are still in review. "PRs merged for others" counts teammates' pull requests that the member merged. Each member fills in their own time spent, in hours, here and next to each activity below.

## Mohamad Alosta

- Wrote the Sprint 3 user stories US-25, US-26, US-27 and US-28 (issues #160, #161, #163 and #166), and opened the issues for the Sprint 3 acceptance tests (#162), docs (#168), AI logs (#169) and summary report (#170). (2 h)
- Wrote US-30 (#188) on November 15 for the missing parts of feature 1 (archiving postings and filtering applications). (1 h)
- Took the minutes for the November 5 and November 12 meetings (issues #159 and #164). (1 h)
- **Implemented US-28 (job filter additions)** in PR #175, merged November 14. Job seekers can now filter by minimum salary, date posted and open jobs only, sort by the closest deadline or the highest salary, and get company and city suggestions while typing. Added 18 unit tests. Wrote acceptance tests #180 and #181. (5 h)
- Fixed long words with no spaces running past the edge of their boxes, in PR #177, merged November 14. (1 h)
- **Implemented US-19 (following other users)** in PR #174, merged November 14. Job seekers and recruiters can follow each other from their profiles, and find people to follow on a new Recruiters / Job seekers page with a search. Profiles show follower counts, the Following page lists who you follow, and job seekers can filter the job list to jobs from people they follow. Job postings and the applicants list show each person's photo, which links to their profile. Added 31 unit tests. Wrote acceptance tests #178 and #179. (14 h)
- Wrote the Sprint 3 plan, the Sprint 3 task breakdown and this contribution log (issue #168, PRs #182, #187 and #199). (5 h)
- Wrote the Sprint 3 summary report (issue #170), in `docs/submissions/submission-3/`. (2 h)
- Updated the README for Sprint 3: the Sprint 3 scope, what was added this sprint, what is left, and links to the new docs. Moved the deadline reminders notes into their own file, `docs/deadline-reminders.md`. (0.5 h)
- Wrote the Sprint 3 AI log for US-28, US-19 and the Sprint 3 docs, in `AI_Log/Mohamad_Alosta/` (issue #169). (2 h)
- Reviewed, approved and merged Maher's job offer emails pull request (#165). (10 mins)
- Reviewed, approved and merged Maher's dark mode pull request (#183). (10 mins)
- Reviewed, approved and merged Michael's archive and filter pull request (#191). (10 mins)
- Reviewed, approved and merged Kimia's AI log and contribution pull request (#198). (10 mins)

**Total time spent: 34 h and 10 mins**

## Paul Fourment

- **Implemented US-24 (resume AI autofill and review)** in PR #176, merged November 14. Job seekers can get an AI review of a resume, tailored to a job posting if they want, and fill in their profile from it after picking what to keep. This sprint he also fixed a leftover from merging `schema.ts`, removed an unused comment and fixed the AI docs. (2 h)
- Wrote acceptance tests #153 to #158 for the Sprint 1 stories US-01, US-02 and US-04. (2 h)
- Wrote acceptance tests #192 and #193 for US-24, one for the AI resume review and one for filling in the profile from a resume. (1 h)
- Made the team's GitHub project board for the sprints. (15 mins)

**Total time spent: 5 h and 15 mins**

## Maher Waez

- **Implemented US-27 (job offer emails)** in PR #165, merged November 12. When a recruiter sends an offer, the applicant gets a congratulations email with a link to see the offer on CareerConnect. The same offer never sends a second email, and the offer is still saved if the email fails. Added unit tests and his AI log for it. (5 h)
- Wrote and ran acceptance test #186 for US-27. He checked that the email goes to the right applicant with the right link, that you have to log in to see the offer, that rejections and repeated offers don't send an email, and that a failed email doesn't lose the offer. (2 h)
- **Implemented US-21 (dark mode)** in PR #183, merged November 15. Users can pick Light, Dark or System on the Settings page, and the choice is saved in the browser. He updated the styles on the main pages, like profiles, jobs, applications, settings and the AI pages. Added tests, his AI log and acceptance test #185. (10 h)
- Kept the dark mode branch up to date while the other Sprint 3 features were merged. He fixed the merge conflicts and the styles that broke, checked that the new notifications, analytics, job filters and AI pages looked right, and tested the pages again. (3 h)
- Reviewed and approved nine pull requests on November 14 and 15: Kimia's notifications (#167), Michael's analytics (#173), Paul's AI feature (#176) and AI log (#194), and Mohamad's job filters (#175), long words fix (#177), following (#174) and Sprint 3 docs (#182, #187). He merged all of them except #174. (1 h)
- Wrote a new story, US-29 (personalized home dashboard, #184), and started building it. He took it out of Sprint 3 on November 16. (1 h)

**Total time spent: 22 h**

## Michael Derocher

- **Implemented US-25 (application analytics and history)** in PR #173, merged November 14. Job seekers get a page with their application history, a breakdown of their applications by status and a chart of the applications they sent over time. Added unit tests, his AI log and acceptance tests #171 and #172. (11 h)
- **Implemented US-30 (archiving postings and filtering applications)** in PR #191, merged November 15. Recruiters can now archive a posting and bring it back later, see their active and archived postings separately with how many applications each one has, and filter a posting's applicants by status or by how recently they applied. Job seekers don't see archived postings and can't apply to them. Added unit tests, his AI log and acceptance tests #189 and #190. (9 h)
- Wrote acceptance tests #149 to #152 for the Sprint 2 stories US-12 and US-13. (1 h)

**Total time spent: 21 h**

## Kimia Karimiyeganeh

- **Implemented US-26 (notifications and reminders)** in PR #167, merged November 14: notifications for recruiters and job seekers, saved in the database, with a bell and an inbox in the app, plus deadline reminders for recruiters. Here is how that work splits up:
- Designed the notification table (who it's for, the type, the time, read or unread, and a key that stops duplicates) and wrote the server code to create notifications, load them, count the unread ones and mark them as read. Users can only see and change their own notifications. Added unit tests. (7 h)
- Connected notifications to applications: recruiters hear about new applications, and applicants about status changes, interviews, offers and rejections. A notification is only sent when the status really changes. Added error handling, and tests to make sure the existing application features still work. (7 h)
- Built the deadline reminders for recruiters: a separate TypeScript script, its database code and a GitHub Actions workflow. It only picks postings whose deadline is close, and it never sends the same reminder twice. She set up the workflow's variables and database secret, fixed the database connection, and tested it on the shared Supabase database. Run #3 created one reminder, and run #4 created no duplicates. (7 h)
- Built the notification bell with an unread count, the inbox, the links and marking as read. After feedback from the team, she moved the bell to the top right and added a dropdown with the latest notifications. Tested it with automated tests and in the browser. (2 h)
- Merged her branch with the job offer emails without losing either the emails or the in-app notifications. Then she ran the tests and the type check, and tested the notifications, the recruiter and job seeker views and the reminder workflow by hand. PR #167 changed 28 files, 8 of them tests. (4 h)
- Wrote acceptance tests #196 and #197, one for the notifications from applications and one for the deadline reminders. (1 h)
- Wrote her Sprint 3 AI log, about how she used Codex and ChatGPT for the code, debugging, the interface and testing, and her part of this contribution log, in PR #198. (2 h)

**Total time spent: 30 h**
