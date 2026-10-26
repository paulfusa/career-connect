export function acceptanceRate(submitted: number, offered: number, decided: number): number | null {
	if (decided === 0) return null;
	return Math.round((offered / submitted) * 100);
}
