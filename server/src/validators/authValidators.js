const { z } = require('zod');

// Password must contain at least one letter, one digit, and one symbol, and be
// at least 8 characters long. This is enforced here (not just in the frontend)
// so it can never be bypassed by calling the API directly.
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(200)
  .regex(/[A-Za-z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least one symbol (e.g. !, @, #, $, %)');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Must be a valid email address'),
  password: passwordSchema,
  phone: z.string().trim().max(30).optional().nullable(),
  role: z.enum(['customer', 'driver']).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(20, 'Invalid or missing reset token'),
  password: passwordSchema,
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, passwordSchema };
