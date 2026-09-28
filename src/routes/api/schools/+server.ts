import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Proxies the Hipo universities list (free, no key, ~10k schools incl. Québec CEGEPs).
// It's HTTP-only, so browsers on our HTTPS site can't call it directly.
// ponytail: public API with no uptime promise; bundle its JSON dataset if it gets flaky
export const GET: RequestHandler = async ({ url, fetch }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) return json([]);

	try {
		const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(q)}`, {
			signal: AbortSignal.timeout(4000)
		});
		if (!res.ok) return json([]);
		const schools = (await res.json()) as {
			name: string;
			country: string;
			'state-province': string | null;
			domains: string[];
		}[];

		// Canadian schools first, since most of our users are in Canada
		schools.sort((a, b) => Number(b.country === 'Canada') - Number(a.country === 'Canada'));
		const results = schools.slice(0, 8).map((s) => ({
			label: s.name,
			detail: [s['state-province'], s.country].filter(Boolean).join(', '),
			domain: s.domains[0]
		}));
		return json(results, { headers: { 'cache-control': 'public, max-age=86400' } });
	} catch {
		return json([]);
	}
};
