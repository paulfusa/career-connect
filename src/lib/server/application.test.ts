import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyProblem, parseApplication, withdrawProblem } from './application.ts';

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

const openJob = { status: 'open', published: true, applicationDeadline: null };
const today = '2026-10-22';

test('application: missing or unpublished job is not found', () => {
	assert.equal(applyProblem(undefined, false, today), 'Job posting not found.');
	assert.equal(applyProblem({ ...openJob, published: false }, false, today), 'Job posting not found.');
});

test('application: closed job cannot be applied to', () => {
	assert.equal(applyProblem({ ...openJob, status: 'closed' }, false, today), 'This job is no longer receiving applications.');
});

test('application: second application is not allowed', () => {
	assert.equal(applyProblem(openJob, true, today), 'You have already applied to this job.');
});

test('application: open, published job with no earlier application is fine', () => {
	assert.equal(applyProblem(openJob, false, today), null);
});

// TODO (Mohamad): 2 deadline tests, one the day after the deadline and one on the deadline itself

const withdrawalJob = {
    status: 'open',
    published: true,
    applicationDeadline: '2026-10-31'
};

test('withdrawal: allows withdrawing an existing application before deadline', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, true, '2026-10-18', false),
        null
    );
});

test('withdrawal: rejects closed jobs', () => {
    assert.equal(
        withdrawProblem({ ...withdrawalJob, status: 'closed' }, true, '2026-10-18', false),
        'This job is no longer accepting changes to applications.'
    );
});

test('withdrawal: rejects expired deadlines', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, true, '2026-11-01', false),
        'The application deadline has passed.'
    );
});

test('withdrawal: permits withdrawing on the deadline date', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, true, '2026-10-31', false),
        null
    );
});

test('withdrawal: rejects missing applications', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, false, '2026-10-18', false),
        'You have no application to withdraw.'
    );
});

test('withdrawal: rejects unpublished jobs', () => {
    assert.equal(
        withdrawProblem({ ...withdrawalJob, published: false }, true, '2026-10-18', false),
        'Job posting not found.'
    );
});

test('withdrawal: rejects withdrawing after a decision was sent', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, true, '2026-10-18', true),
        'You can no longer withdraw because the recruiter has already sent a decision.'
    );
});
