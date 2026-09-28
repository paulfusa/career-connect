import type { Profile } from '$lib/server/db/schema';

// US-04: what a complete profile has, in the order we nudge the user to fill it in
export function completeness(
	role: 'job_seeker' | 'recruiter',
	image: string | null | undefined,
	p: Profile | null,
	counts: { experience: number; education: number }
) {
	const checks: [done: boolean, todo: string][] =
		role === 'job_seeker'
			? [
					[!!p?.headline, 'Add a headline'],
					[!!p?.location, 'Add your location'],
					[counts.education > 0, 'Add your education'],
					[counts.experience > 0, 'Add an experience'],
					[(p?.skills.length ?? 0) >= 3, 'Add at least 3 skills'],
					[!!p?.about, 'Write a short about section'],
					[(p?.jobTypes.length ?? 0) + (p?.desiredRoles.length ?? 0) > 0, 'Set your job preferences'],
					[!!image, 'Add a profile picture']
				]
			: [
					[!!p?.company, 'Add your company'],
					[!!p?.jobTitle, 'Add your job title'],
					[!!p?.location, 'Add your location'],
					[!!p?.about, 'Write a short about section'],
					[!!image, 'Add a profile picture']
				];

	const done = checks.filter(([ok]) => ok).length;
	return {
		percent: Math.round((done / checks.length) * 100),
		next: checks.find(([ok]) => !ok)?.[1] ?? null
	};
}
