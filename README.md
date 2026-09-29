# Career Connect
Project for **SOEN 341 LAB FM** - *Fall 2026*  

**GitHub Repository:** https://github.com/paulfusa/career-connect

**Authors** 
| Name | ID | 
|---|---|
| Paul Fourment | 40306274 |
| Mohamad Alosta | 40312377 |
| Michael Derocher | 40308662 |
| Kimia Karimiyeganeh | 40068588  |
| Andrew Rowe | 40276263 |
| Maher Waez | 40248191 |

## Project description 
CareerConnect is a web application designed to connect job seekers and recruiters. It allows both to manage the hiring process in a single place. Job seekers will have the ability to create their own profile, manage their resumes, browse for job postings, save their favorite opportunities to dive into later, submit applications, follow the application's status, and more. Recruiters, on the other hand, will be able to publish openings, review applications, and update decision status and communicate outcomes with applicants.

The project aims to ease the application process organizing it and making it more transparent. Its proposed outcome-message feature tries to diminish the "ghosting" phenomenon that is practiced by many companies, and allows the applicants to receive genuine feedback and a way to improve. This provides clear and precise explanations to either move onto the next step of the process or to ameliorate their applications. The team will also implement generative AI features, and will define and document its usage throughout the developmental procedure.

## Problem and Proposed Solution
Job seekers often try to get opportunities throughout websites, emails, and personal documents. This poses some difficulty in terms of organizing and remembering the status of each application. Recruiters also need a way to post openings and respond to applications.

CareerConnect aims to gather all this into one platform that tries to satisfy both user ends. In doing so, the hiring process will get easier as more features will be addressed in later stages.

# Setup
## Dependencies
- **Node.js**: v22 or higher
- **pnpm**: v9 or higher
1. Clone the repository: `git clone https://github.com/paulfusa/career-connect.git`
2. In Project Terminal, run `pnpm install` to install the Node dependencies,
3. Duplicate the `.env.example` and rename to `.env`, and paste the required keys.

## Run Dev
### VS Code
- Go to **Run and Debug** and choose `Web`

### Individual
- Start the Web Server `pnpm run dev`

Then open http://localhost:5173 in your browser.

# Testing
Run the automated tests with `pnpm test`.

# Current Sprint 1 Scope
- US-01: Account registration
- US-02: Login and logout
- US-16: First-login onboarding
- US-04: Profile management

# Planned Features

## Job-seeker and account features:
- Account registration, email verification, login/logout.
- Job seeker profile creation and management.
- Resume upload and update/edit.
- Job search, monitoring job application status, and job acceptance rate.
- Job browsing filters and application submission.
- History tracking

## Recruiter/Company Features:
- Recruiter company profiles and descriptions.
- Job posting creation and management.
- Application review and status updates.
- Company reviews that users can read and submit.

## Additional Ideas:
- **Clear application outcomes:** Recruiters can send an offer with details on how to proceed or a rejection with a recruiter-made feedback on how to improve applications.
- **Feature suggestions:** Users can send feature suggestions to improve the workflow and provide benefits to explain to the team the reason for implementing them.

**The generative AI feature being considered by the team:** AI-assisted resume feedback that provides suggestion on how to improve resume's clarity and relevance. The team still has to review and confirm the chosen AI feature.

# Technologies
The repository is set up with SvelteKit, Svelte, TypeScript, PostgreSQL, Drizzle ORM, Better Auth, and pnpm.

# Project documentation
- [Sprint 1 plan](docs/sprints/sprint-1.md)
- [Task breakdown](docs/sprints/task-breakdown.md)
- [Contribution log](docs/sprints/sprint-1-contributions.md)
- [Team process](docs/process/team-process.md)
- [Team-generated user stories](docs/user-stories/team-generated-stories.md)
- [Meeting minutes](docs/meeting-minutes/)
- [AI usage logs](AI_Log/)
- User stories: GitHub Issues
