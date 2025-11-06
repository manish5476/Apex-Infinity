import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { AppMessageService } from '../services/message.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
type Severity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

@Injectable({
  providedIn: 'root'
})
export class CommonMethodService {

  // Use inject() for cleaner, constructor-less dependency injection
  private messageService = inject(AppMessageService);
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() { }


// Usage example in template or method
// <button (click)="downloadInvoicePDF(selectedInvoiceId)">Download PDF</button>
  // --- Data Formatting Utilities ---
   
  public responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  /**
   * Formats a number as Indian Rupee currency (e.g., ₹1,00,000.00).
   * @param value The number to format.
   * @returns The formatted currency string or 'N/A'.
   */
  public formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Formats a date object or string into a specified format.
   * @param value The date to format.
   * @param format The format string (e.g., 'dd/MM/yyyy', 'mediumDate'). Defaults to 'mediumDate'.
   * @returns The formatted date string.
   */
  public formatDate(value: Date | string | number, format: string = 'mediumDate'): string | null {
    if (!value) return null;
    return this.datePipe.transform(value, format);
  }

  /**
   * Formats a date to a relative "time ago" string (e.g., "2 hours ago").
   * @param value The date to format.
   * @returns A relative time string.
   */
  public formatRelativeTime(value: Date | string): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return this.formatDate(date, 'longDate') || 'a long time ago';
  }

  /**
   * Truncates a string to a specified length and adds an ellipsis.
   * @param text The text to truncate.
   * @param limit The character limit.
   * @returns The truncated string.
   */
  public truncateText(text: string, limit: number = 50): string {
    if (!text || text.length <= limit) {
      return text;
    }
    return text.substring(0, limit) + '...';
  }

  /**
   * Capitalizes the first letter of a string.
   */
  public capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Generates initials from a full name (e.g., "Shivam Kumar" -> "SK").
   * @param fullName The full name string.
   * @returns The generated initials.
   */
  public getInitials(fullName: string): string {
    if (!fullName) return '';
    return fullName.split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  // --- UI & Status Helpers ---

  public getSeverity(status: string): Severity {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'unpaid': return 'danger';
      default: return 'info';
    }
  }

  public getPaymentStatusSeverity(status: string): Severity {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warn';
      case 'failed': return 'danger';
      default: return 'info';
    }
  }

  public getInvoiceStatusSeverity(status: string): Severity {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'unpaid': return 'danger';
      case 'pending': return 'warn';
      default: return 'info';
    }
  }

  /**
   * Generates a consistent, random-looking hex color from any string.
   * Useful for user avatars, tags, etc.
   * @param str The input string.
   * @returns A hex color code string.
   */
  public generateHexColorFromString(str: string): string {
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

  // --- Array & Object Utilities ---

  /**
   * Groups an array of objects by a specified key.
   * @param array The array to group.
   * @param key The key to group by.
   * @returns An object with keys corresponding to the grouped values.
   */
  public groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((result, currentValue) => {
      const groupKey = String(currentValue[key]);
      (result[groupKey] = result[groupKey] || []).push(currentValue);
      return result;
    }, {} as { [key: string]: T[] });
  }

  /**
   * Creates a deep clone of a JSON-serializable object.
   */
  public deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Checks if two objects are deeply equal.
   * @param obj1 The first object.
   * @param obj2 The second object.
   * @returns True if the objects are equal.
   */
  public areObjectsEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  // --- Browser & DOM Utilities ---

  /**
   * Copies a string to the user's clipboard.
   * @param text The text to copy.
   */
  public async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.messageService.showSuccess('Copied!', 'Text copied to clipboard.');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      this.messageService.showError('Copy Failed', 'Could not copy text to clipboard.');
    }
  }

  /**
   * Smoothly scrolls to an element on the page.
   * @param elementId The ID of the element to scroll to.
   */
  public scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // --- Advanced Form Handling ---

  /**
   * Marks all controls in a FormGroup as touched. Useful for displaying validation messages on submit.
   * @param formGroup The FormGroup to mark.
   */
  public markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // --- Performance & Timing ---

  /**
   * Creates a debounced function that delays invoking the provided function
   * until after `wait` milliseconds have elapsed since the last time it was invoked.
   * @param func The function to debounce.
   * @param wait The number of milliseconds to delay.
   * @returns A new debounced function.
   */
  public debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  // --- Data Transformation ---

  /**
   * Converts an array of objects into a CSV formatted string and triggers a download.
   * @param data The array of objects to convert.
   * @param filename The desired filename for the downloaded CSV file.
   */
  public exportToCsv(data: any[], filename: string = 'export.csv'): void {
    if (!data || data.length === 0) {
      this.messageService.showWarn('Export Failed', 'No data available to export.');
      return;
    }
    const replacer = (key: any, value: any) => value === null ? '' : value;
    const header = Object.keys(data[0]);
    const csv = [
      header.join(','),
      ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

    public  handleError<T>() {
    return (error: HttpErrorResponse): Observable<T | undefined> => {
      console.error('API Error:', error);
      this.messageService.showError(`Error fetching data: ${error.error?.message || error.message || 'Server error'}`)
      // this.errorMessage = `Error fetching data: ${error.error?.message || error.message || 'Server error'}`;
      // Optionally, return an empty/default observable of the expected type, or rethrow
      // return of(undefined as T); // This will make the subscriber complete without emitting data
      throw error; // Or rethrow to be handled by a global error handler if you have one
    };
  }


  // --- URL & Routing Utilities ---

  /**
   * Updates the URL query parameters without a full page reload.
   * @param params The query parameters to set.
   */
  public updateQueryParams(params: { [key: string]: any }): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge', // 'merge' preserves other existing query params
    });
  }

  // --- Error Handling ---

  /**
   * Creates a reusable error handler for an RxJS pipe.
   * It logs the error and shows a user-friendly message.
   * @param operation A friendly name for the operation that failed.
   */
  public createApiErrorHandler<T>(operation: string = 'API operation') {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`[${operation}] failed:`, error);
      this.messageService.handleHttpError(error, operation);
      return throwError(() => error);
    };
  }
}

