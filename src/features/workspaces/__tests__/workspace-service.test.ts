import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceService } from '../services/workspace.service';
import { apiClient } from '@/lib/client/api-client';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('WorkspaceService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches workspaces list with array and object responses', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([
      { id: 'ws-1', name: 'Main Workspace', slug: 'main' },
    ]);

    const list1 = await WorkspaceService.getWorkspaces();
    expect(list1.length).toBe(1);
    expect(list1[0]!.name).toBe('Main Workspace');

    vi.mocked(apiClient).mockResolvedValueOnce({
      workspaces: [{ id: 'ws-2', name: 'Secondary Workspace', slug: 'secondary' }],
    });

    const list2 = await WorkspaceService.getWorkspaces();
    expect(list2.length).toBe(1);

    vi.mocked(apiClient).mockRejectedValueOnce(new Error('Network error'));
    const emptyList = await WorkspaceService.getWorkspaces();
    expect(emptyList).toEqual([]);
  });

  it('fetches current workspace and handles error gracefully', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      id: 'ws-active',
      name: 'Active WS',
      slug: 'active',
    });

    const current = await WorkspaceService.getCurrentWorkspace();
    expect(current?.id).toBe('ws-active');

    vi.mocked(apiClient).mockRejectedValueOnce(new Error('Failed'));
    const nullWs = await WorkspaceService.getCurrentWorkspace();
    expect(nullWs).toBeNull();
  });

  it('creates workspace', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      id: 'ws-new',
      name: 'New WS',
      slug: 'new-ws',
    });

    const res = await WorkspaceService.createWorkspace({ name: 'New WS', slug: 'new-ws' });
    expect(apiClient).toHaveBeenCalledWith('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'New WS', slug: 'new-ws' }),
    });
    expect(res.id).toBe('ws-new');
  });
});
