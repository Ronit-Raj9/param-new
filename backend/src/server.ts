import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma, connectDatabase, disconnectDatabase } from "./config/database.js";
import { createLogger } from "./utils/logger.js";

const logger = createLogger("server");

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info("Database connected successfully");

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`Server started on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
      logger.info(`API base: http://localhost:${env.PORT}/api/v1`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info("HTTP server closed");
        
        await disconnectDatabase();
        logger.info("Database disconnected");
        
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.fatal({ error }, "Uncaught exception");
      process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
      logger.error({ reason }, "Unhandled rejection");
    });

  } catch (error) {
    logger.fatal({ error }, "Failed to start server");
    process.exit(1);
  }
}

startServer();
