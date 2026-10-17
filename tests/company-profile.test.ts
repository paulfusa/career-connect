
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCompanyProfile } from '../src/lib/server/company-profile-validation.ts';
import { canManageCompany } from '../src/lib/server/company-profile-permissions.ts';

test('accepts valid company information', () => {
    const result = validateCompanyProfile(
        'TechNova Solutions',
        'A software development company.',
        'Montreal, Quebec',
        'https://example.com'
    );

    assert.equal(result, null);
});

test('rejects missing required fields', () => {
    const result = validateCompanyProfile(
        '',
        'Software development company',
        'Montreal',
        ''
    );

    assert.equal(result, 'Please fill in all required fields.');
});

test('accepts an empty optional website', () => {
    const result = validateCompanyProfile(
        'TechNova Solutions',
        'A software development company.',
        'Montreal',
        ''
    );

    assert.equal(result, null);
});

test('rejects invalid website URLs', () => {
    const result = validateCompanyProfile(
        'TechNova Solutions',
        'A software development company.',
        'Montreal',
        'invalid-website'
    );

    assert.equal(result, 'Please enter a valid website URL.');
});

test('rejects company names longer than 150 characters', () => {
    const result = validateCompanyProfile(
        'A'.repeat(151),
        'A software development company.',
        'Montreal',
        ''
    );

    assert.equal(result, 'One or more fields exceed the allowed length.');
});


test('recruiter can manage their own company', () => {
    const recruiter = {
        id: 'recruiter-1',
        role: 'recruiter'
    };

    assert.equal(canManageCompany(recruiter, 'recruiter-1'), true);
});

test('job seeker cannot manage a company', () => {
    const jobSeeker = {
        id: 'user-1',
        role: 'job_seeker'
    };

    assert.equal(canManageCompany(jobSeeker, 'user-1'), false);
});

test('recruiter cannot manage another company', () => {
    const recruiter = {
        id: 'recruiter-2',
        role: 'recruiter'
    };

    assert.equal(canManageCompany(recruiter, 'recruiter-1'), false);
});

test('unauthenticated users cannot manage companies', () => {
    assert.equal(canManageCompany(null, 'recruiter-1'), false);
});
