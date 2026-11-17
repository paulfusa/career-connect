import { SUGGESTION_LIMITS, SUGGESTION_STATUSES, type SuggestionStatus } from '../feature-suggestions.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Field = keyof typeof SUGGESTION_LIMITS;
export type SuggestionInput = Record<Field, string>;

const NAMES: Record<Field, string> = {
	title: 'Title',
	description: 'Description',
	benefit: 'How it would help'
};

// US-06: checks the suggestion form, returns the values and an error for each bad field
export function parseSuggestion(form: FormData): { values: SuggestionInput; errors: Partial<Record<Field, string>> } {
	const values = {} as SuggestionInput;
	const errors: Partial<Record<Field, string>> = {};
	for (const key of Object.keys(SUGGESTION_LIMITS) as Field[]) {
		const raw = form.get(key);
		const value = typeof raw === 'string' ? raw.trim() : '';
		values[key] = value;
		const { min, max } = SUGGESTION_LIMITS[key];
		if (!value) errors[key] = `${NAMES[key]} is required.`;
		else if (value.length < min) errors[key] = `${NAMES[key]} needs at least ${min} characters.`;
		else if (value.length > max) errors[key] = `${NAMES[key]} can be at most ${max} characters.`;
	}
	return { values, errors };
}

export const isSuggestionStatus = (value: unknown): value is SuggestionStatus =>
	typeof value === 'string' && Object.hasOwn(SUGGESTION_STATUSES, value);

// id + new status from the review form, null if something's off
export function parseStatusChange(form: FormData): { id: string; status: SuggestionStatus } | null {
	const id = form.get('id');
	const status = form.get('status');
	if (typeof id !== 'string' || !UUID.test(id) || !isSuggestionStatus(status)) return null;
	return { id, status };
}

// only admins can review suggestions
export const canReviewSuggestions = (user: { isAdmin?: boolean | null } | undefined | null): boolean => user?.isAdmin === true;
