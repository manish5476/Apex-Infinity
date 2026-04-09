/**
 * ============================================================
 * ERP Pipes Collection — Angular 21 Standalone
 * ============================================================
 * Usage: import { ErpPipesModule } from './pipes/erp-pipes.module';
 * Or import each pipe individually (standalone).
 * ============================================================
 */

import { Pipe, PipeTransform, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─────────────────────────────────────────────────────────────
// 1. CURRENCY PIPE (Indian Rupee with words support)
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ 123456.78 | inrCurrency }}         → ₹1,23,456.78
 *        {{ 123456.78 | inrCurrency:'USD' }}    → $123,456.78
 *        {{ 123456.78 | inrCurrency:'INR':0 }}  → ₹1,23,457
 */
@Pipe({ name: 'inrCurrency', standalone: true, pure: true })
export class InrCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'INR', decimals = 2): string {
    if (value === null || value === undefined) return '—';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. DATE FORMAT PIPE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ '2024-01-15' | erpDate }}          → 15 Jan 2024
 *        {{ '2024-01-15' | erpDate:'DD/MM/YY' }} → 15/01/24
 *        {{ myDate | erpDate:'full' }}          → Monday, 15 January 2024
 */
@Pipe({ name: 'erpDate', standalone: true, pure: true })
export class ErpDatePipe implements PipeTransform {
  transform(value: Date | string | null, format: 'short' | 'medium' | 'long' | 'full' | 'DD/MM/YYYY' | 'DD/MM/YY' | string = 'medium'): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    const opts: Record<string, Intl.DateTimeFormatOptions> = {
      short: { day: '2-digit', month: '2-digit', year: '2-digit' },
      medium: { day: '2-digit', month: 'short', year: 'numeric' },
      long: { day: '2-digit', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    };
    if (opts[format]) return d.toLocaleDateString('en-IN', opts[format]);
    // Custom token format
    const pad = (n: number) => String(n).padStart(2, '0');
    return format
      .replace('YYYY', String(d.getFullYear()))
      .replace('YY', String(d.getFullYear()).slice(2))
      .replace('MM', pad(d.getMonth() + 1))
      .replace('DD', pad(d.getDate()));
  }
}

// ─────────────────────────────────────────────────────────────
// 3. TIME AGO PIPE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ createdAt | timeAgo }}  → 2 hours ago / just now
 */
@Pipe({ name: 'timeAgo', standalone: true, pure: false })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | null): string {
    if (!value) return '—';
    const diff = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (diff < 30) return 'just now';
    const units: [number, string, number][] = [
      [60, 'second', 1],
      [3600, 'minute', 60],
      [86400, 'hour', 3600],
      [604800, 'day', 86400],
      [2592000, 'week', 604800],
      [31536000, 'month', 2592000],
      [Infinity, 'year', 31536000],
    ];
    for (const [limit, unit, divisor] of units) {
      if (diff < limit) {
        const val = Math.floor(diff / divisor);
        return `${val} ${unit}${val !== 1 ? 's' : ''} ago`;
      }
    }
    return '—';
  }
}

// ─────────────────────────────────────────────────────────────
// 4. STATUS BADGE PIPE
// ─────────────────────────────────────────────────────────────

/**
 * Returns CSS class name for status badges.
 * Usage: <span [class]="status | statusClass">{{ status }}</span>
 */
@Pipe({ name: 'statusClass', standalone: true, pure: true })
export class StatusClassPipe implements PipeTransform {
  private readonly map: Record<string, string> = {
    active: 'badge-success', inactive: 'badge-secondary', pending: 'badge-warning',
    approved: 'badge-success', rejected: 'badge-danger', draft: 'badge-secondary',
    processing: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger',
    paid: 'badge-success', unpaid: 'badge-danger', partial: 'badge-warning',
    open: 'badge-info', closed: 'badge-secondary', onhold: 'badge-warning',
    confirmed: 'badge-success', shipped: 'badge-info', delivered: 'badge-success',
    returned: 'badge-warning', present: 'badge-success', absent: 'badge-danger',
    late: 'badge-warning', leave: 'badge-info',
  };
  transform(status: string | null | undefined): string {
    return this.map[status?.toLowerCase() ?? ''] ?? 'badge-secondary';
  }
}

// ─────────────────────────────────────────────────────────────
// 5. MASK PIPE (Aadhaar, PAN, Bank Acc)
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ '123456789012' | mask }}         → ********9012
 *        {{ 'ABCDE1234F' | mask:6 }}         → ****E1234F
 */
@Pipe({ name: 'mask', standalone: true, pure: true })
export class MaskPipe implements PipeTransform {
  transform(value: string | null, visible = 4, char = '*'): string {
    if (!value) return '—';
    if (value.length <= visible) return value;
    return char.repeat(value.length - visible) + value.slice(-visible);
  }
}

// ─────────────────────────────────────────────────────────────
// 6. TRUNCATE PIPE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ longText | truncate:50 }}
 *        {{ longText | truncate:30:'...' }}
 */
