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
}

// import { Injectable, inject } from '@angular/core';
// import { DatePipe } from '@angular/common';
// import { Router, ActivatedRoute } from '@angular/router';
// import { FormGroup, AbstractControl, ValidationErrors, FormArray } from '@angular/forms';
// import { HttpErrorResponse } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { AppMessageService } from '../services/message.service';

// export type Severity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

// @Injectable({
//   providedIn: 'root'
// })
// export class CommonMethodService {
//   // Dependencies
//   private messageService = inject(AppMessageService);
//   private datePipe = inject(DatePipe);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   // ==========================================================================
//   // 1. FORMATTING UTILITIES
//   // ==========================================================================

//   /**
//    * Formats a number as Indian Rupee currency (e.g., ₹1,00,000.00).
//    */
//   public formatCurrency(value: number | string | undefined | null): string {
//     if (value === undefined || value === null || value === '') return '₹0.00';
//     const numValue = typeof value === 'string' ? parseFloat(value) : value;
//     return `₹${numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//   }

//   /**
//    * Formats a date object or string into a consistent app-wide format.
//    * Default: 'dd MMM yyyy' (e.g., 14 Nov 2024)
//    */
//   public formatDate(value: Date | string | number | null | undefined, format: string = 'dd MMM yyyy'): string {
//     if (!value) return '-';
//     try {
//       return this.datePipe.transform(value, format) || '-';
//     } catch (e) {
//       return '-';
//     }
//   }

//   /**
//    * Formats file size from bytes to human-readable string.
//    * e.g., 1024 -> "1 KB"
//    */
//   public formatFileSize(bytes: number): string {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }

//   /**
//    * Truncates text to a limit and adds ellipsis.
//    */
//   public truncateText(text: string, limit: number = 30): string {
//     if (!text) return '';
//     return text.length > limit ? text.substring(0, limit) + '...' : text;
//   }

//   /**
//    * Generates initials from a name (e.g., "Rahul Dravid" -> "RD").
//    */
//   public getInitials(name: string): string {
//     if (!name) return '';
//     const parts = name.trim().split(' ');
//     if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
//     return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//   }

//   // ==========================================================================
//   // 2. UI & SEVERITY HELPERS
//   // ==========================================================================

//   /**
//    * A Smart Generic Mapper for Statuses.
//    * Matches keywords to Severity colors.
//    */
//   public mapStatusToSeverity(status: string): Severity {
//     if (!status) return 'secondary';
//     const s = status.toLowerCase();

//     // Success (Green)
//     if (['paid', 'active', 'completed', 'approved', 'verified', 'success', 'inflow', 'present'].includes(s)) return 'success';
    
//     // Warning (Yellow)
//     if (['pending', 'processing', 'hold', 'draft', 'review', 'late', 'absent'].includes(s)) return 'warn';
    
//     // Danger (Red)
//     if (['unpaid', 'inactive', 'failed', 'rejected', 'cancelled', 'deleted', 'outflow', 'overdue', 'blocked'].includes(s)) return 'danger';
    
//     // Info (Blue)
//     if (['partial', 'shipped', 'refunded', 'return', 'info'].includes(s)) return 'info';

//     // Default
//     return 'secondary';
//   }

//   /**
//    * Generates a consistent hex color from a string (for Avatars/Tags).
//    */
//   public stringToColor(str: string): string {
//     let hash = 0;
//     for (let i = 0; i < str.length; i++) {
//       hash = str.charCodeAt(i) + ((hash << 5) - hash);
//     }
//     let color = '#';
//     for (let i = 0; i < 3; i++) {
//       const value = (hash >> (i * 8)) & 0xFF;
//       color += ('00' + value.toString(16)).substr(-2);
//     }
//     return color;
//   }

//   // ==========================================================================
//   // 3. FILE & DOWNLOAD UTILITIES
//   // ==========================================================================

