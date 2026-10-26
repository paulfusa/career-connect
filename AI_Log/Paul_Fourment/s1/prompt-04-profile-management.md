# Profile Management (US-04)
- **Purpose of AI Use**: Code generation for profile management page and the main page layout
- **AI-Suggested Content**: App layout with an account sidebar, routes for recruiters and job seekers, profile/experience/education tables (SQL to run on Supabase), profile view and section edit dialogs, photo upload to Supabase Storage, change email/password, delete account, recruiter view of a profile, page transitions, school/company/city/skill autocomplete with a custom dropdown
- **Validation**: Tested the profile management page, editing details and found it very clunky, added more prompts to make it a smoother experience and add all the sections needed for the future.
- **Decision**: Accepted / Modified
- **Reflection**: AI helped create the page and DB layout for the founding details for Job Seekers and Recruiters, with things like experience, education, skills, etc.
- **Responsible Person**: Paul Fourment

# Prompt 1
I have created a new branch for feature/profile-management. Here is the user story to follow. I know the main page hasn't been sorted out yet, but if we can do a layout for it that would be great. It doesn't need content yet, just a simple layout: account card on the side, the jobs and stuff will be in the center. 

(*US-04 user story pasted: view and edit name, profile picture, email, password, phone number, location, skills, education and experience summary; changes persist; required fields show clear validation errors; users can edit only their own profile. Tasks 4.1–4.4.*)

# Response 1
**Recruiters vs job seekers**: use the same routes and let each page adapt to `user.role` (e.g. the home page shows "Jobs for you" or "Your job postings", the profile shows skills or company). Separate routes only make sense for pages one role must never see (e.g. a future recruiter-only "post a job" page), which get a one-line role check. Two parallel route trees would duplicate the layout, profile page and guards.

**Layout** (`src/routes/(app)/+layout.svelte`): every logged-in page shares a glass account card on the left (photo or initials, name, headline or job title, location, Home/Profile links, Log out) with the page content in the center. On phones the card moves to the top. Logout became its own `/logout` route so it works from any page.

**Data (Task 4.1)**: a `profile` table with one row per user, linked to `user`. The onboarding answers moved from `user` into it, so `user` keeps only account data.

**Profile page (Tasks 4.2–4.3)**: view mode with an Edit button; edit form for photo, name, phone, location (city autocomplete), headline/skills/education/experience for job seekers, company/job title for recruiters; separate forms to change email and password.
- Photo upload goes to a Supabase Storage bucket through its REST API from the server (secret key never reaches the browser), limited to PNG/JPG/WebP under 2 MB.
- Every action uses the logged-in user's id, never an id from the form, so users can only edit their own profile.

**Tests (Task 4.4)**: validation moved into a pure function with unit tests using Node's built-in test runner (`pnpm test`), no new dependency.

# Prompt 2
Can you add a simple page transition animation, quick and simple?

# Response 2
Used the browser's View Transitions API through SvelteKit's `onNavigate` (the pattern from the SvelteKit docs, no library):
- The old page fades out (120 ms) and the new one fades in with a 6 px lift (200 ms).
- The account card is excluded from the transition so it stays still.
- Disabled for users with reduced motion enabled; browsers without support (Firefox) navigate normally.

# Prompt 3
I want to avoid coming back to this page as much as possible, so I want to finalize it as much as possible right now. Remember the project description we were given: what other things would we need in the profile management area? For things like education, companies and skills, I'd like to make them simpler.
- Education: use possible APIs to autofill and show known schools
- Companies: same thing (like LinkedIn has) if an API is available
- Skills: how LinkedIn organizes skills

(*Project description pasted*)

# Response 3
**Data sources (tested live)**
| Field | Source | Result |
|---|---|---|
| Schools | Hipo university list (free, no key) | Good coverage incl. Québec CEGEPs; HTTP-only, so our server fetches it (`/api/schools`) |
| Companies | Clearbit autocomplete (free, no key) | Names + websites; logos shown from the company website's favicon |
| Skills | ESCO (EU skills taxonomy) | Rejected: "react" returned "react calmly in stressful situations" |

