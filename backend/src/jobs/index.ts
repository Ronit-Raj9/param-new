import { createBlockchainWorker } from "./blockchain/blockchain.worker.js";
import { createCSVWorker } from "./csv/csv.worker.js";
import { createPDFWorker } from "./pdf/pdf.worker.js";
import { createWalletWorker } from "./wallet/wallet.worker.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("workers");

/**
 * Start all workers
 */
export function startWorkers() {
  logger.info("Starting all workers...");

  const blockchainWorker = createBlockchainWorker();
  const csvWorker = createCSVWorker();
  const pdfWorker = createPDFWorker();
  const walletWorker = createWalletWorker();

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down workers...");

    await Promise.all([
      blockchainWorker.close(),
      csvWorker.close(),
      pdfWorker.close(),
      walletWorker.close(),
    ]);

    logger.info("All workers stopped");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  logger.info("All workers started successfully");

  return {
    blockchainWorker,
    csvWorker,
    pdfWorker,
    walletWorker,
  };
}

// Export for standalone worker process
export { createBlockchainWorker } from "./blockchain/blockchain.worker.js";
export { createCSVWorker } from "./csv/csv.worker.js";
export { createPDFWorker } from "./pdf/pdf.worker.js";
export { createWalletWorker } from "./wallet/wallet.worker.js";