//   /**
//    * Downloads a Blob response (PDF, Excel, CSV) to the user's device.
//    * @param blobData The Blob object from API response.
//    * @param filename The name to save the file as.
//    */
//   public downloadBlob(blobData: Blob, filename: string): void {
//     const url = window.URL.createObjectURL(blobData);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   }

//   /**
//    * Converts JSON data to CSV and triggers download.
//    */
//   public exportToCsv(data: any[], filename: string = 'export.csv'): void {
//     if (!data || data.length === 0) {
//       this.messageService.showWarn('No Data', 'There is no data to export.');
//       return;
//     }
    
//     const replacer = (key: any, value: any) => value === null ? '' : value;
//     const header = Object.keys(data[0]);
//     const csv = [
//       header.join(','),
//       ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
//     ].join('\r\n');

//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     this.downloadBlob(blob, filename);
//   }

//   // ==========================================================================
//   // 4. FORM HANDLING UTILITIES
//   // ==========================================================================

//   /**
//    * Marks all controls in a form group (and nested groups) as touched.
//    * Triggers validation messages to show up.
//    */
//   public markFormGroupTouched(formGroup: FormGroup | FormArray): void {
//     Object.values(formGroup.controls).forEach(control => {
//       control.markAsTouched();
//       if (control instanceof FormGroup || control instanceof FormArray) {
//         this.markFormGroupTouched(control);
//       }
//     });
//   }

//   /**
//    * Debugging tool: Returns a list of all invalid controls and their errors.
//    */
//   public getFormValidationErrors(form: FormGroup): any[] {
//     const errors: any[] = [];
//     Object.keys(form.controls).forEach(key => {
//       const controlErrors: ValidationErrors | null = form.get(key)?.errors || null;
//       if (controlErrors) {
//         Object.keys(controlErrors).forEach(keyError => {
//           errors.push({
//             control: key,
//             error: keyError,
//             value: controlErrors[keyError]
//           });
//         });
//       }
//     });
//     return errors;
//   }

//   // ==========================================================================
//   // 5. BROWSER & DOM UTILITIES
//   // ==========================================================================

//   public async copyToClipboard(text: string): Promise<void> {
//     try {
//       await navigator.clipboard.writeText(text);
//       this.messageService.showSuccess('Copied', 'Text copied to clipboard');
//     } catch (err) {
//       this.messageService.showError('Failed', 'Could not copy text');
//     }
//   }

//   public scrollToTop(): void {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   }

//   public isMobile(): boolean {
//     return window.innerWidth <= 768;
//   }

//   public printPage(): void {
//     window.print();
//   }

//   // ==========================================================================
//   // 6. URL & NAVIGATION
//   // ==========================================================================

//   public updateQueryParams(params: any): void {
//     this.router.navigate([], {
//       relativeTo: this.route,
//       queryParams: params,
//       queryParamsHandling: 'merge',
//     });
//   }

//   public goBack(): void {
//     window.history.back();
//   }

//   // ==========================================================================
//   // 7. RXJS ERROR HANDLER FACTORY
//   // ==========================================================================

//   /**
//    * Creates a reusable error handler for RxJS pipes in Components.
//    * @param operation Name of the operation (e.g., 'Load Users')
//    */
//   public createErrorHandler(operation: string = 'Operation') {
//     return (error: HttpErrorResponse): Observable<never> => {
//       console.error(`${operation} failed:`, error);
//       this.messageService.handleHttpError(error, operation);
//       return throwError(() => error);
//     };
//   }
// }

// // import { Injectable, inject, PLATFORM_ID } from '@angular/core';
// // import { DatePipe, isPlatformBrowser } from '@angular/common';
// // import { Router, ActivatedRoute } from '@angular/router';
// // import { FormGroup, FormControl, FormArray } from '@angular/forms';
// // import { HttpErrorResponse } from '@angular/common/http';
// // import { AppMessageService } from '../services/message.service';

// // // PrimeNG Severity Type
// // export type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class CommonMethodService {
  
