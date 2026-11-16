# Sprint 3 - Team Member Contributions

This log is based on our GitHub history (commits, pull requests, reviews and issues) since October 27, and the meeting minutes from November 5 and November 12.

## Summary

| Member              | GitHub               | Commits | Merged PRs           | Open PRs | Reviews approved                       | PRs merged for others | Issues created                                      | Nov 5 meeting | Nov 12 meeting | Time spent |
| ------------------- | -------------------- | ------- | -------------------- | -------- | -------------------------------------- | --------------------- | --------------------------------------------------- | ------------- | -------------- | ---------- |
| Mohamad Alosta      | @MAlos616            | 15      | 3 (#174, #175, #177) | 0        | 1 (#165)                               | 1                     | 14 (#159 to #164, #166, #168 to #170, #178 to #181) | Present       | Present        | ? h        |
| Paul Fourment       | @paulfusa            | 4       | 1 (#176)             | 0        | 0                                      | 0                     | 6 (#153 to #158)                                    | Absent        | Present        | 3 h        |
| Maher Waez          | @Maherwaez01         | 5       | 1 (#165)             | 0        | 6 (#167, #173, #174, #175, #176, #177) | 5                     | 0                                                   | Present       | Present        | ? h        |
| Michael Derocher    | @MichaelDerocher1551 | 5       | 1 (#173)             | 0        | 0                                      | 0                     | 6 (#149 to #152, #171, #172)                        | Present       | Absent         | ? h        |
| Kimia Karimiyeganeh | @kimiakarimiy        | 8       | 1 (#167)             | 0        | 0                                      | 0                     | 0                                                   | Present       | Present        | ? h        |

Note: The counts are from November 15. Commit counts don't include merge commits, and include commits on branches that are still in review. "PRs merged for others" counts teammates' pull requests that the member merged. Each member fills in their own time spent, in hours, here and next to each activity below.

## Mohamad Alosta

- Wrote the Sprint 3 user stories US-25, US-26, US-27 and US-28 (issues #160, #161, #163 and #166), and opened the issues for the Sprint 3 acceptance tests (#162), docs (#168), AI logs (#169) and summary report (#170). (2 h)
- Took the minutes for the November 5 and November 12 meetings (issues #159 and #164). (1 h)
- **Implemented US-28 (job filter additions)** in PR #175, merged November 14. Job seekers can now filter by minimum salary, date posted and open jobs only, sort by the closest deadline or the highest salary, and get company and city suggestions while typing. Added 18 unit tests. Wrote acceptance tests #180 and #181. (5 h)
- Fixed long words with no spaces running past the edge of their boxes, in PR #177, merged November 14. (1 h)
- **Implemented US-19 (following other users)** in PR #174, merged November 14. Job seekers and recruiters can follow each other from their profiles, and find people to follow on a new Recruiters / Job seekers page with a search. Profiles show follower counts, the Following page lists who you follow, and job seekers can filter the job list to jobs from people they follow. Job postings and the applicants list show each person's photo, which links to their profile. Added 31 unit tests. Wrote acceptance tests #178 and #179. (14 h)
- Wrote the Sprint 3 plan, the Sprint 3 task breakdown and this contribution log (issue #168). (5 h)
- Wrote the Sprint 3 summary report (issue #170), in `docs/submissions/submission-3/`. (? h)
- Updated the README for Sprint 3: the Sprint 3 scope, what was added this sprint, what is left, and links to the new docs. Moved the deadline reminders notes into their own file, `docs/deadline-reminders.md`. (? h)
- Wrote the Sprint 3 AI log for US-28, US-19 and the Sprint 3 docs, in `AI_Log/Mohamad_Alosta/` (issue #169). (? h)
- Reviewed, approved and merged Maher's job offer emails pull request (#165). (10 min)

## Paul Fourment

- **Working on US-24 (resume AI autofill and review)** on the `feature/ai-resume` branch, and it was merged in PR #176 on November 14. This sprint he also fixed a leftover from merging `schema.ts`, removed an unused comment and fixed the AI docs. (? h)
- Wrote acceptance tests #153 to #158 for the Sprint 1 stories US-01, US-02 and US-04. (? h)

## Maher Waez

- **Implemented US-27 (job offer emails)** in PR #165, merged November 12. When a recruiter sends an offer, the applicant gets an email with a link to see it on CareerConnect. Added tests and his AI log for it. (? h)
- **Working on US-21 (dark mode)** on the `feature/dark-mode` branch. Users can pick Light, Dark or System on the Settings page, and the choice is saved in the browser. Most pages have dark styles now, including the profile, jobs, applications and AI pages. Added tests and his AI log for it. (? h)
- Reviewed and approved six pull requests on November 14: Kimia's notifications (#167), Michael's analytics (#173), Paul's AI feature (#176) and Mohamad's job filters (#175), long words fix (#177) and following (#174). He merged all of them except #174. (? h)

## Michael Derocher

- **Implemented US-25 (application analytics and history)** in PR #173, merged November 14. Job seekers get a page with their application history, a breakdown of their applications by status and a chart of the applications they sent over time. Added unit tests, his AI log and acceptance tests #171 and #172. (? h)
- Wrote acceptance tests #149 to #152 for the Sprint 2 stories US-12 and US-13. (? h)

## Kimia Karimiyeganeh

- **Implemented US-26 (notifications and reminders)** in PR #167, merged November 14. Recruiters get a notification for new applications, and job seekers for status changes, interviews, offers and rejections. There's a notification bell with an unread count and an inbox, plus deadline reminders for recruiters. Added unit tests. (? h)
