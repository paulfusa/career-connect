// US-19: job seekers can see and follow recruiters, and recruiters can see and follow job seekers
export function canSeeProfile(viewerRole: string, targetRole: string): boolean {
	return (
		(viewerRole === 'recruiter' && targetRole === 'job_seeker') ||
		(viewerRole === 'job_seeker' && targetRole === 'recruiter')
	);
}

// who you see on the Recruiters / Job seekers page: the other role
export function roleToFind(viewerRole: string) {
	return viewerRole === 'job_seeker' ? 'recruiter' : 'job_seeker';
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
