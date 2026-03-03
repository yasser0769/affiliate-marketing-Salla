import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url(),
  SALLA_WEBHOOK_SECRET: z.string().min(1),
  SALLA_API_BASE: z.string().url().default('https://api.salla.dev'),
  SALLA_ACCOUNTS_BASE: z.string().url().default('https://accounts.salla.sa'),
  SALLA_CLIENT_ID: z.string().min(1),
  SALLA_CLIENT_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32).optional()
});

export const env = EnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_BASE_URL: process.env.APP_BASE_URL,
  SALLA_WEBHOOK_SECRET: process.env.SALLA_WEBHOOK_SECRET,
  SALLA_API_BASE: process.env.SALLA_API_BASE ?? 'https://api.salla.dev',
  SALLA_ACCOUNTS_BASE: process.env.SALLA_ACCOUNTS_BASE ?? 'https://accounts.salla.sa',
  SALLA_CLIENT_ID: process.env.SALLA_CLIENT_ID,
  SALLA_CLIENT_SECRET: process.env.SALLA_CLIENT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY
});
