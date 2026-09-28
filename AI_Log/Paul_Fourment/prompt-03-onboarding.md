# First-Login Onboarding (US-16)
- **Purpose of AI Use**: Brainstorming a small second feature for Sprint 1, then code generation for it
- **AI-Suggested Content**: The onboarding modal idea and its user story, a role-specific onboarding modal, save/skip form actions, onboarding columns on the `user` table, location autocomplete using the Photon city search API
- **Validation**: Tested it on an account that hadnt received the onboarding yet
- **Decision**: Accepted / Modified
- **Reflection**: AI helped create a small but meaningful feature for when a user logins for the first time or creates an account
- **Responsible Person**: Paul Fourment

# Prompt 1
For the first sprint we need 2 features and one is the authentication. The other user stories are all a lot more work and I want a small feature I can add a user story for. I was thinking, once you register, you have a modal with an introduction or something? Do not start work yet.

# Response 1
Suggested making the modal do one small job instead of only showing an introduction, so it counts as a real feature (it saves data, depends on the role, and can be tested and demoed):

**First-login onboarding modal**: right after registering, a modal welcomes the user and asks 2 quick questions for their role, which are saved.
- Job seeker: headline and location
- Recruiter: company name and job title
- "Save" or "Skip for now", and it only ever appears once.
- The answers become the start of the profile for US-03, so the work isn't thrown away.

Drafted user story:

> **US-16: First-login onboarding** · Priority: Medium · Sprint: 1
>
> As a new user, I want a quick welcome step after I register so that my account has basic details and I know what to do next.
>
> **Acceptance criteria**
> - [ ] After registering, a welcome modal opens automatically.
> - [ ] Job seekers are asked for a headline and location; recruiters for their company and job title.
> - [ ] The user can save the answers or skip.
> - [ ] The modal never appears again after it has been saved or skipped, including on later logins.
> - [ ] Saved answers are shown on the home page.
>
> **Tasks**
> - **16.1**: Add the onboarding columns to `user` (SQL for Supabase).
> - **16.2**: Build the modal UI (native `<dialog>`, keyboard-accessible, glass style).
> - **16.3**: Add the save and skip form actions.
> - **16.4**: Show the saved answers on the home page and test that the modal only appears once.

# Prompt 2
I've created a new branch feature/login-onboarding, start.

# Response 2
**Database**: the answers are stored on the `user` table next to `role`, so Better Auth includes them with the logged-in user and no extra query is needed.

```sql
-- US-11: onboarding answers + whether the user has been through onboarding
alter table public."user"
  add column headline     text,
  add column location     text,
  add column company      text,
  add column job_title    text,
  add column onboarded_at timestamp;
```

**Files**
- `src/lib/components/OnboardingDialog.svelte`: the modal, built on the native `<dialog>` element (focus stays inside the modal, Esc closes it, dimmed backdrop) in the same glass style as the login pages, with a short entrance animation that is turned off for reduced motion.
- `src/lib/onboarding.ts`: the questions for each role, shared by the modal and the server so they stay in sync.
- `src/routes/+page.server.ts`: `onboard` and `skipOnboarding` actions. The server only accepts the fields for the user's role, requires them, and limits them to 100 characters. Both actions set `onboarded_at`, so the modal never shows again.
- `src/routes/+page.svelte`: opens the modal when `onboarded_at` is empty, otherwise shows the saved answers on the home card.
- `src/lib/server/auth.ts` and `src/lib/server/db/auth.schema.ts`: the new columns. They are marked read-only in Better Auth so they can't be set through the signup API.

**Behaviour**
- Save stores the answers; Skip stores nothing. Both mark the user as onboarded.
- Esc closes the modal for the current visit only; it comes back until the user saves or skips.

**Test steps given**
1. Log in with an account that hasn't been onboarded; the modal appears.
2. Save; the answers show on the home card. Log out and back in; no modal.
3. Register a recruiter and click Skip; the modal closes and doesn't return.

# Prompt 3
Can we make the location field show options and autofill as you type, for all cities?

# Response 3
Added city autocomplete using **Photon**, a free geocoding API built on OpenStreetMap (no API key, callable from the browser).

- `searchCities()` in `src/lib/onboarding.ts` asks Photon for up to 6 cities matching the text and formats them as "City, Province/State, Country".
- Results are biased toward Montréal, so local cities rank first without excluding the rest of the world (e.g. "montr" → Montreal, Montreal West, Montréal-Est).
- In the modal, the search runs once the user has typed 2 letters and paused for 250 ms. An older request is cancelled if the user keeps typing. Results appear in the input's native suggestion list (`<datalist>`), with "Remote" always offered.
- If Photon is unreachable, the field still works as a normal text box.
- The recruiter fields are tagged for browser autofill (`organization`, `organization-title`).

**Testing**: ran the search against the live API: "montr" → Montreal, Quebec, Canada; "tokyo" → Tokyo, Japan; "sao pa" → São Paulo, Brazil; nonsense text → no suggestions.
