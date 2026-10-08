
import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePasswordReset } from '../src/lib/server/password-reset-validation.ts';

const valid = {
  email: 'test@example.com',
  otp: '123456',
  password: 'NewPassword123',
  confirmPassword: 'NewPassword123'
};

test('accepts valid password reset input', () => {
  assert.equal(
    validatePasswordReset(
      valid.email,
      valid.otp,
      valid.password,
      valid.confirmPassword
    ),
    null
  );
});

test('rejects invalid email addresses', () => {
  assert.match(
    validatePasswordReset(
      'invalid-email',
      valid.otp,
      valid.password,
      valid.confirmPassword
    )!,
    /valid email/
  );
});

test('rejects codes shorter than 6 digits', () => {
  assert.match(
    validatePasswordReset(
      valid.email,
      '12345',
      valid.password,
      valid.confirmPassword
    )!,
    /6-digit/
  );
});

test('rejects codes containing letters', () => {
  assert.match(
    validatePasswordReset(
      valid.email,
      '12345a',
      valid.password,
      valid.confirmPassword
    )!,
    /6-digit/
  );
});

test('rejects passwords shorter than 8 characters', () => {
  assert.match(
    validatePasswordReset(
      valid.email,
      valid.otp,
      'short',
      'short'
    )!,
    /8 characters/
  );
});

test('rejects mismatched passwords', () => {
  assert.match(
    validatePasswordReset(
      valid.email,
      valid.otp,
      valid.password,
      'DifferentPassword'
    )!,
    /do not match/
  );
});

test('accepts a password of exactly 8 characters', () => {
  assert.equal(
    validatePasswordReset(
      valid.email,
      valid.otp,
      'Abcd1234',
      'Abcd1234'
    ),
    null
  );
});
