import type { Request, Response, NextFunction } from "express";
import type { User } from "@prisma/client";
import { verifyPrivyToken, getPrivyUser } from "../../config/privy.js";
import { prisma } from "../../config/database.js";
import { ERROR_CODES } from "../../utils/constants.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("auth-middleware");

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: User;
      privyDid?: string;
    }
  }
}

/**
 * Extract bearer token from Authorization header
 */
function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Authentication middleware - verifies Privy token
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: "Authentication required",
        },
      });
      return;
    }

    // Verify token with Privy
    const claims = await verifyPrivyToken(token);
    
    if (!claims) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_TOKEN,
          message: "Invalid or expired token",
        },
      });
      return;
    }

    // Get or create user in our database
    let user = await prisma.user.findUnique({
      where: { privyId: claims.userId },
    });

    if (!user) {
      // First time login - get user info from Privy
      const privyUser = await getPrivyUser(claims.userId);
      
      if (!privyUser) {
        res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.INVALID_TOKEN,
            message: "User not found in Privy",
          },
        });
        return;
      }

      // Extract email from Privy user
      const email = privyUser.email?.address || privyUser.google?.email;
      
      if (!email) {
        res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Email is required for registration",
          },
        });
        return;
      }

      // Check if user exists by email (might be pre-registered)
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link existing user to Privy
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            privyId: claims.userId,
            status: "ACTIVE",
            activatedAt: user.activatedAt || new Date(),
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Create new user
        const userName = privyUser.google?.name ?? email.split("@")[0];
        user = await prisma.user.create({
          data: {
            privyId: claims.userId,
            email,
            name: userName || "User",
            role: "STUDENT", // Default role
            status: "ACTIVE",
            activatedAt: new Date(),
            lastLoginAt: new Date(),
          },
        });
      }
    } else {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Attach user to request
    req.user = user;
    req.privyDid = claims.userId || "";

    next();
  } catch (error) {
    logger.error({ error }, "Authentication error");
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "Authentication failed",
      },
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    
    if (!token) {
      next();
      return;
    }

    const claims = await verifyPrivyToken(token);
    
    if (claims) {
      const user = await prisma.user.findUnique({
        where: { privyId: claims.userId },
      });
      
      if (user) {
        req.user = user;
        req.privyDid = claims.userId;
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
}
