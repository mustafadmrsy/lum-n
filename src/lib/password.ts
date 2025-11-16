import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Şifre en az 8 karakter olmalıdır");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Şifre en az bir büyük harf içermelidir");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Şifre en az bir küçük harf içermelidir");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Şifre en az bir rakam içermelidir");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
