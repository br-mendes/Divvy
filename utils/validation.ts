export interface PasswordValidation {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
  remaining: number;
}

export function validatePassword(password: string): PasswordValidation {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\|,.<>/?]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  return {
    isValid: passed === 5,
    strength: passed <= 2 ? 'weak' : passed <= 4 ? 'medium' : 'strong',
    checks,
    remaining: 5 - passed,
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
