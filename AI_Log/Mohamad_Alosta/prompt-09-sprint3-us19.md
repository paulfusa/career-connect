# Prompt 9 - US-19 Recruiters and Job Seekers Can Follow Each Other (Sprint 3)

- **Tool**: Claude
- **Date**: November 13 - 14, 2026
- **Purpose of AI Use**: The code and unit tests for US-19 (#80), two additions I suggested while testing, and getting the pull request ready.
- **Chat Link or Prompt/Response**: No shareable link. My main requests are in the appendix below.
- **AI-Suggested Content**: We worked on US-19 together. I gave ideas and outlined the two additions: a page to find people to follow, and profile photos that link to each person's profile. The AI drafted the code and tests and explained the parts I asked about. I also ran the database change myself, tested every part with two accounts, and told it what to fix and how to make it better.
- **Validation**: pnpm check (0 errors), pnpm test (31 tests for US-19, 291 in total), manual testing with a job seeker and a recruiter account, acceptance tests #178 and #179, and Maher's approval of PR #174.
- **Decision**: Used after testing, with the changes I asked for (the button width, the new page and the photos).
- **Reflection**: Testing with two accounts at the same time showed me things the unit tests can't, like the button size and whether the counts make sense. The two features I suggested while testing made following much more useful, since you no longer need someone's profile link to follow them.
- **Responsible Person**: Mohamad Alosta

## Development and Understanding Process

The AI built the first version: following and unfollowing from a profile, the Following page, follower counts and the "From people I follow" filter. I then tested it in two browsers, one as the job seeker "Find jobs" and one as the recruiter "Hiring company", and asked for changes. Things I asked about:

- Whether there were tests for it (there weren't yet, so I asked for them).
- Whether the database was updated after I ran the new table in the Supabase SQL Editor.
- Why "Find jobs" showed 0 followers after both accounts followed each other.
- Whether the Recruiters / Job seekers page uses an outside API (it doesn't, it reads our own database).
- Whether the changes would cause merge problems with what was already on GitHub.

## Work Done (by step)

| Step                             | What was done                                                                                                                 | Who did what                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Follow table (`schema.ts`)  | Who follows whom and since when, with one follow per pair and no following yourself                                           | The AI drafted it and the SQL and explained them to me, and I ran the SQL in the Supabase SQL Editor                                            |
| 2. Follow rules (`follow.ts`)  | Job seekers follow recruiters and recruiters follow job seekers, with clear messages for following yourself or a missing user | The AI drafted it and explained it to me                                                                                                        |
| 3. Profile page                  | The Follow / Unfollow button and the follower count                                                                           | The AI drafted it and explained it to me, and I tested it with two accounts                                                                     |
| 4. Following page and job filter | A list of the people you follow, and "From people I follow" on the job list                                                   | The AI drafted it and explained it to me, and I tested it with two accounts                                                                     |
| 5. Unit tests                    | Tests for following, unfollowing and the follow rules                                                                         | I asked if there were tests, and the AI drafted them and explained what they check                                                              |
| Fix (November 14)                | The Follow button was squished, so it now has room and stays the same width as Unfollow                                       | I found the problem, and the AI fixed it                                                                                                        |
| 6. Recruiters / Job seekers page | Job seekers look through recruiters and recruiters through job seekers, with a search and a "Following" tag                   | I gave the idea and outlined it, and chose to list all job seekers. The AI built it and explained it to me                                      |
| 7. Profile photos                | A small round photo on job postings and the applicants list that opens the person's profile                                   | I gave the idea and outlined it (a round photo on applications and job postings that opens the profile). The AI built it and explained it to me |
| 8. More tests and clean-up       | Tests for the new page and the photos (31 tests in total for US-19), and plainer comments                                     | I asked for them, and the AI drafted them                                                                                                       |
| Acceptance tests (#178, #179)    | Two tests in the same style as my Sprint 2 ones                                                                               | The AI drafted them, and I ran each test and posted them                                                                                        |

## Errors and Bugs Found During Testing

- I noticed the Follow button looked squished. The AI gave it a fixed width so it doesn't change size when it switches to Unfollow.
- "Find jobs" showed 0 followers even though I had followed from both accounts. It wasn't a bug: the recruiter had followed a different user (Maher). After following the right account, the counts were correct.
- GitHub said PR #174 had conflicts even though it merged cleanly on my computer. The AI updated the branch from `main`, and the conflict went away.
- The photo component also changes in Maher's dark mode branch, so whoever merges second will need to fix a small conflict.

## Validation and Testing

- `pnpm check`: 0 errors. `pnpm test`: 31 tests for US-19 pass, and all 291 tests pass after the merge.
- Manual testing with two accounts:
  - Following and unfollowing from a profile, with the right counts on both sides.
  - You can't follow yourself, and the button turns into Unfollow so you can't follow twice.
  - The Following page lists the right people, and "From people I follow" shows only their jobs.
  - The Recruiters page shows only recruiters, and its search finds Jerry Rec.
  - The photos on a job and on the applicants list open the right profile.
- Acceptance tests #178 and #179 passed on November 14.
- Maher approved PR #174, and I merged it on November 14.

## Code Provided Directly by the AI

- All of the US-19 code and its 31 unit tests. The SQL for the follow table was also from the AI, and I ran it myself.

## Code Walkthrough from the AI

To prepare for the lab, I asked the AI to walk me through the US-19 code block by block. Its explanation, in short:

| Block                         | What it does                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Follow table (`schema.ts`)  | One row per follow. The unique pair stops following twice, a check stops following yourself, and deleting a user deletes their follows.                                                                                        |
| Follow rules (`follow.ts`)  | Who can see whom (only the opposite role), which role the Recruiters / Job seekers page shows, and why a follow isn't allowed. A missing user and a not-allowed user get the same message, so nobody can tell which ids exist. |
| Profile page `load`         | Sends you to your own profile if it's your id, gives the same 404 for missing and not allowed, counts the followers, checks if you already follow them, and gets a recruiter's 5 latest jobs.                                  |
| Follow and Unfollow actions   | Follow checks the rules, then adds the row and ignores a duplicate, so a double click can't follow twice. Unfollow only deletes your own follow.                                                                               |
| Follow button                 | Switches between Follow and Unfollow, sends the form without reloading the page, and keeps the same width.                                                                                                                     |
| Own profile counts            | Counts your followers and the people you follow, at the same time as the rest of your profile.                                                                                                                                 |
| Following page                | Lists the people you follow, newest first, each with an Unfollow button.                                                                                                                                                       |
| "From people I follow"        | Keeps only jobs whose creator is in your follow list. Only job seekers see the box.                                                                                                                                            |
| Recruiters / Job seekers page | Lists verified people with the other role, searches their name, headline, job title and company, shows a Following tag, and stops at 50.                                                                                       |
| Photo links                   | A small round photo that opens the person's profile, on the job cards, the job page and the applicants list.                                                                                                                   |
| Navigation                    | The Recruiters or Job seekers link, and the Following link.                                                                                                                                                                    |
| Tests                         | The follow rules on their own, the pages with a fake database, and the photo data on the job page and applicants list.                                                                                                         |

## Other AI Use During This Period

- Drafting the pull request description for #174, and combining the US-28 commits into one.
- Drafting the acceptance tests for US-28 and US-19, which I ran before posting.
- Updating the README for Sprint 3 and checking the Sprint 3 docs against GitHub.
- The Sprint 3 summary report: the AI drafted the text and built the Word file from the Concordia cover page template I gave it. I added the TA's name and changed the title style myself.
- Preparing for the lab: a walkthrough of the US-19 code, summarized above.
- This log: the AI drafted it from our chat history, and I checked it against what happened.

## Appendix - Main Prompts

> let us do my other US

> the follow button seems a bit compressed should we fix that?

> find jobs has 0 followers

> should we add an applicant section or recruiter section so u can head there and see what to add also shouldnt u be able to see the profile and from there say follow or not

> also we should like add the profile photo of a recruiter or applicant in a circle maybe on like the top right side of an application or a job posting and once u press it u head to their profile

> can u send in the code parts to Github with the description of what we did etc...

> Can u give me a summary of what each code block does for what we worked on together and explain them telling me which parts did what?

> Walk me through the code blocks one by one
