// field-service/work-assignment/work-assignment.service.ts
// HTTP wrapper for the Field Service API. Consumed only by CalendarFacade.

import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';

export interface WorkAssignmentListParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export interface CompleteWorkAssignmentPayload {
  customerRating?: number;
  firstVisitResolution?: boolean;
  delayReason?: string;
  internalNotes?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkAssignmentService extends BaseApiService {
  private readonly base = '/field-service/work-assignments';

  getAll(params: WorkAssignmentListParams = {}): Observable<any> {
    return this.get(this.base, params);
  }

  getById(id: string): Observable<any> {
    return this.get(`${this.base}/${id}`);
  }

  /** Get all assignments in a date range — lightweight, calendar-optimised endpoint */
  getCalendarRange(startDate: string, endDate: string, filters: Record<string, string> = {}): Observable<any[]> {
    return this.get(`${this.base}/calendar`, {
      startDate, endDate, ...filters
    }).pipe(map((res: any) => res.data?.assignments ?? []));
  }

  getSeries(seriesId: string): Observable<any[]> {
    return this.get(`${this.base}/series/${seriesId}`)
      .pipe(map((res: any) => res.data?.assignments ?? []));
  }

  create(payload: any): Observable<any> {
    return this.post(this.base, payload);
  }

  update(id: string, payload: any): Observable<any> {
    return this.patch(`${this.base}/${id}`, payload);
  }

  updateStatus(id: string, status: string, scope: 'single' | 'future' | 'all' = 'single'): Observable<any> {
    return this.patch(`${this.base}/${id}/status`, { status, scope });
  }

  complete(id: string, data: CompleteWorkAssignmentPayload): Observable<any> {
    return this.post(`${this.base}/${id}/complete`, data);
  }

  getStats(): Observable<any> {
    return this.get(`${this.base}/stats`);
  }

  getSlaAtRisk(): Observable<any[]> {
    return this.get(`${this.base}/sla-at-risk`)
      .pipe(map((res: any) => res.data?.assignments ?? []));
  }
}
