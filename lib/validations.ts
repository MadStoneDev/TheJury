// lib/validations.ts — Zod schemas for input validation
import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid UUID format");

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
