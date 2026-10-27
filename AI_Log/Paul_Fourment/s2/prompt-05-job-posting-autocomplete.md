# Job Posting Autocomplete and Recruiter Postings
- **Purpose of AI Use**: Improving the Job Posting with Autocomplete & Detailed Dropdown
- **AI-Suggested Content**: Matching autocomplete feature as done in the Experience seciton for job seekers.
- **Validation**: Tested and worked, with some quirks due to the API being slow
- **Decision**: Accepted and Iterated
- **Reflection**: AI Helped copy an already done feature to make it universal for the webapp.
- **Responsible Person**: Paul Fourment

# Prompt 1
Checking my teammate's branch: for the job posting, can you apply the same APIs we used for profile management to the create job posting form, with company name, location, etc.?

# Response 1
The job posting form now uses the same company and city autocomplete as the profile.
- **Company field**: suggestions with logo and website as you type. Picking one saves the company's website domain with the posting.
- **Location field**: city suggestions, plus "Remote".
- **Logos**: the job list and the posting page show the company's logo next to the title, or its first letter if no suggestion was picked. Existing postings show the letter until edited.
- **Validation**: a malformed domain is dropped and never saved, with a unit test added next to the teammate's existing tests.
- Employment type and work mode already used the shared lists from the profile, so they were left as they were.

**SQL to run in the Supabase SQL Editor**
```sql
alter table public.job_posting add column company_domain text;
```

# Prompt 2
When I hit create, the company is autofilled with "Acme Inc"; it should be empty. And for location, if I enter a city, "Remote" is the only option and is always shown while typing.

# Response 2
- **Company**: a new posting now starts empty (the prefill from the recruiter's profile was removed).
- **Location**:
  - "Remote" only appears when the typed text is the start of it ("r", "rem"), not whenever it contains the same letters.
  - A "Searching…" row shows while the city search is running, instead of an empty or misleading list.
  - Typing "Montr" shows Montreal, Montreal West and Montréal-Est once the search returns.
- The fix is in the shared autocomplete code, so the profile and onboarding location fields get the same behaviour.

**Testing**: checked in the browser on a temporary preview page (since removed). The city search itself still takes about 2.5 seconds on the free Photon service; "Searching…" makes the wait visible.

# Prompt 3
Can we separate YOUR job postings from the general ones?

# Response 3
Recruiters get two tabs on the Jobs page: **All postings** and **Your postings**.
- **Your postings** (`/jobs?mine`) lists only the jobs that recruiter created, newest first, with the heading "Your job postings" and a "Create your first posting" link when empty.
- **Job seekers** see no tabs, only the general list; adding `?mine` to the URL does nothing for them.
- The filter runs on the server. The recruiter card on the home page links to both lists, and after deleting a posting the recruiter lands back on their own list.

# Prompt 4
There should be an Edit button next to it instead of having to click on the posting to view and edit it.

# Response 4
Each posting the recruiter owns now has an **Edit** button on its card, in both tabs, going straight to the editor.
- Only shown on the logged-in recruiter's own postings; other recruiters' postings and job seekers' lists don't show it.
- The rest of the card still opens the posting.
- Screen readers hear which posting each button edits (e.g. "Edit Software Developer Intern").
- Also fixed an existing layout bug: "Create a posting" and "Edit posting" were stretching across the full width because of conflicting width classes. They now sit beside the heading on wider screens and stay full-width on phones.

**Testing**: checked in the browser with sample postings on a temporary preview page (since removed).
