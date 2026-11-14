import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJobSearch, postedAfter } from './job-search.ts';

test('job search: trims the text fields', () => {
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

test('job search: cuts a very long keyword, company and location', () => {
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
    assert.equal(search.minSalary, '');
    assert.equal(search.postedWithin, '');
    assert.equal(search.openOnly, '');
    assert.equal(search.sort, '');
});

// US-28
test('job search: keeps a normal minimum salary and trims the spaces', () => {
    assert.equal(parseJobSearch(new URLSearchParams({ minSalary: ' 50000 ' })).minSalary, '50000');
    assert.equal(parseJobSearch(new URLSearchParams({ minSalary: '9999999' })).minSalary, '9999999');
});

test('job search: ignores a minimum salary that is not a plain number', () => {
    for (const minSalary of ['-5000', '50000.5', '50k', 'abc', '1e6', '12345678']) {
        assert.equal(parseJobSearch(new URLSearchParams({ minSalary })).minSalary, '', minSalary);
    }
});

test('job search: keeps the valid date posted and sort options and drops the rest', () => {
    for (const postedWithin of ['1', '7', '30']) {
        assert.equal(parseJobSearch(new URLSearchParams({ postedWithin })).postedWithin, postedWithin);
    }
    for (const sort of ['deadline', 'salary']) {
        assert.equal(parseJobSearch(new URLSearchParams({ sort })).sort, sort);
    }
    const invalid = parseJobSearch(new URLSearchParams({ postedWithin: '365', sort: 'cheapest' }));
    assert.equal(invalid.postedWithin, '');
    assert.equal(invalid.sort, '');
});

test('job search: odd values like constructor are not accepted', () => {
    const search = parseJobSearch(new URLSearchParams({ postedWithin: 'constructor', sort: 'toString' }));
    assert.equal(search.postedWithin, '');
    assert.equal(search.sort, '');
});

test('job search: open jobs only is on when the box is ticked', () => {
    assert.equal(parseJobSearch(new URLSearchParams({ openOnly: 'on' })).openOnly, 'on');
    assert.equal(parseJobSearch(new URLSearchParams({ openOnly: 'yes' })).openOnly, '');
});

test('job search: no date posted means no date limit', () => {
    assert.equal(postedAfter('', new Date()), null);
});

test('job search: date posted goes back the right number of days', () => {
    const now = new Date('2026-11-13T12:00:00Z');
    assert.equal(postedAfter('1', now)?.toISOString(), '2026-11-12T12:00:00.000Z');
    assert.equal(postedAfter('7', now)?.toISOString(), '2026-11-06T12:00:00.000Z');
    assert.equal(postedAfter('30', now)?.toISOString(), '2026-10-14T12:00:00.000Z');
});