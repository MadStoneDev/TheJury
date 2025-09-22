// lib/jsonUtils.ts

/**
 * Safely parse JSON with fallback values
 * Handles cases where input is already an object, null, undefined, or invalid JSON
 */
export const safeJsonParse = <T = any>(jsonString: any, fallback: T): T => {
  // Handle null/undefined
  if (jsonString == null) return fallback;

  // If it's already an object/array, return it
  if (typeof jsonString === "object") return jsonString;

  // If it's not a string, convert to string first
  if (typeof jsonString !== "string") {
    jsonString = String(jsonString);
  }

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
      inputLength: jsonString.length,
      preview: jsonString.substring(0, 100),
    });
    return fallback;
  }
};

/**
 * Safely stringify JSON with error handling
 */
export const safeJsonStringify = (
  obj: any,
  fallback: string = "{}",
): string => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error("JSON stringify error:", error, obj);
    return fallback;
  }
};

/**
 * Parse database JSON field that could be string or already parsed
 */
export const parseDbJsonField = <T = any>(field: any, fallback: T): T => {
  // Common patterns in database JSON fields
  if (Array.isArray(field)) return field as T;
  if (typeof field === "object" && field !== null) return field as T;
  return safeJsonParse(field, fallback);
};

/**
 * Validate that parsed JSON matches expected structure
 */
export const validateJsonStructure = (
  parsed: any,
  validator: (obj: any) => boolean,
  fallback: any,
) => {
  if (validator(parsed)) {
    return parsed;
  }
  console.warn("JSON structure validation failed:", parsed);
  return fallback;
};
