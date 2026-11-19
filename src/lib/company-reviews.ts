// US-09: used by the company page and the server
export const RATINGS = [1, 2, 3, 4, 5] as const;

// length of the written review, in characters
export const REVIEW_LIMITS = { min: 10, max: 2000 } as const;

// how full each of the 5 stars is (1, 0.5 or 0), to the closest half star. So 3.3 shows 3.5 and 4.2 shows 4
export function starFills(rating: number): number[] {
	const halves = Math.round(rating * 2) / 2;
	return RATINGS.map((star) => Math.min(Math.max(halves - (star - 1), 0), 1));
}
