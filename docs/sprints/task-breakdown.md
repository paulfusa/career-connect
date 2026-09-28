# Task Breakdown

Each user story is a GitHub Issue, and the tasks below come from each issue's **Tasks** section.
The owner of a user story is responsible for its tasks unless a task lists someone else.

> **Status: PROPOSED.** Assignments and sprints must be confirmed by the team, then set as assignees and labels on each GitHub Issue.

**Legend**
- **Priority:** High / Medium / Low
- **Status:** Completed, In Progress or Not Started

## Summary by Member

| Member | GitHub | User Stories | Sprint 1 Tasks |
|---|---|---|---|
| Paul Fourment | @paulfusa | US-01, US-02, US-16 (done), US-04, US-08 | — |
| Mohamad Alosta | @MAlos616 | US-03, US-06 | T1, T2, T3, T4, T7, T8 |
| Kimia Karimiyeganeh | @kimiakarimiy | US-10, US-11, US-15 | T5 |
| Maher Waez | @Maherwaez01 | US-07, US-09 | T6 |
| Andrew Rowe | @an-rowe54 | US-12, US-13 | T5 |
| Michael Derocher | @MichaelDerocher1551 | US-05, US-14, tests for US-01 and US-02 | T5 |

## Sprint Overview

| Sprint | User Stories |
|---|---|
| Sprint 1 | US-01, US-02, US-16 (demo features) + Sprint 1 documentation tasks T1–T8 |
| Sprint 2 | US-04, US-05, US-08, US-10, US-12 |
| Sprint 3 | US-07, US-11, US-13, US-14, US-15 |
| Sprint 4 | US-03, US-06, US-09 + Generative AI feature |

---

## Sprint 1 Documentation Tasks

| ID | Task | Type | Owner | Priority | Due | Status |
|---|---|---|---|---|---|---|
| T1 | Sprint 1 work plan (backlog, priorities, risks, effort estimation, capacity) | Task | Mohamad | High | Sep 27 | Completed |
| T2 | Detailed log of each team member's contribution | Task | Mohamad | High | Sep 27 | Completed |
| T3 | Team process definition (workflow, branching, PR process, code review, Definition of Ready, Definition of Done) | Task | Mohamad | High | Sep 27 | Completed |
| T4 | README setup instructions and GitHub repo link | Task | Mohamad | High | Sep 27 | Completed |
| T5 | AI Usage Log PDF in `AI_Log/<Name>/` | Task | Everyone | High | Sep 27 | In Progress |
| T6 | "Team-Generated User Stories and Features" section | Task | Maher | High | Sep 27 | Not Started |
| T7 | Meeting minutes folder and cleanup of empty issues #1 and #2 | Task | Mohamad | Low | Sep 27 | In Progress |
| T8 | Sprint 1 submission document (cover page, README, repo link) | Task | Mohamad | High | Sep 27 | Completed |

---

## Sprint 1 - Completed User Stories (Demo)

### US-01: Account registration (#5) · High · Paul · Sprint 1
| Task | Description | Owner | Status |
|---|---|---|---|
| 1.1 | Choose the database/auth approach and design the `users` schema | Paul | Completed |
| 1.2 | Implement the signup form action with server-side validation and password hashing | Paul | Completed |
| 1.3 | Build the registration page UI | Paul | Completed |
| 1.4 | Write tests for valid signup, duplicate email, and weak password | Michael | Not Started (moved to Sprint 2) |

### US-02: Login and logout (#6) · High · Paul · Sprint 1
| Task | Description | Owner | Status |
|---|---|---|---|
| 2.1 | Implement session handling in `hooks.server.ts` | Paul | Completed |
| 2.2 | Build the login page and logout action | Paul | Completed |
| 2.3 | Add route guards for authenticated pages and role-based pages | Paul | In Progress (login guard done, role-based guard pending) |
| 2.4 | Write tests for login success, login failure, and protected-route redirects | Michael | Not Started (moved to Sprint 2) |

### US-16: First-login onboarding (#29) · Medium · Paul · Sprint 1
| Task | Description | Owner | Status |
|---|---|---|---|
| 16.1 | Add the onboarding columns to `user` | Paul | Completed |
| 16.2 | Build the modal UI | Paul | Completed |
| 16.3 | Add the save and skip form actions | Paul | Completed |
| 16.4 | Show saved answers on the home page and test that the modal only appears once | Paul | Completed |

---

## Sprint 2

### US-04: Profile Management (#9) · High · Paul
| Task | Description | Status |
|---|---|---|
| 4.1 | Design a profile database table linked to the user account | Not Started |
| 4.2 | Implement loading and updating the signed-in user's profile | Not Started |
| 4.3 | Build the profile view and edit form | Not Started |
| 4.4 | Test saving, validation, and access control | Not Started |

