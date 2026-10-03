export type AnnouncementType =
  | 'GENERAL'
  | 'URGENT'
  | 'HOLIDAY'
  | 'POLICY_UPDATE'
  | 'EVENT'
  | 'MAINTENANCE'
  | 'PAYROLL'
  | 'POLICY'
  | 'EMERGENCY';

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Announcement {
  readonly id: string;
  readonly workspaceId?: string;
  readonly companyId?: string | null;
  readonly companyName?: string | null;
  readonly title: string;
  readonly message: string;
  readonly type: AnnouncementType;
  readonly priority: AnnouncementPriority;
  readonly isPublished: boolean;
  readonly publishedAt?: string | null;
  readonly expiresAt?: string | null;
  readonly authorUserId?: string;
  readonly authorName?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface CreateAnnouncementInput {
  companyId?: string | null;
  title: string;
  message: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  isPublished?: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
}

export interface UpdateAnnouncementInput {
  companyId?: string | null;
  title?: string;
  message?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  isPublished?: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
}

export interface GetAnnouncementsParams {
  companyId?: string | null;
  search?: string;
  type?: AnnouncementType | 'ALL';
  priority?: AnnouncementPriority | 'ALL';
  page?: number;
  limit?: number;
}

export interface AnnouncementsListResponse {
  announcements: Announcement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