**Skills like LinkedIn**: standard skill names picked from a search box, shown as a list, with up to 5 starred top skills shown first. Implemented with a built-in list of about 415 common skills (technical, tools, business, soft skills, languages), with custom skills still allowed.

**Additions proposed for the profile** (chosen: all except resume, which stays a placeholder for its own story):
1. Structured experience entries (title, company, employment type, location, start/end month or current, description)
2. Structured education entries (school, degree, field of study, years, description)
3. Job preferences (open to work, desired roles, job types, work mode, preferred locations), for job search filtering and matching later
4. Read-only recruiter view `/profile/[id]`, since the story says recruiters should understand the candidate's background
5. About section, links (LinkedIn, GitHub, portfolio), profile completeness bar, delete account

**Implementation**
- Profile organised like LinkedIn: each section is a card with its own Edit/Add button that opens a dialog. The open dialog is in the URL (e.g. `/profile?experience=new`), so back/Esc close it.
- Validation rewritten as one parser per section (dates in order and not in the future, years in range, links normalised, unknown choices dropped), covered by 6 unit test groups.
- Recruiter view: only recruiters can open it and only for job seekers; everyone else gets the same "not found" page so ids can't be probed.
- Delete account requires typing DELETE and the password; profile, experience and education rows are removed by the database's cascading deletes, and the photo is deleted from storage.

**SQL to run in the Supabase SQL Editor**
```sql
alter table public.profile
  drop column education,
  drop column experience,
  add column about               text,
  add column linkedin_url        text,
  add column github_url          text,
  add column website_url         text,
  add column company_domain      text,
  add column top_skills          text[]  not null default '{}',
  add column open_to_work        boolean not null default false,
  add column desired_roles       text[]  not null default '{}',
  add column job_types           text[]  not null default '{}',
  add column work_modes          text[]  not null default '{}',
  add column preferred_locations text[]  not null default '{}';

create table public.experience (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references public."user"(id) on delete cascade,
  title           text not null,
  company         text not null,
  company_domain  text,
  employment_type text,
  location        text,
  start_date      date not null,
  end_date        date,
  description     text,
  created_at      timestamp not null default now(),
  constraint experience_dates_check check (end_date is null or end_date >= start_date)
);
create index experience_user_id_idx on public.experience(user_id);
alter table public.experience enable row level security;

create table public.education (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null references public."user"(id) on delete cascade,
  school         text not null,
  school_domain  text,
  degree         text,
  field_of_study text,
  start_year     integer,
  end_year       integer,
  description    text,
  created_at     timestamp not null default now(),
  constraint education_years_check check (end_year is null or start_year is null or end_year >= start_year)
);
create index education_user_id_idx on public.education(user_id);
alter table public.education enable row level security;
```

# Prompt 4
The preview of the suggestions is like the default browser dropdown and doesn't show the logos. Would it be possible to do it like LinkedIn, where it shows that information, so the options match the aesthetic?

# Response 4
Replaced the browser's `<datalist>` with a custom `Combobox` component following the accessible combobox pattern (WAI-ARIA):
- Glass-styled list showing a logo, name and detail line: companies with their website, schools with province/country, cities with region/country; skills filter instantly with prefix matches first.
- Keyboard: arrow keys move, Enter picks, Esc closes the list without closing the dialog; in chip fields Enter on custom text still adds it.
- The list is rendered as a popover (top layer), so it appears above the dialog without being clipped, and flips above the field when there isn't room below.
- "Remote" is only offered when it matches what's typed.

**Testing**: checked in the browser: "shop" → Shopify / shopify.com with logo, keyboard selection stores the company's domain, "sherb" → Sherbrooke / Quebec, Canada, "py" → Python, pytest, PyTorch, and Esc behaviour inside the dialog.
