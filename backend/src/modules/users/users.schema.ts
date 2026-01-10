import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(["ADMIN", "ACADEMIC", "STUDENT"]),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    role: z.enum(["ADMIN", "ACADEMIC", "STUDENT"]).optional(),
    status: z.enum(["PENDING_ACTIVATION", "ACTIVE", "SUSPENDED", "DEACTIVATED"]).optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    role: z.enum(["ADMIN", "ACADEMIC", "STUDENT"]).optional(),
    status: z.enum(["PENDING_ACTIVATION", "ACTIVE", "SUSPENDED", "DEACTIVATED"]).optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
export type ListUsersQuery = z.infer<typeof listUsersSchema>["query"];
