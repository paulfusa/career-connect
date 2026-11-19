import { REVIEW_LIMITS } from '../company-reviews.ts';

export type ReviewForm = { rating: number | null; body: string };
export type ReviewErrors = { rating?: string; body?: string };

// US-09: checks the review form, same idea as the suggestion form in US-06
export function parseReview(form: FormData): { values: ReviewForm; errors: ReviewErrors } {
	const rawRating = form.get('rating');
	const rawBody = form.get('body');
	const rating = typeof rawRating === 'string' && /^[1-5]$/.test(rawRating) ? Number(rawRating) : null;
	const body = typeof rawBody === 'string' ? rawBody.trim() : '';

	const errors: ReviewErrors = {};
	if (rating === null) errors.rating = 'Pick a rating from 1 to 5 stars.';
	if (!body) errors.body = 'Write a few words about the company.';
	else if (body.length < REVIEW_LIMITS.min) errors.body = `Your review needs at least ${REVIEW_LIMITS.min} characters.`;
	else if (body.length > REVIEW_LIMITS.max) errors.body = `Your review can be at most ${REVIEW_LIMITS.max} characters.`;

	return { values: { rating, body }, errors };
}

// average with one decimal, null if there are no reviews yet
export function ratingSummary(ratings: number[]): { average: number | null; count: number } {
	if (ratings.length === 0) return { average: null, count: 0 };
	const total = ratings.reduce((sum, rating) => sum + rating, 0);
	return { average: Math.round((total / ratings.length) * 10) / 10, count: ratings.length };
}

// anyone signed in, except the recruiter who owns the company
export const canReviewCompany = (user: { id: string } | null | undefined, company: { recruiterId: string }): boolean =>
	!!user && user.id !== company.recruiterId;
