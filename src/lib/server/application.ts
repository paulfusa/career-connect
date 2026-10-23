const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ApplicationInput = {
	resumeId: string;
};

export type ApplicationErrors = Partial<Record<keyof ApplicationInput, string>>;
export type ApplicationParse =
	| { ok: true; values: ApplicationInput }
	| { ok: false; errors: ApplicationErrors; values: ApplicationInput };

export function parseApplication(data: FormData): ApplicationParse {
	const errors: ApplicationErrors = {};
	const values: ApplicationInput = {
		resumeId: data.get('resumeId')?.toString() ?? ''
	};

	if (!UUID.test(values.resumeId)) errors.resumeId = 'Choose one of your resumes.';

	return Object.keys(errors).length ? { ok: false, errors, values } : { ok: true, values };
}

// today's date in Eastern time (EST, or EDT in summer) as 'YYYY-MM-DD', so it can be compared with a deadline as text
export function todayEastern(): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Toronto', // the official name for Eastern time, it switches between EST and EDT by itself
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}

export function applyProblem(
	job: { status: string; published: boolean; applicationDeadline: string | null } | undefined,
	alreadyApplied: boolean,
	today: string
): string | null {
	if (!job || !job.published) return 'Job posting not found.';
	if (job.status !== 'open') return 'This job is no longer receiving applications.';
	// TODO (Mohamad): block applying after the deadline, same message as withdrawProblem
	if (alreadyApplied) return 'You have already applied to this job.';
	return null;
}

export function withdrawProblem(
    job: {
        status: string;
        published: boolean;
        applicationDeadline: string | null;
    } | undefined,
    hasApplication: boolean,
    today: string,
    decided: boolean
): string | null {
    if (!job || !job.published) {
        return 'Job posting not found.';
    }

    if (job.status !== 'open') {
        return 'This job is no longer accepting changes to applications.';
    }

    if (decided) {
        return 'You can no longer withdraw because the recruiter has already sent a decision.';
    }

    if (job.applicationDeadline && today > job.applicationDeadline) {
        return 'The application deadline has passed.';
    }

    if (!hasApplication) {
        return 'You have no application to withdraw.';
    }

    return null;
}