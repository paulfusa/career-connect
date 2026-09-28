// Run with: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEducation, parseExperience, parseIntro, parsePreferences, parseSkills } from './profile.ts';

const form = (fields: Record<string, string | string[]>) => {
	const data = new FormData();
	for (const [k, v] of Object.entries(fields)) for (const item of [v].flat()) data.append(k, item);
	return data;
};
const today = new Date('2026-09-28');

test('intro: trims, normalizes links, and ignores recruiter fields for job seekers', () => {
	const r = parseIntro(
		form({ name: '  Ada Lovelace ', phone: '+1 514 555 0123', githubUrl: 'github.com/ada', company: 'Acme' }),
		'job_seeker'
	);
	assert.ok(r.ok);
	assert.equal(r.values.name, 'Ada Lovelace');
	assert.equal(r.values.githubUrl, 'https://github.com/ada');
	assert.equal(r.values.company, null);
});

test('intro: required name, valid phone and links, company required for recruiters', () => {
	const r = parseIntro(form({ name: ' ', phone: 'call me', linkedinUrl: 'not a link' }), 'recruiter');
	assert.ok(!r.ok);
	assert.equal(r.errors.name, 'Name is required.');
	assert.match(r.errors.phone, /valid phone/);
	assert.match(r.errors.linkedinUrl, /valid link/);
	assert.equal(r.errors.company, 'Company is required.');
});

test('skills: de-duplicated, top skills must be listed skills, max 5 top skills', () => {
	const ok = parseSkills(form({ skills: ['Svelte', 'SQL', 'svelte', ' '], topSkills: ['sql', 'Docker'] }));
	assert.ok(ok.ok);
	assert.deepEqual(ok.values.skills, ['Svelte', 'SQL']);
	assert.deepEqual(ok.values.topSkills, ['sql']);

	const tooMany = parseSkills(form({ skills: ['a', 'b', 'c', 'd', 'e', 'f'], topSkills: ['a', 'b', 'c', 'd', 'e', 'f'] }));
	assert.ok(!tooMany.ok);
	assert.ok(tooMany.errors.topSkills);
});

test('preferences: unknown choices are dropped', () => {
	const r = parsePreferences(form({ openToWork: 'on', jobTypes: ['internship', 'astronaut'], workModes: ['remote'] }));
	assert.ok(r.ok);
	assert.equal(r.values.openToWork, true);
	assert.deepEqual(r.values.jobTypes, ['internship']);
	assert.deepEqual(r.values.workModes, ['remote']);
});

test('experience: dates are validated and current roles have no end date', () => {
	const current = parseExperience(
		form({ title: 'Intern', company: 'Shopify', companyDomain: 'shopify.com', startDate: '2026-05', current: 'on', endDate: '2026-08' }),
		today
	);
	assert.ok(current.ok);
	assert.equal(current.values.startDate, '2026-05-01');
	assert.equal(current.values.endDate, null);

	const bad = parseExperience(form({ title: 'Intern', company: 'X', startDate: '2026-05', endDate: '2025-01' }), today);
	assert.ok(!bad.ok);
	assert.match(bad.errors.endDate, /after the start/);

	const future = parseExperience(form({ title: 'Intern', company: 'X', startDate: '2027-01', current: 'on' }), today);
	assert.ok(!future.ok);
	assert.match(future.errors.startDate, /future/);

	const missing = parseExperience(form({ title: '', company: '', startDate: '2026-01' }), today);
	assert.ok(!missing.ok);
	assert.ok(missing.errors.title && missing.errors.company && missing.errors.endDate);
});

test('education: school required, years in range and in order, bad domains dropped', () => {
	const ok = parseEducation(
		form({ school: 'Concordia University', schoolDomain: 'concordia.ca', startYear: '2023', endYear: '2027' }),
		today
	);
	assert.ok(ok.ok);
	assert.equal(ok.values.schoolDomain, 'concordia.ca');

	const bad = parseEducation(form({ school: '', schoolDomain: 'javascript:alert(1)', startYear: '2027', endYear: '2023' }), today);
	assert.ok(!bad.ok);
	assert.equal(bad.errors.school, 'School is required.');
	assert.match(bad.errors.endYear, /after the start/);

	const range = parseEducation(form({ school: 'X', startYear: '1800' }), today);
	assert.ok(!range.ok);
	assert.match(range.errors.startYear, /between 1950/);
});
