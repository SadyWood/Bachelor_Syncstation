// apps/api/src/utils/slug.ts

/**
 * Converts a string to a URL-friendly slug.
 *
 * Rules:
 * - Lowercase
 * - Replace non-alphanumeric characters with hyphens
 * - Remove leading/trailing hyphens
 * - Max 160 characters
 *
 * @param text - The text to slugify
 * @returns URL-friendly slug
 *
 * @example
 * slugify("The Matrix Reloaded") // "the-matrix-reloaded"
 * slugify("Star Wars: Episode IV") // "star-wars-episode-iv"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')      // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')          // Remove leading/trailing hyphens
    .slice(0, 160);                   // Max 160 chars
}

/**
 * Generates a unique slug by appending a timestamp.
 * Used when creating new projects to ensure uniqueness.
 *
 * @param title - The project title
 * @returns Unique slug with timestamp
 *
 * @example
 * generateUniqueSlug("My Project") // "my-project-1730728451234"
 */
export function generateUniqueSlug(title: string): string {
  const baseSlug = slugify(title);
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`.slice(0, 160);
}
