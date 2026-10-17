import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptanceRate } from './acceptance-rate.ts';

test('acceptance rate: unavailable before any final decision', () => {
	assert.equal(acceptanceRate(4, 0, 0), null);
});

test('acceptance rate: offered divided by submitted, the rate is a percentage', () => {
	assert.equal(acceptanceRate(4, 1, 2), 25);
});

test('acceptance rate: rounds to the nearest whole percentage', () => {
	assert.equal(acceptanceRate(3, 1, 3), 33);
});

test('acceptance rate: zero when every decision was a rejection', () => {
	assert.equal(acceptanceRate(5, 0, 5), 0);
});
