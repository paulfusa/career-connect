// US-09: used by the company page and the server
export const RATINGS = [1, 2, 3, 4, 5] as const;

// length of the written review, in characters
export const REVIEW_LIMITS = { min: 10, max: 2000 } as const;

// reviews go with the company's name, so every "Intel" posting and profile shares the same reviews.
// lowercase, and anything that isn't a letter or number becomes a dash: "Lionfish Cyber Security" is lionfish-cyber-security
export function companySlug(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// how full each star is (1, 0.5 or 0), rounded to the closest half, so 3.3 shows 3.5
export function starFills(rating: number): number[] {
	const halves = Math.round(rating * 2) / 2;
	return RATINGS.map((star) => Math.min(Math.max(halves - (star - 1), 0), 1));
}
