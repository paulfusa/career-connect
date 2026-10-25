import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptanceRate } from './acceptance-rate.ts';

test('acceptance rate: not shown before any decision is made', () => {
	assert.equal(acceptanceRate(4, 0, 0), null);
});

test('acceptance rate: offers out of all applications, as a percentage', () => {
	assert.equal(acceptanceRate(4, 1, 2), 25);
});

test('acceptance rate: rounds to the nearest whole percentage', () => {
	assert.equal(acceptanceRate(3, 1, 3), 33);
});

test('acceptance rate: 0% when every decision is a rejection', () => {
	assert.equal(acceptanceRate(5, 0, 5), 0);
});
