import { apiClient } from '@/lib/client/api-client';
import type { WorkspaceItem, CreateWorkspaceInput } from '../types/workspace.types';

export class WorkspaceService {
  /**
   * List all workspaces belonging to the authenticated user.
   */
  static async getWorkspaces(): Promise<WorkspaceItem[]> {
    try {
      const data = await apiClient<WorkspaceItem[] | { workspaces: WorkspaceItem[] }>(
        '/workspaces',
      );
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.workspaces)) return data.workspaces;
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Get metadata for the currently active workspace.
   */
  static async getCurrentWorkspace(): Promise<WorkspaceItem | null> {
    try {
      return await apiClient<WorkspaceItem>('/workspaces/current');
    } catch {
      return null;
    }
  }

  /**
   * Create a new workspace.
   */
  static async createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceItem> {
    return apiClient<WorkspaceItem>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}
