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
	description: 'Build useful software.',
	requirements: 'Java coding experience',
	applicationDeadline: '2026-10-23'
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

test('job posting: keeps a valid company domain and drops a malformed one', () => {
	const ok = parseJobPosting(form({ ...valid, companyDomain: 'Shopify.com' }));
	assert.ok(ok.ok);
	assert.equal(ok.values.companyDomain, 'shopify.com');

	const bad = parseJobPosting(form({ ...valid, companyDomain: 'javascript:alert(1)' }));
	assert.ok(bad.ok);
	assert.equal(bad.values.companyDomain, null);

	assert.equal(parseJobPosting(form(valid)).values.companyDomain, null);
});

test('job posting: requires requirements and an application deadline', () => {
	const parsed = parseJobPosting(form({ ...valid, requirements: '', applicationDeadline: '' }));
	assert.ok(!parsed.ok);
	assert.equal(parsed.errors.requirements, 'Requirements need to be listed.');           
	assert.equal(parsed.errors.applicationDeadline, 'The deadline for job offers must be set.');
});

test('job posting: restricts to a valid salary range', () => {
	const parsed = parseJobPosting(form({ ...valid, salaryMin:'50000', salaryMax: '' })); 
	assert.ok(parsed.ok);
	assert.equal(parsed.values.salaryMin, 50000); 
});

test('job posting: rejects negative salaries and a minimum greater than the maximum', () => {
	const negative = parseJobPosting(form({ ...valid, salaryMin: '-50000' }));
	assert.ok(!negative.ok);
	assert.ok(negative.errors.salaryMin);
	const reversed = parseJobPosting(form({ ...valid, salaryMin: '50000', salaryMax: '40000' }));
	assert.ok(!reversed.ok);
	assert.equal(reversed.errors.salaryMax, 'The maximum salary cannot be less than the minimum.'); 
});

test('job posting: defaults to open status and rejects unkown statuses', () => {
	const Default = parseJobPosting(form({ ...valid}));
	assert.ok(Default.ok);
	assert.equal(Default.values.status, 'open');
	const reject = parseJobPosting(form({ ...valid, status: 'Hello' }));
	assert.ok(!reject.ok);
	assert.equal(reject.errors.status, 'Choose Open or Closed.'); 
});