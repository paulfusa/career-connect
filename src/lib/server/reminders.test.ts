import { test } from 'node:test';
import assert from 'node:assert/strict';
import { needsReminder } from './reminders.ts';

const now = new Date('2026-10-22T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

test('reminder: decided application gets no reminder', () => {
	assert.equal(needsReminder(daysAgo(10), true, now), false);
});

test('reminder: application sent 3 days ago gets no reminder yet', () => {
	assert.equal(needsReminder(daysAgo(3), false, now), false);
});

test('reminder: application left 8 days without a decision gets a reminder', () => {
	assert.equal(needsReminder(daysAgo(8), false, now), true);
});

// exactly REMINDER_DAYS is not late yet, the reminder starts after the 7th day
test('reminder: application sent exactly a week ago', () => {
	assert.equal(needsReminder(daysAgo(7), false, now), false);
});
