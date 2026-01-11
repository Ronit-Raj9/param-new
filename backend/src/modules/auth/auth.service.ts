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
  });

  if (existingUser) {
    // Link existing user to Privy account
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        privyId: claims.userId,
        status: "ACTIVE",
        activatedAt: existingUser.activatedAt || new Date(),
        lastLoginAt: new Date(),
      },
    });

    // Ensure student has wallet
    await ensureStudentWallet(user, claims.userId);

    return { user, isNewUser: false };
  }

  // Create new user - need a valid name
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
