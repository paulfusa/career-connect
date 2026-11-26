# Demo Data, UI Polish, AI Job Matching (US-31) and Acceptance Tests
- **Purpose of AI Use**: Preparing the app for the final demo (realistic demo data, a cleaner interface and navigation), implementing the second Generative AI feature, and writing the remaining acceptance tests
- **AI-Suggested Content**: A seed script with demo recruiters, job seekers, postings, resumes and applications (`scripts/seed.ts`, `docs/seed-data.md`); sidebar icons and button styles; a fix for the gap above every page; AI job matching reusing the US-24 AI client (`src/lib/server/job-match.ts`, `/matches` page, `job_match` table); a reorganized sidebar with tabs inside each area; 8 acceptance tests for US-16, US-31, US-32 and US-33
- **Validation**: reviewed all changes, tests ai model, and published the acceptance tests
- **Decision**: accepted
- **Reflection**: AI helped build the final ai generative feature from what was already built before, and helped polish the final changes as well.
- **Responsible Person**: Paul Fourment

# Prompt 1
Can you seed data for the website so it looks more professional rather than test data? I can give you the logins for my recruiter and job seeker accounts, or do you prefer doing it through the database?

# Response 1
Recommended a seed script over clicking through the site: it can be rerun on a fresh database, teammates can use it, passwords are hashed the same way as the sign-up page, and it can be reviewed before anything is written. The account passwords weren't needed; the data was attached to the two accounts by email.

Choices made: only add data (never change or delete existing rows), create about 12 extra demo people, review a dry run first, and work on a new branch from main.

**`scripts/seed.ts`** (`pnpm db:seed`, `--dry-run` to preview):
- **4 recruiters** at fictional companies (Northwind Labs, Maple Health Analytics, Lumen Financial, Boreal Robotics), each with a company profile and 3 postings with realistic descriptions, requirements, salaries and deadlines (one closed). Fictional companies with `.example` websites, so no real employer gets fake postings.
- **8 job seekers** with complete profiles (headline, about, skills, job preferences, experience with bullet points, education) and a generated text resume PDF uploaded to the private `resumes` bucket, readable by the AI features.
- **22 applications** at every stage, **5 offers and rejections** with full recruiter messages, **38 notifications** matching what the app sends, **23 follows** and **3 feature suggestions**.
- **The two team accounts** only had their empty fields filled, plus postings and applications.
- Dates are relative to the day it runs, so deadlines stay in the future. Running it again adds nothing.

**Verification**: the dry run rolled back and left every table count unchanged; the real run added exactly the expected rows and uploaded 8 of 8 PDFs; a generated PDF was read back with accents, bullets and wrapped lines intact; signing in as a demo job seeker showed her applications, the new postings and a working resume download. `docs/seed-data.md` lists the demo accounts (shared password) and how to run it.

# Prompt 2
What does seed.ts do? Do I need to commit it?

# Response 2
It creates the demo accounts, fills in their profiles, postings and resumes, then builds the activity between them, and only ever adds. The data is already in the database, so the site doesn't need the script, but committing it lets anyone rebuild the demo with one command, shows teammates the demo logins, and is evidence of where the data came from. The demo password in it only works for the fake `.test` accounts.

# Prompt 3
Can you improve the UI buttons, especially the sidebar with matching icons?

# Response 3
- **Icons**: an `Icon` component with outline icons copied from Lucide (open-source), so no new dependency; one icon per sidebar link and an exit icon on Log out.
- **Sidebar**: the current page gets a tinted background and a teal icon; Log out turns red on hover; on phones the links sit in a two-column grid instead of uneven wrapped rows (one column under 360px).
- **Buttons**: the shared primary and secondary styles lift slightly on hover, press down when clicked and have softer shadows. Their size and layout were left alone because about 25 places combine them with other classes.
- Checked in dark mode, light mode and at phone width. One existing test looked for the old `flex-wrap` class; it was updated to the new grid while keeping what it protects (the notification bell stays in the header).

# Prompt 4
The top of the main pages is lower than the sidebar. Fix that gap.

# Response 4
All 21 logged-in pages added the same `md:mt-14` (56px) of top margin, left over from an earlier layout. Removing it makes every page start level with the sidebar card; measured in the browser on two pages (both at the same height). Phone layouts were unaffected.

# Prompt 5
This is the last feature I need to implement. Reuse the AI system we already built.

(*US-31 pasted: suggestions picked from open, published postings, based on the profile and optionally a resume; each shows title, company, location, a match level and a reason; missing skills listed; closed, unpublished and already-applied jobs excluded; saved, refreshable and private; clear messages for an empty profile, no fit, or the AI being unavailable. Tasks 31.1 to 31.5.*)

