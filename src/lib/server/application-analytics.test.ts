import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getApplicationAnalytics } from './application-analytics.ts';

const now = new Date('2026-05-15T12:00:00.000Z');

function application(status: 'applied' | 'interview' | 'offered' | 'rejected' | 'under_review', appliedAt: string) {
	return { status, appliedAt: new Date(appliedAt) };
}

test('application analytics: counts every current status, including statuses with no applications', () => {
	const result = getApplicationAnalytics(
		[
			application('applied', '2026-05-01T10:00:00.000Z'),
			application('applied', '2026-04-01T10:00:00.000Z'),
			application('interview', '2026-03-01T10:00:00.000Z'),
			application('rejected', '2026-02-01T10:00:00.000Z')
		],
		null,
		now
	);

	assert.equal(result.totalApplications, 4);
	assert.deepEqual(
		result.statusCounts.map(({ status, count }) => [status, count]),
		[
			['applied', 2],
			['under_review', 0],
			['interview', 1],
			['offered', 0],
			['rejected', 1]
		]
	);
});

test('application analytics: groups applications into the 12-month UTC window', () => {
	const result = getApplicationAnalytics(
		[
			application('applied', '2025-06-01T00:00:00.000Z'),
			application('interview', '2025-06-30T23:59:59.000Z'),
			application('offered', '2025-05-31T23:59:59.000Z'),
			application('rejected', '2026-05-15T12:00:00.000Z'),
			application('applied', '2026-06-01T00:00:00.000Z')
		],
		null,
		now
	);

	assert.equal(result.months.length, 12);
	assert.equal(result.months[0].key, '2025-06');
	assert.equal(result.months[11].key, '2026-05');
	assert.equal(result.months[0].count, 2);
	assert.equal(result.months[11].count, 1);
	assert.equal(result.months.reduce((sum, month) => sum + month.count, 0), 3);
	assert.equal(result.maxMonthlyApplications, 2);
});

test('application analytics: valid status filters only the history list, not the overall statistics', () => {
	const allApplications = [
		application('applied', '2026-05-01T10:00:00.000Z'),
		application('interview', '2026-04-01T10:00:00.000Z')
	];
	const result = getApplicationAnalytics(allApplications, 'interview', now);

	assert.equal(result.applications.length, 1);
	assert.equal(result.applications[0].status, 'interview');
	assert.equal(result.totalApplications, 2);
	assert.equal(result.statusCounts.find(({ status }) => status === 'applied')?.count, 1);
	assert.equal(result.statusFilter, 'interview');
});

test('application analytics: invalid and empty filters show all application history', () => {
	const allApplications = [
		application('applied', '2026-05-01T10:00:00.000Z'),
		application('interview', '2026-04-01T10:00:00.000Z')
	];

	for (const filter of ['unknown', '', null]) {
		const result = getApplicationAnalytics(allApplications, filter, now);
		assert.equal(result.applications.length, allApplications.length);
		assert.equal(result.statusFilter, '');
	}
});

test('application analytics: empty history has zero counts and a nonzero chart scale', () => {
	const result = getApplicationAnalytics([], null, now);

	assert.equal(result.totalApplications, 0);
	assert.equal(result.applications.length, 0);
	assert.ok(result.statusCounts.every(({ count }) => count === 0));
	assert.ok(result.months.every(({ count }) => count === 0));
	assert.equal(result.maxMonthlyApplications, 1);
});
