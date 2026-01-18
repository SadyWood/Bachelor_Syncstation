/**
 * Example API service for log entries
 *
 * This file demonstrates how to use shared types from @hk26/schema
 * in your API calls. Follow this pattern for all API communication.
 *
 * IMPORTANT: Always import request/response types from @hk26/schema, never define them locally!
 */

import { apiClient } from './client';
import type {
  LogEntry,
  LogEntrySummary,
  CreateLogEntryRequestBody,
  UpdateLogEntryRequestBody,
  LogEntryResponseData,
  LogEntriesListResponseData,
  SyncStatusT,
} from '@hk26/schema';

/**
 * Fetch all log entries for a specific content node
 */
export async function getLogEntriesForNode(
  nodeId: string,
  status?: SyncStatusT,
): Promise<LogEntrySummary[]> {
  const params = new URLSearchParams();
  params.append('nodeId', nodeId);
  if (status) params.append('status', status);

  const response = await apiClient.get<LogEntriesListResponseData>(
    `/syncstation/log-entries?${params.toString()}`,
  );

  return response.data.items;
}

/**
 * Get a single log entry by ID
 */
export async function getLogEntry(id: string): Promise<LogEntry> {
  const response = await apiClient.get<LogEntryResponseData>(
    `/syncstation/log-entries/${id}`,
  );

  return response.data.entry;
}

/**
 * Create a new log entry
 */
export async function createLogEntry(
  data: CreateLogEntryRequestBody,
): Promise<LogEntry> {
  const response = await apiClient.post<LogEntryResponseData>(
    '/syncstation/log-entries',
    data, // ✅ Type-safe: matches CreateLogEntryRequestBody
  );

  return response.data.entry;
}

/**
 * Update an existing log entry
 */
export async function updateLogEntry(
  id: string,
  data: UpdateLogEntryRequestBody,
): Promise<LogEntry> {
  const response = await apiClient.patch<LogEntryResponseData>(
    `/syncstation/log-entries/${id}`,
    data, // ✅ Type-safe: matches UpdateLogEntryRequestBody
  );

  return response.data.entry;
}

/**
 * Delete a log entry
 */
export async function deleteLogEntry(id: string): Promise<void> {
  await apiClient.delete(`/syncstation/log-entries/${id}`);
}

/**
 * Example usage in a React Native component:
 *
 * ```typescript
 * import { createLogEntry } from '@/api/log-entries.example';
 * import type { CreateLogEntryRequestBody } from '@hk26/schema';
 *
 * const handleCreateLog = async () => {
 *   const data: CreateLogEntryRequestBody = {
 *     nodeId: selectedNodeId,
 *     title: 'Costume note for Scene 3',
 *     description: 'Main actor needs backup jacket',
 *   };
 *
 *   try {
 *     const entry = await createLogEntry(data);
 *     console.log('Created log entry:', entry.id);
 *   } catch (error) {
 *     console.error('Failed to create log entry:', error);
 *   }
 * };
 * ```
 */
