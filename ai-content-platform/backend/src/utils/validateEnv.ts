/**
 * Validates that all required environment variables are set.
 * Throws an error at startup if any are missing — fail fast.
 */
export function validateEnv(): void {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n` +
      `   Copy .env.example to .env and fill in the values.`
    );
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET is shorter than 32 characters. Use a stronger secret in production.');
  }
}
