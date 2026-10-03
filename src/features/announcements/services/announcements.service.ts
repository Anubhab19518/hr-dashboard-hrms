import { apiClient } from '@/lib/client/api-client';
import type {
  Announcement,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  GetAnnouncementsParams,
  AnnouncementsListResponse,
} from '../types/announcements.types';

function unwrapList<T>(res: unknown, key?: string): T[] {
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (key && Array.isArray(obj[key])) return obj[key] as T[];
    if (obj.data && typeof obj.data === 'object') {
      const dataObj = obj.data as Record<string, unknown>;
      if (key && Array.isArray(dataObj[key])) return dataObj[key] as T[];
      if (Array.isArray(dataObj.announcements)) return dataObj.announcements as T[];
      if (Array.isArray(dataObj.items)) return dataObj.items as T[];
      if (Array.isArray(dataObj.records)) return dataObj.records as T[];
    }
    if (Array.isArray(obj.announcements)) return obj.announcements as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

function unwrapEntity<T>(res: unknown, key?: string): T {
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (key && obj[key] && typeof obj[key] === 'object') return obj[key] as T;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      const dataObj = obj.data as Record<string, unknown>;
      if (key && dataObj[key] && typeof dataObj[key] === 'object') return dataObj[key] as T;
      if (dataObj.announcement && typeof dataObj.announcement === 'object') {
        return dataObj.announcement as T;
      }
      return obj.data as T;
    }
    if (obj.announcement && typeof obj.announcement === 'object') return obj.announcement as T;
  }
  return res as T;
}

export function normalizeAnnouncement(raw: unknown): Announcement {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      title: '',
      message: '',
      type: 'GENERAL',
      priority: 'NORMAL',
      isPublished: true,
    };
  }

  const obj = raw as Record<string, unknown>;
  const companyRaw = (obj.company as Record<string, unknown>) || {};
  const companyName =
    (typeof obj.companyName === 'string' && obj.companyName) ||
    (typeof companyRaw.name === 'string' && companyRaw.name) ||
    (typeof obj.company_name === 'string' && obj.company_name) ||
    null;

  return {
    id: String(obj.id || ''),
    workspaceId: (obj.workspaceId || obj.workspace_id) as string | undefined,
    companyId: (obj.companyId ?? obj.company_id ?? null) as string | null,
    companyName,
    title: String(obj.title || ''),
    message: String(obj.message || obj.content || obj.body || ''),
    type: (obj.type as Announcement['type']) || 'GENERAL',
    priority: (obj.priority as Announcement['priority']) || 'NORMAL',
    isPublished: obj.isPublished !== false && obj.is_published !== false,
    publishedAt: (obj.publishedAt || obj.published_at || obj.createdAt || obj.created_at) as
      string | null | undefined,
    expiresAt: (obj.expiresAt || obj.expires_at) as string | null | undefined,
    authorUserId: (obj.authorUserId || obj.author_user_id || obj.userId || obj.user_id) as
      string | undefined,
    authorName: (obj.authorName || obj.author_name) as string | undefined,
    createdAt: (obj.createdAt || obj.created_at) as string | undefined,
    updatedAt: (obj.updatedAt || obj.updated_at) as string | undefined,
  };
}

