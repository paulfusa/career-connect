import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyProblem, parseApplication } from './application.ts';

const form = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

const resumeId = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';

test('application: accepts a resume id', () => {
	const parsed = parseApplication(form({ resumeId }));
	assert.ok(parsed.ok);
	assert.equal(parsed.values.resumeId, resumeId);
});

test('application: rejects a missing or malformed resume id', () => {
	for (const bad of ['', 'not-a-resume']) {
		const parsed = parseApplication(form({ resumeId: bad }));
		assert.ok(!parsed.ok);
		assert.equal(parsed.errors.resumeId, 'Choose one of your resumes.');
	}
});

const openJob = { status: 'open', published: true };

test('application: missing or unpublished job is not found', () => {
	assert.equal(applyProblem(undefined, false), 'Job posting not found.');
	assert.equal(applyProblem({ ...openJob, published: false }, false), 'Job posting not found.');
});

test('application: closed job cannot be applied to', () => {
	assert.equal(applyProblem({ ...openJob, status: 'closed' }, false), 'This job is no longer receiving applications.');
});

test('application: second application is not allowed', () => {
	assert.equal(applyProblem(openJob, true), 'You have already applied to this job.');
});

test('application: open, published job with no earlier application is fine', () => {
	assert.equal(applyProblem(openJob, false), null);
});