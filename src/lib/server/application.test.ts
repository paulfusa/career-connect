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

test('application: a missing or unpublished job is not found', () => {
	assert.equal(applyProblem(undefined, false, today), 'Job posting not found.');
	assert.equal(applyProblem({ ...openJob, published: false }, false, today), 'Job posting not found.');
});

test('application: cannot apply to a closed job', () => {
	assert.equal(applyProblem({ ...openJob, status: 'closed' }, false, today), 'This job is no longer receiving applications.');
});

test('application: cannot apply twice to the same job', () => {
	assert.equal(applyProblem(openJob, true, today), 'You have already applied to this job.');
});

test('application: can apply to an open job', () => {
	assert.equal(applyProblem(openJob, false, today), null);
});

test('application: cannot apply after the deadline', () => {
	assert.equal(applyProblem({ ...openJob, applicationDeadline: '2026-10-21' }, false, today), 'The application deadline has passed.');
});

test('application: can still apply on the deadline day', () => {
	assert.equal(applyProblem({ ...openJob, applicationDeadline: today }, false, today), null);
});

const withdrawalJob = {
    status: 'open',
    published: true,
    applicationDeadline: '2026-10-31'
};

test('withdrawal: can withdraw before the deadline', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, true, '2026-10-18', false),
        null
    );
});

test('withdrawal: cannot withdraw from a closed job', () => {
    assert.equal(
        withdrawProblem({ ...withdrawalJob, status: 'closed' }, true, '2026-10-18', false),
        'This job is no longer accepting changes to applications.'
    );
});

test('withdrawal: cannot withdraw after the deadline', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, true, '2026-11-01', false),
        'The application deadline has passed.'
    );
});

test('withdrawal: can still withdraw on the deadline day', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, true, '2026-10-31', false),
        null
    );
});

test('withdrawal: cannot withdraw without an application', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, false, '2026-10-18', false),
        'You have no application to withdraw.'
    );
});

test('withdrawal: an unpublished job is not found', () => {
    assert.equal(
        withdrawProblem({ ...withdrawalJob, published: false }, true, '2026-10-18', false),
        'Job posting not found.'
    );
});

test('withdrawal: cannot withdraw once a decision was sent', () => {
    assert.equal(
        withdrawProblem(withdrawalJob, true, '2026-10-18', true),
        'You can no longer withdraw because the recruiter has already sent a decision.'
    );
});
