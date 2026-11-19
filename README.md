# Career Connect
[![CI/CD](https://github.com/paulfusa/career-connect/actions/workflows/ci.yml/badge.svg)](https://github.com/paulfusa/career-connect/actions/workflows/ci.yml) [![CodeQL](https://github.com/paulfusa/career-connect/actions/workflows/codeql.yml/badge.svg)](https://github.com/paulfusa/career-connect/actions/workflows/codeql.yml)

Project for **SOEN 341 LAB FM** - *Fall 2026*  

**GitHub Repository:** https://github.com/paulfusa/career-connect

**Authors** 
| Name | ID | 
|---|---|
| Paul Fourment | 40306274 |
| Mohamad Alosta | 40312377 |
| Michael Derocher | 40308662 |
| Kimia Karimiyeganeh | 40068588  |
| Andrew Rowe (dropped the course) | 40276263 |
| Maher Waez | 40248191 |

## Project description 
CareerConnect is a web application designed to connect job seekers and recruiters. It allows both to manage the hiring process in a single place. Job seekers will have the ability to create their own profile, manage their resumes, browse for job postings, save their favorite opportunities to dive into later, submit applications, follow the application's status, and more. Recruiters, on the other hand, will be able to publish openings, review applications, and update decision status and communicate outcomes with applicants.

The project aims to make applying easier by keeping everything organized and clear. Its outcome-message feature tries to cut down on "ghosting" by companies, so applicants get real feedback and a way to improve. They get a clear explanation of either how to move on to the next step or how to improve their applications. We also added a generative AI feature that reviews resumes and fills in profiles from them, and we log how we use AI during development in `AI_Log/`.

## Problem and Proposed Solution
Job seekers often try to get opportunities throughout websites, emails, and personal documents. That makes it hard to stay organized and remember where each application stands. Recruiters also need a way to post openings and respond to applications.

CareerConnect aims to gather all this into one platform that tries to satisfy both user ends. In doing so, the hiring process will get easier as more features will be addressed in later stages.

# Setup
## Dependencies
- **Node.js**: v22 or higher
- **pnpm**: v9 or higher
1. Clone the repository: `git clone https://github.com/paulfusa/career-connect.git`
2. In Project Terminal, run `pnpm install` to install the Node dependencies.
3. Duplicate the `.env.example` and rename to `.env`, and paste the required keys.
4. Optional: to use the AI features (resume review and profile autofill), follow [docs/ai-setup.md](docs/ai-setup.md). It works with a free local model (Ollama) or a free hosted tier (Gemini, Groq).

## Run Dev
The team shares one Supabase database, so changes to the database go through a pull request first and are then run in the Supabase SQL editor. Only use `pnpm db:push` on a database of your own.

### VS Code
- Go to **Run and Debug** and choose `Web`

### Individual
- Start the Web Server `pnpm run dev`

Then open http://localhost:5173 in your browser.

# Testing
Run the linter with `pnpm lint`, the type check with `pnpm check`, the automated tests with `pnpm test`, and the tests with a coverage report with `pnpm test:coverage`.

Our CI/CD pipeline on GitHub Actions runs all of these, plus CodeQL static analysis and a production build, on every pull request, and publishes the built app on every merge to main. See [CI/CD pipeline](docs/ci-cd.md).

Acceptance tests are GitHub issues with the `Acceptance Test` label, linked to the user story they test.

# Current Sprint 3 Scope
Sprint 3 runs from October 27 to November 16, 2026. The status of each story is in the [Sprint 3 plan](docs/sprints/sprint-3.md).
- US-24: Resume AI autofill and review (our generative AI feature)
- US-25: Application analytics and history dashboard
- US-26: Notifications and reminders
- US-27: Job offer emails
- US-28: Job filter additions
- US-19: Recruiters and job seekers can follow each other
- US-21: Dark mode
- US-30: Archive postings and filter applications

Completed in Sprint 1: US-01 (account registration), US-02 (login and logout), US-16 (first-login onboarding) and US-04 (profile management).

Completed in Sprint 2: US-08 (email verification), US-17 (forgot password), US-10 and US-11 (resumes), US-12 and US-13 (job postings), US-05 (browsing jobs), US-14 (job search), US-15 (applying for a job), US-20 (application status), US-07 (company profiles) and US-03 (outcome messages).

# Implemented So Far
- Signing up, email verification, logging in and out, resetting a forgotten password, and a first-login setup.
- Job seeker profiles.
- Uploading, replacing, deleting and viewing resumes.
- Recruiters can create, edit and delete job postings, with company and city suggestions as they type.
- A job list with Open, Closed and Draft badges, and a details page with the requirements, deadline, salary and acceptance rate.
- Searching jobs by keyword, company or location, and filtering by employment type and work mode.
- More job filters: minimum salary, date posted and open jobs only, sorting by the closest deadline or the highest salary, and company and city suggestions while typing.
- Company profiles, shown on each recruiter's postings.
- Applying to a job with one of your resumes, and withdrawing before the deadline.
- A page where recruiters see who applied to each posting and open their resumes.
- Recruiters can archive old postings and bring them back later, see how many applications each posting has, and filter applicants by status or date. Job seekers don't see archived postings.
- Offer and rejection messages with the recruiter's reasons and next steps, plus reminders when an application waits too long.
- Application statuses: recruiters can mark an application Under Review or Interview, and job seekers see every status on My Applications.
- An application history page for job seekers, with a breakdown by status and a chart of the applications they sent over time.
- A notification bell with an unread count and an inbox. Recruiters hear about new applications, and job seekers about status changes, interviews, offers and rejections.
- Deadline reminders for recruiters, as a separate job that is off by default (see [docs/deadline-reminders.md](docs/deadline-reminders.md)).
- An email to the applicant when a recruiter sends an offer, with a link to see it on CareerConnect.
- AI resume review and profile autofill on the Resumes page.
- Dark mode: pick Light, Dark or System on the Settings page, and the choice is remembered in the browser.
- Following: job seekers and recruiters can follow each other and find people on the Recruiters / Job seekers page, and job seekers can show only the jobs of people they follow. Job postings and the applicants list show a profile photo that links to the person's profile.

# Still to Do
- Putting the reminders for applications that waited too long into the notification inbox. Right now recruiters only see them on the applicants page.
- Finishing the AI feature in Sprint 4.
- Not planned yet: recruiter verification (US-18), messaging (US-22), searching job seekers as a recruiter (US-23), company reviews (US-09), feature suggestions (US-06) and a personalized home dashboard (US-29), which Maher already started.

# Technologies
The repository is set up with SvelteKit, Svelte, TypeScript, Tailwind CSS, PostgreSQL on Supabase, Drizzle ORM, Better Auth, and pnpm. Emails are sent with Resend, and the AI features work with any OpenAI-compatible model, like Ollama on your own computer or Google Gemini. GitHub Actions runs our CI pipeline.

# Project documentation
- [Sprint 1 plan](docs/sprints/sprint-1.md)
- [Sprint 2 plan](docs/sprints/sprint-2.md)
- [Sprint 3 plan](docs/sprints/sprint-3.md)
- [Task breakdown](docs/sprints/task-breakdown.md)
- [Sprint 1 contribution log](docs/sprints/sprint-1-contributions.md)
- [Sprint 2 contribution log](docs/sprints/sprint-2-contributions.md)
- [Sprint 3 contribution log](docs/sprints/sprint-3-contributions.md)
- [Team process](docs/process/team-process.md)
- [Team-generated user stories](docs/user-stories/team-generated-stories.md)
- [Meeting minutes](docs/meeting-minutes/)
- [Sprint submissions and summary reports](docs/submissions/)
- [AI setup](docs/ai-setup.md)
- [Deadline reminders](docs/deadline-reminders.md)
- [Demo data](docs/seed-data.md)
- [CI/CD pipeline](docs/ci-cd.md)
- [AI usage logs](AI_Log/)
- User stories and acceptance tests: GitHub Issues