// //   // Dependencies
// //   private messageService = inject(AppMessageService);
// //   private datePipe = inject(DatePipe);
// //   private router = inject(Router);
// //   private route = inject(ActivatedRoute);
// //   private platformId = inject(PLATFORM_ID);

// //   // ==========================================================================
// //   // 1. FORMATTING UTILITIES
// //   // ==========================================================================

// //   /**
// //    * Formats a number to Indian Currency (₹ 1,00,000.00)
// //    */
// //   formatCurrency(value: number | string | undefined | null): string {
// //     if (value === undefined || value === null || value === '') return '₹ 0.00';
// //     const num = Number(value);
// //     if (isNaN(num)) return '₹ 0.00';

// //     return new Intl.NumberFormat('en-IN', {
// //       style: 'currency',
// //       currency: 'INR',
// //       minimumFractionDigits: 2
// //     }).format(num);
// //   }

// //   /**
// //    * Formats a date. Defaults to 'dd MMM yyyy' (e.g., 20 Nov 2025)
// //    */
// //   formatDate(value: string | Date | undefined | null, format: string = 'dd MMM yyyy'): string {
// //     if (!value) return '-';
// //     try {
// //       return this.datePipe.transform(value, format) || '-';
// //     } catch {
// //       return '-';
// //     }
// //   }

// //   /**
// //    * Formats bytes to human readable string (KB, MB, GB)
// //    */
// //   formatFileSize(bytes: number): string {
// //     if (bytes === 0) return '0 Bytes';
// //     const k = 1024;
// //     const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
// //     const i = Math.floor(Math.log(bytes) / Math.log(k));
// //     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// //   }

// //   /**
// //    * Formats an address object into a single string
// //    */
// //   formatAddress(address: any): string {
// //     if (!address) return 'N/A';
// //     const parts = [
// //       address.street,
// //       address.city,
// //       address.state,
// //       address.zipCode,
// //       address.country
// //     ];
// //     return parts.filter(p => p && p.trim() !== '').join(', ');
// //   }

// //   // ==========================================================================
// //   // 2. UI & SEVERITY HELPERS
// //   // ==========================================================================

// //   /**
// //    * Smart Severity: Guesses severity based on status keywords.
// //    * Reduces the need for specific functions per entity.
// //    */
// //   getSeverity(status: string | undefined | null): Severity {
// //     if (!status) return 'secondary';
// //     const s = status.toLowerCase();

// //     // Success Cases
// //     if (['active', 'paid', 'completed', 'approved', 'success', 'delivered', 'verified'].includes(s)) return 'success';
    
// //     // Danger Cases
// //     if (['inactive', 'unpaid', 'failed', 'rejected', 'deleted', 'banned', 'blocked', 'overdue'].includes(s)) return 'danger';
    
// //     // Warning Cases
// //     if (['pending', 'draft', 'review', 'onhold', 'warning', 'expiring'].includes(s)) return 'warn';
    
// //     // Info Cases
// //     if (['partial', 'processing', 'shipped', 'info', 'new'].includes(s)) return 'info';

// //     return 'secondary'; // Default (Grey)
// //   }

// //   /**
// //    * Responsive options for PrimeNG Carousels/Galleries
// //    */
// //   getResponsiveOptions() {
// //     return [
// //       { breakpoint: '1024px', numVisible: 3, numScroll: 3 },
// //       { breakpoint: '768px', numVisible: 2, numScroll: 2 },
// //       { breakpoint: '560px', numVisible: 1, numScroll: 1 }
// //     ];
// //   }

// //   // ==========================================================================
// //   // 3. STRING UTILITIES
// //   // ==========================================================================

// //   /**
// //    * Generates Initials (e.g. "Rahul Kumar" -> "RK")
// //    */
// //   getInitials(name: string | undefined): string {
// //     if (!name) return '';
// //     const parts = name.trim().split(' ');
// //     if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
// //     return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
// //   }

