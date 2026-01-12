import { prisma } from "../../config/database.js";
import { verifyPrivyToken, getPrivyUser } from "../../config/privy.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import { queueCreateStudentWallet } from "../../queues/wallet.queue.js";
import type { User } from "@prisma/client";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const logger = createLogger("auth-service");

export interface AuthResult {
  user: User;
  isNewUser: boolean;
}

/**
 * Verify Privy token and get/create user
 */
export async function authenticateWithPrivy(input: LoginInput): Promise<AuthResult> {
  // Verify the Privy token
  const claims = await verifyPrivyToken(input.token);

  if (!claims) {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  // Check if user exists in our database
  let user = await prisma.user.findUnique({
    where: { privyId: claims.userId },
  });

  if (user) {
    // Update last login
    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Ensure student has wallet (background job if needed)
    await ensureStudentWallet(user, claims.userId);

    return { user, isNewUser: false };
  }

  // Get user info from Privy
  const privyUser = await getPrivyUser(claims.userId);

  if (!privyUser) {
    throw ApiError.unauthorized("User not found in Privy");
  }

  // Extract email
  const email = privyUser.email?.address || privyUser.google?.email;

  if (!email) {
    throw ApiError.badRequest("Email is required for registration");
  }

  // Check if user exists by email (pre-registered)
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { student: true }, // Include student to check status
  });

  if (existingUser) {
    const isPending = existingUser.status === "PENDING_ACTIVATION";

    // Link existing user to Privy account
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        privyId: claims.userId,
        status: "ACTIVE", // Auto-activate on first successful login
        activatedAt: isPending ? new Date() : existingUser.activatedAt,
        lastLoginAt: new Date(),
      },
    });

    // If there is a student record linked, ensure it is also active
    if (existingUser.student && existingUser.student.status === "PENDING_ACTIVATION") {
      await prisma.student.update({
        where: { id: existingUser.student.id },
        data: { status: "ACTIVE" },
      });
    }

    // Ensure student has wallet
    await ensureStudentWallet(user, claims.userId);

    return { user, isNewUser: false };
  }

  // Check if there is a Student record with this email, but no User record (should trigger linking)
  const existingStudent = await prisma.student.findFirst({
    where: { email },
    include: { user: true },
  });

  if (existingStudent) {
    if (existingStudent.user) {
      // This shouldn't typically happen if user query by email failed, 
      // unless data is inconsistent (student email != user email)
      // But if we find a user via student, let's use it
      user = await prisma.user.update({
        where: { id: existingStudent.user.id },
        data: {
          privyId: claims.userId,
          status: "ACTIVE",
          lastLoginAt: new Date(),
        }
      });
    } else {
      // Create user for this student
      const userName = privyUser.google?.name || existingStudent.name || (email.split("@")[0] || "User");

      user = await prisma.user.create({
        data: {
          privyId: claims.userId,
          email,
          name: userName,
          role: "STUDENT",
          status: "ACTIVE",
          activatedAt: new Date(),
          lastLoginAt: new Date(),
          student: {
            connect: { id: existingStudent.id }
          }
        }
      });

      // Activate student status if pending
      if (existingStudent.status === "PENDING_ACTIVATION") {
        await prisma.student.update({
          where: { id: existingStudent.id },
          data: { status: "ACTIVE" }
        });
      }
    }

    await ensureStudentWallet(user, claims.userId);
    return { user, isNewUser: true };
  }


  // Create new user - normal flow for non-pre-registered
  // Check if admin email domain or other logic if needed, otherwise default to STUDENT
  const userName = privyUser.google?.name || email.split("@")[0] || "User";

  user = await prisma.user.create({
    data: {
      privyId: claims.userId,
      email,
      name: userName,
      role: "STUDENT",
      status: "ACTIVE",
      activatedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  logger.info({ userId: user.id, email }, "New user created");

  // Queue wallet creation for new student
  await ensureStudentWallet(user, claims.userId);

  return { user, isNewUser: true };
}

/**
 * Ensure student has a wallet - enqueue creation job if missing
 */
async function ensureStudentWallet(user: User, privyUserId: string): Promise<void> {
  // Only create wallets for students
  if (user.role !== "STUDENT") {
    return;
  }

  // Check if user has a linked student record
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
  });

  if (!student) {
    // No student record yet - wallet will be created when student record is created
    logger.debug({ userId: user.id }, "No student record - skipping wallet check");
    return;
  }

  // Check if student already has a wallet
  if (student.walletAddress) {
    logger.debug({ studentId: student.id, walletAddress: student.walletAddress }, "Student already has wallet");
    return;
  }

  // Enqueue wallet creation job
  await queueCreateStudentWallet({
    studentId: student.id,
    userId: user.id,
    privyUserId,
  });

  logger.info({ studentId: student.id, userId: user.id }, "Wallet creation job enqueued");
}

