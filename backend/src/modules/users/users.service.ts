import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import type { User, Prisma } from "@prisma/client";
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from "./users.schema.js";

const logger = createLogger("users-service");

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw ApiError.conflict("User with this email already exists");
  }

  // Generate a placeholder privy ID - will be updated when user logs in via Privy
  const placeholderPrivyId = `placeholder_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const user = await prisma.user.create({
    data: {
      privyId: placeholderPrivyId,
      email: input.email,
      name: input.name,
      role: input.role,
      status: "PENDING_ACTIVATION",
    },
  });

  logger.info({ userId: user.id, email: input.email }, "User created");
  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id },
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

/**
 * Update user
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.role && { role: input.role }),
      ...(input.status && { 
        status: input.status,
        ...(input.status === "ACTIVE" && !existing.activatedAt && { activatedAt: new Date() }),
      }),
    },
  });

  logger.info({ userId: id, updates: input }, "User updated");
  return user;
}

/**
 * List users with filters
 */
export async function listUsers(query: ListUsersQuery) {
  const { role, status, search, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Delete user (soft delete by setting status)
 */
export async function deleteUser(id: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  await prisma.user.update({
    where: { id },
    data: { status: "DEACTIVATED" },
  });

  logger.info({ userId: id }, "User deactivated");
}

/**
 * Get user stats
 */
export async function getUserStats() {
  const [total, byRole, byStatus] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),
    prisma.user.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  return {
    total,
    byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count.role])),
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
  };
}

/**
 * Suspend user
 */
export async function suspendUser(id: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.status === "SUSPENDED") {
    throw ApiError.badRequest("User is already suspended");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });

  logger.info({ userId: id }, "User suspended");
  return updatedUser;
}

/**
 * Activate user
 */
export async function activateUser(id: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.status === "ACTIVE") {
    throw ApiError.badRequest("User is already active");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { 
      status: "ACTIVE",
      ...(!user.activatedAt && { activatedAt: new Date() }),
    },
  });

  logger.info({ userId: id }, "User activated");
  return updatedUser;
}