### US-05: Browse and view job offers (#10) · High · Michael
| Task | Description | Status |
|---|---|---|
| 5.1 | Retrieve published job postings and their application status | Not Started |
| 5.2 | Build the job offers list with a visible status for each job | Not Started |
| 5.3 | Build the job details page | Not Started |
| 5.4 | Calculate and display the acceptance rate if final decisions were made | Not Started |
| 5.5 | Prevent new applications when a job is not Open | Not Started |
| 5.6 | Test open, closed, unpublished, and no-decision cases | Not Started |

### US-08: Account email verification (#13) · High · Paul
| Task | Description | Status |
|---|---|---|
| 8.1 | Send a verification email after registration | Not Started |
| 8.2 | Store whether the user's email is verified | Not Started |
| 8.3 | Block application access for unverified users | Not Started |
| 8.4 | Allow verification links to activate accounts | Not Started |
| 8.5 | Add a resend verification option | Not Started |
| 8.6 | Test verified and unverified account access | Not Started |

### US-10: Resume Upload (#15) · High · Kimia
| Task | Description | Status |
|---|---|---|
| 10.1 | Create resume database/storage model | Not Started |
| 10.2 | Implement resume upload API | Not Started |
| 10.3 | Build resume upload UI | Not Started |
| 10.4 | Validate file type and size | Not Started |

### US-12: Recruiter Job Posting Creation (#17) · High · Andrew
| Task | Description | Status |
|---|---|---|
| 12.1 | Design job posting schema | Not Started |
| 12.2 | Build job creation form | Not Started |
| 12.3 | Create backend API | Not Started |
| 12.4 | Add input validation | Not Started |

---

## Sprint 3

### US-07: Recruiter company profile (#12) · High · Maher
| Task | Description | Status |
|---|---|---|
| 7.1 | Create a company profile table | Not Started |
| 7.2 | Build a company profile form | Not Started |
| 7.3 | Add edit functionality | Not Started |
| 7.4 | Display company details on job postings | Not Started |
| 7.5 | Test recruiter permissions | Not Started |

### US-11: Resume Management (#16) · High · Kimia
| Task | Description | Status |
|---|---|---|
| 11.1 | Create resume list page | Not Started |
| 11.2 | Implement resume replacement feature | Not Started |
| 11.3 | Implement resume deletion feature | Not Started |
| 11.4 | Add confirmation dialog for deletion | Not Started |

### US-13: Recruiter Job Posting Management (#18) · High · Andrew
| Task | Description | Status |
|---|---|---|
| 13.1 | Implement edit functionality | Not Started |
| 13.2 | Implement delete functionality | Not Started |
| 13.3 | Add authorization checks | Not Started |
| 13.4 | Write tests | Not Started |

### US-14: Job Search Filters (#19) · Low · Michael
| Task | Description | Status |
|---|---|---|
| 14.1 | Implement search API | Not Started |
| 14.2 | Add filter UI components | Not Started |
| 14.3 | Create database queries | Not Started |
| 14.4 | Write integration tests | Not Started |

### US-15: Apply for a Job (#20) · High · Kimia
| Task | Description | Status |
|---|---|---|
| 15.1 | Create application model | Not Started |
| 15.2 | Implement apply button workflow | Not Started |
| 15.3 | Link resumes to applications | Not Started |
| 15.4 | Create success notification | Not Started |

---

## Sprint 4

### US-03: Clear Application Outcome Message (#8) · Medium · Mohamad
| Task | Description | Status |
|---|---|---|
| 3.1 | Design and store outcome messages linked to applications | Not Started |
| 3.2 | Build the offer/rejection form with a mandatory recruiter explanation | Not Started |
| 3.3 | Display the message and notification to the applicant | Not Started |
| 3.4 | Add a reminder for recruiters to respond to pending applications | Not Started |
| 3.5 | Test authorization, matching status, and delivery | Not Started |

### US-06: Submit feature suggestion (#11) · Low · Mohamad
| Task | Description | Status |
|---|---|---|
| 6.1 | Create a form for suggested features | Not Started |
| 6.2 | Store each suggestion with its submission date and user | Not Started |
| 6.3 | Show confirmation after submission | Not Started |
| 6.4 | Create a way for the team to review suggestions | Not Started |
| 6.5 | Test form validation and access permissions | Not Started |

### US-09: Company reviews (#14) · Low · Maher
| Task | Description | Status |
|---|---|---|
| 9.1 | Create a company reviews table | Not Started |
| 9.2 | Create a form for submitting reviews | Not Started |
| 9.3 | Display reviews on the company page | Not Started |
| 9.4 | Calculate and display the average rating | Not Started |
| 9.5 | Allow users to edit or delete their own reviews | Not Started |
| 9.6 | Test review submission, ownership, and validation | Not Started |

---

## Dependencies
- **US-05** (browse jobs) and **US-14** (search) need **US-12** (job postings) first.
- **US-15** (apply) needs **US-10** (resume upload) and **US-12**.
- **US-03** (outcome messages) needs **US-15** (applications).
- **US-09** (company reviews) needs **US-07** (company profile).
- **US-04** (profile) builds on **US-16** (onboarding fields).
