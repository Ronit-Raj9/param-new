import pino from "pino";
import { env, isDev } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    env: env.NODE_ENV,
  },
});

// Child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};