/**
 * Pre-register a user (admin only)
 */
export async function preRegisterUser(input: RegisterInput, createdBy: string): Promise<User> {
  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw ApiError.conflict("User with this email already exists");
  }

  // Generate a placeholder privy ID - will be updated when user logs in
  const placeholderPrivyId = `placeholder_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role || "STUDENT",
      privyId: placeholderPrivyId,
      status: "PENDING_ACTIVATION",
    },
  });

  logger.info({ userId: user.id, email: input.email, createdBy }, "User pre-registered");
  return user;
}

/**
 * Get current user profile
 */
export async function getUserProfile(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: {
        include: {
          program: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user;
}
// ===========================================
// ACTIVATION TOKEN FUNCTIONS
// ===========================================

export interface ActivationTokenInfo {
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  student?: {
    name: string;
    email: string;
    enrollmentNumber: string;
    program?: string;
  };
}

/**
 * Validate an activation token (public endpoint)
 */
export async function validateActivationToken(token: string): Promise<ActivationTokenInfo> {
  const activationToken = await prisma.activationToken.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          student: {
            include: { program: true },
          },
        },
      },
    },
  });

  if (!activationToken) {
    return { valid: false };
  }

  if (activationToken.used) {
    return { valid: false, used: true };
  }

  if (activationToken.expiresAt < new Date()) {
    return { valid: false, expired: true };
  }

  const student = activationToken.user.student;
  return {
    valid: true,
    student: student ? {
      name: student.name,
      email: student.email,
      enrollmentNumber: student.enrollmentNumber,
      program: student.program?.name,
    } : undefined,
  };
}

/**
 * Complete activation after Privy login
 * Called when student logs in via Privy with a valid activation token
 */
export async function completeActivation(
  token: string,
  privyUserId: string,
  walletAddress: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  // Find and validate token
  const activationToken = await prisma.activationToken.findUnique({
    where: { token },
    include: {
      user: {
        include: { student: true },
      },
    },
  });

  if (!activationToken) {
    return { success: false, error: "Invalid activation token" };
  }

  if (activationToken.used) {
    return { success: false, error: "Activation token already used" };
  }

  if (activationToken.expiresAt < new Date()) {
    return { success: false, error: "Activation token expired" };
  }

  const { user } = activationToken;
  const { student } = user;

  // Update everything in a transaction
  const updatedUser = await prisma.$transaction(async (tx) => {
    // Mark token as used
    await tx.activationToken.update({
      where: { id: activationToken.id },
      data: { used: true, usedAt: new Date() },
    });

    // Update user - link to Privy and activate
    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        privyId: privyUserId,
        status: "ACTIVE",
        activatedAt: new Date(),
        lastLoginAt: new Date(),
      },
    });

    // Update student with wallet address and activate
    if (student) {
      await tx.student.update({
        where: { id: student.id },
        data: {
          status: "ACTIVE",
          walletAddress,
        },
      });
    }

    return updated;
  });

  logger.info({ userId: user.id, studentId: student?.id, walletAddress }, "Account activated");

  // Queue blockchain sync if student exists with wallet
  if (student && walletAddress) {
    try {
      // Import dynamically to avoid circular dependency
      const { queueSyncStudent } = await import("../../queues/blockchain.queue.js");
      await queueSyncStudent(student.id);
    } catch (error) {
      logger.error({ error, studentId: student.id }, "Failed to queue chain sync");
      // Don't fail activation if chain sync fails
    }
  }

  return { success: true, user: updatedUser };
}