import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Return the correctly-pluralised word for a count.
 * Defaults the plural form to `${singular}s`.
 *   plural(1, "vote") -> "vote"
 *   plural(2, "vote") -> "votes"
 */
export function plural(count: number, singular: string, pluralForm?: string) {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}

/**
 * Format a count together with its correctly-pluralised word.
 *   pluralize(1, "vote")  -> "1 vote"
 *   pluralize(0, "vote")  -> "0 votes"
 *   pluralize(3, "person", "people") -> "3 people"
 */
export function pluralize(count: number, singular: string, pluralForm?: string) {
  return `${count} ${plural(count, singular, pluralForm)}`;
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
