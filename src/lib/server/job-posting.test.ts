import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJobPosting } from './job-posting.ts';

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
	description: 'Build useful software.'
};

test('job posting: trims valid fields', () => {
	const parsed = parseJobPosting(form({ ...valid, title: '  Software Engineer  ' }));
	assert.ok(parsed.ok);
	assert.equal(parsed.values.title, 'Software Engineer');
});

test('job posting: rejects missing fields and invalid choices', () => {
	const parsed = parseJobPosting(form({ ...valid, title: ' ', employmentType: 'invalid', workMode: '' }));
	assert.ok(!parsed.ok);
	assert.equal(parsed.errors.title, 'Job title is required.');
	assert.equal(parsed.errors.employmentType, 'Choose a valid employment type.');
	assert.equal(parsed.errors.workMode, 'Choose a valid work mode.');
});

test('job posting: rejects inherited object property names as choices', () => {
	const parsed = parseJobPosting(form({ ...valid, employmentType: 'toString', workMode: 'constructor' }));
	assert.ok(!parsed.ok);
	assert.ok(parsed.errors.employmentType);
	assert.ok(parsed.errors.workMode);
});

test('job posting: enforces field length limits', () => {
	const parsed = parseJobPosting(form({ ...valid, description: 'x'.repeat(5001) }));
	assert.ok(!parsed.ok);
	assert.match(parsed.errors.description ?? '', /5000 characters or fewer/);
});
