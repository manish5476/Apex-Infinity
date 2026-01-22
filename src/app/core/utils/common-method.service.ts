import { Injectable, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, ValidationErrors, FormArray } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { finalize } from 'rxjs/operators'; // Import finalize
import { LoadingService } from '../services/loading.service';
import { AppMessageService } from '../services/message.service';

export type Severity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

@Injectable({
  providedIn: 'root'
})
export class CommonMethodService {

  // Dependencies
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService); // Inject LoadingService
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /**
   * 🚀 THE ULTIMATE API HANDLER
   * Handles Loading, Error, and Subscription automatically.
   * * @param observable$ The API call (e.g., this.service.getById(id))
   * @param successFn Callback function for success response
   * @param context Error message context (e.g., 'Fetch Invoice')
   */
  public apiCall<T>(
    observable$: Observable<T>,
    successFn: (response: T) => void,
    context: string = 'Operation'
  ): void {
    this.loadingService.show();

    observable$.pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        successFn(res);
      },
      error: (err) => {
        this.messageService.handleHttpError(err, context);
      }
    });
  }

  // ==========================================================================
  // 1. FORMATTING UTILITIES
  // ==========================================================================

  /**
   * Formats a number as Indian Rupee currency (e.g., ₹1,00,000.00).
   */
  public formatCurrency(value: number | string | undefined | null): string {
    if (value === undefined || value === null || value === '') return '₹0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `₹${numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Formats a date object or string into a consistent app-wide format.
   * Default: 'dd MMM yyyy' (e.g., 14 Nov 2024)
   */
  public formatDate(value: Date | string | number | null | undefined, format: string = 'dd MMM yyyy'): string {
    if (!value) return '-';
    try {
      return this.datePipe.transform(value, format) || '-';
    } catch (e) {
      return '-';
    }
  }

  /**
   * Formats file size from bytes to human-readable string.
   * e.g., 1024 -> "1 KB"
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Truncates text to a limit and adds ellipsis.
   */
  public truncateText(text: string, limit: number = 30): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  /**
   * Generates initials from a name (e.g., "Rahul Dravid" -> "RD").
   */
  public getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // ==========================================================================
  // 2. UI & SEVERITY HELPERS
  // ==========================================================================

  /**
   * A Smart Generic Mapper for Statuses.
   * Matches keywords to Severity colors.
   */
  public mapStatusToSeverity(status: string): Severity {
    if (!status) return 'secondary';
    const s = status.toLowerCase();

    // Success (Green)
    if (['paid', 'active', 'completed', 'approved', 'verified', 'success', 'inflow', 'present'].includes(s)) return 'success';

    // Warning (Yellow)
    if (['pending', 'processing', 'hold', 'draft', 'review', 'late', 'absent'].includes(s)) return 'warn';

    // Danger (Red)
    if (['unpaid', 'inactive', 'failed', 'rejected', 'cancelled', 'deleted', 'outflow', 'overdue', 'blocked'].includes(s)) return 'danger';

    // Info (Blue)
    if (['partial', 'shipped', 'refunded', 'return', 'info'].includes(s)) return 'info';

    // Default
    return 'secondary';
  }

  /**
   * Generates a consistent hex color from a string (for Avatars/Tags).
   */
  public stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  }

  // ==========================================================================
  // 3. FILE & DOWNLOAD UTILITIES
  // ==========================================================================

  /**
   * Downloads a Blob response (PDF, Excel, CSV) to the user's device.
   * @param blobData The Blob object from API response.
   * @param filename The name to save the file as.
   */
  public downloadBlob(blobData: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blobData);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Converts JSON data to CSV and triggers download.
   */
  public exportToCsv(data: any[], filename: string = 'export.csv'): void {
    if (!data || data.length === 0) {
      this.messageService.showWarn('No Data', 'There is no data to export.');
      return;
    }

    const replacer = (key: any, value: any) => value === null ? '' : value;
    const header = Object.keys(data[0]);
    const csv = [
      header.join(','),
      ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  // ==========================================================================
  // 4. FORM HANDLING UTILITIES
  // ==========================================================================

  /**
   * Marks all controls in a form group (and nested groups) as touched.
   * Triggers validation messages to show up.
   */
  public markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Debugging tool: Returns a list of all invalid controls and their errors.
   */
  public getFormValidationErrors(form: FormGroup): any[] {
    const errors: any[] = [];
    Object.keys(form.controls).forEach(key => {
      const controlErrors: ValidationErrors | null = form.get(key)?.errors || null;
      if (controlErrors) {
        Object.keys(controlErrors).forEach(keyError => {
          errors.push({
            control: key,
            error: keyError,
            value: controlErrors[keyError]
          });
        });
      }
    });
    return errors;
  }

  // ==========================================================================
  // 5. BROWSER & DOM UTILITIES
  // ==========================================================================

  public async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.messageService.showSuccess('Copied', 'Text copied to clipboard');
    } catch (err) {
      this.messageService.showError('Failed', 'Could not copy text');
    }
  }

  public scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  public printPage(): void {
    window.print();
  }

  // ==========================================================================
  // 6. URL & NAVIGATION
  // ==========================================================================

  public updateQueryParams(params: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  public goBack(): void {
    window.history.back();
  }

  // ==========================================================================
  // 7. RXJS ERROR HANDLER FACTORY
  // ==========================================================================

  /**
   * Creates a reusable error handler for RxJS pipes in Components.
   * @param operation Name of the operation (e.g., 'Load Users')
   */
  public createErrorHandler(operation: string = 'Operation') {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`${operation} failed:`, error);
      this.messageService.handleHttpError(error, operation);
      return throwError(() => error);
    };
  }


  public generateSku(name: string): string {
    if (!name) return '';

    // Normalize name → lowercase + remove special characters
    const normalized = name
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')   // remove symbols
      .trim()
      .replace(/\s+/g, '-');        // spaces → dash

    // Take first 3–5 characters for short code
    const shortCode = normalized.substring(0, 5);

    // Append a random 4-digit alphanumeric ID for uniqueness
    const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${shortCode}-${uniqueId}`.toUpperCase();
  }


  /**
   * Returns an HTML badge for status/paymentStatus
   * Safe to use inside AG Grid cellRenderer
   */
  public statusBadgeHtml(status: string): string {
    if (!status) return '';

    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#f3f4f6', text: '#374151' },
      issued: { bg: '#e0f2fe', text: '#0369a1' },
      paid: { bg: '#dcfce7', text: '#15803d' },
      unpaid: { bg: '#fee2e2', text: '#b91c1c' },
      partial: { bg: '#fef9c3', text: '#854d0e' },
      cancelled: { bg: '#f1f5f9', text: '#64748b' },
      completed: { bg: '#dcfce7', text: '#15803d' }
    };

    const key = status.toLowerCase();
    const theme = colors[key] || colors['draft'];

    return `
    <span style="
      background:${theme.bg};
      color:${theme.text};
      padding:4px 10px;
      border-radius:6px;
      font-size:11px;
      font-weight:700;
      text-transform:uppercase;
      letter-spacing:0.4px;
      display:inline-block;
    ">
      ${status}
    </span>
  `;
  }


  // Add this to your existing CommonMethodService class

  // ==========================================================================
  // ATTENDANCE SPECIFIC UTILITIES
  // ==========================================================================

  /**
   * Maps attendance status to PrimeNG severity levels
   */
  public mapAttendanceStatusToSeverity(status: string): Severity {
    if (!status) return 'secondary';

    const s = status.toLowerCase();

    switch (s) {
      // Present / Working - Green
      case 'present':
      case 'working':
      case 'approved':
      case 'completed':
      case 'checked_in':
      case 'break_end':
      case 'regular':
        return 'success';

      // Absent / Warning - Yellow/Orange
      case 'absent':
      case 'late':
      case 'half_day':
      case 'pending':
      case 'draft':
      case 'under_review':
      case 'wfh': // work from home
      case 'break_start':
        return 'warn';

      // Issues / Errors - Red
      case 'missed':
      case 'rejected':
      case 'cancelled':
      case 'emergency':
      case 'system_error':
      case 'forgot_punch':
      case 'time_correction':
        return 'danger';

      // Info / Special Cases - Blue
      case 'on_leave':
      case 'holiday':
      case 'week_off':
      case 'on_duty':
      case 'field_work':
      case 'info':
      case 'others':
        return 'info';

      // Default
      default:
        return 'secondary';
    }
  }

  /**
   * Maps attendance punch type to severity
   */
  public mapPunchTypeToSeverity(type: string): Severity {
    const t = type?.toLowerCase();

    switch (t) {
      case 'in':
      case 'checkin':
      case 'regular':
        return 'success';

      case 'out':
      case 'checkout':
        return 'danger';

      case 'break_start':
      case 'breakstart':
        return 'warn';

      case 'break_end':
      case 'breakend':
      case 'onduty':
      case 'wfh':
        return 'info';

      case 'field':
      case 'others':
        return 'secondary';

      default:
        return 'secondary';
    }
  }

  /**
   * Maps urgency level to severity
   */
  public mapUrgencyToSeverity(urgency: string): Severity {
    switch (urgency?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'danger';

      case 'medium':
        return 'warn';

      case 'low':
        return 'info';

      default:
        return 'secondary';
    }
  }

  /**
   * Get display text for attendance status
   */
  public getAttendanceStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      // Present variations
      'present': 'Present',
      'working': 'Working',
      'checked_in': 'Checked In',

      // Absent/Leave
      'absent': 'Absent',
      'on_leave': 'On Leave',
      'half_day': 'Half Day',
      'late': 'Late',

      // Special
      'holiday': 'Holiday',
      'week_off': 'Week Off',
      'wfh': 'Work From Home',
      'onduty': 'On Duty',
      'field': 'Field Work',

      // Request status
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'under_review': 'Under Review',
      'draft': 'Draft',

      // Machine status
      'processed': 'Processed',
      'orphan': 'Unidentified',
      'corrected': 'Corrected'
    };

    return statusMap[status?.toLowerCase()] || status;
  }

  /**
   * Get display text for punch type
   */
  public getPunchTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      'in': 'Check In',
      'checkin': 'Check In',
      'out': 'Check Out',
      'checkout': 'Check Out',
      'break_start': 'Break Start',
      'breakstart': 'Break Start',
      'break_end': 'Break End',
      'breakend': 'Break End',
      'regular': 'Regular',
      'wfh': 'Work From Home',
      'onduty': 'On Duty',
      'field': 'Field Work'
    };

    return typeMap[type?.toLowerCase()] || type;
  }

  /**
   * Get icon for attendance status/punch type
   */
  public getAttendanceIcon(type: string): string {
    const iconMap: Record<string, string> = {
      // Punch types
      'in': 'pi pi-sign-in',
      'checkin': 'pi pi-sign-in',
      'out': 'pi pi-sign-out',
      'checkout': 'pi pi-sign-out',
      'break_start': 'pi pi-coffee',
      'breakstart': 'pi pi-coffee',
      'break_end': 'pi pi-play',
      'breakend': 'pi pi-play',

      // Status
      'present': 'pi pi-check-circle',
      'absent': 'pi pi-times-circle',
      'late': 'pi pi-clock',
      'half_day': 'pi pi-hourglass',
      'on_leave': 'pi pi-calendar',
      'holiday': 'pi pi-star',
      'approved': 'pi pi-check',
      'rejected': 'pi pi-times',
      'pending': 'pi pi-hourglass',

      // Work types
      'wfh': 'pi pi-home',
      'onduty': 'pi pi-car',
      'field': 'pi pi-map-marker',

      // Emergency/Issues
      'emergency': 'pi pi-exclamation-triangle',
      'system_error': 'pi pi-exclamation-circle',
      'forgot_punch': 'pi pi-history'
    };

    return iconMap[type?.toLowerCase()] || 'pi pi-clock';
  }

  /**
   * Get CSS class for attendance status (for Tailwind/Bootstrap)
   */
  public getAttendanceStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      // Tailwind classes
      'present': 'bg-green-100 text-green-700 border border-green-200',
      'absent': 'bg-red-100 text-red-700 border border-red-200',
      'late': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      'half_day': 'bg-blue-100 text-blue-700 border border-blue-200',
      'on_leave': 'bg-purple-100 text-purple-700 border border-purple-200',
      'holiday': 'bg-gray-100 text-gray-700 border border-gray-200',
      'week_off': 'bg-gray-100 text-gray-700 border border-gray-200',
      'wfh': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      'onduty': 'bg-orange-100 text-orange-700 border border-orange-200',
      'field': 'bg-teal-100 text-teal-700 border border-teal-200',

      // Request status
      'approved': 'bg-green-100 text-green-700 border border-green-200',
      'rejected': 'bg-red-100 text-red-700 border border-red-200',
      'pending': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      'under_review': 'bg-blue-100 text-blue-700 border border-blue-200',
      'draft': 'bg-gray-100 text-gray-700 border border-gray-200'
    };

    return classMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border border-gray-200';
  }

  /**
   * Get badge HTML for attendance status (for AG Grid or tables)
   */
  public attendanceStatusBadgeHtml(status: string): string {
    const severity = this.mapAttendanceStatusToSeverity(status);
    const text = this.getAttendanceStatusText(status);
    const icon = this.getAttendanceIcon(status);

    const colorMap: Record<string, { bg: string; text: string }> = {
      success: { bg: '#dcfce7', text: '#15803d' },
      warn: { bg: '#fef9c3', text: '#854d0e' },
      danger: { bg: '#fee2e2', text: '#b91c1c' },
      info: { bg: '#e0f2fe', text: '#0369a1' },
      secondary: { bg: '#f3f4f6', text: '#374151' }
    };

    const theme = colorMap[severity || 'secondary'] || colorMap['secondary'];

    return `
    <span style="
      background: ${theme.bg};
      color: ${theme.text};
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    ">
      <i class="${icon}" style="font-size: 10px;"></i>
      ${text}
    </span>
  `;
  }

  /**
   * Format punch time with timezone awareness
   */
  public formatPunchTime(dateTime: string | Date | null | undefined): string {
    if (!dateTime) return '--:--';

    try {
      const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;

      // Check if date is valid
      if (isNaN(date.getTime())) return '--:--';

      // Format as 24-hour time
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${hours}:${minutes}`;
    } catch (e) {
      return '--:--';
    }
  }

  /**
   * Format attendance date with day name
   */
  public formatAttendanceDate(dateStr: string | Date): string {
    if (!dateStr) return '';

    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

      // Check if date is valid
      if (isNaN(date.getTime())) return '';

      return this.datePipe.transform(date, 'EEEE, dd MMM yyyy') || '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Calculate working hours between two times
   */
  public calculateWorkingHours(startTime: string | Date, endTime: string | Date): string {
    if (!startTime || !endTime) return '0:00';

    try {
      const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
      const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '0:00';

      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      return `${diffHours}:${diffMinutes.toString().padStart(2, '0')}`;
    } catch (e) {
      return '0:00';
    }
  }

  /**
   * Check if date is today
   */
  public isToday(dateStr: string | Date): boolean {
    if (!dateStr) return false;

    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      const today = new Date();

      return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    } catch (e) {
      return false;
    }
  }

  /**
   * Get day name from date
   */
  public getDayName(dateStr: string | Date): string {
    if (!dateStr) return '';

    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

      return this.datePipe.transform(date, 'EEE') || '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Generate date range for attendance filters
   */
  public getDateRange(range: 'today' | 'week' | 'month' | 'year'): { startDate: string; endDate: string } {
    const today = new Date();
    let startDate = new Date();

    switch (range) {
      case 'today':
        startDate = today;
        break;

      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;

      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;

      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    const format = (date: Date) => date.toISOString().split('T')[0];

    return {
      startDate: format(startDate),
      endDate: format(today)
    };
  }

  /**
   * Validate regularization request data
   */
  public validateRegularizationRequest(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.targetDate) {
      errors.push('Target date is required');
    }

    if (!data.type) {
      errors.push('Request type is required');
    }

    if (!data.reason || data.reason.trim().length < 10) {
      errors.push('Reason must be at least 10 characters');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (data.targetDate && !dateRegex.test(data.targetDate)) {
      errors.push('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate not future date
    if (data.targetDate) {
      const target = new Date(data.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (target > today) {
        errors.push('Cannot regularize future dates');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
