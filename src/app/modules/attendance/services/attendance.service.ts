import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService extends BaseApiService {
  // 🔗 Matches your Backend Route prefix
  private endpoint = '/v1/attendance';

  // =========================================================
  // 🟢 EMPLOYEE ACTIONS (Self-Service)
  // =========================================================

  /**
   * 👊 Web Punch (Check In / Check Out)
   * @param data { type: 'in' | 'out', latitude: number, longitude: number, accuracy: number }
   */
  markAttendance(data: any): Observable<any> {
    // Corresponds to: POST /api/v1/attendance/punch
    return this.post(`${this.endpoint}/punch`, data, 'markAttendance');
  }

  /**
   * 📅 Get My Attendance History
   * @param filterParams { month: 'YYYY-MM' } or { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
   */
  getMyAttendance(filterParams?: any): Observable<any> {
    // Corresponds to: GET /api/v1/attendance/my-history
    return this.get(`${this.endpoint}/my-history`, filterParams, 'getMyAttendance');
  }

  /**
   * 📝 Request Regularization (Fix Missed Punch)
   * @param data { targetDate, type, correction: { newFirstIn?, newLastOut?, reason } }
   */
  submitRegularization(data: any): Observable<any> {
    // Corresponds to: POST /api/v1/attendance/regularize
    return this.post(`${this.endpoint}/regularize`, data, 'submitRegularization');
  }

  // =========================================================
  // 🔴 MANAGER / ADMIN ACTIONS (Approvals)
  // =========================================================

  /**
   * 📋 Get Pending Requests for My Team/Branch
   */
  getPendingRequests(): Observable<any> {
    // Corresponds to: GET /api/v1/attendance/requests/pending
    return this.get(`${this.endpoint}/requests/pending`, {}, 'getPendingRequests');
  }

  /**
   * ✅ Approve or ❌ Reject Request
   * @param requestId The ID of the Regularization Request
   * @param data { status: 'approved' | 'rejected', rejectionReason?: string }
   */
  decideRegularization(requestId: string, data: any): Observable<any> {
    // Corresponds to: PATCH /api/v1/attendance/regularize/:id
    return this.patch(`${this.endpoint}/regularize/${requestId}`, data, 'decideRegularization');
  }
}