import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJobSearch } from './job-search.ts';

test('job search: trims text', () => {
    const search = parseJobSearch(new URLSearchParams({ keyword: '  developer  ', company: ' Acme ', location: ' Montreal ' }));
    assert.equal(search.keyword, 'developer');
    assert.equal(search.company, 'Acme');
    assert.equal(search.location, 'Montreal');
});

test('job search: keeps the valid dropdowns and drops the rest', () => {
    const valid = parseJobSearch(new URLSearchParams({ employmentType: 'full_time', workMode: 'remote' }));
    assert.equal(valid.employmentType, 'full_time');
    assert.equal(valid.workMode, 'remote');
    const invalid = parseJobSearch(new URLSearchParams({ employmentType: 'banana', workMode: 'underwater' }));
    assert.equal(invalid.employmentType, '');
    assert.equal(invalid.workMode, '');
});

test('job search: cutting a very long keyword, company, and location', () => {
    const search = parseJobSearch(new URLSearchParams({ keyword: 'x'.repeat(150), company: 'y'.repeat(150), location: 'y'.repeat(150) }));
    assert.equal(search.keyword.length, 100);
    assert.equal(search.company.length, 100);
    assert.equal(search.location.length, 100);
});

test('job search: missing fields are returned as empty', () => {
    const search = parseJobSearch(new URLSearchParams({}));
    assert.equal(search.keyword, '');
    assert.equal(search.company, '');
    assert.equal(search.location, '');
    assert.equal(search.employmentType, '');
    assert.equal(search.workMode, '');
});