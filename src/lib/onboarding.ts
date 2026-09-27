// US-11: onboarding questions per role, shared by the modal and the save action
import type { FullAutoFill } from 'svelte/elements';

export const MAX_ANSWER_LENGTH = 100;

// City suggestions from Photon (OpenStreetMap geocoder): free, no API key, CORS-enabled.
// ponytail: public instance has fair-use limits; self-host Photon or use a paid geocoder if traffic grows
// lat/lon biases ranking toward Montréal (most of our users) without excluding anywhere else
export async function searchCities(query: string, signal: AbortSignal): Promise<string[]> {
	const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&layer=city&limit=6&lang=en&lat=45.5&lon=-73.57`;
	const res = await fetch(url, { signal });
	if (!res.ok) return [];
	const { features } = (await res.json()) as {
		features: { properties: { name?: string; state?: string; country?: string } }[];
	};
	const labels = features.map(({ properties: p }) => [p.name, p.state, p.country].filter(Boolean).join(', '));
	return [...new Set(labels)];
}

type Question = {
	name: 'headline' | 'location' | 'company' | 'jobTitle';
	label: string;
	placeholder: string;
	autocomplete?: FullAutoFill;
	suggestCities?: boolean;
};

export const QUESTIONS: Record<'job_seeker' | 'recruiter', Question[]> = {
	job_seeker: [
		{ name: 'headline', label: 'Headline', placeholder: '3rd-year software engineering student' },
		{
			name: 'location',
			label: 'Location',
			placeholder: 'Start typing a city',
			suggestCities: true
		}
	],
	recruiter: [
		{ name: 'company', label: 'Company', placeholder: 'Acme Inc.', autocomplete: 'organization' },
		{
			name: 'jobTitle',
			label: 'Your job title',
			placeholder: 'Talent acquisition lead',
			autocomplete: 'organization-title'
		}
	]
};
