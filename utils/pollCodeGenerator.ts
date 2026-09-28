// utils/pollCodeGenerator.ts
import { checkPollCodeExists } from "@/lib/supabaseHelpers";

export const generateUniquePollCode = async (): Promise<string> => {
  const generateCode = (length: number): string => {
    // Uppercase only, and no ambiguous glyphs (0/O, 1/I) so a room can read a
    // code off a screen and type it without confusion. Matches the "six-
    // character code" promised on the homepage.
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const tryLength = async (
    length: number,
    maxAttempts: number = 5,
  ): Promise<string | null> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = generateCode(length);
      const exists = await checkPollCodeExists(code);
      if (!exists) {
        return code;
      }
    }
    return null;
  };

  // Six characters, matching the homepage promise and the newer polls.
  let code = await tryLength(6, 5);
  if (code) return code;

  // Grow the code space only if six-character codes keep colliding.
  code = await tryLength(7, 5);
  if (code) return code;

  code = await tryLength(8, 5);
  if (code) return code;

  // If all fail, throw an error
  throw new Error(
    "Unable to generate unique poll code after multiple attempts",
  );
};
