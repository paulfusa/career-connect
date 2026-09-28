// US-04: fixed choices and limits shared by the profile forms (client) and validation (server).
// Relative imports only, so `node --test` can load it.

export const LIMITS = {
	short: 100,
	url: 200,
	about: 2000,
	description: 2000,
	skill: 40,
	skills: 50,
	topSkills: 5,
	listItems: 10
} as const;

export const EMPLOYMENT_TYPES = {
	full_time: 'Full-time',
	part_time: 'Part-time',
	internship: 'Internship',
	coop: 'Co-op',
	contract: 'Contract',
	freelance: 'Freelance',
	volunteer: 'Volunteer'
} as const;

// what a job seeker is looking for; a subset of the employment types above
export const JOB_TYPES = {
	full_time: 'Full-time',
	part_time: 'Part-time',
	internship: 'Internship',
	coop: 'Co-op',
	contract: 'Contract'
} as const;

export const WORK_MODES = {
	on_site: 'On-site',
	hybrid: 'Hybrid',
	remote: 'Remote'
} as const;

// suggestions only; any degree name is accepted
export const DEGREES = [
	'DEC (Diplôme d’études collégiales)',
	'AEC (Attestation d’études collégiales)',
	'High school diploma',
	'Certificate',
	'Diploma',
	'Associate degree',
	'Bachelor of Engineering (BEng)',
	'Bachelor of Science (BSc)',
	'Bachelor of Arts (BA)',
	'Bachelor of Commerce (BComm)',
	'Master of Engineering (MEng)',
	'Master of Science (MSc)',
	'Master of Business Administration (MBA)',
	'Master of Arts (MA)',
	'Doctor of Philosophy (PhD)'
];
