import { Injectable, inject } from '@angular/core';
import { DatePipe, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, ValidationErrors, FormArray, AbstractControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject, Subscription } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';
import { AppMessageService } from '../services/message.service';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type Severity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

export interface ApiCallOptions {
  /** Skip global loading spinner */
  skipLoading?: boolean;
  /** Skip global error toast (handle manually) */
  skipErrorToast?: boolean;
  /** Destroy signal — auto-unsubscribes when component destroys */
  destroy$?: Subject<void>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  value: any;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
}

export interface SelectOption {
  label: string;
  value: any;
  icon?: string;
  disabled?: boolean;
  severity?: Severity;
}

export interface AddressFormat {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface TimeAgoResult {
  text: string;
  unit: 'just now' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
  value: number;
}

// ============================================================

@Injectable({
  providedIn: 'root'
})
export class CommonMethodService {

  // ── Dependencies ──────────────────────────────────────────
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  private datePipe = inject(DatePipe);
  private decimalPipe = inject(DecimalPipe);
  private percentPipe = inject(PercentPipe);
  private router = inject(Router);
  private route = inject(ActivatedRoute);


  // ==========================================================================
  // SECTION 1 ▸ API CALL HANDLER
  // ==========================================================================

  /**
   * 🚀 THE ULTIMATE API HANDLER
   * Handles Loading, Error, Subscription, and optional auto-unsubscribe.
   *
   * @param observable$  The API call (e.g., this.service.getById(id))
   * @param successFn    Callback for successful response
   * @param context      Label for error logging (e.g., 'Fetch Invoice')
   * @param options      Optional config: skipLoading, skipErrorToast, destroy$
   * @returns            Subscription — unsubscribe in ngOnDestroy if no destroy$ provided
   *
   * @example
   * // Basic
   * this.common.apiCall(this.invoiceService.getAll(), (res) => this.invoices = res.data);
   *
   * @example
   * // With destroy$ (auto-cleanup)
   * this.common.apiCall(obs$, (res) => { ... }, 'Load Users', { destroy$: this.destroy$ });
   */
  public apiCall<T>(
    observable$: Observable<T>,
    successFn: (response: T) => void,
    context: string = 'Operation',
    options: ApiCallOptions = {}
  ): Subscription {
    const { skipLoading = false, skipErrorToast = false, destroy$ } = options;

    if (!skipLoading) this.loadingService.show();

    let pipe$ = observable$.pipe(finalize(() => { if (!skipLoading) this.loadingService.hide(); }));
    if (destroy$) pipe$ = pipe$.pipe(takeUntil(destroy$));

    return pipe$.subscribe({
      next: (res) => successFn(res),
      error: (err) => {
        if (!skipErrorToast) this.messageService.handleHttpError(err);
        console.error(`[apiCall] ${context} failed:`, err);
      }
    });
  }

  public badge(label: string, bg: string, color: string, border: string): string {
    return `<span style="
      background:${bg};
      color:${color};
      border:1px solid ${border};
      padding:1px 6px;
      border-radius:3px;
      font-size:10px;
      font-weight:700;
      letter-spacing:0.3px;
      text-transform:uppercase;
      white-space:nowrap;
      line-height:1.4;
      display:inline-block;">
      ${label}
    </span>`;
  }

  public twoLine(
    top: string,
    bottom: string,
    topStyle = 'font-size:11px;color:var(--text-secondary);',
    bottomStyle = 'font-size:10px;color:var(--text-tertiary);'
  ): string {
    return `
      <div style="
        display:flex;flex-direction:column;
        justify-content:center;gap:0px;
        line-height:1.25;overflow:hidden;">
        <span style="${topStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${top}</span>
        <span style="${bottomStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${bottom}</span>
      </div>`;
  }

  /**
   * Promise-based API call — useful inside async/await functions.
   * Automatically shows/hides global loader.
   */
  public apiCallAsync<T>(
    observable$: Observable<T>,
    options: ApiCallOptions = {}
  ): Promise<T> {
    const { skipLoading = false } = options;
    if (!skipLoading) this.loadingService.show();

    return new Promise((resolve, reject) => {
      observable$.pipe(
        finalize(() => { if (!skipLoading) this.loadingService.hide(); })
      ).subscribe({
        next: resolve,
        error: (err) => {
          this.messageService.handleHttpError(err);
          reject(err);
        }
      });
    });
  }

  // ==========================================================================
  // SECTION 2 ▸ FORMATTING — CURRENCY / NUMBER / PERCENT
  // ==========================================================================

  /**
   * Format as Indian Rupee  →  ₹1,00,000.00
   */
  public formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '₹0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format any currency with symbol and locale.
   * @example formatCurrencyIntl(1500, 'USD', 'en-US')  →  $1,500.00
   */
  public formatCurrencyIntl(
    value: number,
    currency: string = 'INR',
    locale: string = 'en-IN'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(value);
  }

