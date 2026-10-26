// US-03: recruiters get a reminder for applications left without a decision for this many days
export const REMINDER_DAYS = 7;

// true when application has no decision and was sent more than REMINDER_DAYS days before now
export function needsReminder(appliedAt: Date, decided: boolean, now: Date): boolean {
	if (decided) return false; // the recruiter has given an answer, so no need for a reminder

	const days = (now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60 * 24);
	return days > REMINDER_DAYS;
}
