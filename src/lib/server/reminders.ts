// US-03: recruiters get a reminder for applications left without a decision for this many days
export const REMINDER_DAYS = 7;

// TODO (Mohamad): true when the application has no decision and was sent more than REMINDER_DAYS days before now
export function needsReminder(appliedAt: Date, decided: boolean, now: Date): boolean {
	return false;
}
