// lib/validations.ts — Zod schemas for input validation
import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
});

export const checkoutSchema = z.object({
  priceId: z.string().startsWith("price_", "Invalid price ID"),
});

export const voteSchema = z.object({
  demo_poll_id: uuidSchema,
  selected_options: z
    .array(z.string())
    .min(1, "At least one option must be selected")
    .max(20, "Too many options selected"),
  voter_fingerprint: z
    .string()
    .min(1, "Voter fingerprint is required")
    .max(500, "Voter fingerprint too long"),
});
