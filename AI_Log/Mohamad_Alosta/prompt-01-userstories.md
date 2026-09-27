# Prompt 1 - Define User Stories
- **Purpose of AI Use**: Brainstorming and requirements to start project.
- **Date**: September 25, 2026
- **Validation**: Read through and found some User Stories are too broad in the feature, and more detail is needed to be added and priorities to be moved around.
- **Decision**: Partially Accepted.
- **Reflection**: AI helped give a starting point for the project.
- **Responsible Person**: Mohamad Alosta

# Prompt
Suppose you are a software engineer and a member of a team, I want you to help us define requirements for a career platform. Generate user stories for an application called CareerConnect other than but in the same format as those already present in:
https://github.com/paulfusa/career-connect/tree/main.

# Response
Here are 8 user stories covering the core CareerConnect features. Each follows the Appendix B format, with acceptance criteria and a starting task breakdown you can turn into GitHub Issues in the same manner of the two previous prompts.
---

## US-01: Application Outcome Feedback

As a job seeker, I want to create and manage my profile, so that I can present my personal information, skills, and experience to potential employers.

### **Acceptance Criteria**
- [ ] Users can create a profile after registering.
- [ ] Users can update their personal information.
- [ ] Users can view their profile information.
- [ ] Profile information is saved and associated with the correct user account.
- [ ] Users can manage their professional information through their profile.

### **Tasks**
- Task 1.1: Design the profile data structure.
- Task 1.2: Implement profile creation functionality.
- Task 1.3: Implement profile update functionality.
- Task 1.4: Create the profile viewing interface.
- Task 1.5: Test profile management functionality.

**Decision**
Accepted and added as a GitHub Issue.

**Validation**
The team reviewed the AI-generated story against the CareerConnect project requirements and determined that profile management is a core feature for the platform.
The story was reviewed for:
- Alignment with job seeker needs.
- Compatibility with other planned features such as resume management and applications.
- Clarity of acceptance criteria.
- Agile user story format.
The wording was refined before being added to GitHub Issues.

## US-02: Job Availability Status

As a job seeker, I want to know whether a job posting is currently accepting applications, so that I can focus on opportunities that are still available.

### Acceptance Criteria
- [ ] Job postings display their current availability status.
- [ ] Users can identify whether applications are open or closed.
- [ ] Closed opportunities cannot receive new applications.

### Tasks
- Task 2.1: Add application availability status to job postings.
- Task 2.2: Display status on job search results.
- Task 2.3: Prevent submissions for closed postings.

**Decision**
Not selected as a separate GitHub Issue.

**Reason**
The team decided this functionality could be included within job posting and job search features.

## US-03: Recruiter Company Profile

As a recruiter, I want to create and manage a company profile, so that job seekers can learn more about the organization.

### Acceptance Criteria
- [ ] Recruiters can create company information.
- [ ] Recruiters can update company details.
- [ ] Job seekers can view company information.

### Tasks
- Task 3.1: Design company profile database structure.
- Task 3.2: Create company profile interface.
- Task 3.3: Display company information with job postings.

**Decision**
Not selected for Sprint 1.

**Reason**
The team prioritized core recruitment functionality before additional company features.

## US-04: Company Reviews

As a job seeker, I want to view and submit company reviews, so that I can make more informed decisions about potential employers.

### Acceptance Criteria
- [ ] Users can view company reviews.
- [ ] Users can submit reviews.
- [ ] Reviews are associated with companies.

### Tasks
- Task 4.1: Create review data model.
- Task 4.2: Develop review submission page.
- Task 4.3: Display reviews on company profiles.

**Decision**
Not selected for Sprint 1.

**Reason**
The feature requires additional moderation and review management functionality.

## US-05: Feature Suggestion System

As a CareerConnect user, I want to suggest improvements or new features, so that I can provide feedback and contribute to the platform's improvement.

### Acceptance Criteria
- [ ] Users can submit feature suggestions.
- [ ] Suggestions contain a title and description.
- [ ] The development team can review submitted suggestions.

### Tasks
- Task 5.1: Create feature suggestion form.
- Task 5.2: Store submitted suggestions.
- Task 5.3: Create review interface for suggestions.

**Decision**
Not selected for Sprint 1.

**Reason**
The team considered this useful for future improvements but not part of the initial core functionality.

## US-06: Saved Job Organization

As a job seeker, I want to organize my saved job postings, so that I can easily return to opportunities that interest me.

### Acceptance Criteria
- [ ] Users can save job postings.
- [ ] Users can view saved jobs.
- [ ] Users can remove saved jobs.

### Tasks
- Task 6.1: Create saved jobs database structure.
- Task 6.2: Add save/remove functionality.
- Task 6.3: Create saved jobs page.

**Decision**
Not selected for Sprint 1.

**Reason**
The team prioritized basic job searching and applications first.

## US-07: Interview Preparation Resources

As a job seeker, I want access to interview preparation resources, so that I can improve my preparation before interviews.

### Acceptance Criteria
- [ ] Users can access interview preparation material.
- [ ] Resources are organized by category.
- [ ] Users can view recommended preparation content.

### Tasks
- Task 7.1: Define preparation resource categories.
- Task 7.2: Create resource page.
- Task 7.3: Add resource management functionality.

**Decision**
Not selected for Sprint 1.

**Reason**
The feature was considered outside the initial CareerConnect scope.

## US-08: Application Deadline Reminders

As a job seeker, I want to receive reminders about application deadlines, so that I do not miss important job opportunities.

### Acceptance Criteria
- [ ] Users can see upcoming deadlines.
- [ ] Users can receive reminders.
- [ ] Users can manage notification preferences.

### Tasks
- Task 8.1: Store application deadlines.
- Task 8.2: Implement reminder system.
- Task 8.3: Create notification settings.

**Decision**
Not selected for Sprint 1.

**Reason**
The team considered reminders as a future enhancement after completing core application tracking.
- The required Generative AI feature
- The team's original feature