// //   /**
// //    * Generates a consistent Hex Color based on a string
// //    */
// //   getStringColor(str: string): string {
// //     if (!str) return '#ccc';
// //     let hash = 0;
// //     for (let i = 0; i < str.length; i++) {
// //       hash = str.charCodeAt(i) + ((hash << 5) - hash);
// //     }
// //     const c = (hash & 0x00ffffff).toString(16).toUpperCase();
// //     return '#' + '00000'.substring(0, 6 - c.length) + c;
// //   }

// //   copyToClipboard(text: string): void {
// //     if (isPlatformBrowser(this.platformId)) {
// //       navigator.clipboard.writeText(text).then(() => {
// //         this.messageService.showSuccess('Copied', 'Text copied to clipboard');
// //       }).catch(() => {
// //         this.messageService.showError('Failed', 'Could not copy text');
// //       });
// //     }
// //   }

// //   // ==========================================================================
// //   // 4. FORM UTILITIES
// //   // ==========================================================================

// //   /**
// //    * Recursively marks all form controls as touched to trigger validation errors UI
// //    */
// //   markFormGroupTouched(formGroup: FormGroup | FormArray): void {
// //     Object.values(formGroup.controls).forEach(control => {
// //       control.markAsTouched();
// //       if (control instanceof FormGroup || control instanceof FormArray) {
// //         this.markFormGroupTouched(control);
// //       }
// //     });
// //   }

// //   /**
// //    * Regex Patterns for Indian Context
// //    */
// //   public readonly REGEX = {
// //     EMAIL: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
// //     PHONE_IN: /^[6-9]\d{9}$/, // Indian Mobile
// //     GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
// //     PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
// //     PINCODE: /^[1-9][0-9]{5}$/
// //   };

// //   // ==========================================================================
// //   // 5. FILE & DOWNLOAD UTILITIES
// //   // ==========================================================================

// //   /**
// //    * Downloads a Blob as a file
// //    */
// //   downloadBlob(blob: Blob, fileName: string): void {
// //     if (isPlatformBrowser(this.platformId)) {
// //       const url = window.URL.createObjectURL(blob);
// //       const a = document.createElement('a');
// //       a.href = url;
// //       a.download = fileName;
// //       a.click();
// //       window.URL.revokeObjectURL(url);
// //     }
// //   }

// //   /**
// //    * Exports JSON data to CSV
// //    */
// //   exportToCsv(data: any[], fileName: string = 'export'): void {
// //     if (!data || !data.length) {
// //       this.messageService.showWarn('No Data', 'There is nothing to export');
// //       return;
// //     }
    
// //     const replacer = (key: any, value: any) => value === null ? '' : value;
// //     const header = Object.keys(data[0]);
// //     const csv = [
// //       header.join(','), // Header row
// //       ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
// //     ].join('\r\n');

// //     const blob = new Blob([csv], { type: 'text/csv' });
// //     this.downloadBlob(blob, `${fileName}_${new Date().getTime()}.csv`);
// //   }

// //   // ==========================================================================
// //   // 6. ROUTING & QUERY UTILITIES
// //   // ==========================================================================

// //   /**
// //    * Merges new query params into the URL without full reload
// //    */
// //   updateQueryParams(params: any): void {
// //     // Remove null/undefined values
// //     const cleanParams = Object.entries(params).reduce((acc: any, [k, v]) => {
// //       if (v !== null && v !== undefined && v !== '') acc[k] = v;
// //       return acc;
// //     }, {});

// //     this.router.navigate([], {
// //       relativeTo: this.route,
// //       queryParams: cleanParams,
// //       queryParamsHandling: 'merge'
// //     });
// //   }
// // }

// // // import { HttpErrorResponse } from '@angular/common/http';
// // // import { Injectable, inject } from '@angular/core';
// // // import { FormGroup } from '@angular/forms';
// // // import { Observable, throwError } from 'rxjs';
// // // import { AppMessageService } from '../services/message.service';
// // // import { DatePipe } from '@angular/common';
// // // import { ActivatedRoute, Router } from '@angular/router';
// // // type Severity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

