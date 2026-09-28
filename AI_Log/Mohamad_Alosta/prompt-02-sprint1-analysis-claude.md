# Prompt 2 - Sprint 1 Progress Tracking and Organization
- **Tool**: Claude, used inside VS Code with access to our local copy of the repository.
- **Date**: September 27, 2026
- **Purpose of AI Use**: Monitoring task completion and brainstorming how to organize and proceed with the tasks of Sprint 1.
- **Chat Link or Prompt/Response**: Link not available (the app wasn't used). My prompts are listed in the appendix below.
- **AI-Suggested Content**: The AI compared the Sprint 1 requirements with our repository and GitHub issues to show what was complete and what was still missing. It then suggested how to organize each folder.
- **Validation**: I went through every file on GitHub and examined the validity and marked down each completion, leaving out the incomplete sections.
- **Decision**: Modified before use. I recreated the documents in my own understanding and completed the remaining files.
- **Reflection**: AI helped in speeding up the process of developing the planning, README, task monitoring, and task breakdown phases in an organized manner.
- **Responsible Person**: Mohamad Alosta

---

# Prompt
*(My requests combined and reworded into one prompt. The original message is included below it.)*

> I have attached the SOEN 341 course outline and the Sprint 1 project instructions for CareerConnect. Compare the Sprint 1 requirements and rubric with the current state of our GitHub repository and issues. Tell me which deliverables are complete, which are partially complete, and which are still missing, and prioritize what is left based on the rubric weights. Then suggest how we should organize the repository folders so that each Sprint 1 deliverable has a clear place.

Original message: *"read those two documents and analyze sprint 1"* (Sprint 1 project PDF and course outline attached)

# Response
**Comparison of Sprint 1 requirements with the repository:**

| Rubric category (weight) | Status | Notes |
|---|---|---|
| Team members and repository setup (0.5) | Partial | Repo, members and `AI_Log/` exist. No folder for meeting minutes. |
| README file (0.5) | Almost | Missing the GitHub repository link and complete setup instructions. |
| Feature identification and scope (1.0) | Mostly done | Generative AI feature not confirmed; original feature not clearly named. |
| User stories (3.0) | Partial | 16 stories (minimum 15), but no separate "Team-Generated User Stories and Features" section. |
| Sprint planning (3.0) | Missing | Work plan in `docs/sprints/sprint-1.md` is empty: no priorities, risks, estimates or capacity. |
| Task breakdown (1.5) | Partial | Tasks exist in each issue, but most issues have no assignee and only one label is used. |
| AI usage log (2.0) | Weak | Logs must be PDFs in each member's folder. Some members have no log yet. |
| Contribution log (0.5) | Missing | No record of each member's contribution. |
| Meeting minutes (1.0) | Partial | Only the September 24 minutes exist. |
| Project demo (1.0) | Partial | Registration/login and onboarding are built. |

The team process definition (workflow, branching, PR and code review process, Definition of Ready, Definition of Done) was also missing.

**Suggested priority:** sprint plan (3.0) → AI log PDFs (2.0) → team-generated stories and team process → issue assignees and labels → contribution log → README setup.

**Suggested folder organization:**

| Folder | Contents |
|---|---|
| `AI_Log/<Name>/` | Each member's AI usage log PDF |
| `docs/sprints/` | Sprint plan, task breakdown, contribution log |
| `docs/process/` | Team process (workflow, branching, PRs, DoR, DoD) |
| `docs/meeting-minutes/` | Minutes of each meeting |
| `docs/user-stories/` | Team-generated user stories and features |
| `docs/submissions/` | Documents submitted for each sprint |


