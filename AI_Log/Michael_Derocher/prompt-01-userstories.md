# Title
Generate Additional User Stories

# Purpose of AI Use
Brainstorming and backlog refinement to identify missing user stories for CareerConnect.

# AI-Suggested Content

The AI suggested additional user stories including:

- Resume Upload
- Resume Management
- Recruiter Job Posting Creation
- Recruiter Job Posting Management
- Job Search Filters
- Apply for a Job
- Application Status Tracking
- Saved Jobs
- Recruiter View Applicants
- AI Resume Feedback
- AI Interview Preparation Assistant

It also provided acceptance criteria and implementation tasks for each story.

# Validation

The generated stories were compared against the project requirements and reviewed by the team to ensure coverage of key features such as resume management, job applications, application tracking, recruiter tools, and AI functionality.

# Decision

Not all suggestions were made into actual github issues, though they may still be added at a later time.

# Reflection

The AI helped identify missing features and accelerated backlog creation. The team refined several stories to better fit project scope and Sprint priorities.

# Responsible Person

Michael Derocher

# Prompt

Given the attached CareerConnect project specifications as well as screenshots of the current GitHub issues/user stories our team has created, provide additional user stories that we will need to implement for our project. There is also an example of what our user stories look like.

(Screenshots and examples of our existing user sotries were included, as well as the project specifications.)

# Full Response
Based on the project specification for **CareerConnect** and the user stories already visible in your GitHub backlog, your team currently has:

* US-01: Account Registration
* US-02: Login and Logout
* US-03: Clear Application Outcome Message
* US-04: Profile Management
* US-05: Browse and View Job Offers
* US-06: Submit Feature Suggestion
* US-07: Recruiter Company Profile
* US-08: Email Verification
* US-09: Company Reviews

The project requirements also include resume management, job posting management, job applications, application tracking, dashboards, notifications, saved jobs, and at least one AI feature. 

Since Sprint 1 requires **at least 15 user stories**, your team should add several more stories that cover the missing core functionality. 

---

# Suggested Additional User Stories

## US-10: Resume Upload

**As a job seeker, I want to upload my resume so that I can apply for jobs more efficiently.**

### Acceptance Criteria

* User can upload PDF resumes.
* Uploaded resume is stored securely.
* User receives confirmation after upload.
* Invalid file formats are rejected.

### Tasks

* Task 10.1: Create resume database/storage model.
* Task 10.2: Implement resume upload API.
* Task 10.3: Build resume upload UI.
* Task 10.4: Validate file type and size.

---

## US-11: Resume Management

**As a job seeker, I want to update or delete my uploaded resumes so that my job applications always use current information.**

### Acceptance Criteria

* User can view uploaded resumes.
* User can replace a resume.
* User can delete a resume.
* Changes are reflected immediately.

### Tasks

* Task 11.1: Create resume list page.
* Task 11.2: Implement resume replacement feature.
* Task 11.3: Implement resume deletion feature.
* Task 11.4: Add confirmation dialog for deletion.

---

## US-12: Recruiter Job Posting Creation

**As a recruiter, I want to create job postings so that I can advertise employment opportunities.**

### Acceptance Criteria

* Recruiter can create a posting.
* Required fields must be completed.
* Job becomes visible to job seekers.
* Recruiter receives confirmation.

### Tasks

* Task 12.1: Design job posting schema.
* Task 12.2: Build job creation form.
* Task 12.3: Create backend API.
* Task 12.4: Add input validation.

---

## US-13: Recruiter Job Posting Management

**As a recruiter, I want to edit or remove my job postings so that I can keep listings accurate.**

### Acceptance Criteria

* Recruiter can update posting details.
* Recruiter can delete postings.
* Changes appear immediately.
* Unauthorized users cannot modify postings.

### Tasks

* Task 13.1: Implement edit functionality.
* Task 13.2: Implement delete functionality.
* Task 13.3: Add authorization checks.
* Task 13.4: Write tests.

---

## US-14: Job Search Filters

**As a job seeker, I want to filter job listings by criteria so that I can find relevant opportunities faster.**

### Acceptance Criteria

* User can search by keyword.
* User can filter by location.
* User can filter by company.
* Results update correctly.

### Tasks

* Task 14.1: Implement search API.
* Task 14.2: Add filter UI components.
* Task 14.3: Create database queries.
* Task 14.4: Write integration tests.

---

## US-15: Apply for a Job

**As a job seeker, I want to submit applications directly through the platform so that I can track my applications in one place.**

### Acceptance Criteria

* User can apply using an uploaded resume.
* Application is saved.
* Recruiter can view applications.
* Confirmation is displayed.

### Tasks

* Task 15.1: Create application model.
* Task 15.2: Implement apply button workflow.
* Task 15.3: Link resumes to applications.
* Task 15.4: Create success notification.

---

## US-16: Application Status Tracking

**As a job seeker, I want to track the status of my applications so that I know where I stand in the hiring process.**

### Acceptance Criteria

* User can see statuses:

  * Applied
  * Interview
  * Offered
  * Rejected
* Status updates are visible immediately.
* Applications are organized clearly.

### Tasks

* Task 16.1: Create status tracking model.
* Task 16.2: Build application dashboard.
* Task 16.3: Implement recruiter status updates.
* Task 16.4: Write status update tests.

---

## US-17: Saved Jobs

**As a job seeker, I want to save interesting jobs so that I can review them later.**

### Acceptance Criteria

* User can save a job.
* User can remove a saved job.
* Saved jobs are displayed in a dedicated section.
* Duplicate saves are prevented.

### Tasks

* Task 17.1: Create saved-jobs table.
* Task 17.2: Implement save functionality.
* Task 17.3: Build saved jobs page.
* Task 17.4: Write tests.

---

## US-18: Recruiter View Applicants

**As a recruiter, I want to view applicants for my job postings so that I can evaluate candidates.**

### Acceptance Criteria

* Recruiter can see applicant list.
* Recruiter can view resumes.
* Recruiter can sort applicants.
* Only authorized recruiters can access applicant data.

### Tasks

* Task 18.1: Create applicant listing page.
* Task 18.2: Implement recruiter permissions.
* Task 18.3: Add resume viewer.
* Task 18.4: Write security tests.

---

# AI Feature (Required by Project)

The specification requires at least one AI-based feature. 

## US-19: AI Resume Feedback

**As a job seeker, I want AI-generated feedback on my resume so that I can improve my chances of getting interviews.**

### Acceptance Criteria

* User uploads a resume.
* AI generates improvement suggestions.
* Suggestions are displayed clearly.
* User can regenerate feedback.

### Tasks

* Task 19.1: Integrate AI service.
* Task 19.2: Extract resume text.
* Task 19.3: Generate feedback prompts.
* Task 19.4: Build feedback UI.

---

# Original Team Feature (Good for Bonus Creativity)

## US-20: Interview Preparation Assistant

**As a job seeker, I want personalized interview questions based on a job description so that I can prepare more effectively.**

### Acceptance Criteria

* User selects a job posting.
* AI generates interview questions.
* Questions are relevant to the role.
* User can request additional questions.

### Tasks

* Task 20.1: Create AI prompt workflow.
* Task 20.2: Integrate job description extraction.
* Task 20.3: Build interview practice page.
* Task 20.4: Add testing and validation.

These stories would bring your backlog to **20+ user stories**, cover all major requirements from the project specification, and provide both the **required AI feature** and a strong **team-generated original feature** that you can highlight during Sprint 1 reviews.
