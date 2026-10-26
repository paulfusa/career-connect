import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editJobPosting } from './job-posting-edit.ts';

const form = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

const valid = {
	title: 'Updated Software Engineer',
	company: 'Acme',
	location: 'Montreal, QC',
	employmentType: 'full_time',
	workMode: 'hybrid',
	description: 'Build useful software.',
	requirements: 'Java coding experience',
	applicationDeadline: '2026-10-23'
};

const postingId = 'd2719f0a-98a7-4a21-8b67-123456789abc';

test('job posting editing: non-recruiters cannot edit postings', async () => {
	let updateCalled = false;
	const result = await editJobPosting(
		{ id: 'user-1', role: 'job_seeker' },
		postingId,
		form(valid),
		async () => {
			updateCalled = true;
			return postingId;
		}
	);

	assert.deepEqual(result, { status: 'forbidden' });
	assert.equal(updateCalled, false);
});

test('job posting editing: an invalid posting id updates nothing', async () => {
	let updateCalled = false;
	const result = await editJobPosting(
		{ id: 'recruiter-1', role: 'recruiter' },
		'not-a-uuid',
		form(valid),
		async () => {
			updateCalled = true;
			return postingId;
		}
	);

	assert.deepEqual(result, { status: 'not-found' });
	assert.equal(updateCalled, false);
});

test('job posting editing: invalid values return errors and nothing is updated', async () => {
	let updateCalled = false;
	const result = await editJobPosting(
		{ id: 'recruiter-1', role: 'recruiter' },
		postingId,
		form({ ...valid, title: '' }),
		async () => {
			updateCalled = true;
			return postingId;
		}
	);

	assert.equal(result.status, 'invalid');
	if (result.status !== 'invalid') assert.fail('Expected invalid form result.');
	assert.equal(result.errors.title, 'Job title is required.');
	assert.equal(updateCalled, false);
});

test('job posting editing: a recruiter can edit their own posting', async () => {
	const existing = {
		id: postingId,
		createdBy: 'recruiter-1',
		title: 'Old title'
	};
	let saved: Record<string, unknown> | undefined;

	const result = await editJobPosting(
		{ id: 'recruiter-1', role: 'recruiter' },
		postingId,
		form(valid),
		async (id, ownerId, values) => {
			if (existing.id !== id || existing.createdBy !== ownerId) return null;
			saved = values;
			existing.title = values.title;
			return existing.id;
		}
	);

	assert.deepEqual(result, { status: 'updated', id: postingId });
	assert.equal(existing.title, 'Updated Software Engineer');
	assert.equal(saved?.createdBy, undefined);
	assert.ok(saved?.updatedAt instanceof Date);
});

test("job posting editing: a recruiter cannot edit another recruiter's posting", async () => {
	const existing = {
		id: postingId,
		createdBy: 'owner-1',
		title: 'Original title'
	};

	const result = await editJobPosting(
		{ id: 'recruiter-2', role: 'recruiter' },
		postingId,
		form(valid),
		async (id, ownerId, values) => {
			if (existing.id !== id || existing.createdBy !== ownerId) return null;
			existing.title = values.title;
			return existing.id;
		}
	);

	assert.deepEqual(result, { status: 'not-found' });
	assert.equal(existing.title, 'Original title');
});