# Response 5
**Design**: the server decides which jobs are allowed before the AI sees anything, and the AI only ranks and explains.
1. **Eligible jobs** (`isMatchable`): published, open, not archived, deadline not passed, not posted by the user and not already applied to. The same rule runs again whenever saved matches are shown, so a job that closes or is applied to disappears without refreshing.
2. **Shortlist**: the 12 eligible jobs sharing the most terms with the candidate's skills, roles and job titles, so the prompt stays small enough for a local model.
3. **Prompt**: the profile (skills, experience, education, preferences; no name, email or phone), the optional resume text, and the jobs labelled `J1`, `J2`… instead of database ids. The model is told the data is untrusted, not to invent anything, and not to pad the list.
4. **Output checks** (`normalizeMatches`): references that weren't sent are dropped, levels must be Strong, Good or Partial, each job appears once, "missing" skills the candidate already has are removed, and results are sorted strongest first (max 6).
5. **Saved** per job seeker in a new `job_match` table (SQL to run on Supabase), with the resume used and the model name.

**Page** (`/matches`): resume picker (or profile only), **Find my matches** / **Refresh matches**, cards with company logo, details, a coloured level badge, the reason and **Missing for this job**, and a note that AI can be wrong. Messages for an empty profile (with a link to complete it), no jobs that fit, AI not set up, unreadable PDFs and AI failures (the previous matches stay). Recruiters get "not found". The Home page button for job seekers now leads there, and `docs/ai-setup.md` documents the feature and its privacy and validation rules.

**Validation with the real local model** (seeded profiles, read-only):
- The first version ranked unrelated jobs highly (it counted common words like "experience"), padded the list with weak "partial" matches, and described one candidate with a trait the profile didn't contain.
- Fixed by ignoring common words and weighting the candidate's own skills and titles, and by telling the model not to pad the list or describe unstated traits.
- After the fix: a full-stack profile got five sensible, ranked matches with real gaps in about 30 seconds; three profiles got none because they had already applied to the postings in their field.

**Tests**: 13 new unit tests (eligibility rules, ranking, prompt content, output checks, saving, access control, every error message), with the AI faked. 472 tests pass.

**SQL to run in the Supabase SQL Editor**
```sql
create table public.job_match (
  user_id    text primary key references public."user"(id) on delete cascade,
  resume_id  uuid references public.resume(id) on delete set null,
  matches    jsonb not null,
  model      text not null,
  updated_at timestamp not null default now()
);
alter table public.job_match enable row level security;
```

# Prompt 6
The sidebar is a bit full now. Reorganize it, maybe by moving things into the Jobs tab. Same with Recruiters and Following: merge those.

# Response 6
The sidebar now has one link per area, and related pages became tabs at the top of each area (a shared `SectionTabs` component, no URLs changed):

| Sidebar | Tabs (job seeker) | Tabs (recruiter) |
|---|---|---|
| Home | | |
| Jobs | All jobs, Job matches, My reviews | All postings, Active, Archived, Company reviews |
| My Applications | | |
| Resumes | | |
| People | Recruiters, Following | Job seekers, Following |
| Settings | Settings, Suggest a feature (+ Review suggestions for admins) | same |

Job seekers went from 10 sidebar links to 6, recruiters from 7 to 4. The sidebar keeps its area highlighted on every tab (e.g. Jobs stays selected on Job matches). Checked every tab as a demo job seeker and a demo recruiter, and at phone width.

# Prompt 7
Now I need to wrap up all the acceptance tests for my user stories that I'm missing. Create them in a Markdown file so I can create the issues myself under my name.

# Response 7
Compared the stories assigned to me with the existing "Acceptance Test" issues: US-16, US-31 and US-33 had none, and US-32 (written by me but unassigned) had none either. Wrote two tests per story in the team's format (Tasks, criteria covered, Given / When / Then with checkboxes, Result left empty), with messages and button names taken from the code:

| Story | Tests | Covers |
|---|---|---|
| US-16 Onboarding | 16.1, 16.2 | Questions per role, saving, answers on the card and profile; skipping, and the window never coming back |
| US-31 Job matching | 31.1, 31.2 | Levels, reasons, missing skills, saving and refreshing with a resume; applied and closed jobs removed, recruiters blocked, every error message |
| US-32 Unit tests | 32.1, 32.2 | The coverage report and the 80% minimum, the removed outdated test, the fakes, and deliberate bugs caught by tests |
| US-33 CI/CD | 33.1, 33.2 | Checks on every pull request, a failing test blocking the merge, the coverage summary, and the downloadable build after a merge |

Two steps were corrected after checking the code: the onboarding field already stops typing at 100 characters, and the exact coverage error text was used. The file gives each issue's title and body ready to paste.

Issues found along the way: the `main` ruleset requires a pull request and an approval but not passing checks (needed for 33.1); #204 still asks for hosted deployment while the team agreed on a downloadable build; #203 and #204 use the wrong task numbers; #203 has no assignee.
