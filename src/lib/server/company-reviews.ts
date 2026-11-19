import { REVIEW_LIMITS } from '../company-reviews.ts';

// a company in the address, like intel or lionfish-cyber-security (see companySlug)
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const isSlug = (value: unknown): value is string => typeof value === 'string' && value.length <= 200 && SLUG.test(value);

export type ReviewForm = { rating: number | null; body: string };
export type ReviewErrors = { rating?: string; body?: string };

// US-09: checks the review form, same idea as the suggestion form in US-06
export function parseReview(form: FormData): { values: ReviewForm; errors: ReviewErrors } {
	const rawRating = form.get('rating');
	const rawBody = form.get('body');
	// 0 to 5 in half stars: 0, 0.5, 1 ... 5
	const number = typeof rawRating === 'string' && /^[0-5](\.[05])?$/.test(rawRating) ? Number(rawRating) : null;
	const rating = number !== null && number <= 5 ? number : null;
	const body = typeof rawBody === 'string' ? rawBody.trim() : '';

	const errors: ReviewErrors = {};
	if (rating === null) errors.rating = 'Pick a star rating.';
	if (!body) errors.body = 'Write a few words about the company.';
	else if (body.length < REVIEW_LIMITS.min) errors.body = `Your review needs at least ${REVIEW_LIMITS.min} characters.`;
	else if (body.length > REVIEW_LIMITS.max) errors.body = `Your review can be at most ${REVIEW_LIMITS.max} characters.`;

	return { values: { rating, body }, errors };
}

const oneDecimal = (value: number) => Math.round(value * 10) / 10;

// average with one decimal, null if there are no reviews yet
export function ratingSummary(ratings: number[]): { average: number | null; count: number } {
	if (ratings.length === 0) return { average: null, count: 0 };
	const total = ratings.reduce((sum, rating) => sum + rating, 0);
	return { average: oneDecimal(total / ratings.length), count: ratings.length };
}

// stars on job postings (postgres sends avg() back as text)
export function toRating(average: unknown, count: unknown): { average: number; count: number } | null {
	const reviews = Number(count ?? 0);
	if (!reviews || average === null || average === undefined) return null;
	return { average: oneDecimal(Number(average)), count: reviews };
}

type Reviewer = { role: string } | null | undefined;
export const ONLY_JOB_SEEKERS = 'Only job seekers can review companies.';

// job seekers only, and not about your own company (an admin with a company can switch to the job seeker view)
export function reviewProblem(user: Reviewer, yours: boolean): string | null {
	if (user?.role !== 'job_seeker') return ONLY_JOB_SEEKERS;
	if (yours) return "You can't review your own company.";
	return null;
}

export const canReviewCompany = (user: Reviewer, yours: boolean) => reviewProblem(user, yours) === null;

// job seekers see every company's reviews, recruiters only the companies they're part of
export const canSeeReviews = (user: Reviewer, yours: boolean) => user?.role === 'job_seeker' || yours;
