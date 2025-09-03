// utils/pollCodeGenerator.ts
import { checkPollCodeExists } from "@/lib/supabaseHelpers";

export const generateUniquePollCode = async (): Promise<string> => {
  const generateCode = (length: number): string => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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

  // Try 8 characters first
  let code = await tryLength(8, 5);
  if (code) return code;

  // Try 9 characters
  code = await tryLength(9, 5);
  if (code) return code;

  // Try 10 characters
  code = await tryLength(10, 5);
  if (code) return code;

  // If all fail, throw an error
  throw new Error(
    "Unable to generate unique poll code after multiple attempts",
  );
};
