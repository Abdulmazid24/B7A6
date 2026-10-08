import "dotenv/config";

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "default_jwt_access_secret_key",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "default_jwt_refresh_secret_key",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:5000",
} as const;
