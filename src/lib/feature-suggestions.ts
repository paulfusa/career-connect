// US-06: used by the suggestion pages and the server
export const SUGGESTION_STATUSES = {
	new: 'New',
	under_review: 'Under review',
	planned: 'Planned',
	not_planned: 'Not planned'
} as const;

export type SuggestionStatus = keyof typeof SUGGESTION_STATUSES;

// min and max length of each field, in characters
export const SUGGESTION_LIMITS = {
	title: { min: 5, max: 120 },
	description: { min: 20, max: 2000 },
	benefit: { min: 10, max: 1000 }
} as const;