// // // @Injectable({
// // //   providedIn: 'root'
// // // })
// // // export class CommonMethodService {

// // //   // Use inject() for cleaner, constructor-less dependency injection
// // //   private messageService = inject(AppMessageService);
// // //   private datePipe = inject(DatePipe);
// // //   private router = inject(Router);
// // //   private route = inject(ActivatedRoute);

// // //   constructor() { }

// // //   public responsiveOptions = [
// // //     {
// // //       breakpoint: '1024px',
// // //       numVisible: 1,
// // //       numScroll: 1
// // //     },
// // //     {
// // //       breakpoint: '768px',
// // //       numVisible: 1,
// // //       numScroll: 1
// // //     },
// // //     {
// // //       breakpoint: '560px',
// // //       numVisible: 1,
// // //       numScroll: 1
// // //     }
// // //   ];

// // //   /**
// // //    * Formats a number as Indian Rupee currency (e.g., ₹1,00,000.00).
// // //    * @param value The number to format.
// // //    * @returns The formatted currency string or 'N/A'.
// // //    */
// // //   public formatCurrency(value: number | undefined | null): string {
// // //     if (value === undefined || value === null) {
// // //       return 'N/A';
// // //     }
// // //     return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// // //   }

// // //   /**
// // //    * Formats a date object or string into a specified format.
// // //    * @param value The date to format.
// // //    * @param format The format string (e.g., 'dd/MM/yyyy', 'mediumDate'). Defaults to 'mediumDate'.
// // //    * @returns The formatted date string.
// // //    */
// // //   public formatDate(value: Date | string | number, format: string = 'mediumDate'): string | null {
// // //     if (!value) return null;
// // //     return this.datePipe.transform(value, format);
// // //   }

// // //   /**
// // //    * Formats a date to a relative "time ago" string (e.g., "2 hours ago").
// // //    * @param value The date to format.
// // //    * @returns A relative time string.
// // //    */
// // //   public formatRelativeTime(value: Date | string): string {
// // //     if (!value) return 'N/A';
// // //     const date = new Date(value);
// // //     const now = new Date();
// // //     const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
// // //     const minutes = Math.round(seconds / 60);
// // //     const hours = Math.round(minutes / 60);
// // //     const days = Math.round(hours / 24);

// // //     if (seconds < 60) return `${seconds} seconds ago`;
// // //     if (minutes < 60) return `${minutes} minutes ago`;
// // //     if (hours < 24) return `${hours} hours ago`;
// // //     if (days < 7) return `${days} days ago`;
// // //     return this.formatDate(date, 'longDate') || 'a long time ago';
// // //   }

// // //   /**
// // //    * Truncates a string to a specified length and adds an ellipsis.
// // //    * @param text The text to truncate.
// // //    * @param limit The character limit.
// // //    * @returns The truncated string.
// // //    */
// // //   public truncateText(text: string, limit: number = 50): string {
// // //     if (!text || text.length <= limit) {
// // //       return text;
// // //     }
// // //     return text.substring(0, limit) + '...';
// // //   }

// // //   /**
// // //    * Capitalizes the first letter of a string.
// // //    */
// // //   public capitalize(text: string): string {
// // //     if (!text) return '';
// // //     return text.charAt(0).toUpperCase() + text.slice(1);
// // //   }

// // //   /**
// // //    * Generates initials from a full name (e.g., "Shivam Kumar" -> "SK").
// // //    * @param fullName The full name string.
// // //    * @returns The generated initials.
// // //    */
// // //   public getInitials(fullName: string): string {
// // //     if (!fullName) return '';
// // //     return fullName.split(' ')
// // //       .map(n => n[0])
// // //       .slice(0, 2)
// // //       .join('')
// // //       .toUpperCase();
// // //   }

// // //   // --- UI & Status Helpers ---

