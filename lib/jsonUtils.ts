// lib/jsonUtils.ts

/**
 * Safely parse JSON with fallback values
 * Handles cases where input is already an object, null, undefined, or invalid JSON
 */
export const safeJsonParse = <T>(jsonString: unknown, fallback: T): T => {
  // If it's already an object/array, return it
  if (typeof jsonString === "object") return jsonString as T;

  // If it's not a string, convert to string first
  if (typeof jsonString !== "string") {
    jsonString = String(jsonString);
  }

  if (typeof jsonString === "string") {
    // Handle empty strings
    if (jsonString.trim() === "") return fallback;

    try {
      const parsed = JSON.parse(jsonString);
      return parsed !== null ? parsed : fallback;
    } catch (error) {
      console.error("JSON parse error:", {
        error: error instanceof Error ? error.message : error,
        input: jsonString,
        inputType: typeof jsonString,
        inputLength: (jsonString as string).length,
        preview: (jsonString as string).substring(0, 100),
      });
      return fallback;
    }
  }

  return fallback;
};
