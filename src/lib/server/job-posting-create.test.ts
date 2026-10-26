import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJobPosting } from './job-posting-create.ts';

const form = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

const valid = {
	title: 'Software Engineer',
	company: 'Acme',
	location: 'Montreal, QC',
	employmentType: 'full_time',
	workMode: 'hybrid',
	description: 'Build useful software.',
	requirements: 'Java coding experience',
	applicationDeadline: '2026-10-23'
};

test('job posting creation: non-recruiters are rejected and nothing is saved', async () => {
	let insertCalled = false;
	const result = await createJobPosting(
		{ id: 'user-1', role: 'job_seeker' },
		form(valid),
		async () => {
			insertCalled = true;
			return 'posting-1';
		}
	);

	assert.deepEqual(result, { status: 'forbidden' });
	assert.equal(insertCalled, false);
});

test('job posting creation: invalid values return errors and nothing is saved', async () => {
	let insertCalled = false;
	const result = await createJobPosting(
		{ id: 'recruiter-1', role: 'recruiter' },
		form({ ...valid, title: '' }),
		async () => {
			insertCalled = true;
			return 'posting-1';
		}
	);

	assert.equal(result.status, 'invalid');
	if (result.status !== 'invalid') assert.fail('Expected invalid form result.');
	assert.equal(result.errors.title, 'Job title is required.');
	assert.equal(insertCalled, false);
});

test("job posting creation: a recruiter's valid posting is saved and its id returned", async () => {
	let insertedValues: Record<string, unknown> | undefined;
	const result = await createJobPosting(
		{ id: 'recruiter-1', role: 'recruiter' },
		form(valid),
		async (values) => {
			insertedValues = values;
			return 'posting-1';
		}
	);

	assert.deepEqual(result, { status: 'created', id: 'posting-1' });
	assert.deepEqual(insertedValues, {
		title: 'Software Engineer',
		company: 'Acme',
		companyDomain: null,
		location: 'Montreal, QC',
		employmentType: 'full_time',
		workMode: 'hybrid',
		description: 'Build useful software.',
		status: 'open',
		published: false,
		requirements: 'Java coding experience',
		applicationDeadline: '2026-10-23',
		salaryMin: null,
		salaryMax: null,
		createdBy: 'recruiter-1'
	});
});
