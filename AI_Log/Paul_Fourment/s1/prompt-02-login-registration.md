# Login, Registration & Logout (US-01, US-02)
- **Purpose of AI Use**: Code generation for the authentication flow 
- **AI-Suggested Content**: Login and registration pages, shared glass-style layout component, a `role` column on the `user` table, a route guard in `hooks.server.ts`, logout action, SQL to run on Supabase
- **Validation**: rested the pages in the browser, wrong-password error message, protected route redirect to `/login`, role selector
- **Decision**: Accepted / Modified
- **Reflection**: AI helped create the login/registration pages, and the DB layout for the accounts store.
- **Responsible Person**: Paul Fourment

# Prompt 1
I have started this project, and added a prompt log for the User Stories example in the docs. I have connected the database to Supabase. I'd like to build the login log out system. Let's start by making a login page, use clean modern glassy smooth UI design.

(*Sprint 1 PDF attached*)

# Response 1
Built on the Better Auth setup that was already in the project.

**Design direction**: a frosted-glass card over soft, slowly drifting "morning light" (peach, sky and lilac blurred shapes) on a light mist background, with a teal accent for the main action. Fonts: Bricolage Grotesque for headings, Hanken Grotesk for body text. Motion is limited to the background drift and the card's entrance, and both are turned off for users with reduced motion enabled.

**Files**
- `src/routes/login/+page.server.ts`: form action calling `auth.api.signInEmail`. Wrong credentials always return the same generic message ("Email or password is incorrect.") as required by US-02. Already logged-in users are redirected to `/`.
- `src/routes/login/+page.svelte`: email and password fields, a Show/Hide password toggle, a "Logging in…" state on the button, and the email kept filled in after a failed attempt.
- `src/routes/layout.css` and `src/app.html`: colour and font tokens shared by future pages.

**Testing**: `svelte-check` passed. In the browser, a wrong password showed the generic error and the password field was cleared.

# Prompt 2
Let's do registration and all that. Anything DB related, give me here and tell me what to do on Supabase, I'll do it manually.

# Response 2
Covers the rest of US-01 (registration with a role) and US-02 (logout and protected routes).

**Registration** (`src/routes/register/`)
- Fields: role ("Find a job" / "Hire people"), full name, email, password (at least 8 characters).
- The form is validated on the server; clear errors are shown, including for an email that's already registered.
- The user is logged in automatically after signing up.

**Role**
- Added as an extra user field in Better Auth (`src/lib/server/auth.ts`) and as a column in the Drizzle schema (`src/lib/server/db/auth.schema.ts`), with a database check constraint so only `job_seeker` or `recruiter` can be stored.

**Protected routes** (`src/hooks.server.ts`)
- Only `/login`, `/register` and Better Auth's `/api/auth` endpoints are public. Every other page redirects logged-out users to `/login`.

**Logout**
- The home page shows the user's name and role, with a Log out button that ends the session and returns to `/login`. This is a placeholder until the profile/dashboard stories are done.

**Refactor**
- The glass layout and the password field were moved into `src/lib/components/AuthShell.svelte` and `PasswordField.svelte` so the login and register pages share them.
- Removed the starter `src/routes/demo` pages, which duplicated the real login.

**SQL to run in the Supabase SQL Editor**
```sql
-- US-01: every user is a job seeker or a recruiter
alter table public."user"
  add column role text not null default 'job_seeker'
  constraint user_role_check check (role in ('job_seeker', 'recruiter'));
alter table public."user" alter column role drop default;

-- Keep auth tables away from Supabase's public Data API.
-- The app connects as the postgres role, which bypasses RLS, so nothing breaks.
alter table public."user"       enable row level security;
alter table public.session      enable row level security;
alter table public.account      enable row level security;
alter table public.verification enable row level security;
```
The second part is a security fix. Supabase exposes every table in the `public` schema through its web API. Without Row Level Security, anyone with the public key could read the `account` table, which stores password hashes.

**Test steps given**
1. Restart the dev server.
2. Register an account at `/register`; you should land on the home page with your name.
3. Log out; you should be on `/login`, and visiting `/` should redirect back there.
4. Log in again with the same account.
