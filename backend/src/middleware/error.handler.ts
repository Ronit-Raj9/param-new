import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ERROR_CODES } from "../utils/constants.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("error-handler");

// Custom API Error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, code: string = ERROR_CODES.VALIDATION_ERROR) {
    return new ApiError(400, code, message);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(401, ERROR_CODES.UNAUTHORIZED, message);
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError(403, ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message: string = "Not found") {
    return new ApiError(404, ERROR_CODES.NOT_FOUND, message);
  }

  static conflict(message: string) {
    return new ApiError(409, ERROR_CODES.CONFLICT, message);
  }

  static internal(message: string = "Internal server error") {
    return new ApiError(500, ERROR_CODES.INTERNAL_ERROR, message);
  }
}

// Error response format
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Global error handler
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "An unexpected error occurred",
    },
  };

  let statusCode = 500;

  // Handle known error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    response.error.code = err.code;
    response.error.message = err.message;
    if (err.details) {
      response.error.details = err.details;
    }
  } else if (err instanceof ZodError) {
    statusCode = 400;
    response.error.code = ERROR_CODES.VALIDATION_ERROR;
    response.error.message = "Validation failed";
    response.error.details = {
      errors: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    };
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // Unique constraint violation
        statusCode = 409;
        response.error.code = ERROR_CODES.DUPLICATE_ENTRY;
        response.error.message = "A record with this value already exists";
        break;
      case "P2025": // Record not found
        statusCode = 404;
        response.error.code = ERROR_CODES.NOT_FOUND;
        response.error.message = "Record not found";
        break;
      default:
        response.error.code = ERROR_CODES.DATABASE_ERROR;
        response.error.message = "Database error occurred";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    response.error.code = ERROR_CODES.VALIDATION_ERROR;
    response.error.message = "Invalid data provided";
  }

  res.status(statusCode).json(response);
};

// Not found handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

// Async handler wrapper to catch errors
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
