import { z } from "zod";

// Login request (Privy token)
export const loginSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
  }),
});

// Register request (for pre-creating users)
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(["ADMIN", "ACADEMIC", "STUDENT"]).optional().default("STUDENT"),
  }),
});

// Link wallet (for students after degree approval)
export const linkWalletSchema = z.object({
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  }),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LinkWalletInput = z.infer<typeof linkWalletSchema>["body"];