// // //   public getSeverity(status: string): Severity {
// // //     switch (status.toLowerCase()) {
// // //       case 'paid': return 'success';
// // //       case 'unpaid': return 'danger';
// // //       default: return 'info';
// // //     }
// // //   }

// // //   public getPaymentStatusSeverity(status: string): Severity {
// // //     switch (status.toLowerCase()) {
// // //       case 'completed': return 'success';
// // //       case 'pending': return 'warn';
// // //       case 'failed': return 'danger';
// // //       default: return 'info';
// // //     }
// // //   }

// // //   public getInvoiceStatusSeverity(status: string): Severity {
// // //     switch (status.toLowerCase()) {
// // //       case 'paid': return 'success';
// // //       case 'unpaid': return 'danger';
// // //       case 'pending': return 'warn';
// // //       default: return 'info';
// // //     }
// // //   }

// // //   /**
// // //    * Generates a consistent, random-looking hex color from any string.
// // //    * Useful for user avatars, tags, etc.
// // //    * @param str The input string.
// // //    * @returns A hex color code string.
// // //    */
// // //   public generateHexColorFromString(str: string): string {
// // //     let hash = 0;
// // //     for (let i = 0; i < str.length; i++) {
// // //       hash = str.charCodeAt(i) + ((hash << 5) - hash);
// // //     }
// // //     let color = '#';
// // //     for (let i = 0; i < 3; i++) {
// // //       const value = (hash >> (i * 8)) & 0xFF;
// // //       color += ('00' + value.toString(16)).substr(-2);
// // //     }
// // //     return color;
// // //   }

// // //   // --- Array & Object Utilities ---

// // //   /**
// // //    * Groups an array of objects by a specified key.
// // //    * @param array The array to group.
// // //    * @param key The key to group by.
// // //    * @returns An object with keys corresponding to the grouped values.
// // //    */
// // //   public groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
// // //     return array.reduce((result, currentValue) => {
// // //       const groupKey = String(currentValue[key]);
// // //       (result[groupKey] = result[groupKey] || []).push(currentValue);
// // //       return result;
// // //     }, {} as { [key: string]: T[] });
// // //   }

// // //   /**
// // //    * Creates a deep clone of a JSON-serializable object.
// // //    */
// // //   public deepClone<T>(obj: T): T {
// // //     return JSON.parse(JSON.stringify(obj));
// // //   }
  
// // //   /**
// // //    * Checks if two objects are deeply equal.
// // //    * @param obj1 The first object.
// // //    * @param obj2 The second object.
// // //    * @returns True if the objects are equal.
// // //    */
// // //   public areObjectsEqual(obj1: any, obj2: any): boolean {
// // //     return JSON.stringify(obj1) === JSON.stringify(obj2);
// // //   }

// // //   // --- Browser & DOM Utilities ---

// // //   /**
// // //    * Copies a string to the user's clipboard.
// // //    * @param text The text to copy.
// // //    */
// // //   public async copyToClipboard(text: string): Promise<void> {
// // //     try {
// // //       await navigator.clipboard.writeText(text);
// // //       this.messageService.showSuccess('Copied!', 'Text copied to clipboard.');
// // //     } catch (err) {
// // //       console.error('Failed to copy text: ', err);
// // //       this.messageService.showError('Copy Failed', 'Could not copy text to clipboard.');
// // //     }
// // //   }

// // //   /**
// // //    * Smoothly scrolls to an element on the page.
// // //    * @param elementId The ID of the element to scroll to.
// // //    */
// // //   public scrollToElement(elementId: string): void {
// // //     const element = document.getElementById(elementId);
// // //     if (element) {
// // //       element.scrollIntoView({ behavior: 'smooth', block: 'start' });
// // //     }
// // //   }

// // //   // --- Advanced Form Handling ---

// // //   /**
// // //    * Marks all controls in a FormGroup as touched. Useful for displaying validation messages on submit.
// // //    * @param formGroup The FormGroup to mark.
// // //    */

