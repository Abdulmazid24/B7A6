import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000").transform((val) => Number(val)),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is strictly required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is strictly required"),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  CLIENT_URL: z.string().default("http://localhost:5000"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables configuration:");
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const config = {
  env: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  jwt: {
    accessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
    accessExpiresIn: parsedEnv.data.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
    refreshExpiresIn: parsedEnv.data.JWT_REFRESH_EXPIRES_IN,
  },
  stripe: {
    secretKey: parsedEnv.data.STRIPE_SECRET_KEY,
    webhookSecret: parsedEnv.data.STRIPE_WEBHOOK_SECRET,
  },
  google: {
    clientId: parsedEnv.data.GOOGLE_CLIENT_ID,
  },
  clientUrl: parsedEnv.data.CLIENT_URL,
} as const;

export type ConfigType = typeof config;
