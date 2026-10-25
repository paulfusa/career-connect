# Task Breakdown

Every user story is a GitHub issue, and the tasks below are copied from its **Tasks** section.
Whoever owns a story owns its tasks, unless a task names someone else.

**Legend**
- **Priority:** High / Medium / Low
- **Status:** Completed, In Review, In Progress or Not Started

## Summary by Member

| Member | GitHub | Sprint 1 Stories | Sprint 2 Stories | Sprint 1 Tasks | Sprint 2 Tasks |
|---|---|---|---|---|---|
| Paul Fourment | @paulfusa | US-01, US-02, US-16, US-04 | US-10, US-11, Generative AI feature (#91) | T4, T5 | T12, T14 |
| Mohamad Alosta | @MAlos616 | - | US-03, US-05, US-14, US-15 (15.1) | T1, T2, T3, T4, T5, T6, T7, T8 | T9, T10, T11, T12, T13, T14, T15, T16 |
| Kimia Karimiyeganeh | @kimiakarimiy | - | US-20 | T5 | T12, T14 |
| Maher Waez | @Maherwaez01 | - | US-07, US-08, US-17, US-15 (15.2 to 15.5) | T5 | T12, T14 |
| Andrew Rowe (dropped the course) | @an-rowe54 | - | - | T5 | - |
| Michael Derocher | @MichaelDerocher1551 | - | US-12, US-13 | T5 | T12, T14 |

Some stories changed hands during Sprint 2. US-05 and US-14 went from Michael to Mohamad, US-12 and US-13 from Andrew to Michael, and US-10 and US-11 from Kimia to Paul. US-15 was split: Mohamad built the application table (15.1) and Maher built the rest (15.2 to 15.5), including the job seeker side that Michael was first assigned. Andrew Rowe dropped the course during Sprint 2, and Maher took over US-21.

Not planned for a sprint yet: US-06 (Mohamad), US-09 (Maher), US-19 (Kimia), US-21 (Maher), US-22 (Paul) and US-23 (Michael).

## Sprint 1 Documentation Tasks

| ID | Task | Type | Owner | Priority | Due | Status |
|---|---|---|---|---|---|---|
| T1 | Sprint 1 work plan (backlog, priorities, risks, effort estimation, capacity) | Task | Mohamad | High | Sep 27 | Completed |
| T2 | Detailed log of each team member's contribution | Task | Mohamad | High | Sep 27 | Completed |
| T3 | Team process definition (workflow, branching, PR process, code review, Definition of Ready, Definition of Done) | Task | Mohamad | High | Sep 27 | Completed |
| T4 | README setup instructions and GitHub repo link | Task | Mohamad and Paul | High | Sep 28 | Completed |
| T5 | AI Usage Log PDF in `AI_Log/<Name>/` | Task | Everyone | High | Sep 27 | Completed |
| T6 | "Team-Generated-stories" section | Task | Mohamad | High | Sep 28 | Completed |
| T7 | Meeting minutes folder and cleanup of empty issues #2 | Task | Mohamad | Low | Sep 27 | Completed |
| T8 | Sprint 1 submission document (cover page, README, repo link) | Task | Mohamad | High | Sep 27 | Completed |

## Sprint 1 - Completed User Stories (Demo)

Each heading is written as **Title - Priority - Assignee - Sprint**.

### US-01: Account registration (#5) - High - Paul - Sprint 1
| Task | Description | Owner | Status |
|---|---|---|---|
| 1.1 | Choose the database/auth approach and design the `users` schema (id, email, password hash, role, created_at) | Paul | Completed |
| 1.2 | Implement the signup endpoint/form action with server-side validation and password hashing | Paul | Completed |
| 1.3 | Build the registration page UI in SvelteKit with client-side validation | Paul | Completed |
| 1.4 | Write tests for valid signup, duplicate email, and weak password | Paul | Completed |

### US-02: Login and logout (#6) - High - Paul - Sprint 1
| Task | Description | Owner | Status |
|---|---|---|---|
| 2.1 | Implement session handling (e.g. in `hooks.server.ts`) | Paul | Completed |
| 2.2 | Build the login page and logout action | Paul | Completed |
| 2.3 | Add route guards for authenticated pages and role-based pages | Paul | Completed |
| 2.4 | Write tests for login success, login failure, and protected-route redirects | Paul | Completed |

### US-16: First-login onboarding (#29) - Medium - Paul - Sprint 1
| Task | Description | Owner | Status |
|---|---|---|---|
| 16.1 | Add the onboarding columns to user (SQL for Supabase) | Paul | Completed |
| 16.2 | Build the modal UI (native `<dialog>`, keyboard-accessible, glass style) | Paul | Completed |
| 16.3 | Add the save and skip form actions | Paul | Completed |
| 16.4 | Show the saved answers on the home page and test that the modal only appears once | Paul | Completed |

### US-04: Profile Management (#9) - High - Paul - Sprint 1
| Task | Description | Owner | Status |
|---|---|---|---|
| 4.1 | Design a profile database table linked to the user account | Paul | Completed |
| 4.2 | Implement loading and updating the signed-in user’s profile | Paul | Completed |
| 4.3 | Build the profile view and edit form | Paul | Completed |
| 4.4 | Test saving, validation, and access control | Paul | Completed |

## Sprint 2 Documentation and Setup Tasks

| ID | Task | Type | Owner | Priority | Due | Status |
|---|---|---|---|---|---|---|
| T9 | Sprint 2 meeting minutes, October 1 (#83) | Task | Mohamad | Medium | Oct 2 | Completed |
| T10 | Sprint 2 meeting minutes, October 8 (#94) | Task | Mohamad | Medium | Oct 9 | Completed |
| T11 | CI pipeline that runs the type check and tests on every PR (#102) | Task | Mohamad | High | Oct 15 | Completed |
| T12 | Acceptance tests, at least two per Sprint 1 and Sprint 2 user story (#103) | Task | Everyone | High | Oct 22 | In Progress |
| T13 | Sprint 2 plan, task breakdown and contribution log (#104) | Task | Mohamad | High | Oct 24 | In Progress |
| T14 | Sprint 2 AI usage logs (#105) | Task | Everyone | High | Oct 25 | In Progress |
| T15 | Sprint 2 summary report (#106) | Task | Mohamad | High | Oct 25 | In Progress |
| T16 | Sprint 2 meeting minutes, October 22 (#120) | Task | Mohamad | Medium | Oct 23 | Completed |

## Sprint 2 - User Stories

Each heading is written as **Title - Priority - Assignee - Sprint**.

### US-08: Account email verification (#13) - High - Maher - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 8.1 | Send a verification email after registration | Maher | Completed |
| 8.2 | Store whether the user's email is verified | Maher | Completed |
| 8.3 | Block application access for unverified users | Maher | Completed |
| 8.4 | Allow verification links to activate accounts | Maher | Completed |
| 8.5 | Add a resend verification option | Maher | Completed |
| 8.6 | Test verified and unverified accounts access | Maher | Completed |

### US-10: Resume Upload (#15) - High - Paul - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 10.1 | Create resume database/storage model | Paul | Completed |
| 10.2 | Implement resume upload API | Paul | Completed |
| 10.3 | Build resume upload UI | Paul | Completed |
| 10.4 | Validate file type and size | Paul | Completed |

### US-11: Resume Management (#16) - High - Paul - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 11.1 | Create resume list page | Paul | Completed |
| 11.2 | Implement resume replacement feature | Paul | Completed |
| 11.3 | Implement resume deletion feature | Paul | Completed |
| 11.4 | Add confirmation dialog for deletion | Paul | Completed |

### US-12: Recruiter Job Posting Creation (#17) - High - Michael - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 12.1 | Design job posting schema | Michael | Completed |
| 12.2 | Build job creation form | Michael | Completed |
| 12.3 | Create backend API | Michael | Completed |
| 12.4 | Add input validation | Michael | Completed |

### US-13: Recruiter Job Posting Management (#18) - High - Michael - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 13.1 | Implement edit functionality | Michael | Completed |
| 13.2 | Implement delete functionality | Michael | Completed |
| 13.3 | Add authorization checks | Michael | Completed |
| 13.4 | Write tests | Michael | Completed |

### US-17: Forgot password (#90) - Medium - Maher - Sprint 2
Done in PR #96: the forgot-password and reset-password pages, the email with the reset code, and tests. The issue doesn't have separate tasks yet.

### US-05: Browse and view job offers (#10) - High - Mohamad - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 5.1 | Retrieve published job postings and their application status | Mohamad | Completed |
| 5.2 | Build the job offers list with a visible status for each job | Mohamad | Completed |
| 5.3 | Build the job details page | Mohamad | Completed |
| 5.4 | Calculate and display the acceptance rate if final application decisions were made | Mohamad | Completed |
| 5.5 | Prevent new applications when a job is not Open | Mohamad | Completed |
| 5.6 | Test open, closed, unpublished, and no decision taken features | Mohamad | Completed |

Status: Completed. Most of it went in with PR #100 on October 17, and the acceptance rate (5.4) came later with US-03 in PR #123. Acceptance tests: #108, #109.

### US-14: Job Search Filters (#19) - High - Mohamad - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 14.1 | Implement search API | Mohamad | Completed |
| 14.2 | Add filter UI components | Mohamad | Completed |
| 14.3 | Create database queries | Mohamad | Completed |
| 14.4 | Write integration tests | Mohamad | Completed (unit tests and acceptance tests #110, #111) |

Status: Completed, merged on October 17 in PR #116. Acceptance tests: #110, #111.

### US-15: Apply for a Job (#20) - High - Mohamad, Maher - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 15.1 | Create application model | Mohamad | Completed |
| 15.2 | Implement apply button workflow | Maher | Completed |
| 15.3 | Link resumes to applications | Maher | Completed |
| 15.4 | Create success notification | Maher | Completed |
| 15.5 | Display applications to the recruiter who owns the posting, with links to the applicants' resumes | Maher | Completed |

Status: Completed. Maher's PR #118 was merged on October 22. After testing it, Mohamad fixed the success message, blocked applying after the deadline and added the withdraw messages (PR #123).

### US-20: Application Status Tracking (#107) - High - Kimia - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 20.1 | Add a status column to the application table, starting at Applied | Kimia | Completed |
| 20.2 | Add a status control to the recruiter's list of applications for a posting | Kimia | Completed |
| 20.3 | Allow only the recruiter who owns the posting to change the status | Kimia | Completed |
| 20.4 | Build the job seeker's "My applications" page | Kimia | Completed |
| 20.5 | Test status changes, permissions, and the My applications page | Kimia | Completed |

Status: Completed with PR #122 on October 25. Offered and Rejected are set by US-03 when the recruiter sends a decision (PR #123).

### US-07: Recruiter company profile (#12) - High - Maher - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 7.1 | Create a company profile table | Maher | Completed |
| 7.2 | build a company profile form | Maher | Completed |
| 7.3 | Add edit functionality | Maher | Completed |
| 7.4 | Display company details on job postings | Maher | Completed |
| 7.5 | Test recruiter permissions | Maher | Completed |

### US-03: Clear Application Outcome Message (#8) - High - Mohamad - Sprint 2
| Task | Description | Owner | Status |
|---|---|---|---|
| 3.1 | Design and store outcome messages linked to applications | Mohamad | Completed |
| 3.2 | Build the offer or rejection form that displays a mandatory detailed response from the recruiter | Mohamad | Completed |
| 3.3 | Display the message and notification to the applicant | Mohamad | Completed |
| 3.4 | Add a reminder to remind recruiters to respond to pending applications | Mohamad | Completed |
| 3.5 | Test authorization, matching status, and delivery features | Mohamad | Completed |

Status: Completed in PR #123.

### US-18: Recruiter Verification and Approval (#97) - Medium - Maher - Sprint 3
| Task | Description | Owner | Status |
|---|---|---|---|
| 18.1 | Create a database table to store recruiter verification requests and their status | Maher | Not Started |
| 18.2 | Add a Request Verification button to recruiter profiles | Maher | Not Started |
| 18.3 | Create an admin-only Verification Requests section with a pending request counter | Maher | Not Started |
| 18.4 | Allow admins to open and review recruiter profiles from the requests list | Maher | Not Started |
| 18.5 | Implement Approve and Reject functionality with appropriate access restrictions | Maher | Not Started |
| 18.6 | Display a blue verified badge on approved recruiter profiles | Maher | Not Started |

Status: Postponed. It was the story we said we'd drop first if we ran out of time, and Maher will build it in Sprint 3.
| 18.7 | Allow recruiters to view their status and resubmit rejected requests | Maher | Not Started |
| 18.8 | Test verification requests, approval, rejection, database updates, and authorization | Maher | Not Started |

### Generative AI feature: Resume AI autofill and review (#91) - High - Paul - Sprint 2
Being built on the `feature/ai-resume` branch. The issue doesn't have separate tasks yet.

## Not Planned Yet - Remaining User Stories

These stories are in the backlog but haven't been planned for a sprint yet. Their tasks come from each GitHub issue.

### US-06: Submit feature suggestion (#11) - Low - Mohamad - Not planned yet
| Task | Description | Owner | Status |
|---|---|---|---|
| 6.1 | Create a form for suggested features | Mohamad | Not Started |
| 6.2 | Store each suggestion with its submission date and user | Mohamad | Not Started |
| 6.3 | Show confirmation after submission | Mohamad | Not Started |
| 6.4 | Create a way for the team to review suggestions | Mohamad | Not Started |
| 6.5 | Test form validation and permission for accessing submitted suggestions | Mohamad | Not Started |

### US-09: Company reviews (#14) - Low - Maher - Not planned yet
| Task | Description | Owner | Status |
|---|---|---|---|
| 9.1 | Create a company reviews table in the database | Maher | Not Started |
| 9.2 | Create a form for submitting reviews | Maher | Not Started |
| 9.3 | Display reviews on the company page | Maher | Not Started |
| 9.4 | Calculate and display the average rating | Maher | Not Started |
| 9.5 | Allow users to edit or delete their own reviews | Maher | Not Started |
| 9.6 | Test review submission, ownership, and validation | Maher | Not Started |

### US-19: Recruiters And Job Seekers can Follow Eachother (#80) - Low - Kimia - Not planned yet
| Task | Description | Owner | Status |
|---|---|---|---|
| 19.1 | Create a follow table (follower, followed user, date) | Kimia | Not Started |
| 19.2 | Add the Follow / Unfollow button to profile pages | Kimia | Not Started |
| 19.3 | Build the Following page | Kimia | Not Started |
| 19.4 | Add a "From people I follow" filter to the job list | Kimia | Not Started |
| 19.5 | Test following, unfollowing, and the duplicate and self-follow rules | Kimia | Not Started |

### US-21: Dark Mode (#82) - Low - Maher - Not planned yet
| Task | Description | Owner | Status |
|---|---|---|---|
| 21.1 | Define dark versions of the app's colours | Maher | Not Started |
| 21.2 | Add the theme toggle to the navigation bar | Maher | Not Started |
| 21.3 | Save the user's choice and apply it when a page loads | Maher | Not Started |
| 21.4 | Check every page in both themes for readability | Maher | Not Started |

### US-22: Messaging between Job Seekers & Recruiters (#81) - Low - Paul - Not planned yet
| Task | Description | Owner | Status |
|---|---|---|---|
| 22.1 | Create the conversation and message tables | Paul | Not Started |
| 22.2 | Build the inbox page | Paul | Not Started |
| 22.3 | Build the conversation page with a send form | Paul | Not Started |
| 22.4 | Restrict conversations to their two participants | Paul | Not Started |
| 22.5 | Test sending, privacy, the unread marker, and validation | Paul | Not Started |

### US-23: Search Job Seekers as Recruiter (#79) - Low - Michael - Not planned yet
| Task | Description | Owner | Status |
|---|---|---|---|
| 23.1 | Write the search query over job seeker profiles | Michael | Not Started |
| 23.2 | Build the candidate search page and form | Michael | Not Started |
| 23.3 | Restrict the page to recruiters | Michael | Not Started |
| 23.4 | Test the filters, the Open to work rule, and access control | Michael | Not Started |
