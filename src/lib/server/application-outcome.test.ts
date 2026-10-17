import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOutcome } from './application-outcome.ts';

const form = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

const offer = {
	status: 'offered',
	message: 'Your interviews went very well, and the team was impressed by your database project. We would like you to join us.',
	nextSteps: 'Reply to hr@acme.com by October 30 to accept, and we will send your contract.'
};

test('outcome: trims valid fields', () => {
	const parsed = parseOutcome(form({ ...offer, message: `  ${offer.message}  ` }));
	assert.ok(parsed.ok);
	assert.equal(parsed.values.message, offer.message);
});

test('outcome: rejects a status other than offered or rejected', () => {
	const parsed = parseOutcome(form({ ...offer, status: 'interview' }));
	assert.ok(!parsed.ok);
	assert.equal(parsed.errors.status, 'Choose Offered or Rejected.');
});

test('outcome: enforces the message length limit', () => {
	const parsed = parseOutcome(form({ ...offer, message: 'x'.repeat(2001) }));
	assert.ok(!parsed.ok);
	assert.ok(parsed.errors.message);
});

test('outcome: rejects a message shorter than the minimum', () => {
	const parsed = parseOutcome(form({ ...offer, message: 'y'.repeat(99) }));
	assert.ok(!parsed.ok);
	assert.ok(parsed.errors.message);
});

test('outcome: requires next steps for an offer', () => {
	const parsed = parseOutcome(form({ ...offer, nextSteps: '' }));
	assert.ok(!parsed.ok);
	assert.ok(parsed.errors.nextSteps);
});

test('outcome: clears next steps for a rejection', () => {
	const parsed = parseOutcome(form({ ...offer, status: 'rejected' }));
	assert.ok(parsed.ok);
	assert.equal(parsed.values.nextSteps, '');
});

test('outcome: enforces the next steps length limit', () => {
	const parsed = parseOutcome(form({ ...offer, nextSteps: 'x'.repeat(2001) }));
	assert.ok(!parsed.ok);
	assert.ok(parsed.errors.nextSteps);
});
