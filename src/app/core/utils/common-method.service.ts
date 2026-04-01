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
    // this.loadingService.show();

    observable$.pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        successFn(res);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
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
      this.messageService.showWarn('There is no data to export.');
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
      this.messageService.showSuccess('Text copied to clipboard');
    } catch (err) {
      this.messageService.showError('Could not copy text');
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
      this.messageService.handleHttpError(error);
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
allThemes: Theme[] = [
    // ---------------------------------------------------------
    // LIGHT THEMES
    // ---------------------------------------------------------
    {
      name: "Light Default",
      id: "theme-light",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
      category: "light",
      description: "Clean, default SaaS light mode with sleek blue accents."
    },
    {
      name: "Ivory",
      id: "theme-ivory",
      color: "#B35A3D",
      gradient: "linear-gradient(135deg, #B35A3D 0%, #D4846A 100%)",
      category: "light",
      description: "Premium, warm, and editorial design with terracotta accents on soft ivory."
    },
    {
      name: "Aurora",
      id: "theme-aurora",
      color: "#4a6fa5",
      gradient: "linear-gradient(135deg, #4a6fa5 0%, #7fb5c8 100%)",
      category: "light",
      description: "Cool corporate blue with crisp, professional slate tones."
    },
    {
      name: "Verdant",
      id: "theme-verdant",
      color: "#2d6a2d",
      gradient: "linear-gradient(135deg, #2d6a2d 0%, #7ab87a 100%)",
      category: "light",
      description: "Organic, calm, and botanical with refreshing forest and leaf greens."
    },
    {
      name: "Coastal Command",
      id: "theme-coastal-command",
      color: "#0d9488",
      gradient: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
      category: "light",
      description: "Enterprise SaaS teal with cool neutral backgrounds for commanding authority."
    },
    {
      name: "Warm Meridian",
      id: "theme-warm-meridian",
      color: "#0a7c72",
      gradient: "linear-gradient(135deg, #0a7c72 0%, #d97706 100%)",
      category: "light",
      description: "Refined and welcoming warm ivory backgrounds with sophisticated gold-teal accents."
    },
    {
      name: "Daylight Orange",
      id: "theme-daylight-orange",
      color: "#f97316",
      gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 55%, #fb923c 100%)",
      category: "light",
      description: "Cool pearl white surfaces accented by energetic, bright orange gradients."
    },
    {
      name: "Naval Dawn",
      id: "theme-naval-dawn",
      color: "#ffbf00",
      gradient: "linear-gradient(135deg, #cc9900 0%, #ffbf00 55%, #ffcf40 100%)",
      category: "light",
      description: "Crisp, airy naval whites and greys offset by a commanding golden-amber glow."
    },

    // ---------------------------------------------------------
    // DARK THEMES
    // ---------------------------------------------------------
    {
      name: "Dark Default",
      id: "theme-dark",
      color: "#818cf8",
      gradient: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
      category: "dark",
      description: "Sleek, modern Tailwind-style dark mode with soft indigo accents."
    },
    {
      name: "Neon Eclipse",
      id: "theme-neon-eclipse",
      color: "#ff6600",
      gradient: "linear-gradient(135deg, #ff4400 0%, #ff6600 55%, #ff8533 100%)",
      category: "dark",
      description: "Vibrant neon tones piercing through a deep, dark eclipse background."
    },
    {
      name: "Obsidian Rose",
      id: "theme-obsidian-rose",
      color: "#ff2d78",
      gradient: "linear-gradient(135deg, #cc0055 0%, #ff2d78 45%, #d4af37 100%)",
      category: "dark",
      description: "Volcanic black surface with hot-pink glass panels and gold micro-details."
    },
    {
      name: "Deep Emerald",
      id: "theme-deep-emerald",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
      category: "dark",
      description: "Flagship dark theme featuring deep navy backgrounds and electric emerald accents."
    },
    {
      name: "Midnight Bronze",
      id: "theme-midnight-bronze",
      color: "#c49050",
      gradient: "linear-gradient(135deg, #a87030 0%, #c49050 55%, #d8a870 100%)",
      category: "dark",
      description: "Rich navy base with warm, premium bronze and gold glassmorphism details."
    },
    {
      name: "Molten Ember",
      id: "theme-molten-ember",
      color: "#ff6420",
      gradient: "linear-gradient(135deg, #cc4400 0%, #ff6420 48%, #ffaa44 100%)",
      category: "dark",
      description: "Deep charcoal-brown with vibrant orange-gold fire glowing from below."
    },
    {
      name: "Neon Void",
      id: "theme-neon-void",
      color: "#b44dff",
      gradient: "linear-gradient(135deg, #7722ee 0%, #b44dff 48%, #00ccff 100%)",
      category: "dark",
      description: "Pure black void with violet-purple neon corona and cyberpunk cyan glows."
    },
    {
      name: "Obsidian Jade",
      id: "theme-obsidian-jade",
      color: "#2dd4bf",
      gradient: "linear-gradient(135deg, #0d9488 0%, #2dd4bf 50%, #a3e8c8 100%)",
      category: "dark",
      description: "Warm deep charcoal contrasted with glowing jade and gold luxury aesthetics."
    },
    {
      name: "Solar Flare",
      id: "theme-solar-flare",
      color: "#fb923c",
      gradient: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #db2777 100%)",
      category: "dark",
      description: "Intense deep red and brown backgrounds radiating a bright, solar orange flare."
    },
    {
      name: "Nebula",
      id: "theme-nebula",
      color: "#d946ef",
      gradient: "linear-gradient(to right, #ec4899 0%, #a855f7 55%, #8b5cf6 100%)",
      category: "dark",
      description: "Deep void space with striking fuchsia and purple nebula-inspired gradients."
    },
    {
      name: "Luxury",
      id: "theme-luxury",
      color: "#d4af37",
      gradient: "linear-gradient(135deg, #9c7a00 0%, #d4af37 55%, #f59e0b 100%)",
      category: "dark",
      description: "Classic onyx black and rich gold styling for an uncompromising luxury feel."
    },
    {
      name: "Abyssal Coral",
      id: "theme-abyssal-coral",
      color: "#ff7040",
      gradient: "linear-gradient(135deg, #f05030 0%, #ff7040 55%, #ff9470 100%)",
      category: "dark",
      description: "Deep oceanic abyssal tones paired with vibrant, living coral highlights."
    },

    // ---------------------------------------------------------
    // GLASSMORPHISM THEMES
    // ---------------------------------------------------------
    {
      name: "Aurora Glass",
      id: "theme-aurora-glass",
      color: "#39ff8a",
      gradient: "linear-gradient(135deg, #00d4a0 0%, #39ff8a 40%, #a855f7 100%)",
      category: "glass",
      description: "Deep arctic night sky with green-violet aurora bleeding through thick frosted ice."
    },
    {
      name: "Arctic Crystal",
      id: "theme-arctic-crystal",
      color: "#0ea5e9",
      gradient: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)",
      category: "glass",
      description: "Pure white-blue crystalline light with extreme frosted glass and maximum luminosity."
    },
    {
      name: "Horizon",
      id: "theme-horizon",
      color: "#ffbd9b",
      gradient: "linear-gradient(135deg, #f56217 0%, #ff8c50 100%)",
      category: "glass",
      description: "A striking gradient background bleeding through sleek, frosted glass surfaces."
    }
  ];
  // allThemes: Theme[] = [
  //   { 
  //   name: "Ivory", 
  //   id: "ivory", 
  //   color: "#B35A3D", 
  //   gradient: "linear-gradient(135deg, #B35A3D 0%, #D4846A 100%)", 
  //   category: "light", 
  //   description: "Premium, warm, and minimalist design with terracotta accents on soft ivory backgrounds." 
  // },
  // { 
  //   name: "Aurora", 
  //   id: "aurora", 
  //   color: "#4a6fa5", 
  //   gradient: "linear-gradient(135deg, #4a6fa5 0%, #7fb5c8 100%)", 
  //   category: "light", 
  //   description: "Clean, corporate, and professional with crisp blue and slate tones." 
  // },
  // { 
  //   name: "Ember", 
  //   id: "ember", 
  //   color: "#c05621", 
  //   gradient: "linear-gradient(135deg, #c05621 0%, #d4a843 100%)", 
  //   category: "light", 
  //   description: "Warm, earthy, and energetic featuring deep orange and radiant gold gradients." 
  // },
  // { 
  //   name: "Verdant", 
  //   id: "verdant", 
  //   color: "#2d6a2d", 
  //   gradient: "linear-gradient(135deg, #2d6a2d 0%, #7ab87a 100%)", 
  //   category: "light", 
  //   description: "Organic, calm, and botanical with refreshing forest and leaf greens." 
  // },
  // { 
  //   name: "Sakura", 
  //   id: "sakura", 
  //   color: "#b83060", 
  //   gradient: "linear-gradient(135deg, #b83060 0%, #e897b0 100%)", 
  //   category: "light", 
  //   description: "Soft, floral, and elegant using delicate pinks and rich rose shades." 
  // },
  // { 
  //   name: "Cyberpunk", 
  //   id: "cyberpunk", 
  //   color: "#fef08a", 
  //   gradient: "linear-gradient(135deg, #fef08a 0%, #22d3ee 100%)", 
  //   category: "dark", 
  //   description: "High-contrast retro-futuristic dark mode with piercing neon yellow and cyan." 
  // },
  //   { name: "theme-neon-eclipse", id: "theme-neon-eclipse", color: "#bf00ff", gradient: "linear-gradient(135deg, #bf00ff 0%, #3a0088 100%)", category: "dark", description: "Vibrant neon tones piercing through a deep, dark eclipse background." },
  //   { name: "theme-naval-amber", id: "theme-naval-amber", color: "#ffbf00", gradient: "linear-gradient(135deg, #000080 0%, #ffbf00 100%)", category: "professional", description: "A commanding deep naval blue contrasted with warm, glowing amber highlights." },
  //   { name: "theme-abyssal-coral", id: "theme-abyssal-coral", color: "#ff7f50", gradient: "linear-gradient(135deg, #0b1d28 0%, #ff7f50 100%)", category: "dark", description: "Deep oceanic abyssal tones paired with vibrant, living coral." },
  //   { name: "theme-slate-rust", id: "theme-slate-rust", color: "#b7410e", gradient: "linear-gradient(135deg, #708090 0%, #b7410e 100%)", category: "professional", description: "Cool slate gray accented by earthy, oxidized rust tones." },
  //   { name: "theme-indigo-tangerine", id: "theme-indigo-tangerine", color: "#f28500", gradient: "linear-gradient(135deg, #4b0082 0%, #f28500 100%)", category: "colorful", description: "A striking combination of deep indigo and bright, citrusy tangerine." },
  //   { name: "theme-solar-space", id: "theme-solar-space", color: "#ffcc00", gradient: "linear-gradient(135deg, #000000 0%, #ffcc00 100%)", category: "dark", description: "The absolute darkness of space illuminated by intense solar yellow." },
  //   { name: "theme-cobalt-mango", id: "theme-cobalt-mango", color: "#ff8243", gradient: "linear-gradient(135deg, #0047ab 0%, #ff8243 100%)", category: "colorful", description: "Rich cobalt blue balanced with sweet, tropical mango orange." },
  //   { name: "theme-sapphire-flame", id: "theme-sapphire-flame", color: "#e25822", gradient: "linear-gradient(135deg, #0f52ba 0%, #e25822 100%)", category: "colorful", description: "Cool sapphire depths ignited by a warm, fiery red-orange." },
  //   { name: "theme-oceanic-peach", id: "theme-oceanic-peach", color: "#ffcba4", gradient: "linear-gradient(135deg, #006994 0%, #ffcba4 100%)", category: "modern", description: "Rolling oceanic blues softened by gentle peach pastels." },
  //   { name: "theme-lapis-tiger", id: "theme-lapis-tiger", color: "#fd6a02", gradient: "linear-gradient(135deg, #26619c 0%, #fd6a02 100%)", category: "colorful", description: "Bold lapis lazuli combined with fierce, striking tiger orange." },
  //   { name: "theme-midnight-marigold", id: "theme-midnight-marigold", color: "#eaa221", gradient: "linear-gradient(135deg, #191970 0%, #eaa221 100%)", category: "dark", description: "The darkest midnight hour lit up by golden marigold hues." },
  //   { name: "theme-twilight-burnt", id: "theme-twilight-burnt", color: "#cc5500", gradient: "linear-gradient(135deg, #301934 0%, #cc5500 100%)", category: "dark", description: "A fading twilight purple grounded by deep, burnt orange." },
  //   { name: "theme-void-electric", id: "theme-void-electric", color: "#0ff0fc", gradient: "linear-gradient(135deg, #0f0f0f 0%, #0ff0fc 100%)", category: "dark", description: "A deep, empty void pierced by bright electric cyan." },
  //   { name: "theme-storm-apricot", id: "theme-storm-apricot", color: "#fbceb1", gradient: "linear-gradient(135deg, #4f666a 0%, #fbceb1 100%)", category: "modern", description: "Turbulent storm-cloud grays offset by a soft, cheerful apricot." },
  //   { name: "theme-marine-copper", id: "theme-marine-copper", color: "#b87333", gradient: "linear-gradient(135deg, #000080 0%, #b87333 100%)", category: "professional", description: "Nautical marine blues complemented by polished copper accents." },
  //   { name: "theme-royal-pumpkin", id: "theme-royal-pumpkin", color: "#ff7518", gradient: "linear-gradient(135deg, #4169e1 0%, #ff7518 100%)", category: "colorful", description: "Classic royal blue paired with a festive, bright pumpkin orange." },
  //   { name: "theme-eclipse-tangerine", id: "theme-eclipse-tangerine", color: "#f28500", gradient: "linear-gradient(135deg, #111111 0%, #f28500 100%)", category: "dark", description: "A stark shadow eclipse rimmed with a vibrant tangerine glow." },
  //   { name: "theme-cyber-navy", id: "theme-cyber-navy", color: "#00ff00", gradient: "linear-gradient(135deg, #000080 0%, #00ff00 100%)", category: "modern", description: "Traditional navy blue upgraded with futuristic cyber-green elements." },
  //   { name: "theme-midnight-gold", id: "theme-midnight-gold", color: "#ffd700", gradient: "linear-gradient(135deg, #191970 0%, #ffd700 100%)", category: "luxury", description: "Luxurious metallic gold standing out against a midnight backdrop." },
  //   { name: "theme-deep-supernova", id: "theme-deep-supernova", color: "#ff4040", gradient: "linear-gradient(135deg, #1a0b2e 0%, #ff4040 100%)", category: "dark", description: "The deep purples of space exploding into a brilliant red supernova." },
  //   { name: "theme-midnight-bronze", id: "theme-midnight-bronze", color: "#cd7f32", gradient: "linear-gradient(135deg, #191970 0%, #cd7f32 100%)", category: "luxury", description: "Dark, moody blues accented by rich, antiqued bronze." },
  //   { name: "theme-frosted-pearl", id: "theme-frosted-pearl", color: "#eae0c8", gradient: "linear-gradient(135deg, #ffffff 0%, #eae0c8 100%)", category: "minimal", description: "A clean, bright theme featuring icy whites and soft pearl undertones." },
  //   { name: "theme-crisp-structure", id: "theme-crisp-structure", color: "#2a2a2a", gradient: "linear-gradient(135deg, #f5f5f5 0%, #2a2a2a 100%)", category: "minimal", description: "High-contrast architectural whites and structured, sharp charcoal grays." },
  //   { name: "theme-blueprint-light", id: "theme-blueprint-light", color: "#3b82f6", gradient: "linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)", category: "professional", description: "A light, analytical theme inspired by crisp architectural blueprints." },
  //   { name: "theme-cloud-ivory", id: "theme-cloud-ivory", color: "#fffff0", gradient: "linear-gradient(135deg, #f0f8ff 0%, #fffff0 100%)", category: "minimal", description: "Soft, floating cloud colors blended with warm, luxurious ivory." },
  //   { name: "theme-royal-sapphire", id: "theme-royal-sapphire", color: "#0f52ba", gradient: "linear-gradient(135deg, #4169e1 0%, #0f52ba 100%)", category: "luxury", description: "A majestic blend of royal blue and deep, brilliant sapphire." },
  //   { name: "theme-ocean-mist", id: "theme-ocean-mist", color: "#e0ffff", gradient: "linear-gradient(135deg, #006994 0%, #e0ffff 100%)", category: "minimal", description: "Cool oceanic blues softened by a sheer, breathable mist." },
  //   { name: "theme-executive-velvet", id: "theme-executive-velvet", color: "#800020", gradient: "linear-gradient(135deg, #1a1a1a 0%, #800020 100%)", category: "luxury", description: "Professional, dark styling with rich, tactile burgundy velvet accents." },
  //   { name: "theme-obsidian-blue", id: "theme-obsidian-blue", color: "#00008b", gradient: "linear-gradient(135deg, #0b0b0b 0%, #00008b 100%)", category: "dark", description: "Sleek, black volcanic obsidian shining with deep blue undertones." },
  //   { name: "theme-coastal-command", id: "theme-coastal-command", color: "#4682b4", gradient: "linear-gradient(135deg, #2f4f4f 0%, #4682b4 100%)", category: "professional", description: "Authoritative slate and steel blues inspired by coastal defense operations." },
  //   { name: "theme-warm-meridian", id: "theme-warm-meridian", color: "#ff8c00", gradient: "linear-gradient(135deg, #d2691e 0%, #ff8c00 100%)", category: "colorful", description: "Sun-drenched, equatorial warmth in deep orange and terracotta." },
  //   { name: "theme-arctic-glass", id: "theme-arctic-glass", color: "#b0e0e6", gradient: "linear-gradient(135deg, #ffffff 0%, #b0e0e6 100%)", category: "minimal", description: "Transparent, freezing whites combined with icy powder blues." },
  //   { name: "theme-obsidian-contrast", id: "theme-obsidian-contrast", color: "#ffffff", gradient: "linear-gradient(135deg, #050505 0%, #ffffff 100%)", category: "dark", description: "Maximum contrast featuring pitch-black obsidian and pure white." },
  //   { name: "theme-deep-emerald", id: "theme-deep-emerald", color: "#004b23", gradient: "linear-gradient(135deg, #001f0e 0%, #004b23 100%)", category: "dark", description: "Lush, dark green styling inspired by deep forest emeralds." },
  //   { name: "theme-obsidian-jade", id: "theme-obsidian-jade", color: "#00a86b", gradient: "linear-gradient(135deg, #0b0b0b 0%, #00a86b 100%)", category: "dark", description: "Dark, glossy obsidian paired with striking, vibrant jade green." },
  //   { name: "theme-daylight-orange", id: "theme-daylight-orange", color: "#ff8c00", gradient: "linear-gradient(135deg, #87ceeb 0%, #ff8c00 100%)", category: "colorful", description: "Bright daylight sky blues warming up to a sunny, daytime orange." },
  //   { name: "theme-morning-tangerine", id: "theme-morning-tangerine", color: "#f28500", gradient: "linear-gradient(135deg, #ffdf00 0%, #f28500 100%)", category: "colorful", description: "A fresh, awakening blend of early yellow light and tangerine." },
  //   { name: "theme-crisp-apricot", id: "theme-crisp-apricot", color: "#fbceb1", gradient: "linear-gradient(135deg, #ffffff 0%, #fbceb1 100%)", category: "minimal", description: "Clean whites with a very subtle, refreshing splash of apricot." },
  //   { name: "theme-naval-dawn", id: "theme-naval-dawn", color: "#ffb6c1", gradient: "linear-gradient(135deg, #000080 0%, #ffb6c1 100%)", category: "modern", description: "Deep naval night-sky giving way to the soft pinks of early dawn." },
  //   { name: "theme-azure-sun", id: "theme-azure-sun", color: "#ffd700", gradient: "linear-gradient(135deg, #007fff 0%, #ffd700 100%)", category: "colorful", description: "A brilliant, cloudless azure sky paired with a radiant yellow sun." },
  //   { name: "theme-cloud-amber", id: "theme-cloud-amber", color: "#ffbf00", gradient: "linear-gradient(135deg, #f0f8ff 0%, #ffbf00 100%)", category: "minimal", description: "Soft, misty cloud grays touched by the warm glow of amber." },
  //   { name: "theme-luminous-coral", id: "theme-luminous-coral", color: "#ff7f50", gradient: "linear-gradient(135deg, #ffdab9 0%, #ff7f50 100%)", category: "colorful", description: "A highly radiant, glowing coral over a warm, luminous background." },
  //   { name: "theme-midnight-slate", id: "theme-midnight-slate", color: "#708090", gradient: "linear-gradient(135deg, #191970 0%, #708090 100%)", category: "dark", description: "The deep hues of midnight blue resting against cool, rigid slate." },
  //   { name: "theme-solar-flare", id: "theme-solar-flare", color: "#ff4500", gradient: "linear-gradient(135deg, #ff8c00 0%, #ff4500 100%)", category: "colorful", description: "Intense, radiating heat captured through brilliant oranges and reds." },
  //   { name: "theme-horizon", id: "theme-horizon", color: "#db7093", gradient: "linear-gradient(135deg, #87ceeb 0%, #db7093 100%)", category: "modern", description: "A vast gradient spanning from a light blue sky to a pale, dusky pink." },
  //   { name: "theme-midnight-city", id: "theme-midnight-city", color: "#ff1493", gradient: "linear-gradient(135deg, #1a1a2e 0%, #ff1493 100%)", category: "dark", description: "Dark, urban nightscapes splashed with bright pink neon lights." },
  //   { name: "theme-bio-frost", id: "theme-bio-frost", color: "#00fa9a", gradient: "linear-gradient(135deg, #e0ffff 0%, #00fa9a 100%)", category: "modern", description: "Organic, glowing bio-luminescent greens under a layer of icy frost." },
  //   { name: "theme-royal", id: "theme-royal", color: "#4169e1", gradient: "linear-gradient(135deg, #000080 0%, #4169e1 100%)", category: "core", description: "A classic, elegant theme rooted entirely in majestic royal blues." },
  //   { name: "theme-nebula", id: "theme-nebula", color: "#8a2be2", gradient: "linear-gradient(135deg, #4b0082 0%, #8a2be2 100%)", category: "dark", description: "Swirling, cosmic dust rendered in vibrant purples and deep indigos." },
  //   { name: "theme-luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #000000 0%, #d4af37 100%)", category: "luxury", description: "High-end aesthetic combining absolute black with opulent gold." },
  //   { name: "theme-futuristic", id: "theme-futuristic", color: "#00ffff", gradient: "linear-gradient(135deg, #0a0a0a 0%, #00ffff 100%)", category: "modern", description: "A highly technical dark interface lit by sharp, glowing cyan." },
  //   { name: "theme-sunset", id: "theme-sunset", color: "#ff4500", gradient: "linear-gradient(135deg, #ff8c00 0%, #ff4500 100%)", category: "colorful", description: "The dramatic, cascading colors of a late evening sunset." },
  //   { name: "theme-slate-ember", id: "theme-slate-ember", color: "#b88645", gradient: "linear-gradient(135deg, #2f4f4f 0%, #b88645 100%)", category: "dark", description: "Dark premium glass with deep blue base and rich bronze accents." },
  //   { name: "theme-sage-cream", id: "theme-sage-cream", color: "#fffdd0", gradient: "linear-gradient(135deg, #9dc183 0%, #fffdd0 100%)", category: "minimal", description: "An earthy, calming blend of herbal sage green and smooth cream." },
  //   { name: "theme-midnight-royal", id: "theme-midnight-royal", color: "#4169e1", gradient: "linear-gradient(135deg, #191970 0%, #4169e1 100%)", category: "dark", description: "A rich, monochromatic dive from midnight shadows into royal blue." },
  //   { name: "theme-deep-space", id: "theme-deep-space", color: "#ffffff", gradient: "linear-gradient(135deg, #0d0d0d 0%, #2a2a35 100%)", category: "dark", description: "An ultra-dark, immersive theme mirroring the vastness of space." },
  //   { name: "theme-rose-glass", id: "theme-rose-glass", color: "#ff66cc", gradient: "linear-gradient(135deg, #ffb6c1 0%, #ff66cc 100%)", category: "minimal", description: "Translucent, elegant interfaces tinted with a delicate rose hue." },
  //   { name: "theme-amethyst-pearl", id: "theme-amethyst-pearl", color: "#9966cc", gradient: "linear-gradient(135deg, #fdfbf7 0%, #9966cc 100%)", category: "luxury", description: "Soft pearlescent whites intersecting with crystalline amethyst purple." },
  //   { name: "theme-indigo-breeze", id: "theme-indigo-breeze", color: "#00bfff", gradient: "linear-gradient(135deg, #4b0082 0%, #00bfff 100%)", category: "modern", description: "Heavy, dark indigo lightened by a sweeping, breezy cyan." },
  //   { name: "theme-teal-mist", id: "theme-teal-mist", color: "#008080", gradient: "linear-gradient(135deg, #e0f6f6 0%, #008080 100%)", category: "modern", description: "A foggy, atmospheric gradient featuring deep and light teal tones." },
  //   { name: "theme-emerald-dawn", id: "theme-emerald-dawn", color: "#50c878", gradient: "linear-gradient(135deg, #013220 0%, #50c878 100%)", category: "modern", description: "The transition from dark, forest night to a vibrant emerald morning." },
  //   { name: "theme-royal-sky", id: "theme-royal-sky", color: "#87ceeb", gradient: "linear-gradient(135deg, #4169e1 0%, #87ceeb 100%)", category: "modern", description: "A soaring gradient blending deep royal blue into light sky blue." },
  //   { name: "theme-violet-whisper", id: "theme-violet-whisper", color: "#ee82ee", gradient: "linear-gradient(135deg, #f8f8ff 0%, #ee82ee 100%)", category: "minimal", description: "A barely-there, airy theme with a soft touch of violet." },
  //   { name: "theme-aurora-glass", id: "theme-aurora-glass", color: "#00ff7f", gradient: "linear-gradient(135deg, #020024 0%, #00ff7f 100%)", category: "modern", description: "Translucent layering capturing the green luminescence of the aurora." },
  //   { name: "theme-obsidian-rose", id: "theme-obsidian-rose", color: "#ff007f", gradient: "linear-gradient(135deg, #111111 0%, #ff007f 100%)", category: "dark", description: "Sleek, dark obsidian pierced by a bold, romantic rose pink." },
  //   { name: "theme-arctic-crystal", id: "theme-arctic-crystal", color: "#aeece1", gradient: "linear-gradient(135deg, #ffffff 0%, #aeece1 100%)", category: "minimal", description: "A pristine, sharp theme inspired by crystalline arctic ice formations." },
  //   { name: "theme-neon-void", id: "theme-neon-void", color: "#ff00ff", gradient: "linear-gradient(135deg, #050505 0%, #ff00ff 100%)", category: "dark", description: "A deep black void illuminated by sharp, neon magenta accents." },
  //   { name: "theme-molten-ember", id: "theme-molten-ember", color: "#ff4500", gradient: "linear-gradient(135deg, #3a0d04 0%, #ff4500 100%)", category: "dark", description: "Dark, smoldering charcoal glowing with intense, molten ember reds." }
  // ];
}
