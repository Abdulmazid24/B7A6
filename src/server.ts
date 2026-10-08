import { Server } from "http";
import app from "./app";
import { config } from "./config";
import prisma from "./lib/prisma";

let server: Server;

async function bootstrap() {
  try {
    server = app.listen(config.port, () => {
      console.log(`🚀 University Management System API running at http://localhost:${config.port}`);
      console.log(`📡 Environment: ${config.env}`);
      console.log(`🛡️ Rate Limiter: Active (200 req / 15m)`);
      console.log(`📚 Health check: http://localhost:${config.port}/api/v1/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }

  // Graceful shutdown
  const exitHandler = async () => {
    if (server) {
      server.close(async () => {
        console.log("🛑 Server closed gracefully");
        await prisma.$disconnect();
        process.exit(0);
      });
    } else {
      await prisma.$disconnect();
      process.exit(0);
    }
  };

  const unexpectedErrorHandler = (error: unknown) => {
    console.error("💥 Unexpected error encountered:", error);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);
  process.on("SIGTERM", exitHandler);
  process.on("SIGINT", exitHandler);
}

// Only start the HTTP listener if not running in Vercel serverless environment
if (!process.env.VERCEL) {
  bootstrap();
}

export default app;
