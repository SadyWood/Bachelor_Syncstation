// apps/workstation-web/src/utils/slugify.ts

/**
 * Converts a string to a URL-friendly slug.
 *
 * Rules:
 * - Lowercase
 * - Replace non-alphanumeric characters with hyphens
 * - Remove leading/trailing hyphens
 * - Max 160 characters
 *
 * @example
 * slugify("The Matrix Reloaded") // "the-matrix-reloaded"
 * slugify("Star Wars: Episode IV") // "star-wars-episode-iv"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .slice(0, 160); // Max 160 chars
}

/**
 * Generates a unique slug by appending a number if needed.
 * Useful when checking against existing slugs.
 *
 * @example
 * uniqueSlugify("my-project", ["my-project"]) // "my-project-2"
 * uniqueSlugify("new-project", []) // "new-project"
 */
export function uniqueSlugify(text: string, existingSlugs: string[]): string {
  const baseSlug = slugify(text);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let candidateSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(candidateSlug)) {
    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }

  return candidateSlug.slice(0, 160);
}
