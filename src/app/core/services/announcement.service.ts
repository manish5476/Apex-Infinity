import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

// =============================================================================
// Interfaces for Payload Suggestions (IntelliSense)
// =============================================================================

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'alert' | string;
  targetAudience?: 'all' | 'staff' | 'customers' | string;
  [key: string]: any;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  message?: string;
  type?: string;
  targetAudience?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface GetAnnouncementsQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  [key: string]: any;
}

export interface SearchAnnouncementsQuery {
  q?: string;
  search?: string;
  [key: string]: any;
}

// =============================================================================
// Announcement Service
// =============================================================================

@Injectable({ providedIn: 'root' })
export class AnnouncementService extends BaseApiService {
  private endpoint = '/v1/announcements';

  // ============================================================
  // ── STATIC / UTILITY ROUTES ─────────────────────────────────
  // ============================================================

  /**
   * Get announcement statistics
   * Maps to: GET /v1/announcements/stats
   */
  getAnnouncementStats(): Observable<any> {
    return this.get(`${this.endpoint}/stats`, {}, 'getAnnouncementStats');
  }

  /**
   * Search announcements
   * Maps to: GET /v1/announcements/search
   */
  searchAnnouncements(queryParams: SearchAnnouncementsQuery): Observable<any> {
    return this.get(`${this.endpoint}/search`, queryParams, 'searchAnnouncements');
  }

  // ============================================================
  // ── ROOT CRUD ───────────────────────────────────────────────
  // ============================================================

  /**
   * Get all announcements with optional filters
   * Maps to: GET /v1/announcements
   */
  getAllAnnouncements(queryParams?: GetAnnouncementsQuery): Observable<any> {
    return this.get(this.endpoint, queryParams, 'getAllAnnouncements');
  }

  /**
   * Create a new announcement
   * Maps to: POST /v1/announcements
   */
  createAnnouncement(data: CreateAnnouncementPayload): Observable<any> {
    return this.post(this.endpoint, data, 'createAnnouncement');
  }

  // ============================================================
  // ── ID-BASED OPERATIONS ─────────────────────────────────────
  // ============================================================

  /**
   * Mark an announcement as read for the current user
   * Maps to: PATCH /v1/announcements/:id/read
   */
  markAsRead(announcementId: string): Observable<any> {
    return this.patch(`${this.endpoint}/${announcementId}/read`, {}, 'markAsRead');
  }

  /**
   * Update an existing announcement
   * Maps to: PATCH /v1/announcements/:id
   */
  updateAnnouncement(announcementId: string, data: UpdateAnnouncementPayload): Observable<any> {
    return this.patch(`${this.endpoint}/${announcementId}`, data, 'updateAnnouncement');
  }

  /**
   * Delete an announcement
   * Maps to: DELETE /v1/announcements/:id
   */
  deleteAnnouncement(announcementId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${announcementId}`, null, 'deleteAnnouncement');
  }
}