  /**
   * Format large numbers with K / L / Cr suffix (Indian notation).
   * @example formatCompactIndian(1500000)  →  "15L"
   */
  public formatCompactIndian(value: number): string {
    if (value >= 1_00_00_000) return `${(value / 1_00_00_000).toFixed(2)}Cr`;
    if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(2)}L`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  }

  /**
   * Format a number with decimal places.
   * @example formatNumber(12345.678, 2)  →  "12,345.68"
   */
  public formatNumber(value: number | null | undefined, decimals: number = 2): string {
    if (value === null || value === undefined) return '0';
    return this.decimalPipe.transform(value, `1.${decimals}-${decimals}`) || '0';
  }

  /**
   * Format as percentage.
   * @example formatPercent(0.856)  →  "85.60%"
   */
  public formatPercent(value: number, decimals: number = 2): string {
    return this.percentPipe.transform(value, `1.${decimals}-${decimals}`) || '0%';
  }

  /**
   * Parse currency string back to number.
   * @example parseCurrency("₹1,00,000.50")  →  100000.50
   */
  public parseCurrency(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[₹$€£,\s]/g, '')) || 0;
  }

  /**
   * Format file size from bytes to human-readable.
   * @example formatFileSize(1536)  →  "1.5 KB"
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Format duration from total minutes.
   * @example formatDuration(135)  →  "2h 15m"
   */
  public formatDuration(totalMinutes: number): string {
    if (!totalMinutes || totalMinutes < 0) return '0m';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  /**
   * Format duration from total seconds.
   * @example formatDurationFromSeconds(3725)  →  "1h 02m 05s"
   */
  public formatDurationFromSeconds(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds < 0) return '0s';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m.toString().padStart(2, '0')}m`);
    parts.push(`${s.toString().padStart(2, '0')}s`);
    return parts.join(' ');
  }


  // ==========================================================================
  // SECTION 3 ▸ FORMATTING — DATE / TIME
  // ==========================================================================

  /**
   * Format a date with Angular DatePipe.
   * Default: 'dd MMM yyyy'  →  14 Nov 2024
   */
  public formatDate(
    value: Date | string | number | null | undefined,
    format: string = 'dd MMM yyyy'
  ): string {
    if (!value) return '-';
    try { return this.datePipe.transform(value, format) || '-'; }
    catch { return '-'; }
  }

  /**
   * Format date + time.
   * @example formatDateTime(date)  →  "14 Nov 2024, 09:30 AM"
   */
  public formatDateTime(value: Date | string | null | undefined): string {
    return this.formatDate(value, 'dd MMM yyyy, hh:mm a');
  }

  /**
   * Format time only.
   * @example formatTime(date)  →  "09:30 AM"
   */
  public formatTime(value: Date | string | null | undefined): string {
    return this.formatDate(value, 'hh:mm a');
  }

  /**
   * Format time in 24-hour format.
   * @example formatTime24(date)  →  "14:30"
   */
  public formatTime24(dateTime: string | Date | null | undefined): string {
    if (!dateTime) return '--:--';
    try {
      const d = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
      if (isNaN(d.getTime())) return '--:--';
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch { return '--:--'; }
  }

  /**
   * Returns relative time string — "3 hours ago", "just now", etc.
   */
  public timeAgo(value: Date | string | null | undefined): TimeAgoResult {
    if (!value) return { text: '-', unit: 'just now', value: 0 };
    const date = typeof value === 'string' ? new Date(value) : value;
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return { text: 'Just now', unit: 'just now', value: 0 };
    if (seconds < 3600) { const v = Math.floor(seconds / 60); return { text: `${v} min ago`, unit: 'minutes', value: v }; }
    if (seconds < 86400) { const v = Math.floor(seconds / 3600); return { text: `${v} hour${v > 1 ? 's' : ''} ago`, unit: 'hours', value: v }; }
    if (seconds < 604800) { const v = Math.floor(seconds / 86400); return { text: `${v} day${v > 1 ? 's' : ''} ago`, unit: 'days', value: v }; }
    if (seconds < 2592000) { const v = Math.floor(seconds / 604800); return { text: `${v} week${v > 1 ? 's' : ''} ago`, unit: 'weeks', value: v }; }
    if (seconds < 31536000) { const v = Math.floor(seconds / 2592000); return { text: `${v} month${v > 1 ? 's' : ''} ago`, unit: 'months', value: v }; }
    const v = Math.floor(seconds / 31536000);
    return { text: `${v} year${v > 1 ? 's' : ''} ago`, unit: 'years', value: v };
  }

  /** Returns just the text from timeAgo */
  public timeAgoText(value: Date | string | null | undefined): string {
    return this.timeAgo(value).text;
  }

  /** Check if date is today */
  public isToday(dateStr: string | Date): boolean {
    if (!dateStr) return false;
    try {
      const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      const t = new Date();
      return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
    } catch { return false; }
  }

  /** Check if date is in the past */
  public isPast(date: string | Date): boolean {
    return new Date(date).getTime() < Date.now();
  }

  /** Check if date is in the future */
  public isFuture(date: string | Date): boolean {
    return new Date(date).getTime() > Date.now();
  }

  /** Check if a date is within N days from now */
  public isWithinDays(date: string | Date, days: number): boolean {
    const target = new Date(date).getTime();
    const now = Date.now();
    return target >= now && target <= now + days * 86400000;
  }

  /**
   * Get date range boundaries as ISO date strings.
   */
  public getDateRange(
    range: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'last7' | 'last30' | 'last90'
  ): { startDate: string; endDate: string } {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    let start = new Date();

    switch (range) {
      case 'today': start = today; break;
      case 'yesterday': start = new Date(today); start.setDate(today.getDate() - 1); return { startDate: fmt(start), endDate: fmt(start) };
      case 'week': start = new Date(today); start.setDate(today.getDate() - today.getDay()); break;
      case 'month': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case 'quarter': start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1); break;
      case 'year': start = new Date(today.getFullYear(), 0, 1); break;
      case 'last7': start = new Date(today); start.setDate(today.getDate() - 7); break;
      case 'last30': start = new Date(today); start.setDate(today.getDate() - 30); break;
      case 'last90': start = new Date(today); start.setDate(today.getDate() - 90); break;
    }

    return { startDate: fmt(start), endDate: fmt(today) };
  }

  /**
   * Returns day name from date.
   * @example getDayName(date)  →  "Mon"
   */
  public getDayName(dateStr: string | Date, format: 'short' | 'long' = 'short'): string {
    if (!dateStr) return '';
    try {
      const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      return this.datePipe.transform(d, format === 'short' ? 'EEE' : 'EEEE') || '';
    } catch { return ''; }
  }

  /**
   * Calculate working hours between two datetime strings.
   * @returns "8:30"
   */
  public calculateWorkingHours(start: string | Date, end: string | Date): string {
    if (!start || !end) return '0:00';
    try {
      const s = typeof start === 'string' ? new Date(start) : start;
      const e = typeof end === 'string' ? new Date(end) : end;
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return '0:00';
      const ms = e.getTime() - s.getTime();
      if (ms < 0) return '0:00';
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}:${m.toString().padStart(2, '0')}`;
    } catch { return '0:00'; }
  }

  /**
   * Format attendance date with day name.
   * @example "Monday, 14 Nov 2024"
   */
  public formatAttendanceDate(dateStr: string | Date): string {
    if (!dateStr) return '';
    try {
      const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      return this.datePipe.transform(d, 'EEEE, dd MMM yyyy') || '';
    } catch { return ''; }
  }

  /**
   * Get number of days between two dates.
   */
  public daysBetween(start: string | Date, end: string | Date): number {
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(end).setHours(0, 0, 0, 0);
    return Math.round(Math.abs(e - s) / 86400000);
  }

  /**
   * Add days to a date.
   */
  public addDays(date: Date | string, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Returns an array of Date objects between start and end (inclusive).
   */
  public getDatesBetween(start: Date | string, end: Date | string): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }


  // ==========================================================================
  // SECTION 4 ▸ STRING UTILITIES
  // ==========================================================================

  /** Truncate text with ellipsis. */
  public truncateText(text: string, limit: number = 30): string {
    if (!text) return '';
    return text.length > limit ? `${text.substring(0, limit)}...` : text;
  }

  /** Generate initials from name. "Rahul Dravid" → "RD" */
  public getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /** Capitalize first letter. "hello world" → "Hello world" */
  public capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /** Title case all words. "hello world" → "Hello World" */
  public toTitleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Convert camelCase/snake_case to Title Case label. */
  public toLabel(key: string): string {
    if (!key) return '';
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  /** Convert string to slug. "Hello World!" → "hello-world" */
  public slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** Check if string contains a search term (case-insensitive). */
  public contains(source: string, search: string): boolean {
    if (!source || !search) return false;
    return source.toLowerCase().includes(search.toLowerCase());
  }

  /** Strip HTML tags from a string. */
  public stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /** Mask sensitive info. "9876543210" → "98****3210" */
  public maskString(str: string, visibleStart = 2, visibleEnd = 4): string {
    if (!str || str.length <= visibleStart + visibleEnd) return str;
    const masked = '*'.repeat(str.length - visibleStart - visibleEnd);
    return `${str.slice(0, visibleStart)}${masked}${str.slice(-visibleEnd)}`;
  }

  /** Mask email. "user@example.com" → "us**@example.com" */
  public maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    return `${this.maskString(local, 2, 1)}@${domain}`;
  }

  /** Count words in a string. */
  public wordCount(str: string): number {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
  }

  /** Extract numbers from string. "Total: 1,234.56 INR" → 1234.56 */
  public extractNumber(str: string): number {
    if (!str) return 0;
    return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
  }

  /**
   * Generate a unique SKU from a product name.
   * @example generateSku("Blue Denim Jacket")  →  "BLUE--QVFT"
   */
  public generateSku(name: string): string {
    if (!name) return '';
    const normalized = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, '-');
    const shortCode = normalized.substring(0, 5);
    const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${shortCode}-${uniqueId}`.toUpperCase();
  }

  /**
   * Generate a random alphanumeric ID of given length.
   * @example generateId(8)  →  "A3fK92mZ"
   */
  public generateId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /**
   * Generate a UUID v4.
   */
  public generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }


  // ==========================================================================
  // SECTION 5 ▸ VALIDATION UTILITIES
  // ==========================================================================

  /** Validate Indian mobile number (10 digits, starts with 6–9). */
  public isValidMobile(mobile: string): boolean {
    return /^[6-9]\d{9}$/.test(mobile?.toString().trim() || '');
  }

  /** Validate email address. */
  public isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() || '');
  }

  /** Validate Indian PAN number. */
  public isValidPAN(pan: string): boolean {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan?.toUpperCase().trim() || '');
  }

  /** Validate Indian GST number. */
  public isValidGST(gst: string): boolean {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst?.toUpperCase().trim() || '');
  }

  /** Validate Indian Pincode (6 digits). */
  public isValidPincode(pin: string): boolean {
    return /^[1-9][0-9]{5}$/.test(pin?.toString().trim() || '');
  }

  /** Validate IFSC Code. */
  public isValidIFSC(ifsc: string): boolean {
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc?.toUpperCase().trim() || '');
  }

  /** Validate Aadhaar number (12 digits). */
  public isValidAadhaar(aadhaar: string): boolean {
    return /^\d{12}$/.test(aadhaar?.toString().replace(/\s/g, '') || '');
  }

  /** Validate URL. */
  public isValidUrl(url: string): boolean {
    try { new URL(url); return true; }
    catch { return false; }
  }

  /** Check if a value is empty (null, undefined, empty string, empty array/object). */
  public isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Validate regularization request.
   */
  public validateRegularizationRequest(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.targetDate) errors.push('Target date is required');
    if (!data.type) errors.push('Request type is required');
    if (!data.reason || data.reason.trim().length < 10) errors.push('Reason must be at least 10 characters');
    if (data.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.targetDate)) errors.push('Invalid date format. Use YYYY-MM-DD');
    if (data.targetDate) {
      const target = new Date(data.targetDate);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (target > today) errors.push('Cannot regularize future dates');
    }
    return { valid: errors.length === 0, errors };
  }


  // ==========================================================================
  // SECTION 6 ▸ UI & SEVERITY HELPERS
  // ==========================================================================

  /**
   * Map any status string to PrimeNG Severity.
   */
  public mapStatusToSeverity(status: string): Severity {
    if (!status) return 'secondary';
    const s = status.toLowerCase();
    if (['paid', 'active', 'completed', 'approved', 'verified', 'success', 'inflow', 'present', 'working', 'checked_in'].includes(s)) return 'success';
    if (['pending', 'processing', 'hold', 'draft', 'review', 'late', 'absent', 'half_day', 'wfh', 'under_review'].includes(s)) return 'warn';
    if (['unpaid', 'inactive', 'failed', 'rejected', 'cancelled', 'deleted', 'outflow', 'overdue', 'blocked', 'missed', 'emergency'].includes(s)) return 'danger';
    if (['partial', 'shipped', 'refunded', 'return', 'info', 'on_leave', 'holiday', 'week_off', 'on_duty', 'field_work'].includes(s)) return 'info';
    return 'secondary';
  }

  /** Map attendance-specific status to Severity. */
  public mapAttendanceStatusToSeverity(status: string): Severity {
    const s = status?.toLowerCase();
    const successSet = new Set(['present', 'working', 'approved', 'completed', 'checked_in', 'break_end', 'regular']);
    const warnSet = new Set(['absent', 'late', 'half_day', 'pending', 'draft', 'under_review', 'wfh', 'break_start']);
    const dangerSet = new Set(['missed', 'rejected', 'cancelled', 'emergency', 'system_error', 'forgot_punch', 'time_correction']);
    const infoSet = new Set(['on_leave', 'holiday', 'week_off', 'on_duty', 'field_work', 'others']);
    if (successSet.has(s)) return 'success';
    if (warnSet.has(s)) return 'warn';
    if (dangerSet.has(s)) return 'danger';
    if (infoSet.has(s)) return 'info';
    return 'secondary';
  }

  /** Map punch type to Severity. */
  public mapPunchTypeToSeverity(type: string): Severity {
    const t = type?.toLowerCase();
    if (['in', 'checkin', 'regular'].includes(t)) return 'success';
    if (['out', 'checkout'].includes(t)) return 'danger';
    if (['break_start', 'breakstart'].includes(t)) return 'warn';
    if (['break_end', 'breakend', 'onduty', 'wfh'].includes(t)) return 'info';
    return 'secondary';
  }

  /** Map urgency level to Severity. */
  public mapUrgencyToSeverity(urgency: string): Severity {
    switch (urgency?.toLowerCase()) {
      case 'high': case 'urgent': return 'danger';
      case 'medium': return 'warn';
      case 'low': return 'info';
      default: return 'secondary';
    }
  }

  /** Map priority to Severity. */
  public mapPriorityToSeverity(priority: string): Severity {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warn';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  }

  /**
   * Generate a consistent hex color from any string (for Avatars/Tags).
   */
  public stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    let color = '#';
    for (let i = 0; i < 3; i++) color += ('00' + ((hash >> (i * 8)) & 0xFF).toString(16)).slice(-2);
    return color;
  }

  /**
   * Get contrasting text color (black/white) for a background hex color.
   * Useful for dynamic badge text.
   */
  public getContrastColor(hexColor: string): '#000000' | '#ffffff' {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }


  // ==========================================================================
  // SECTION 7 ▸ HTML BADGE / CHIP GENERATORS  (for AG Grid & Templates)
  // ==========================================================================

  private readonly _badgeThemeMap: Record<string, { bg: string; text: string }> = {
    // Severity → colors
    success: { bg: '#dcfce7', text: '#15803d' },
    warn: { bg: '#fef9c3', text: '#854d0e' },
    danger: { bg: '#fee2e2', text: '#b91c1c' },
    info: { bg: '#e0f2fe', text: '#0369a1' },
    secondary: { bg: '#f3f4f6', text: '#374151' },
    contrast: { bg: '#1e293b', text: '#f8fafc' },
    // Named statuses
    draft: { bg: '#f3f4f6', text: '#374151' },
    issued: { bg: '#e0f2fe', text: '#0369a1' },
    paid: { bg: '#dcfce7', text: '#15803d' },
    unpaid: { bg: '#fee2e2', text: '#b91c1c' },
    partial: { bg: '#fef9c3', text: '#854d0e' },
    cancelled: { bg: '#f1f5f9', text: '#64748b' },
    completed: { bg: '#dcfce7', text: '#15803d' },
    pending: { bg: '#fef9c3', text: '#854d0e' },
    approved: { bg: '#dcfce7', text: '#15803d' },
    rejected: { bg: '#fee2e2', text: '#b91c1c' },
    active: { bg: '#dcfce7', text: '#15803d' },
    inactive: { bg: '#fee2e2', text: '#b91c1c' },
  };

  private _resolveBadgeTheme(status: string): { bg: string; text: string } {
    const key = status?.toLowerCase();
    if (this._badgeThemeMap[key]) return this._badgeThemeMap[key];
    const severity = this.mapStatusToSeverity(status);
    return this._badgeThemeMap[severity || 'secondary'];
  }

  /**
   * Returns an inline HTML badge — safe for AG Grid cellRenderer.
   * @example statusBadgeHtml('paid')  →  HTML <span>
   */
  public statusBadgeHtml(status: string, icon?: string): string {
    if (!status) return '';
    const theme = this._resolveBadgeTheme(status);
    const iconHtml = icon ? `<i class="${icon}" style="font-size:10px;"></i> ` : '';
    return `<span style="background:${theme.bg};color:${theme.text};padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;display:inline-flex;align-items:center;gap:4px;">${iconHtml}${status}</span>`;
  }

  /**
   * Returns attendance badge HTML with auto-resolved icon.
   */
  public attendanceStatusBadgeHtml(status: string): string {
    if (!status) return '';
    const severity = this.mapAttendanceStatusToSeverity(status);
    const theme = this._badgeThemeMap[severity || 'secondary'];
    const text = this.getAttendanceStatusText(status);
    const icon = this.getAttendanceIcon(status);
    return `<span style="background:${theme.bg};color:${theme.text};padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;display:inline-flex;align-items:center;gap:4px;"><i class="${icon}" style="font-size:10px;"></i>${text}</span>`;
  }

  /**
   * Returns a pill-style badge HTML (rounded-full).
   */
  public pillBadgeHtml(label: string, severity: Severity = 'secondary'): string {
    const theme = this._badgeThemeMap[severity || 'secondary'];
    return `<span style="background:${theme.bg};color:${theme.text};padding:3px 12px;border-radius:999px;font-size:11px;font-weight:600;display:inline-block;">${label}</span>`;
  }

  /**
   * Returns a dot indicator HTML (colored circle before text).
   */
  public dotIndicatorHtml(label: string, severity: Severity = 'secondary'): string {
    const theme = this._badgeThemeMap[severity || 'secondary'];
    return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:${theme.text};"><span style="width:8px;height:8px;border-radius:50%;background:${theme.text};display:inline-block;flex-shrink:0;"></span>${label}</span>`;
  }


  // ==========================================================================
  // SECTION 8 ▸ ATTENDANCE TEXT / ICON MAPS
  // ==========================================================================

  public getAttendanceStatusText(status: string): string {
    const map: Record<string, string> = {
      present: 'Present', working: 'Working', checked_in: 'Checked In',
      absent: 'Absent', on_leave: 'On Leave', half_day: 'Half Day', late: 'Late',
      holiday: 'Holiday', week_off: 'Week Off', wfh: 'Work From Home',
      onduty: 'On Duty', field: 'Field Work',
      pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
      under_review: 'Under Review', draft: 'Draft',
      processed: 'Processed', orphan: 'Unidentified', corrected: 'Corrected'
    };
    return map[status?.toLowerCase()] || status;
  }

  public getPunchTypeText(type: string): string {
    const map: Record<string, string> = {
      in: 'Check In', checkin: 'Check In', out: 'Check Out', checkout: 'Check Out',
      break_start: 'Break Start', breakstart: 'Break Start',
      break_end: 'Break End', breakend: 'Break End',
      regular: 'Regular', wfh: 'Work From Home', onduty: 'On Duty', field: 'Field Work'
    };
    return map[type?.toLowerCase()] || type;
  }

  public getAttendanceIcon(type: string): string {
    const map: Record<string, string> = {
      in: 'pi pi-sign-in', checkin: 'pi pi-sign-in',
      out: 'pi pi-sign-out', checkout: 'pi pi-sign-out',
      break_start: 'pi pi-coffee', breakstart: 'pi pi-coffee',
      break_end: 'pi pi-play', breakend: 'pi pi-play',
      present: 'pi pi-check-circle', absent: 'pi pi-times-circle',
      late: 'pi pi-clock', half_day: 'pi pi-hourglass',
      on_leave: 'pi pi-calendar', holiday: 'pi pi-star',
      approved: 'pi pi-check', rejected: 'pi pi-times', pending: 'pi pi-hourglass',
      wfh: 'pi pi-home', onduty: 'pi pi-car', field: 'pi pi-map-marker',
      emergency: 'pi pi-exclamation-triangle', system_error: 'pi pi-exclamation-circle',
      forgot_punch: 'pi pi-history'
    };
    return map[type?.toLowerCase()] || 'pi pi-clock';
  }

  public getAttendanceStatusClass(status: string): string {
    const map: Record<string, string> = {
      present: 'bg-green-100 text-green-700 border border-green-200',
      absent: 'bg-red-100 text-red-700 border border-red-200',
      late: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      half_day: 'bg-blue-100 text-blue-700 border border-blue-200',
      on_leave: 'bg-purple-100 text-purple-700 border border-purple-200',
      holiday: 'bg-gray-100 text-gray-700 border border-gray-200',
      week_off: 'bg-gray-100 text-gray-700 border border-gray-200',
      wfh: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      onduty: 'bg-orange-100 text-orange-700 border border-orange-200',
      field: 'bg-teal-100 text-teal-700 border border-teal-200',
      approved: 'bg-green-100 text-green-700 border border-green-200',
      rejected: 'bg-red-100 text-red-700 border border-red-200',
      pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      under_review: 'bg-blue-100 text-blue-700 border border-blue-200',
      draft: 'bg-gray-100 text-gray-700 border border-gray-200'
    };
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border border-gray-200';
  }


  // ==========================================================================
  // SECTION 9 ▸ ARRAY & OBJECT UTILITIES
  // ==========================================================================

  /**
   * Group an array by a key.
   * @example groupBy(employees, 'department')
   */
  public groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((acc, item) => {
      const group = String(item[key]);
      acc[group] = acc[group] || [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  /**
   * Sort array of objects by a key.
   */
  public sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av === bv) return 0;
      const result = av < bv ? -1 : 1;
      return direction === 'asc' ? result : -result;
    });
  }

  /**
   * Remove duplicates from array by key.
   */
  public uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter((item) => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }

  /**
   * Chunk an array into smaller arrays.
   * @example chunk([1,2,3,4,5], 2)  →  [[1,2],[3,4],[5]]
   */
  public chunk<T>(array: T[], size: number): T[][] {
    if (!array || size <= 0) return [];
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) result.push(array.slice(i, i + size));
    return result;
  }

  /**
   * Flatten a nested array one level.
   */
  public flatten<T>(array: T[][]): T[] {
    return ([] as T[]).concat(...array);
  }

  /**
   * Compute sum of a numeric key.
   */
  public sumBy<T>(array: T[], key: keyof T): number {
    return array.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
  }

  /**
   * Compute average of a numeric key.
   */
  public avgBy<T>(array: T[], key: keyof T): number {
    if (!array.length) return 0;
    return this.sumBy(array, key) / array.length;
  }

  /**
   * Find the min/max by key.
   */
  public minBy<T>(array: T[], key: keyof T): T | undefined {
    return array.reduce((min, item) => item[key] < min[key] ? item : min, array[0]);
  }
  public maxBy<T>(array: T[], key: keyof T): T | undefined {
    return array.reduce((max, item) => item[key] > max[key] ? item : max, array[0]);
  }

  /**
   * Convert an array of objects to a key-value map.
   * @example toMap(users, 'id')  →  { '1': {id:1, name:'A'}, ... }
   */
  public toMap<T>(array: T[], key: keyof T): Record<string, T> {
    return array.reduce((map, item) => {
      map[String(item[key])] = item;
      return map;
    }, {} as Record<string, T>);
  }

  /**
   * Apply client-side filters to an array.
   */
  public applyFilters<T>(array: T[], filters: FilterConfig[]): T[] {
    return array.filter((item: any) => {
      return filters.every((f) => {
        const val = item[f.field];
        const fv = f.value;
        switch (f.operator || 'eq') {
          case 'eq': return val === fv;
          case 'neq': return val !== fv;
          case 'gt': return val > fv;
          case 'gte': return val >= fv;
          case 'lt': return val < fv;
          case 'lte': return val <= fv;
          case 'contains': return String(val).toLowerCase().includes(String(fv).toLowerCase());
          case 'startsWith': return String(val).toLowerCase().startsWith(String(fv).toLowerCase());
          case 'endsWith': return String(val).toLowerCase().endsWith(String(fv).toLowerCase());
          default: return true;
        }
      });
    });
  }

  /**
   * Client-side pagination.
   */
  public paginate<T>(array: T[], page: number, limit: number): { data: T[]; meta: PaginationMeta } {
    const total = array.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = array.slice(start, start + limit);
    return {
      data,
      meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    };
  }

  /**
   * Deep clone an object (safe for plain objects).
   */
  public deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Deep compare two objects for equality.
   */
  public deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * Pick specific keys from an object.
   * @example pick(user, ['id', 'name'])
   */
  public pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    return keys.reduce((acc, key) => { acc[key] = obj[key]; return acc; }, {} as Pick<T, K>);
  }

  /**
   * Omit specific keys from an object.
   */
  public omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((k) => delete (result as any)[k]);
    return result;
  }

  /**
   * Flatten object to dot-notation.
   * @example { a: { b: 1 } }  →  { 'a.b': 1 }
   */
  public flattenObject(obj: any, prefix = ''): Record<string, any> {
    return Object.keys(obj).reduce((acc, key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, this.flattenObject(obj[key], fullKey));
      } else {
        acc[fullKey] = obj[key];
      }
      return acc;
    }, {} as Record<string, any>);
  }


  // ==========================================================================
  // SECTION 10 ▸ MATH & FINANCIAL UTILITIES
  // ==========================================================================

  /** Round to N decimal places. */
  public round(value: number, decimals: number = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /** Clamp a value between min and max. */
  public clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /** Calculate percentage. percent(50, 200) → 25 */
  public percent(part: number, total: number, decimals: number = 2): number {
    if (!total) return 0;
    return this.round((part / total) * 100, decimals);
  }

  /** Calculate GST split: returns { base, gstAmount, total }. */
  public calculateGST(amount: number, gstRate: number, inclusive: boolean = false): { base: number; gstAmount: number; total: number } {
    if (inclusive) {
      const base = this.round(amount / (1 + gstRate / 100));
      const gstAmount = this.round(amount - base);
      return { base, gstAmount, total: amount };
    } else {
      const gstAmount = this.round(amount * gstRate / 100);
      return { base: amount, gstAmount, total: this.round(amount + gstAmount) };
    }
  }

  /** Calculate TDS deduction. */
  public calculateTDS(amount: number, tdsRate: number): { gross: number; tds: number; net: number } {
    const tds = this.round(amount * tdsRate / 100);
    return { gross: amount, tds, net: this.round(amount - tds) };
  }

  /** Calculate EMI (reducing balance method). */
  public calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    if (annualRate === 0) return this.round(principal / tenureMonths);
    const r = annualRate / 12 / 100;
    const emi = principal * r * Math.pow(1 + r, tenureMonths) / (Math.pow(1 + r, tenureMonths) - 1);
    return this.round(emi);
  }

  /** Calculate simple interest. */
  public calculateSimpleInterest(principal: number, rate: number, years: number): { interest: number; total: number } {
    const interest = this.round(principal * rate * years / 100);
    return { interest, total: principal + interest };
  }

  /** Calculate compound interest. */
  public calculateCompoundInterest(principal: number, rate: number, years: number, n: number = 12): { interest: number; total: number } {
    const total = this.round(principal * Math.pow(1 + rate / (100 * n), n * years));
    const interest = this.round(total - principal);
    return { interest, total };
  }

  /** Calculate discount. */
  public calculateDiscount(originalPrice: number, discountPercent: number): { discountAmount: number; finalPrice: number } {
    const discountAmount = this.round(originalPrice * discountPercent / 100);
    return { discountAmount, finalPrice: this.round(originalPrice - discountAmount) };
  }

  /** Calculate profit/loss percentage. */
  public calculateProfitLoss(costPrice: number, sellingPrice: number): { amount: number; percent: number; type: 'profit' | 'loss' | 'neutral' } {
    const amount = this.round(sellingPrice - costPrice);
    const percent = this.percent(Math.abs(amount), costPrice);
    return { amount, percent, type: amount > 0 ? 'profit' : amount < 0 ? 'loss' : 'neutral' };
  }


  // ==========================================================================
  // SECTION 11 ▸ FORM HANDLING UTILITIES
  // ==========================================================================

  /** Mark all controls in a FormGroup/FormArray as touched (shows validation errors). */
  public markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /** Mark all controls as untouched (reset validation state). */
  public markFormGroupUntouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsUntouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupUntouched(control);
      }
    });
  }

  /** Get all invalid controls with their errors (debugging tool). */
  public getFormValidationErrors(form: FormGroup): { control: string; error: string; value: any }[] {
    const errors: { control: string; error: string; value: any }[] = [];
    Object.keys(form.controls).forEach((key) => {
      const controlErrors: ValidationErrors | null = form.get(key)?.errors || null;
      if (controlErrors) {
        Object.keys(controlErrors).forEach((errKey) => {
          errors.push({ control: key, error: errKey, value: controlErrors[errKey] });
        });
      }
    });
    return errors;
  }

  /** Disable specific controls in a FormGroup. */
  public disableControls(form: FormGroup, keys: string[]): void {
    keys.forEach((k) => form.get(k)?.disable());
  }

  /** Enable specific controls in a FormGroup. */
  public enableControls(form: FormGroup, keys: string[]): void {
    keys.forEach((k) => form.get(k)?.enable());
  }

  /**
   * Patch form only with keys that exist in the form (safe patch — avoids unknown-key warnings).
   */
  public safePatchValue(form: FormGroup, data: Record<string, any>): void {
    const patchable: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      if (form.contains(key)) patchable[key] = data[key];
    });
    form.patchValue(patchable);
  }

  /**
   * Extract dirty values only from form (useful for PATCH requests).
   */
  public getDirtyValues(form: FormGroup): Record<string, any> {
    const dirty: Record<string, any> = {};
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      if (control?.dirty) dirty[key] = control.value;
    });
    return dirty;
  }

  /** Check if form has any pending async validators. */
  public isFormValidating(form: FormGroup): boolean {
    return form.status === 'PENDING';
  }


  // ==========================================================================
  // SECTION 12 ▸ FILE & DOWNLOAD UTILITIES
  // ==========================================================================

  /** Download a Blob as a file (PDF, Excel, CSV, etc.). */
  public downloadBlob(blobData: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blobData);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /** Download a JSON object as a .json file. */
  public downloadJson(data: any, filename: string = 'data.json'): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }

  /** Convert JSON array to CSV and trigger download. */
  public exportToCsv(data: any[], filename: string = 'export.csv'): void {
    if (!data?.length) { this.messageService.showWarn('No data to export.'); return; }
    const replacer = (_: any, v: any) => (v === null ? '' : v);
    const header = Object.keys(data[0]);
    const csv = [header.join(','), ...data.map((row) => header.map((f) => JSON.stringify(row[f], replacer)).join(','))].join('\r\n');
    this.downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
  }

  /** Read a File object as base64 string. */
  public fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /** Read a File object as text. */
  public fileToText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /** Validate file type against allowed MIME types. */
  public isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /** Validate file size in MB. */
  public isFileSizeAllowed(file: File, maxMB: number): boolean {
    return file.size <= maxMB * 1024 * 1024;
  }

  /** Get file extension from filename. */
  public getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /** Get file type category (image, document, spreadsheet, etc.). */
  public getFileCategory(mimeType: string): 'image' | 'document' | 'spreadsheet' | 'pdf' | 'video' | 'audio' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
    if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('text/')) return 'document';
    return 'other';
  }


  // ==========================================================================
  // SECTION 13 ▸ BROWSER / DOM UTILITIES
  // ==========================================================================

  /** Copy text to clipboard. */
  public async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.messageService.showSuccess('Copied to clipboard');
    } catch {
      this.messageService.showError('Could not copy text');
    }
  }

  /** Scroll to top of page smoothly. */
  public scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Scroll to a specific element by ID. */
  public scrollToElement(elementId: string, offset: number = 80): void {
    const el = document.getElementById(elementId);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  /** Check if device is mobile (≤768px). */
  public isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /** Check if device is tablet (≤1024px). */
  public isTablet(): boolean {
    return window.innerWidth <= 1024 && window.innerWidth > 768;
  }

  /** Print current page. */
  public printPage(): void {
    window.print();
  }

  /** Open an external URL in a new tab. */
  public openUrl(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /** Get current geolocation as a Promise. */
  public getGeolocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  /** Detect if user prefers dark mode. */
  public prefersDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /** Get value from localStorage (with JSON parse). */
  public getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch { return defaultValue; }
  }

  /** Set value to localStorage (with JSON stringify). */
  public setToStorage(key: string, value: any): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota exceeded */ }
  }

  /** Remove a key from localStorage. */
  public removeFromStorage(key: string): void {
    localStorage.removeItem(key);
  }


  // ==========================================================================
  // SECTION 14 ▸ URL & NAVIGATION
  // ==========================================================================

  /** Update URL query params without navigation. */
  public updateQueryParams(params: Record<string, any>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge' });
  }

  /** Clear all query params. */
  public clearQueryParams(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  /** Navigate back in browser history. */
  public goBack(): void {
    window.history.back();
  }

  /**
   * Build a query string from an object.
   * @example buildQueryString({ page: 1, limit: 10 })  →  "page=1&limit=10"
   */
  public buildQueryString(params: Record<string, any>): string {
    return Object.entries(params)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
  }

  /**
   * Parse a query string into an object.
   */
  public parseQueryString(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    new URLSearchParams(queryString).forEach((value, key) => { params[key] = value; });
    return params;
  }

  /**
   * Get a specific query param from the current URL.
   */
  public getQueryParam(key: string): string | null {
    return new URLSearchParams(window.location.search).get(key);
  }


  // ==========================================================================
  // SECTION 15 ▸ ADDRESS & CONTACT UTILITIES
  // ==========================================================================

  /**
   * Format an address object into a single-line string.
   */
  public formatAddress(addr: AddressFormat, separator: string = ', '): string {
    return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country]
      .filter(Boolean)
      .join(separator);
  }

  /**
   * Format Indian phone number with country code.
   * @example formatPhone('9876543210')  →  "+91 98765 43210"
   */
  public formatPhone(phone: string | null | undefined, countryCode: string = '+91'): string {
    if (!phone) return '-';
    const digits = phone.toString().replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) return phone.toString();
    return `${countryCode} ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  /**
   * Format Aadhaar number with spaces.
   * @example formatAadhaar('123456789012')  →  "1234 5678 9012"
   */
  public formatAadhaar(aadhaar: string): string {
    const d = aadhaar?.replace(/\D/g, '').substring(0, 12) || '';
    return d.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  }

  /**
   * Format PAN for display.
   */
  public formatPAN(pan: string): string {
    return pan?.toUpperCase().trim() || '-';
  }

  /**
   * Format GSTIN for display (with separator at position 15).
   */
  public formatGSTIN(gst: string): string {
    return gst?.toUpperCase().trim() || '-';
  }

  /**
   * Generate initials avatar background color from name.
   */
  public getAvatarStyle(name: string): { background: string; color: string } {
    const bg = this.stringToColor(name);
    return { background: bg, color: this.getContrastColor(bg) };
  }


  // ==========================================================================
  // SECTION 16 ▸ SELECT OPTIONS BUILDERS
  // ==========================================================================

  /**
   * Convert enum-like object to SelectOption array.
   * @example enumToOptions({ ACTIVE: 'active', INACTIVE: 'inactive' })
   */
  public enumToOptions(enumObj: Record<string, string>): SelectOption[] {
    return Object.entries(enumObj).map(([key, value]) => ({
      label: this.toLabel(key),
      value
    }));
  }

  /**
   * Convert string array to SelectOption array.
   * @example stringsToOptions(['paid', 'unpaid'])
   */
  public stringsToOptions(values: string[]): SelectOption[] {
    return values.map((v) => ({ label: this.toTitleCase(v), value: v }));
  }

  /**
   * Convert array of objects to SelectOption array.
   * @example objectsToOptions(users, 'name', '_id')
   */
  public objectsToOptions<T>(
    array: T[],
    labelKey: keyof T,
    valueKey: keyof T,
    iconKey?: keyof T
  ): SelectOption[] {
    return array.map((item) => ({
      label: String(item[labelKey]),
      value: item[valueKey],
      icon: iconKey ? String(item[iconKey]) : undefined
    }));
  }

  /**
   * Build status options with severity colors for PrimeNG dropdowns.
   */
  public statusOptions(statuses: string[]): SelectOption[] {
    return statuses.map((s) => ({
      label: this.toTitleCase(s),
      value: s,
      severity: this.mapStatusToSeverity(s)
    }));
  }


  // ==========================================================================
  // SECTION 17 ▸ RXJS ERROR HANDLER FACTORY
  // ==========================================================================

  /**
   * Reusable RxJS error handler for component pipelines.
   * @example this.service.getAll().pipe(catchError(this.common.createErrorHandler('Load Users')))
   */
  public createErrorHandler(operation: string = 'Operation') {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`[${operation}] failed:`, error);
      this.messageService.handleHttpError(error);
      return throwError(() => error);
    };
  }


  // ==========================================================================
  // SECTION 18 ▸ DEBOUNCE / THROTTLE UTILITIES
  // ==========================================================================

  /**
   * Debounce a function call.
   * @example this.debouncedSearch = this.common.debounce((q) => this.search(q), 400);
   */
  public debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timer: any;
    return (...args: Parameters<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Throttle a function call.
   */
  public throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Simple sleep/delay Promise.
   * @example await this.common.sleep(500);
   */
  public sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }


  // ==========================================================================
  // SECTION 19 ▸ PRINT & REPORT UTILITIES
  // ==========================================================================

  /**
   * Print a specific DOM element by ID.
   */
  public printElement(elementId: string, title: string = 'Print'): void {
    const el = document.getElementById(elementId);
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>${title}</title></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  /**
   * Generate a formatted report title with date.
   * @example reportTitle('Sales Report')  →  "Sales Report — Apr 2025"
   */
  public reportTitle(name: string, date?: Date): string {
    const d = this.datePipe.transform(date || new Date(), 'MMM yyyy') || '';
    return `${name} — ${d}`;
  }


  // ==========================================================================
  // SECTION 20 ▸ MISC / HELPER UTILITIES
  // ==========================================================================

  /**
   * Retry an API call N times before giving up.
   * @example this.common.retry(() => this.service.save(data), 3)
   */
  public async retry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
    for (let i = 0; i <= retries; i++) {
      try { return await fn(); }
      catch (err) {
        if (i === retries) throw err;
        await this.sleep(delay * Math.pow(2, i)); // exponential backoff
      }
    }
    throw new Error('Retry failed');
  }

  /**
   * Execute a function and silently ignore any errors.
   */
  public safe<T>(fn: () => T, fallback: T): T {
    try { return fn(); } catch { return fallback; }
  }

  /**
   * Returns a list of Indian states as SelectOption[].
   */
  public getIndianStates(): SelectOption[] {
    return [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
      'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
      'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
      'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
      'Dadra & Nagar Haveli', 'Daman & Diu', 'Lakshadweep', 'Andaman & Nicobar Islands'
    ].map((s) => ({ label: s, value: s }));
  }

  /**
   * Returns common financial years as SelectOption[].
   * e.g. "FY 2024-25", "FY 2023-24"
   */
  public getFinancialYears(count: number = 5): SelectOption[] {
    const options: SelectOption[] = [];
    const currentYear = new Date().getFullYear();
    const fy = new Date().getMonth() >= 3 ? currentYear : currentYear - 1;
    for (let i = 0; i < count; i++) {
      const start = fy - i;
      const label = `FY ${start}-${(start + 1).toString().slice(-2)}`;
      const value = `${start}-${start + 1}`;
      options.push({ label, value });
    }
    return options;
  }

  /**
   * Returns GST rate options.
   */
  public getGSTRates(): SelectOption[] {
    return [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28].map((r) => ({
      label: `${r}%`,
      value: r
    }));
  }

  /**
   * Returns common payment mode options.
   */
  public getPaymentModeOptions(): SelectOption[] {
    return this.stringsToOptions(['cash', 'cheque', 'neft', 'rtgs', 'imps', 'upi', 'card', 'bank_transfer', 'dd']);
  }
  allThemes: any = [
    // ───────────────────────────────────────────────
    // LIGHT THEMES
    // ───────────────────────────────────────────────
    {
      name: "Light Default",
      id: "theme-light",
      color: "#2563eb",
      gradient: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
      category: "light",
      description: "Clean, default SaaS light mode with authoritative blue accents on pure white."
    },
    {
      name: "Ivory",
      id: "theme-ivory",
      color: "#a84e33",
      gradient: "linear-gradient(135deg, #8b3a22 0%, #a84e33 55%, #c97055 100%)",
      category: "light",
      description: "Premium editorial warmth. Linen ivory base with deep terracotta accents."
    },
    {
      name: "Aurora",
      id: "theme-aurora",
      color: "#2e5fa3",
      gradient: "linear-gradient(135deg, #1e4a8a 0%, #2e5fa3 55%, #5b88c4 100%)",
      category: "light",
      description: "Corporate authority in cool slate-blue with crisp pearl-white surfaces."
    },
    {
      name: "Verdant",
      id: "theme-verdant",
      color: "#1f5c1f",
      gradient: "linear-gradient(135deg, #145014 0%, #1f5c1f 50%, #4ea04e 100%)",
      category: "light",
      description: "Deep botanical greens on soft cream whites. Organic and grounding."
    },
    {
      name: "Coastal Command",
      id: "theme-coastal-command",
      color: "#0a857a",
      gradient: "linear-gradient(135deg, #076e64 0%, #0a857a 50%, #0fb3a4 100%)",
      category: "light",
      description: "Enterprise-grade teal authority on cool neutral surfaces."
    },
    {
      name: "Warm Meridian",
      id: "theme-warm-meridian",
      color: "#08726a",
      gradient: "linear-gradient(135deg, #08726a 0%, #b8860b 100%)",
      category: "light",
      description: "Creamy warm ivory with sophisticated gold-teal accent duet."
    },
    {
      name: "Daylight Orange",
      id: "theme-daylight-orange",
      color: "#e86510",
      gradient: "linear-gradient(135deg, #c94e00 0%, #e86510 50%, #f68934 100%)",
      category: "light",
      description: "Cool pearl white surfaces paired with sunset-orange energy."
    },
    {
      name: "Naval Dawn",
      id: "theme-naval-dawn",
      color: "#c49600",
      gradient: "linear-gradient(135deg, #9a7400 0%, #c49600 55%, #ddb200 100%)",
      category: "light",
      description: "Maritime silver-blue surfaces commanded by deep antique gold."
    },
    {
      name: "Sand Dune",
      id: "theme-sand-dune",
      color: "#b06020",
      gradient: "linear-gradient(135deg, #884800 0%, #b06020 55%, #d08040 100%)",
      category: "light",
      description: "Desert warmth. Sun-bleached sand tones with cognac-amber accents."
    },
    {
      name: "Sakura",
      id: "theme-sakura",
      color: "#c45070",
      gradient: "linear-gradient(135deg, #a03050 0%, #c45070 55%, #e07090 100%)",
      category: "light",
      description: "Japanese cherry blossom. Blush whites, warm mist, and rose petal pink."
    },

    // ───────────────────────────────────────────────
    // DARK THEMES
    // ───────────────────────────────────────────────
    {
      name: "Dark Default",
      id: "theme-dark",
      color: "#818cf8",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #818cf8 100%)",
      category: "dark",
      description: "Deep zinc void with soft indigo-violet accents. Timeless dark mode."
    },
    {
      name: "Neon Eclipse",
      id: "theme-neon-eclipse",
      color: "#ff6e14",
      gradient: "linear-gradient(135deg, #e04c00 0%, #ff6e14 55%, #ff9450 100%)",
      category: "dark",
      description: "Void black space with amber-orange neon cutting through the dark."
    },
    {
      name: "Obsidian Rose",
      id: "theme-obsidian-rose",
      color: "#f0186a",
      gradient: "linear-gradient(135deg, #c00048 0%, #f0186a 45%, #c8a030 100%)",
      category: "dark",
      description: "Volcanic obsidian with hot magenta glass panels and champagne gold edge."
    },
    {
      name: "Deep Emerald",
      id: "theme-deep-emerald",
      color: "#0db87a",
      gradient: "linear-gradient(135deg, #048a5a 0%, #0db87a 50%, #26e09a 100%)",
      category: "dark",
      description: "Near-black emerald depths with electric green bioluminescent glow."
    },
    {
      name: "Midnight Bronze",
      id: "theme-midnight-bronze",
      color: "#c4882e",
      gradient: "linear-gradient(135deg, #9e6a18 0%, #c4882e 55%, #dc9e4a 100%)",
      category: "dark",
      description: "Deep navy abyss with warm cognac-bronze and antique gold shimmer."
    },
    {
      name: "Molten Ember",
      id: "theme-molten-ember",
      color: "#f55e18",
      gradient: "linear-gradient(135deg, #c03800 0%, #f55e18 48%, #ffa040 100%)",
      category: "dark",
      description: "Charred brown-black with fire-orange and molten gold glowing beneath."
    },
    {
      name: "Neon Void",
      id: "theme-neon-void",
      color: "#aa40ff",
      gradient: "linear-gradient(135deg, #6e18ee 0%, #aa40ff 48%, #00d8ff 100%)",
      category: "dark",
      description: "Pure black void with electric violet neon corona and icy cyan accent."
    },
    {
      name: "Obsidian Jade",
      id: "theme-obsidian-jade",
      color: "#20c8ac",
      gradient: "linear-gradient(135deg, #0a9478 0%, #20c8ac 50%, #90e8c8 100%)",
      category: "dark",
      description: "Warm brown-black charcoal with glowing jade teal and subtle gold luxury."
    },
    {
      name: "Solar Flare",
      id: "theme-solar-flare",
      color: "#ffa060",
      gradient: "linear-gradient(135deg, #ffa060 0%, #ff7020 50%, #e01868 100%)",
      category: "dark",
      description: "Deep red-brown surface with solar orange flare radiating to hot coral."
    },
    {
      name: "Nebula",
      id: "theme-nebula",
      color: "#e040f8",
      gradient: "linear-gradient(to right, #f06eaa 0%, #b040f8 55%, #7b44f2 100%)",
      category: "dark",
      description: "Deep space void with fuchsia and violet nebula gradients burning outward."
    },
    {
      name: "Luxury",
      id: "theme-luxury",
      color: "#c8a028",
      gradient: "linear-gradient(135deg, #8c6c00 0%, #c8a028 55%, #e0b848 100%)",
      category: "dark",
      description: "Warm onyx-brown with burnished antique gold. Uncompromising luxury."
    },
    {
      name: "Abyssal Coral",
      id: "theme-abyssal-coral",
      color: "#ff6840",
      gradient: "linear-gradient(135deg, #e04828 0%, #ff6840 55%, #ff9068 100%)",
      category: "dark",
      description: "Deep ocean-black with living reef coral glowing from below."
    },
    {
      name: "Crimson Noir",
      id: "theme-crimson-noir",
      color: "#cc1a30",
      gradient: "linear-gradient(135deg, #8a0818 0%, #cc1a30 50%, #e84060 100%)",
      category: "dark",
      description: "Pitch black with blood crimson and silver-chrome micro-details. Pure drama."
    },
    {
      name: "Void Steel",
      id: "theme-void-steel",
      color: "#2c68ff",
      gradient: "linear-gradient(135deg, #1040e0 0%, #2c68ff 55%, #5888ff 100%)",
      category: "dark",
      description: "Matte anthracite industrial surface with electric cobalt precision."
    },

    // ───────────────────────────────────────────────
    // GLASSMORPHISM THEMES
    // ───────────────────────────────────────────────
    {
      name: "Aurora Glass",
      id: "theme-aurora-glass",
      color: "#28ff90",
      gradient: "linear-gradient(135deg, #00c898 0%, #28ff90 40%, #9050f8 100%)",
      category: "glass",
      description: "Arctic night sky with layered green-violet aurora bleeding through deep frost."
    },
    {
      name: "Arctic Crystal",
      id: "theme-arctic-crystal",
      color: "#0b9ee0",
      gradient: "linear-gradient(135deg, #0176c0 0%, #0b9ee0 50%, #32bbf8 100%)",
      category: "glass",
      description: "Pure white-blue polar light with ice-prism glass and maximum luminosity."
    },
    {
      name: "Horizon",
      id: "theme-horizon",
      color: "#ffcc9a",
      gradient: "linear-gradient(135deg, #f04818 0%, #9040a8 50%, #1858a8 100%)",
      category: "glass",
      description: "Dramatic diagonal sunset from coral to deep ocean, frosted aircraft glass."
    },
    {
      name: "Mercury Glass",
      id: "theme-mercury-glass",
      color: "#5070a8",
      gradient: "linear-gradient(135deg, #304880 0%, #5070a8 50%, #7898cc 100%)",
      category: "glass",
      description: "Polished silver-chrome mirror with platinum reflections and steel-blue precision."
    },
    {
      name: "Amethyst Dusk",
      id: "theme-amethyst-dusk",
      color: "#9040e8",
      gradient: "linear-gradient(135deg, #6820c0 0%, #9040e8 48%, #c8a030 100%)",
      category: "glass",
      description: "Twilight purple sky fading to indigo night with warm gold dust shimmer."
    }, {
      name: "Luxury Minimal",
      id: "theme-luxury-minimal",
      color: "#C89B6D",
      gradient: "linear-gradient(135deg, #B38658 0%, #C89B6D 50%, #E3C19F 100%)",
      category: "glass",
      description: "Soft warm beige and frosted white glass with premium champagne gold accents and a luxury enterprise aesthetic."
    }
  ];

}

