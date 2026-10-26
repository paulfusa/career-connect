
import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePasswordReset } from '../src/lib/server/password-reset-validation.ts';

const valid = {
  email: 'test@example.com',
  otp: '123456',
  password: 'NewPassword123',
  confirmPassword: 'NewPassword123'
};

test('password reset: accepts a valid email, code and password', () => {
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

test('password reset: rejects an invalid email address', () => {
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

test('password reset: rejects a code shorter than 6 digits', () => {
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

test('password reset: rejects a code with letters', () => {
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

test('password reset: rejects a password under 8 characters', () => {
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

test("password reset: rejects passwords that don't match", () => {
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

test('password reset: accepts a password of exactly 8 characters', () => {
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
