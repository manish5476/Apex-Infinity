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
    draft:     { bg: '#f3f4f6', text: '#374151' },
    issued:   { bg: '#e0f2fe', text: '#0369a1' },
    paid:     { bg: '#dcfce7', text: '#15803d' },
    unpaid:   { bg: '#fee2e2', text: '#b91c1c' },
    partial:  { bg: '#fef9c3', text: '#854d0e' },
    cancelled:{ bg: '#f1f5f9', text: '#64748b' },
    completed:{ bg: '#dcfce7', text: '#15803d' }
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


}
