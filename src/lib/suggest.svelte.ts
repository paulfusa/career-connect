// Autocomplete sources and a small debounced search helper shared by SuggestInput and ChipInput.

// label is what goes in the field; title/detail are what the dropdown shows
export type Suggestion = { label: string; title?: string; detail?: string; domain?: string };
export type Search = (query: string, signal: AbortSignal) => Promise<Suggestion[]>;

// Cities from Photon (OpenStreetMap geocoder): free, no API key, CORS-enabled.
// lat/lon biases ranking toward Montréal (most of our users) without excluding anywhere else.
// ponytail: public instance has fair-use limits; self-host Photon or use a paid geocoder if traffic grows
export const searchCities: Search = async (query, signal) => {
	const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&layer=city&limit=6&lang=en&lat=45.5&lon=-73.57`;
	const res = await fetch(url, { signal });
	if (!res.ok) return [];
	const { features } = (await res.json()) as {
		features: { properties: { name?: string; state?: string; country?: string } }[];
	};
	const seen = new Set<string>();
	return features
		.map(({ properties: p }) => ({
			label: [p.name, p.state, p.country].filter(Boolean).join(', '),
			title: p.name,
			detail: [p.state, p.country].filter(Boolean).join(', ')
		}))
		.filter((s) => !seen.has(s.label) && seen.add(s.label));
};

// Companies from Clearbit's free autocomplete (no key, CORS-enabled). Logos come from the domain's favicon.
// ponytail: unofficial since HubSpot bought Clearbit; if it disappears the field degrades to plain text
export const searchCompanies: Search = async (query, signal) => {
	const res = await fetch(
		`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
		{ signal }
	);
	if (!res.ok) return [];
	const companies = (await res.json()) as { name: string; domain: string }[];
	return companies.map((c) => ({ label: c.name, detail: c.domain, domain: c.domain }));
};

// Schools go through our own endpoint because the Hipo universities API is HTTP-only.
export const searchSchools: Search = async (query, signal) => {
	const res = await fetch(`/api/schools?q=${encodeURIComponent(query)}`, { signal });
	return res.ok ? res.json() : [];
};

// Instant filtering of a fixed list (e.g. skills): prefix matches first, then anywhere in the name
export function filterList(list: string[], query: string, exclude: string[] = [], limit = 8): Suggestion[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	const skip = new Set(exclude.map((v) => v.toLowerCase()));
	const matches = list.filter((item) => item.toLowerCase().includes(q) && !skip.has(item.toLowerCase()));
	matches.sort((a, b) => Number(!a.toLowerCase().startsWith(q)) - Number(!b.toLowerCase().startsWith(q)));
	return matches.slice(0, limit).map((label) => ({ label }));
}

export const logoUrl = (domain: string) =>
	`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

// Debounces keystrokes, cancels stale requests, and remembers every label it has seen
// so a picked suggestion can be matched back to its domain.
export class Suggester {
	options = $state<Suggestion[]>([]);
	#seen = new Map<string, Suggestion>();
	#timer: ReturnType<typeof setTimeout> | undefined;
	#request: AbortController | undefined;

	constructor(
		private search: Search,
		private fixed: Suggestion[] = []
	) {
		this.options = fixed;
	}

	find(label: string) {
		return this.#seen.get(label);
	}

	run(query: string) {
		clearTimeout(this.#timer);
		this.#request?.abort();
		// fixed options (e.g. "Remote") only while they match what's typed
		const q = query.trim().toLowerCase();
		const fixed = this.fixed.filter((f) => f.label.toLowerCase().includes(q));
		// picking an option fires input too; don't search again for it
		if (q.length < 2 || this.#seen.has(query)) {
			this.options = fixed;
			return;
		}

		this.#timer = setTimeout(async () => {
			this.#request = new AbortController();
			try {
				const results = await this.search(query.trim(), this.#request.signal);
				for (const r of results) this.#seen.set(r.label, r);
				this.options = [...fixed, ...results.filter((r) => !fixed.some((f) => f.label === r.label))];
			} catch {
				// aborted or offline: keep the last suggestions, typing still works
			}
		}, 250);
	}
}
