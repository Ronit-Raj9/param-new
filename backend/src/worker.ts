/**
 * Worker Entry Point
 * Run with: node dist/worker.js
 */
import "dotenv/config";
import { startWorkers } from "./jobs/index.js";
import { createLogger } from "./utils/logger.js";

const logger = createLogger("worker");

async function main() {
  logger.info("Starting worker process...");

  try {
    const workers = startWorkers();
    
    logger.info({
      blockchain: "running",
      csv: "running",
      pdf: "running",
    }, "All workers initialized");

    // Keep the process alive
    process.on("uncaughtException", (error) => {
      logger.error({ error }, "Uncaught exception in worker");
    });

    process.on("unhandledRejection", (reason) => {
      logger.error({ reason }, "Unhandled rejection in worker");
    });

  } catch (error) {
    logger.error({ error }, "Failed to start workers");
    process.exit(1);
  }
}

main();
