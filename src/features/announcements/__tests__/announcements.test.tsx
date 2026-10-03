import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnnouncementsService } from '../services/announcements.service';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../schemas/announcements.schema';
import { AnnouncementsView } from '../components/announcements-view';
import { AnnouncementFormModal } from '../components/announcement-form-modal';
import { AnnouncementDeleteModal } from '../components/announcement-delete-modal';
import { apiClient } from '@/lib/client/api-client';
import type { Announcement } from '../types/announcements.types';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

vi.mock('@/lib/client/auth-store', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      user: {
        id: 'usr_admin',
        name: 'HR Admin',
        email: 'admin@workspace.com',
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN'],
        permissions: ['announcements:read', 'announcements:write'],
      },
    }),
  ),
  getUserDisplayRole: vi.fn(() => 'Administrator'),
}));

const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    workspaceId: 'ws-1',
    companyId: null,
    companyName: null,
    title: 'Workspace Townhall 2026',
    message: 'Join us for the annual roadmap discussion.',
    type: 'EVENT',
    priority: 'HIGH',
    isPublished: true,
    publishedAt: '2026-10-01T10:00:00.000Z',
    expiresAt: '2026-10-31T23:59:59.000Z',
    authorUserId: 'usr-1',
    authorName: 'HR Team',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'ann-2',
    workspaceId: 'ws-1',
    companyId: 'comp-1',
    companyName: 'Acme Corp',
    title: 'Acme Maintenance Window',
    message: 'Servers will be down for 2 hours on Sunday night.',
    type: 'MAINTENANCE',
    priority: 'NORMAL',
    isPublished: true,
    publishedAt: '2026-09-01T10:00:00.000Z',
    expiresAt: '2026-09-02T10:00:00.000Z',
    authorUserId: 'usr-2',
    authorName: 'DevOps Lead',
    createdAt: '2026-09-01T10:00:00.000Z',
  },
];

const mockCompanies = [
  { id: 'comp-1', name: 'Acme Corp', code: 'ACME' },
  { id: 'comp-2', name: 'Beta Ltd', code: 'BETA' },
];

describe('Announcements Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Zod Validation Schemas', () => {
    it('validates a valid create announcement payload', () => {
      const valid = {
        title: 'Policy Update for Remote Work',
        message: 'Please review the updated guidelines.',
        type: 'POLICY_UPDATE',
        priority: 'HIGH',
        companyId: 'comp-1',
        isPublished: true,
      };
      const result = createAnnouncementSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects an empty title or title exceeding 255 chars', () => {
      const emptyTitle = {
        title: '',
        message: 'Valid message body.',
      };
      expect(createAnnouncementSchema.safeParse(emptyTitle).success).toBe(false);

      const tooLongTitle = {
        title: 'A'.repeat(256),
        message: 'Valid message body.',
      };
      expect(createAnnouncementSchema.safeParse(tooLongTitle).success).toBe(false);
    });

    it('rejects an empty message', () => {
      const emptyMessage = {
        title: 'Valid Title',
        message: '   ',
      };
      expect(createAnnouncementSchema.safeParse(emptyMessage).success).toBe(false);
    });

    it('allows partial updates with updateAnnouncementSchema', () => {
      const partial = {
        title: 'New Title Only',
      };
      const result = updateAnnouncementSchema.safeParse(partial);
      expect(result.success).toBe(true);
    });
  });

  describe('AnnouncementsService', () => {
    it('fetches announcements list with query params', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: {
          announcements: mockAnnouncements,
          pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
        },
      });

      const res = await AnnouncementsService.getAnnouncements({
        companyId: 'comp-1',
        search: 'Townhall',
        type: 'EVENT',
        priority: 'HIGH',
        page: 1,
        limit: 20,
      });

      expect(apiClient).toHaveBeenCalledWith(
        '/hr/announcements?companyId=comp-1&search=Townhall&type=EVENT&priority=HIGH&page=1&limit=20',
      );
      expect(res.announcements).toHaveLength(2);
      expect(res.announcements[0]?.title).toBe('Workspace Townhall 2026');
    });

    it('creates an announcement successfully', async () => {
      const input = {
        title: 'Emergency Drill',
        message: 'Scheduled at 3 PM',
        type: 'EMERGENCY' as const,
        priority: 'URGENT' as const,
        companyId: null,
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: {
          announcement: {
            id: 'ann-new',
            ...input,
            isPublished: true,
          },
        },
      });

      const result = await AnnouncementsService.createAnnouncement(input);
      expect(result.id).toBe('ann-new');
      expect(result.title).toBe('Emergency Drill');
    });

    it('updates an announcement successfully', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: {
          announcement: {
            ...mockAnnouncements[0],
            title: 'Updated Townhall Title',
          },
        },
      });

      const result = await AnnouncementsService.updateAnnouncement('ann-1', {
        title: 'Updated Townhall Title',
      });
      expect(result.title).toBe('Updated Townhall Title');
    });

    it('deletes an announcement successfully', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ success: true });

      const res = await AnnouncementsService.deleteAnnouncement('ann-1');
      expect(res.success).toBe(true);
    });
  });

  describe('Announcements UI Components', () => {
    it('renders announcements list view, displays filters and items', async () => {
      vi.mocked(apiClient).mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('/companies')) {
          return { data: mockCompanies };
        }
        return {
          data: {
            announcements: mockAnnouncements,
            pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
          },
        };
      });

      render(<AnnouncementsView />);

      await waitFor(() => {
        expect(screen.getByText('Workspace Townhall 2026')).toBeInTheDocument();
        expect(screen.getByText('Acme Maintenance Window')).toBeInTheDocument();
      });

      expect(screen.getByText('All Companies (Workspace-wide)')).toBeInTheDocument();
      expect(screen.getByText('Create Announcement')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('opens Create Announcement modal when button clicked', async () => {
      vi.mocked(apiClient).mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('/companies')) {
          return { data: mockCompanies };
        }
        return {
          data: {
            announcements: [],
            pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
          },
        };
      });

      render(<AnnouncementsView />);

      await waitFor(() => {
        expect(screen.getByText('Create Announcement')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Announcement'));

      await waitFor(() => {
        expect(screen.getByText('Create New Announcement')).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/Mandatory Safety Protocol Update/i),
        ).toBeInTheDocument();
      });
    });

    it('submits valid form in AnnouncementFormModal', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <AnnouncementFormModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          companies={mockCompanies}
        />,
      );

      const titleInput = screen.getByPlaceholderText(/Mandatory Safety Protocol Update/i);
      const messageInput = screen.getByPlaceholderText(/Type your announcement content/i);

      fireEvent.change(titleInput, { target: { value: 'Global Office Holiday' } });
      fireEvent.change(messageInput, { target: { value: 'Offices will be closed on Friday.' } });

      const submitButton = screen.getByRole('button', { name: /Publish Announcement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Global Office Holiday',
            message: 'Offices will be closed on Friday.',
          }),
        );
      });
    });

    it('renders and confirms deletion in AnnouncementDeleteModal', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <AnnouncementDeleteModal
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          announcement={mockAnnouncements[0] ?? null}
        />,
      );

      expect(screen.getByRole('heading', { name: 'Delete Announcement' })).toBeInTheDocument();
      expect(screen.getByText(/Workspace Townhall 2026/)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /Delete Announcement/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    });
  });
});
