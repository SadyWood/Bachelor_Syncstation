/**
 * App-specific UI types for Syncstation
 *
 * IMPORTANT: Read .claude/skills/type-safety-schema/SKILL.md to understand:
 * - When to use app-specific types (here) vs shared schemas (@hk26/schema)
 * - How to organize types by domain
 * - Type safety best practices
 *
 * RULE: API request/response types MUST be imported from @hk26/schema
 * ONLY use this file for app-specific UI state, component props, etc.
 */

// Example: Loading state for async operations
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Example: UI-specific state for log entry form
export interface LogEntryFormState {
  title: string;
  description: string;
  nodeId: string | null;
  selectedFiles: string[]; // URIs to selected media files
  errors: Record<string, string>;
  isSubmitting: boolean;
}
