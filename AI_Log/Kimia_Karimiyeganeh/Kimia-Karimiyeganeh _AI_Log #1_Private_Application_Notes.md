# Prompt 1 - Define User Stories
- **Purpose of AI Use**: Brainstorming an additional feature for CareerConnect.
- **AI-Suggested Content**: Generated a Private Application Notes user story with acceptance criteria and implementation tasks.
- **Validation**: The AI assistant compared the suggestion with the repository's existing stories and logs. Private application notes were not found as a separate feature. Personal and team review are pending.
- **Decision**: Proposed for the backlog; implementation sprint to be decided by the team.
- **Reflection**: AI provided a structured starting point by turning a feature idea into a user story, acceptance criteria, and tasks. The team still needs to assess its usefulness and scope.
- **Responsible Person**: Kimia Karimiyeganeh

# Prompt

Suggest one additional user story for CareerConnect, a job-search and application-tracking platform. The idea should provide useful functionality beyond the stories already present in our repository. Follow our existing format: user story, suggested priority, acceptance criteria, and implementation tasks. Keep the feature manageable for a student project.

# Response

## Private Application Notes

**Source:** AI-generated  
**Priority:** Medium — suggested  
**Sprint:** To be decided

### User Story

As a job seeker, I want to add private notes to my applications so that I can remember interview details, questions, and important information about each opportunity.

### Acceptance Criteria

- [ ] A signed-in job seeker can add notes to an application they own.
- [ ] The user can view, edit, and delete their notes.
- [ ] Notes remain saved after refreshing the page or signing in again.
- [ ] Notes display their last-updated date.
- [ ] Recruiters and other users cannot access the notes.
- [ ] Empty notes or notes exceeding 2,000 characters are rejected with a clear message.

### Tasks

- Task 1.1: Create a notes table linked to the application and its owner.
- Task 1.2: Implement adding, retrieving, editing, and deleting notes with ownership checks.
- Task 1.3: Add a private-notes section to the application-details page.
- Task 1.4: Validate note length and display helpful error messages.
- Task 1.5: Test saving, editing, deletion, and protection against unauthorized access.