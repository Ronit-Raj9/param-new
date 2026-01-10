import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { ERROR_CODES } from "../utils/constants.js";

/**
 * Role guard middleware - restricts access to specific roles
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: "Authentication required",
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRole("ADMIN");

/**
 * Require admin or academic role
 */
export const requireAcademic = requireRole("ADMIN", "ACADEMIC");

/**
 * Require student role
 */
export const requireStudent = requireRole("STUDENT");

/**
 * Require any authenticated user
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: "Authentication required",
      },
    });
    return;
  }

  // Check if user is active
  if (req.user.status !== "ACTIVE") {
    res.status(403).json({
      success: false,
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: `Account is ${req.user.status.toLowerCase()}`,
      },
    });
    return;
  }

  next();
}
