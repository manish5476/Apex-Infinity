import { SocketService } from './../../../core/services/socket.service';
import { Inject, Injectable } from '@angular/core';
import { catchError, Observable, switchMap } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { HttpHeaders } from '@angular/common/http';

export interface AttendancePunchData {
  type: 'in' | 'out' | 'break_start' | 'break_end';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
  deviceId?: string;
}

export interface RegularizationRequest {
  targetDate: string; // YYYY-MM-DD
  type: 'missed_punch' | 'correction' | 'work_from_home' | 'on_duty' | 'leave_reversal' | 'others';
  newFirstIn?: string; // ISO date string
  newLastOut?: string; // ISO date string
  reason: string;
  supportingDocs?: string[];
  urgency?: 'low' | 'medium' | 'high';
}

export interface AttendanceFilter {
  month?: any; // YYYY-MM
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: string;
  department?: string;
  branchId?: string;
  page?: number;
  limit?: number;
  includeSubordinates?: boolean;
}

export interface ExportOptions {
  startDate: string;
  endDate: string;
  branchId?: string;
  department?: string;
  format: 'excel' | 'csv';
}

@Injectable({ providedIn: 'root' })
export class AttendanceService extends BaseApiService {
  // 🔗 Matches your Backend Route prefix
  private socketService = Inject(SocketService)
  private endpoint = '/v1/attendance';

  // =========================================================
  // 🟢 EMPLOYEE ACTIONS (Self-Service)
  // =========================================================