// // //   public markFormGroupTouched(formGroup: FormGroup) {
// // //     Object.values(formGroup.controls).forEach(control => {
// // //       control.markAsTouched();
// // //       if (control instanceof FormGroup) {
// // //         this.markFormGroupTouched(control);
// // //       }
// // //     });
// // //   }

// // //   // --- Performance & Timing ---

// // //   /**
// // //    * Creates a debounced function that delays invoking the provided function
// // //    * until after `wait` milliseconds have elapsed since the last time it was invoked.
// // //    * @param func The function to debounce.
// // //    * @param wait The number of milliseconds to delay.
// // //    * @returns A new debounced function.
// // //    */
// // //   public debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
// // //     let timeoutId: ReturnType<typeof setTimeout> | null = null;
// // //     return (...args: Parameters<F>) => {
// // //       if (timeoutId) {
// // //         clearTimeout(timeoutId);
// // //       }
// // //       timeoutId = setTimeout(() => {
// // //         func(...args);
// // //       }, wait);
// // //     };
// // //   }

// // //   // --- Data Transformation ---

// // //   /**
// // //    * Converts an array of objects into a CSV formatted string and triggers a download.
// // //    * @param data The array of objects to convert.
// // //    * @param filename The desired filename for the downloaded CSV file.
// // //    */
// // //   public exportToCsv(data: any[], filename: string = 'export.csv'): void {
// // //     if (!data || data.length === 0) {
// // //       this.messageService.showWarn('Export Failed', 'No data available to export.');
// // //       return;
// // //     }
// // //     const replacer = (key: any, value: any) => value === null ? '' : value;
// // //     const header = Object.keys(data[0]);
// // //     const csv = [
// // //       header.join(','),
// // //       ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
// // //     ].join('\r\n');

// // //     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
// // //     const link = document.createElement('a');
// // //     if (link.download !== undefined) {
// // //       const url = URL.createObjectURL(blob);
// // //       link.setAttribute('href', url);
// // //       link.setAttribute('download', filename);
// // //       link.style.visibility = 'hidden';
// // //       document.body.appendChild(link);
// // //       link.click();
// // //       document.body.removeChild(link);
// // //     }
// // //   }

// // //     public  handleError<T>() {
// // //     return (error: HttpErrorResponse): Observable<T | undefined> => {
// // //       console.error('API Error:', error);
// // //       this.messageService.showError(`Error fetching data: ${error.error?.message || error.message || 'Server error'}`)
// // //       // this.errorMessage = `Error fetching data: ${error.error?.message || error.message || 'Server error'}`;
// // //       // Optionally, return an empty/default observable of the expected type, or rethrow
// // //       // return of(undefined as T); // This will make the subscriber complete without emitting data
// // //       throw error; // Or rethrow to be handled by a global error handler if you have one
// // //     };
// // //   }


// // //   // --- URL & Routing Utilities ---

// // //   /**
// // //    * Updates the URL query parameters without a full page reload.
// // //    * @param params The query parameters to set.
// // //    */
// // //   public updateQueryParams(params: { [key: string]: any }): void {
// // //     this.router.navigate([], {
// // //       relativeTo: this.route,
// // //       queryParams: params,
// // //       queryParamsHandling: 'merge', // 'merge' preserves other existing query params
// // //     });
// // //   }

// // //   // --- Error Handling ---

// // //   /**
// // //    * Creates a reusable error handler for an RxJS pipe.
// // //    * It logs the error and shows a user-friendly message.
// // //    * @param operation A friendly name for the operation that failed.
// // //    */
// // //   public createApiErrorHandler<T>(operation: string = 'API operation') {
// // //     return (error: HttpErrorResponse): Observable<T> => {
// // //       console.error(`[${operation}] failed:`, error);
// // //       this.messageService.handleHttpError(error, operation);
// // //       return throwError(() => error);
// // //     };
// // //   }
// // // }