export const AnnouncementsService = {
  /**
   * Fetch paginated list of announcements with optional filters.
   * Endpoint: GET /api/v1/hr/announcements
   */
  async getAnnouncements(params: GetAnnouncementsParams = {}): Promise<AnnouncementsListResponse> {
    const searchParams = new URLSearchParams();
    if (params.companyId) searchParams.set('companyId', params.companyId);
    if (params.search) searchParams.set('search', params.search);
    if (params.type && params.type !== 'ALL') searchParams.set('type', params.type);
    if (params.priority && params.priority !== 'ALL') searchParams.set('priority', params.priority);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    const endpoint = `/hr/announcements${qs ? `?${qs}` : ''}`;

    let res: unknown;
    try {
      res = await apiClient<unknown>(endpoint);
    } catch {
      // Fallback endpoint if needed
      res = await apiClient<unknown>(`/announcements${qs ? `?${qs}` : ''}`);
    }

    if (Array.isArray(res)) {
      const normalized = res.map(normalizeAnnouncement);
      return {
        announcements: normalized,
        pagination: {
          total: normalized.length,
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          totalPages: Math.ceil(normalized.length / (params.limit ?? 20)) || 1,
        },
      };
    }

    if (typeof res === 'object' && res !== null) {
      const obj = res as Record<string, unknown>;
      const rawData =
        obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null;

      const rawList =
        unwrapList<unknown>(rawData || obj, 'announcements').length > 0
          ? unwrapList<unknown>(rawData || obj, 'announcements')
          : unwrapList<unknown>(res, 'items');

      const normalized = rawList.map(normalizeAnnouncement);

      const paginationRaw =
        (rawData?.pagination as Record<string, unknown>) ||
        (obj.pagination as Record<string, unknown>) ||
        {};

      const total =
        typeof paginationRaw.total === 'number'
          ? paginationRaw.total
          : typeof obj.total === 'number'
            ? obj.total
            : normalized.length;

      const page =
        typeof paginationRaw.page === 'number'
          ? paginationRaw.page
          : typeof obj.page === 'number'
            ? obj.page
            : (params.page ?? 1);

      const limit =
        typeof paginationRaw.limit === 'number'
          ? paginationRaw.limit
          : typeof obj.limit === 'number'
            ? obj.limit
            : (params.limit ?? 20);

      const totalPages =
        typeof paginationRaw.totalPages === 'number'
          ? paginationRaw.totalPages
          : Math.ceil(total / limit) || 1;

      return {
        announcements: normalized,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    }

    return {
      announcements: [],
      pagination: {
        total: 0,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        totalPages: 1,
      },
    };
  },

  /**
   * Fetch a single announcement by ID.
   */
  async getAnnouncementById(id: string): Promise<Announcement> {
    try {
      const res = await apiClient<unknown>(`/hr/announcements/${encodeURIComponent(id)}`);
      return normalizeAnnouncement(unwrapEntity<unknown>(res, 'announcement'));
    } catch {
      const res = await apiClient<unknown>(`/announcements/${encodeURIComponent(id)}`);
      return normalizeAnnouncement(unwrapEntity<unknown>(res, 'announcement'));
    }
  },

  /**
   * Create a new announcement.
   * Endpoint: POST /api/v1/hr/announcements
   */
  async createAnnouncement(data: CreateAnnouncementInput): Promise<Announcement> {
    const payload = {
      ...data,
      companyId: data.companyId || null,
      type: data.type || 'GENERAL',
      priority: data.priority || 'NORMAL',
      isPublished: data.isPublished !== false,
      publishedAt: data.publishedAt || new Date().toISOString(),
    };

    try {
      const res = await apiClient<unknown>('/hr/announcements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return normalizeAnnouncement(unwrapEntity<unknown>(res, 'announcement'));
    } catch {
      const res = await apiClient<unknown>('/announcements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return normalizeAnnouncement(unwrapEntity<unknown>(res, 'announcement'));
    }
  },

  /**
   * Update an existing announcement.
   * Endpoint: PATCH /api/v1/hr/announcements/:id
   */
  async updateAnnouncement(id: string, data: UpdateAnnouncementInput): Promise<Announcement> {
    try {
      const res = await apiClient<unknown>(`/hr/announcements/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return normalizeAnnouncement(unwrapEntity<unknown>(res, 'announcement'));
    } catch {
      const res = await apiClient<unknown>(`/announcements/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return normalizeAnnouncement(unwrapEntity<unknown>(res, 'announcement'));
    }
  },

  /**
   * Delete an announcement.
   * Endpoint: DELETE /api/v1/hr/announcements/:id
   */
  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    try {
      return await apiClient<{ success: boolean }>(`/hr/announcements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      return await apiClient<{ success: boolean }>(`/announcements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    }
  },
};
