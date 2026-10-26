
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCompanyProfile } from '../src/lib/server/company-profile-validation.ts';
import { canManageCompany } from '../src/lib/server/company-profile-permissions.ts';

test('company profile: accepts valid company information', () => {
    const result = validateCompanyProfile(
        'TechNova Solutions',
        'A software development company.',
        'Montreal, Quebec',
        'https://example.com'
    );

    assert.equal(result, null);
});

test('company profile: rejects missing required fields', () => {
    const result = validateCompanyProfile(
        '',
        'Software development company',
        'Montreal',
        ''
    );

    assert.equal(result, 'Please fill in all required fields.');
});

test('company profile: accepts an empty optional website', () => {
    const result = validateCompanyProfile(
        'TechNova Solutions',
        'A software development company.',
        'Montreal',
        ''
    );

    assert.equal(result, null);
});

test('company profile: rejects an invalid website URL', () => {
    const result = validateCompanyProfile(
        'TechNova Solutions',
        'A software development company.',
        'Montreal',
        'invalid-website'
    );

    assert.equal(result, 'Please enter a valid website URL.');
});

test('company profile: rejects a name over 150 characters', () => {
    const result = validateCompanyProfile(
        'A'.repeat(151),
        'A software development company.',
        'Montreal',
        ''
    );

    assert.equal(result, 'One or more fields exceed the allowed length.');
});


test('company profile: a recruiter can manage their own company', () => {
    const recruiter = {
        id: 'recruiter-1',
        role: 'recruiter'
    };

    assert.equal(canManageCompany(recruiter, 'recruiter-1'), true);
});

test('company profile: a job seeker cannot manage a company', () => {
    const jobSeeker = {
        id: 'user-1',
        role: 'job_seeker'
    };

    assert.equal(canManageCompany(jobSeeker, 'user-1'), false);
});

test("company profile: a recruiter cannot manage another recruiter's company", () => {
    const recruiter = {
        id: 'recruiter-2',
        role: 'recruiter'
    };

    assert.equal(canManageCompany(recruiter, 'recruiter-1'), false);
});

test('company profile: guests cannot manage companies', () => {
    assert.equal(canManageCompany(null, 'recruiter-1'), false);
});