@Pipe({ name: 'truncate', standalone: true, pure: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null, limit = 80, suffix = '...'): string {
    if (!value) return '';
    return value.length > limit ? value.slice(0, limit) + suffix : value;
  }
}

// ─────────────────────────────────────────────────────────────
// 7. INITIALS PIPE (for avatars)
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ 'John Doe Smith' | initials }}  → JD
 *        {{ 'John Doe Smith' | initials:3 }} → JDS
 */
@Pipe({ name: 'initials', standalone: true, pure: true })
export class InitialsPipe implements PipeTransform {
  transform(name: string | null, max = 2): string {
    if (!name) return '?';
    return name.split(' ').slice(0, max).map(w => w[0]?.toUpperCase() ?? '').join('');
  }
}

// ─────────────────────────────────────────────────────────────
// 8. COMPACT NUMBER PIPE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ 1200000 | compactNumber }}   → 1.2M
 *        {{ 45000 | compactNumber }}     → 45K
 */
@Pipe({ name: 'compactNumber', standalone: true, pure: true })
export class CompactNumberPipe implements PipeTransform {
  transform(value: number | null): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short' }).format(value);
  }
}

// ─────────────────────────────────────────────────────────────
// 9. FILTER PIPE (for in-template filtering)
// ─────────────────────────────────────────────────────────────

/**
 * Usage: *ngFor="let item of items | filterBy:'name':searchText"
 */
@Pipe({ name: 'filterBy', standalone: true, pure: false })
export class FilterByPipe implements PipeTransform {
  transform<T extends Record<string, unknown>>(
    arr: T[] | null,
    key: keyof T,
    query: string | null
  ): T[] {
    if (!arr) return [];
    if (!query) return arr;
    const q = query.toLowerCase();
    return arr.filter(item => String(item[key] ?? '').toLowerCase().includes(q));
  }
}

// ─────────────────────────────────────────────────────────────
// 10. ORDER BY PIPE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: *ngFor="let item of items | orderBy:'name'"
 *        *ngFor="let item of items | orderBy:'amount':'desc'"
 */
@Pipe({ name: 'orderBy', standalone: true, pure: false })
export class OrderByPipe implements PipeTransform {
  transform<T extends Record<string, unknown>>(
    arr: T[] | null,
    key: keyof T,
    order: 'asc' | 'desc' = 'asc'
  ): T[] {
    if (!arr) return [];
    return [...arr].sort((a, b) => {
      const av = a[key], bv = b[key];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return order === 'asc' ? cmp : -cmp;
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 11. FILE SIZE PIPE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ file.size | fileSize }}  → 2.3 MB
 */
@Pipe({ name: 'fileSize', standalone: true, pure: true })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  }
}

// ─────────────────────────────────────────────────────────────
// 12. PERCENT CHANGE PIPE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ 0.1567 | percentChange }}  → +15.67%
 *        {{ -0.05 | percentChange }}   → -5.00%
 */
@Pipe({ name: 'percentChange', standalone: true, pure: true })
export class PercentChangePipe implements PipeTransform {
  transform(value: number | null, decimals = 2): string {
    if (value === null || value === undefined) return '—';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(decimals)}%`;
  }
}

// ─────────────────────────────────────────────────────────────
// 13. TITLE CASE PIPE (extended)
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ 'hello world' | erpTitleCase }}  → Hello World
 */
@Pipe({ name: 'erpTitleCase', standalone: true, pure: true })
export class ErpTitleCasePipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return '';
    return value.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  }
}

// ─────────────────────────────────────────────────────────────
// 14. SAFE HTML PIPE (DomSanitizer)
// ─────────────────────────────────────────────────────────────

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';

/**
 * Usage: <div [innerHTML]="htmlContent | safeHtml"></div>
 */
@Pipe({ name: 'safeHtml', standalone: true, pure: true })
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

// ─────────────────────────────────────────────────────────────
// 15. JOINED PIPE (for arrays)
// ─────────────────────────────────────────────────────────────

/**
 * Usage: {{ ['Admin','HR','Finance'] | joined }}  → Admin, HR, Finance
 *        {{ roles | joined:' • ' }}
 */
@Pipe({ name: 'joined', standalone: true, pure: true })
export class JoinedPipe implements PipeTransform {
  transform(arr: (string | number)[] | null, separator = ', '): string {
    if (!arr || !arr.length) return '—';
    return arr.join(separator);
  }
}

// ─────────────────────────────────────────────────────────────
// MODULE — import this if using non-standalone components
// ─────────────────────────────────────────────────────────────

export const ERP_PIPES = [
  InrCurrencyPipe, ErpDatePipe, TimeAgoPipe, StatusClassPipe,
  MaskPipe, TruncatePipe, InitialsPipe, CompactNumberPipe,
  FilterByPipe, OrderByPipe, FileSizePipe, PercentChangePipe,
  ErpTitleCasePipe, SafeHtmlPipe, JoinedPipe,
] as const;

@NgModule({
  imports: [CommonModule, ...ERP_PIPES],
  exports: [...ERP_PIPES],
})
export class ErpPipesModule { }