  /**
   * 👊 Web Punch (Check In / Check Out / Breaks)
   * @param data Attendance punch data
   */
  // markAttendance(data: AttendancePunchData): Observable<any> {
  //   return this.post(`${this.endpoint}/punch`, data, 'markAttendance');
  // }
  // attendance.service.ts - Updated markAttendance method
  markAttendance(data: AttendancePunchData): Observable<any> {
    // Ensure location is included if required
    if (!data.latitude || !data.longitude) {
      return this.getCurrentPosition().pipe(
        switchMap(position => {
          const enhancedData = {
            ...data,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          return this.post(`${this.endpoint}/punch`, enhancedData, 'markAttendance');
        }),
        catchError(error => {
          // If location fails, still try with null values
          const fallbackData = {
            ...data,
            latitude: null,
            longitude: null,
            accuracy: null
          };
          return this.post(`${this.endpoint}/punch`, fallbackData, 'markAttendance');
        })
      );
    }
    return this.post(`${this.endpoint}/punch`, data, 'markAttendance');
  }

  /**
   * Get current position with better error handling
   */
  private getCurrentPosition(): Observable<GeolocationPosition> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => observer.next(position),
        error => observer.error(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * 📅 Get My Attendance History
   * @param filterParams Filter parameters
   */
  getMyAttendance(filterParams?: AttendanceFilter): Observable<any> {
    return this.get(`${this.endpoint}/my-history`, filterParams, 'getMyAttendance');
  }

  /**
   * 📋 Get My Regularization Requests
   * @param filterParams Filter parameters
   */
  getMyRequests(filterParams?: AttendanceFilter): Observable<any> {
    return this.get(`${this.endpoint}/my-requests`, filterParams, 'getMyRequests');
  }


  /**
   * 📝 Submit Regularization Request
   * @param data Regularization request data
   */
  submitRegularization(data: any): Observable<any> {
    return this.post(`${this.endpoint}/regularize`, data, 'submitRegularization');
  }

  /**
   * 📡 Subscribe to Real-time Updates
   * @param data Subscription data
   */
  subscribeToUpdates(data: { subscriptionType: string; filters?: any }): Observable<any> {
    return this.post(`${this.endpoint}/subscribe`, data, 'subscribeToUpdates');
  }

  /**
   * 📡 Unsubscribe from Real-time Updates
   * @param subscriptionId Subscription ID
   */
  unsubscribeFromUpdates(subscriptionId: string): Observable<any> {
    return this.post(`${this.endpoint}/unsubscribe`, { subscriptionId }, 'unsubscribeFromUpdates');
  }

  // =========================================================
  // 🔴 MANAGER / ADMIN ACTIONS (Approvals & Monitoring)
  // =========================================================

  /**
   * 📋 Get Pending Requests for My Team/Branch
   * @param filterParams Filter parameters
   */
  getPendingRequests(filterParams?: AttendanceFilter): Observable<any> {
    return this.get(`${this.endpoint}/requests/pending`, filterParams, 'getPendingRequests');
  }

  /**
   * ✅ Approve or ❌ Reject Request
   * @param requestId The ID of the Regularization Request
   * @param data Decision data
   */
  decideRegularization(requestId: string, data: {
    status: 'approved' | 'rejected';
    comments?: string;
    rejectionReason?: string;
  }): Observable<any> {
    return this.patch(`${this.endpoint}/regularize/${requestId}`, data, 'decideRegularization');
  }

  /**
   * 👥 Get Team Attendance
   * @param filterParams Filter parameters
   */
  getTeamAttendance(filterParams?: AttendanceFilter): Observable<any> {
    return this.get(`${this.endpoint}/team`, filterParams, 'getTeamAttendance');
  }

  /**
   * 📊 Get Attendance Summary Dashboard
   * @param filterParams Filter parameters
   */
  getAttendanceSummary(filterParams?: AttendanceFilter): Observable<any> {
    return this.get(`${this.endpoint}/summary`, filterParams, 'getAttendanceSummary');
  }

  /**
   * 🎯 Get Live Attendance Feed
   * @param filterParams Filter parameters
   */
  getLiveAttendance(filterParams?: AttendanceFilter): Observable<any> {
    return this.get(`${this.endpoint}/live`, filterParams, 'getLiveAttendance');
  }

  // =========================================================
  // 📊 REPORTS & ANALYTICS
  // =========================================================

  /**
   * 📈 Export Attendance Data
   * @param options Export options
   */
  exportAttendance(options: ExportOptions): Observable<any> {
    return this.get(`${this.endpoint}/export`, options, 'exportAttendance');
  }

  /**
   * 📅 Get Monthly Report
   * @param filterParams Filter parameters
   */
  getMonthlyReport(filterParams?: AttendanceFilter): Observable<any> {
    return this.get(`${this.endpoint}/reports/monthly`, filterParams, 'getMonthlyReport');
  }

  /**
   * 📊 Get Advanced Analytics
   * @param filterParams Filter parameters
   */
  getAnalytics(filterParams?: AttendanceFilter): Observable<any> {
    return this.get(`${this.endpoint}/analytics`, filterParams, 'getAnalytics');
  }

  /**
   * 🎛️ Get Comprehensive Dashboard
   * @param filterParams Filter parameters
   */
  getDashboard(filterParams?: AttendanceFilter): Observable<any> {
    return this.get(`${this.endpoint}/dashboard`, filterParams, 'getDashboard');
  }

  // =========================================================
  // ⚙️ SHIFT MANAGEMENT
  // =========================================================

  /**
   * 🕐 Create New Shift
   * @param data Shift data
   */
  createShift(data: any): Observable<any> {
    return this.post(`${this.endpoint}/shifts`, data, 'createShift');
  }

  /**
   * 📋 Get All Shifts
   */
  getAllShifts(): Observable<any> {
    return this.get(`${this.endpoint}/shifts`, {}, 'getAllShifts');
  }

  /**
   * 🔍 Get Shift by ID
   * @param shiftId Shift ID
   */
  getShiftById(shiftId: string): Observable<any> {
    return this.get(`${this.endpoint}/shifts/${shiftId}`, {}, 'getShiftById');
  }

  /**
   * ✏️ Update Shift
   * @param shiftId Shift ID
   * @param data Update data
   */
  updateShift(shiftId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/shifts/${shiftId}`, data, 'updateShift');
  }

  /**
   * 🗑️ Delete Shift (Soft Delete)
   * @param shiftId Shift ID
   */
  deleteShift(shiftId: string): Observable<any> {
    return this.delete(`${this.endpoint}/shifts/${shiftId}`, 'deleteShift');
  }

  // =========================================================
  // 🎉 HOLIDAY MANAGEMENT
  // =========================================================

  /**
   * 🏖️ Create Holiday
   * @param data Holiday data
   */
  createHoliday(data: any): Observable<any> {
    return this.post(`${this.endpoint}/holidays`, data, 'createHoliday');
  }

  /**
   * 📅 Get Holidays
   * @param filterParams Filter parameters
   */
  getHolidays(filterParams?: { year?: string; branchId?: string }): Observable<any> {
    return this.get(`${this.endpoint}/holidays`, filterParams, 'getHolidays');
  }

  /**
   * 🔍 Get Holiday by ID
   * @param holidayId Holiday ID
   */
  getHolidayById(holidayId: string): Observable<any> {
    return this.get(`${this.endpoint}/holidays/${holidayId}`, {}, 'getHolidayById');
  }

  /**
   * ✏️ Update Holiday
   * @param holidayId Holiday ID
   * @param data Update data
   */
  updateHoliday(holidayId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/holidays/${holidayId}`, data, 'updateHoliday');
  }

  /**
   * 🗑️ Delete Holiday
   * @param holidayId Holiday ID
   */
  deleteHoliday(holidayId: string): Observable<any> {
    return this.delete(`${this.endpoint}/holidays/${holidayId}`, 'deleteHoliday');
  }

  // =========================================================
  // 📡 MACHINE INTEGRATION (For admin setup)
  // =========================================================

  /**
   * 🤖 Push Machine Data (For machine integration setup)
   * @param apiKey Machine API key
   * @param data Machine data
   */
  pushMachineData(apiKey: string, data: any): Observable<any> {
    // Corresponds to: POST /api/v1/attendance/machine-push
    // Note: This uses API key authentication, not JWT
    const headers = { 'x-machine-api-key': apiKey };
    return this.postWithCustomHeaders(`${this.endpoint}/machine-push`, data, headers, 'pushMachineData');
  }

  // =========================================================
  // 🛠️ HELPER METHODS
  // =========================================================

  /**
   * Get current attendance status for today
   */
  // getCurrentStatus(): Observable<any> {
  //   return this.get(`${this.endpoint}/status`, {}, 'getCurrentStatus');
  // }

  /**
   * Check if user has punched in today
   */
  hasPunchedInToday(): Observable<{ hasPunchedIn: boolean; lastPunch?: any }> {
    return new Observable(observer => {
      this.getMyAttendance({ limit: 1 }).subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = response.data.find((record: any) => record.date === today);

            if (todayRecord && todayRecord.firstIn) {
              observer.next({ hasPunchedIn: true, lastPunch: todayRecord.firstIn });
            } else {
              observer.next({ hasPunchedIn: false });
            }
          } else {
            observer.next({ hasPunchedIn: false });
          }
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Calculate working hours for a date range
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   */
  calculateWorkingHours(startDate: string, endDate: string): Observable<any> {
    return this.get(`${this.endpoint}/summary`, { startDate, endDate }, 'calculateWorkingHours');
  }

  // =========================================================
  // 📊 UTILITY METHODS FOR UI COMPONENTS
  // =========================================================

  /**
   * Format punch time for display
   * @param dateTime ISO date string
   */
  formatPunchTime(dateTime: string): string {
    if (!dateTime) return '--:--';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Format date for display
   * @param dateStr Date string (YYYY-MM-DD)
   */
  formatAttendanceDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  }

  /**
   * Get status badge class
   * @param status Attendance status
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'present':
        return 'badge-success';
      case 'absent':
        return 'badge-danger';
      case 'late':
        return 'badge-warning';
      case 'half_day':
        return 'badge-info';
      case 'on_leave':
        return 'badge-primary';
      case 'holiday':
      case 'week_off':
        return 'badge-secondary';
      default:
        return 'badge-light';
    }
  }

  /**
   * Get status display text
   * @param status Attendance status
   */
  getStatusDisplayText(status: string): string {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late';
      case 'half_day':
        return 'Half Day';
      case 'on_leave':
        return 'On Leave';
      case 'holiday':
        return 'Holiday';
      case 'week_off':
        return 'Week Off';
      case 'week_off_work':
        return 'Worked on Week Off';
      case 'holiday_work':
        return 'Worked on Holiday';
      default:
        return status;
    }
  }

  // =========================================================
  // 🎯 SOCKET.IO INTEGRATION METHODS
  // =========================================================

  /**
   * Connect to attendance socket
   * @param userId User ID
   */
  connectToAttendanceSocket(userId: string): void {
    // This would integrate with your SocketService
    // Example implementation:

    this.socketService.connect('attendance');
    this.socketService.emit('attendance:subscribe', {
      userId,
      subscriptionType: 'my_attendance'
    });

  }

  /**
   * Listen for real-time attendance updates
   */
  onAttendanceUpdate(): Observable<any> {
    return new Observable(observer => {
      // This would integrate with your SocketService

      this.socketService.on('attendance:punch').subscribe((data:any) => {
        observer.next(data);
      });

    });
  }

  /**
   * Listen for request status updates
   */
  onRequestUpdate(): Observable<any> {
    return new Observable(observer => {
      // This would integrate with your SocketService
      
      this.socketService.on('attendance:request:updated').subscribe((data:any) => {
        observer.next(data);
      });
      
    });
  }

  // =========================================================
  // 🚀 BATCH OPERATIONS (For admins)
  // =========================================================

  /**
   * Import attendance data from Excel/CSV
   * @param file File to upload
   */
  importAttendance(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    // Create HTTP headers for file upload
    const headers = new HttpHeaders();
    // Note: Don't set Content-Type for FormData - browser will set it automatically with boundary

    return this.http.post(`${this.baseUrl}${this.endpoint}/import`, formData, {
      headers,
      withCredentials: true,
    });
  }

  /**
   * Bulk update attendance records
   * @param updates Array of attendance updates
   */
  bulkUpdateAttendance(updates: any[]): Observable<any> {
    return this.post(`${this.endpoint}/bulk-update`, { updates }, 'bulkUpdateAttendance');
  }

  // =========================================================
  // 🔧 ADDITIONAL METHODS TO FIX THE ERRORS
  // =========================================================


  /**
   * POST with custom headers (for machine-push with API key)
   * @param url API endpoint
   * @param body Request body
   * @param customHeaders Custom headers object
   * @param context Method context for logging
   */
  // protected postWithCustomHeaders<T>(url: string, body: any, customHeaders: { [key: string]: string }, context?: string): Observable<T> {
  //   const headers = new HttpHeaders(customHeaders);
  //   return this.http.post<T>(`${this.baseUrl}${url}`, body, {
  //     headers,
  //     withCredentials: true,
  //   });
  // }
}