// import { HttpErrorResponse } from '@angular/common/http';
// import { Injectable, inject } from '@angular/core';
// import { Observable, throwError } from 'rxjs';
// import { AppMessageService } from '../services/message.service';
// import { DatePipe } from '@angular/common';

// // A reusable type for PrimeNG component severities
// type Severity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

// @Injectable({
//   providedIn: 'root'
// })
// export class CommonMethodService {

//   // Use inject() for cleaner, constructor-less dependency injection
//   private messageService = inject(AppMessageService);
//   private datePipe = inject(DatePipe);

//   constructor() { }

//   // --- Data Formatting Utilities ---

//   /**
//    * Formats a number as Indian Rupee currency (e.g., ₹1,00,000.00).
//    * @param value The number to format.
//    * @returns The formatted currency string or 'N/A'.
//    */
//   public formatCurrency(value: number | undefined | null): string {
//     if (value === undefined || value === null) {
//       return 'N/A';
//     }
//     return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//   }

//   /**
//    * Formats a date object or string into a specified format.
//    * @param value The date to format.
//    * @param format The format string (e.g., 'dd/MM/yyyy', 'mediumDate'). Defaults to 'mediumDate'.
//    * @returns The formatted date string.
//    */
//   public formatDate(value: Date | string | number, format: string = 'mediumDate'): string | null {
//     if (!value) return null;
//     return this.datePipe.transform(value, format);
//   }

//   /**
//    * Formats a date to a relative "time ago" string (e.g., "2 hours ago").
//    * @param value The date to format.
//    * @returns A relative time string.
//    */
//   public formatRelativeTime(value: Date | string): string {
//     if (!value) return 'N/A';
//     const date = new Date(value);
//     const now = new Date();
//     const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
//     const minutes = Math.round(seconds / 60);
//     const hours = Math.round(minutes / 60);
//     const days = Math.round(hours / 24);

//     if (seconds < 60) return `${seconds} seconds ago`;
//     if (minutes < 60) return `${minutes} minutes ago`;
//     if (hours < 24) return `${hours} hours ago`;
//     if (days < 7) return `${days} days ago`;
//     return this.formatDate(date, 'longDate') || 'a long time ago';
//   }

//   /**
//    * Truncates a string to a specified length and adds an ellipsis.
//    * @param text The text to truncate.
//    * @param limit The character limit.
//    * @returns The truncated string.
//    */
//   public truncateText(text: string, limit: number = 50): string {
//     if (!text || text.length <= limit) {
//       return text;
//     }
//     return text.substring(0, limit) + '...';
//   }

//   /**
//    * Capitalizes the first letter of a string.
//    */
//   public capitalize(text: string): string {
//     if (!text) return '';
//     return text.charAt(0).toUpperCase() + text.slice(1);
//   }

//   /**
//    * Generates initials from a full name (e.g., "Shivam Kumar" -> "SK").
//    * @param fullName The full name string.
//    * @returns The generated initials.
//    */
//   public getInitials(fullName: string): string {
//     if (!fullName) return '';
//     return fullName.split(' ')
//       .map(n => n[0])
//       .slice(0, 2)
//       .join('')
//       .toUpperCase();
//   }

//   // --- UI & Status Helpers ---

//   public getSeverity(status: string): Severity {
//     switch (status.toLowerCase()) {
//       case 'paid': return 'success';
//       case 'unpaid': return 'danger';
//       default: return 'info';
//     }
//   }

