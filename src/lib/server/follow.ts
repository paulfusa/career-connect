// US-19: job seekers can see and follow recruiters, and recruiters can see and follow job seekers
export function canSeeProfile(viewerRole: string, targetRole: string): boolean {
	return (
		(viewerRole === 'recruiter' && targetRole === 'job_seeker') ||
		(viewerRole === 'job_seeker' && targetRole === 'recruiter')
	);
}

// who shows up on the Recruiters / Job seekers page, the same rule as canSeeProfile
export function roleToFind(viewerRole: string): 'recruiter' | 'job_seeker' | null {
	if (viewerRole === 'job_seeker') return 'recruiter';
	if (viewerRole === 'recruiter') return 'job_seeker';
	return null;
}

// the reason someone can't follow this person, or null if they can
export function followProblem(
	me: { id: string; role: string },
	target: { id: string; role: string } | undefined
): string | null {
	if (target && target.id === me.id) return "You can't follow yourself.";
	// same message for "doesn't exist" and "not allowed", like the profile page's 404
	if (!target || !canSeeProfile(me.role, target.role)) return 'User not found.';
	return null;
}
