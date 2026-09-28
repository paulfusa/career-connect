// US-11: onboarding questions per role, shared by the modal and the save action
import type { FullAutoFill } from 'svelte/elements';

export const MAX_ANSWER_LENGTH = 100;

type Question = {
	name: 'headline' | 'location' | 'company' | 'jobTitle';
	label: string;
	placeholder: string;
	autocomplete?: FullAutoFill;
	suggest?: 'city' | 'company';
};

export const QUESTIONS: Record<'job_seeker' | 'recruiter', Question[]> = {
	job_seeker: [
		{ name: 'headline', label: 'Headline', placeholder: '3rd-year software engineering student' },
		{
			name: 'location',
			label: 'Location',
			placeholder: 'Start typing a city',
			suggest: 'city'
		}
	],
	recruiter: [
		{ name: 'company', label: 'Company', placeholder: 'Start typing a company', suggest: 'company' },
		{
			name: 'jobTitle',
			label: 'Your job title',
			placeholder: 'Talent acquisition lead',
			autocomplete: 'organization-title'
		}
	]
};
