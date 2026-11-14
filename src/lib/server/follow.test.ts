import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canSeeProfile, followProblem, roleToFind } from './follow.ts';

const seeker = { id: 'seeker-1', role: 'job_seeker' };
const recruiter = { id: 'recruiter-1', role: 'recruiter' };

test("follow: job seekers and recruiters can see each other's profiles", () => {
    assert.equal(canSeeProfile('job_seeker', 'recruiter'), true);
    assert.equal(canSeeProfile('recruiter', 'job_seeker'), true);
});

test("follow: people with the same role cannot see each other's profiles", () => {
    assert.equal(canSeeProfile('job_seeker', 'job_seeker'), false);
    assert.equal(canSeeProfile('recruiter', 'recruiter'), false);
    assert.equal(canSeeProfile('admin', 'recruiter'), false);
});

test('follow: a job seeker can follow a recruiter and the other way around', () => {
    assert.equal(followProblem(seeker, recruiter), null);
    assert.equal(followProblem(recruiter, seeker), null);
});

test('follow: you cannot follow yourself', () => {
    assert.equal(followProblem(seeker, seeker), "You can't follow yourself.");
});

test('follow: an unknown user and a user with the same role get the same not found message', () => {
    assert.equal(followProblem(seeker, undefined), 'User not found.');
    assert.equal(followProblem(seeker, { id: 'seeker-2', role: 'job_seeker' }), 'User not found.');
    assert.equal(followProblem(recruiter, { id: 'recruiter-2', role: 'recruiter' }), 'User not found.');
});

test('follow: job seekers look through recruiters and recruiters through job seekers', () => {
    assert.equal(roleToFind('job_seeker'), 'recruiter');
    assert.equal(roleToFind('recruiter'), 'job_seeker');
});

test('follow: you can open the profile of everyone on that page', () => {
    assert.equal(canSeeProfile('job_seeker', roleToFind('job_seeker')), true);
    assert.equal(canSeeProfile('recruiter', roleToFind('recruiter')), true);
});
