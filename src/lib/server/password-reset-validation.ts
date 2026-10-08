
export function validatePasswordReset(
  email: string,
  otp: string,
  password: string,
  confirmPassword: string
): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address.';
  }

  if (!/^\d{6}$/.test(otp)) {
    return 'Enter the 6-digit reset code.';
  }

  if (password.length < 8) {
    return 'Password must contain at least 8 characters.';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
}