//   public getPaymentStatusSeverity(status: string): Severity {
//     switch (status.toLowerCase()) {
//       case 'completed': return 'success';
//       case 'pending': return 'warn';
//       case 'failed': return 'danger';
//       default: return 'info';
//     }
//   }

//   public getInvoiceStatusSeverity(status: string): Severity {
//     switch (status.toLowerCase()) {
//       case 'paid': return 'success';
//       case 'unpaid': return 'danger';
//       case 'pending': return 'warn';
//       default: return 'info';
//     }
//   }

//   /**
//    * Generates a consistent, random-looking hex color from any string.
//    * Useful for user avatars, tags, etc.
//    * @param str The input string.
//    * @returns A hex color code string.
//    */
//   public generateHexColorFromString(str: string): string {
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

//   // --- Array & Object Utilities ---

//   /**
//    * Groups an array of objects by a specified key.
//    * @param array The array to group.
//    * @param key The key to group by.
//    * @returns An object with keys corresponding to the grouped values.
//    */
//   public groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
//     return array.reduce((result, currentValue) => {
//       const groupKey = String(currentValue[key]);
//       (result[groupKey] = result[groupKey] || []).push(currentValue);
//       return result;
//     }, {} as { [key: string]: T[] });
//   }

//   /**
//    * Creates a deep clone of a JSON-serializable object.
//    */
//   public deepClone<T>(obj: T): T {
//     return JSON.parse(JSON.stringify(obj));
//   }

//   // --- Browser & DOM Utilities ---

//   /**
//    * Copies a string to the user's clipboard.
//    * @param text The text to copy.
//    */
//   public async copyToClipboard(text: string): Promise<void> {
//     try {
//       await navigator.clipboard.writeText(text);
//       this.messageService.showSuccess('Copied!', 'Text copied to clipboard.');
//     } catch (err) {
//       console.error('Failed to copy text: ', err);
//       this.messageService.showError('Copy Failed', 'Could not copy text to clipboard.');
//     }
//   }

//   /**
//    * Smoothly scrolls to an element on the page.
//    * @param elementId The ID of the element to scroll to.
//    */
//   public scrollToElement(elementId: string): void {
//     const element = document.getElementById(elementId);
//     if (element) {
//       element.scrollIntoView({ behavior: 'smooth', block: 'start' });
//     }
//   }

//   // --- Error Handling ---

//   /**
//    * Creates a reusable error handler for an RxJS pipe.
//    * It logs the error and shows a user-friendly message.
//    * @param operation A friendly name for the operation that failed.
//    */
//   public createApiErrorHandler<T>(operation: string = 'API operation') {
//     return (error: HttpErrorResponse): Observable<T> => {
//       console.error(`[${operation}] failed:`, error);
//       this.messageService.handleHttpError(error, operation);
//       return throwError(() => error);
//     };
//   }





// // import { HttpErrorResponse } from '@angular/common/http';
// // import { Injectable } from '@angular/core';
// // import { Observable } from 'rxjs';
// // import { AppMessageService } from '../services/message.service';

// // type Severity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class CommonMethodService {

// //   constructor(private messageService:AppMessageService) { }




// //   public formatCurrency(value: number | undefined | null): string {
// //     if (value === undefined || value === null) {
// //       return 'N/A';
// //     }
// //     // Using toLocaleString for currency formatting
// //     return `₹${value.toLocaleString('en-IN')}`; // 'en-IN' for Indian Rupees format
// //   }



// //   public responsiveOptions = [
// //     {
// //       breakpoint: '1024px',
// //       numVisible: 1,
// //       numScroll: 1
// //     },
// //     {
// //       breakpoint: '768px',
// //       numVisible: 1,
// //       numScroll: 1
// //     },
// //     {
// //       breakpoint: '560px',
// //       numVisible: 1,
// //       numScroll: 1
// //     }
// //   ];

// //  public  getSeverity(status: string): Severity {
// //     switch (status) {
// //       case 'Paid':
// //         return 'success';
// //       case 'Unpaid':
// //         return 'danger';
// //       default:
// //         return 'info'; // Fallback for unknown status
// //     }
// //   }

  
// //   public getPaymentStatusSeverity(status: string): Severity {
// //     switch (status.toLowerCase()) {
// //       case 'completed':
// //         return 'success';
// //       case 'pending':
// //         return 'warn';
// //       case 'failed':
// //         return 'danger';
// //       default:
// //         return 'info'; // Fallback for unknown status
// //     }
// //   }



// //   // Explicitly define the return type as Severity
// //   public getInvoiceStatusSeverity(status: string): Severity {
// //     switch (status.toLowerCase()) {
// //       case 'paid':
// //         return 'success';
// //       case 'unpaid':
// //         return 'danger';
// //       case 'pending':
// //         return 'warn';
// //       default:
// //         return 'info'; // Fallback for unknown status
// //     }
// //   }
// // }
