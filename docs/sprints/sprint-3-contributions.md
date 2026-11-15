# Sprint 3 - Team Member Contributions

This log is based on our GitHub history (commits, pull requests, reviews and issues) since October 27, and the meeting minutes from November 5 and November 12.

## Summary

| Member              | GitHub               | Commits | Merged PRs                 | Open PRs | Reviews approved                             | PRs merged for others | Issues created                                            | Nov 5 meeting | Nov 12 meeting | Time spent |
| ------------------- | -------------------- | ------- | -------------------------- | -------- | -------------------------------------------- | --------------------- | --------------------------------------------------------- | ------------- | -------------- | ---------- |
| Mohamad Alosta      | @MAlos616            | 16      | 4 (#174, #175, #177, #182) | 1 (#187) | 3 (#165, #183, #191)                         | 3                     | 15 (#159 to #164, #166, #168 to #170, #178 to #181, #188) | Present       | Present        | 34 h       |
| Paul Fourment       | @paulfusa            | 4       | 1 (#176)                   | 0        | 0                                            | 0                     | 8 (#153 to #158, #192, #193)                              | Absent        | Present        | ? h        |
| Maher Waez          | @Maherwaez01         | 8       | 2 (#165, #183)             | 0        | 7 (#167, #173, #174, #175, #176, #177, #182) | 6                     | 3 (#184 to #186)                                          | Present       | Present        | ? h        |
| Michael Derocher    | @MichaelDerocher1551 | 11      | 2 (#173, #191)             | 0        | 0                                            | 0                     | 8 (#149 to #152, #171, #172, #189, #190)                  | Present       | Absent         | ? h        |
| Kimia Karimiyeganeh | @kimiakarimiy        | 8       | 1 (#167)                   | 0        | 0                                            | 0                     | 0                                                         | Present       | Present        | ? h        |

Note: The counts are from November 15. Commit counts don't include merge commits, and include commits on branches that are still in review. "PRs merged for others" counts teammates' pull requests that the member merged. Each member fills in their own time spent, in hours, here and next to each activity below.

## Mohamad Alosta

- Wrote the Sprint 3 user stories US-25, US-26, US-27 and US-28 (issues #160, #161, #163 and #166), and opened the issues for the Sprint 3 acceptance tests (#162), docs (#168), AI logs (#169) and summary report (#170). (2 h)
- Wrote US-30 (#188) on November 15 for the missing parts of feature 1 (archiving postings and filtering applications). (1 h)
- Took the minutes for the November 5 and November 12 meetings (issues #159 and #164). (1 h)
- **Implemented US-28 (job filter additions)** in PR #175, merged November 14. Job seekers can now filter by minimum salary, date posted and open jobs only, sort by the closest deadline or the highest salary, and get company and city suggestions while typing. Added 18 unit tests. Wrote acceptance tests #180 and #181. (5 h)
- Fixed long words with no spaces running past the edge of their boxes, in PR #177, merged November 14. (1 h)
- **Implemented US-19 (following other users)** in PR #174, merged November 14. Job seekers and recruiters can follow each other from their profiles, and find people to follow on a new Recruiters / Job seekers page with a search. Profiles show follower counts, the Following page lists who you follow, and job seekers can filter the job list to jobs from people they follow. Job postings and the applicants list show each person's photo, which links to their profile. Added 31 unit tests. Wrote acceptance tests #178 and #179. (14 h)
- Wrote the Sprint 3 plan, the Sprint 3 task breakdown and this contribution log (issue #168, PRs #182 and #187). (5 h)
- Wrote the Sprint 3 summary report (issue #170), in `docs/submissions/submission-3/`. (2 h)
- Updated the README for Sprint 3: the Sprint 3 scope, what was added this sprint, what is left, and links to the new docs. Moved the deadline reminders notes into their own file, `docs/deadline-reminders.md`. (0.5 h)
- Wrote the Sprint 3 AI log for US-28, US-19 and the Sprint 3 docs, in `AI_Log/Mohamad_Alosta/` (issue #169). (2 h)
- Reviewed, approved and merged Maher's job offer emails pull request (#165). (10 mins)
- Reviewed, approved and merged Maher's dark mode pull request (#183). (10 mins)
- Reviewed, approved and merged Michael's archive and filter pull request (#191). (10 mins)

## Paul Fourment

- **Implemented US-24 (resume AI autofill and review)** in PR #176, merged November 14. Job seekers can get an AI review of a resume, tailored to a job posting if they want, and fill in their profile from it after picking what to keep. This sprint he also fixed a leftover from merging `schema.ts`, removed an unused comment and fixed the AI docs. (? h)
- Wrote acceptance tests #153 to #158 for the Sprint 1 stories US-01, US-02 and US-04. (? h)
- Wrote acceptance tests #192 and #193 for US-24, one for the AI resume review and one for filling in the profile from a resume. (? h)

## Maher Waez

- **Implemented US-27 (job offer emails)** in PR #165, merged November 12. When a recruiter sends an offer, the applicant gets an email with a link to see it on CareerConnect. Added tests and his AI log for it. (? h)
- **Implemented US-21 (dark mode)** in PR #183, merged November 15. Users can pick Light, Dark or System on the Settings page, and the choice is saved in the browser. Every page has dark styles, including the new follow pages. Added tests, his AI logs and acceptance test #185. (? h)
- Wrote acceptance test #186 for US-27. (? h)
- Wrote a new story, US-29 (personalized home dashboard, #184), and he's building it now. (? h)
- Reviewed and approved seven pull requests on November 14 and 15: Kimia's notifications (#167), Michael's analytics (#173), Paul's AI feature (#176) and Mohamad's job filters (#175), long words fix (#177), following (#174) and Sprint 3 docs (#182). He merged all of them except #174. (? h)

## Michael Derocher

- **Implemented US-25 (application analytics and history)** in PR #173, merged November 14. Job seekers get a page with their application history, a breakdown of their applications by status and a chart of the applications they sent over time. Added unit tests, his AI log and acceptance tests #171 and #172. (? h)
- **Implemented US-30 (archiving postings and filtering applications)** in PR #191, merged November 15. Recruiters can now archive a posting and bring it back later, see their active and archived postings separately with how many applications each one has, and filter a posting's applicants by status or by how recently they applied. Job seekers don't see archived postings and can't apply to them. Added unit tests, his AI log and acceptance tests #189 and #190. (? h)
- Wrote acceptance tests #149 to #152 for the Sprint 2 stories US-12 and US-13. (? h)

## Kimia Karimiyeganeh

- **Implemented US-26 (notifications and reminders)** in PR #167, merged November 14. Recruiters get a notification for new applications, and job seekers for status changes, interviews, offers and rejections. There's a notification bell with an unread count and an inbox, plus deadline reminders for recruiters. Added unit tests. (? h)
