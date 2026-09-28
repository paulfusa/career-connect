import type { SubmitFunction } from '@sveltejs/kit';

// use:enhance handler that tracks a pending flag; keeps typed values after a validation error
export const withPending =
	(set: (pending: boolean) => void, reset = false): SubmitFunction =>
	() => {
		set(true);
		return async ({ update }) => {
			await update({ reset });
			set(false);
		};
	};
