import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { GridPageState } from '../grid-types';
import { CommonModule } from '@angular/common';

/**
 * Component: app-grid-pagination
 * Premium paginator with page-size selector, direct page input, prev/next controls,
 * and total record count. All tokens, no PrimeNG paginator.
 */
@Component({
  selector: 'app-grid-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between px-4 py-2 border-t border-[var(--border-secondary)]
                bg-[var(--bg-primary)] text-[length:var(--font-size-xs)]
                text-[var(--text-tertiary)] select-none">

      <!-- Left: record count -->
      <div class="flex items-center gap-2">
        <span class="font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
          {{ fromRecord() }}–{{ toRecord() }}
        </span>
        <span>of</span>
        <span class="font-[var(--font-weight-semibold)] text-[var(--text-primary)]">
          {{ total() | number }}
        </span>
        <span>records</span>

        <!-- Page size selector -->
        <div class="flex items-center gap-1 ml-3">
          <span class="text-[var(--text-tertiary)]">Show</span>
          <select
            class="bg-[var(--bg-secondary)] border border-[var(--border-secondary)]
                   text-[var(--text-primary)] text-[length:var(--font-size-xs)]
                   rounded-[var(--ui-border-radius-sm)] px-1 py-0.5 outline-none
                   focus:ring-1 focus:ring-[var(--accent-primary)] cursor-pointer"
            [value]="pageSize()"
            (change)="onPageSizeChange($any($event.target).value)">
            @for (size of pageSizeOptions(); track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
          <span class="text-[var(--text-tertiary)]">per page</span>
        </div>
      </div>

      <!-- Right: page navigation -->
      <div class="flex items-center gap-1">

        <!-- First page -->
        <button type="button" [disabled]="isFirstPage()" (click)="goToPage(0)"
                class="apex-pg-btn" [class.opacity-30]="isFirstPage()" aria-label="First page">
          <i class="pi pi-angle-double-left text-[10px]"></i>
        </button>

        <!-- Prev -->
        <button type="button" [disabled]="isFirstPage()" (click)="goToPage(page() - 1)"
                class="apex-pg-btn" [class.opacity-30]="isFirstPage()" aria-label="Previous page">
          <i class="pi pi-angle-left text-[10px]"></i>
        </button>

        <!-- Page number pills -->
        @for (p of visiblePages(); track p) {
          @if (p === -1) {
            <span class="px-1 text-[var(--text-tertiary)]">…</span>
          } @else {
            <button type="button"
                    class="apex-pg-btn"
                    [class.apex-pg-btn--active]="p === page()"
                    (click)="goToPage(p)">
              {{ p + 1 }}
            </button>
          }
        }

        <!-- Next -->
        <button type="button" [disabled]="isLastPage()" (click)="goToPage(page() + 1)"
                class="apex-pg-btn" [class.opacity-30]="isLastPage()" aria-label="Next page">
          <i class="pi pi-angle-right text-[10px]"></i>
        </button>

        <!-- Last page -->
        <button type="button" [disabled]="isLastPage()" (click)="goToPage(totalPages() - 1)"
                class="apex-pg-btn" [class.opacity-30]="isLastPage()" aria-label="Last page">
          <i class="pi pi-angle-double-right text-[10px]"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .apex-pg-btn {
      min-width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 6px;
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: var(--transition-fast);
      outline: none;
    }
    .apex-pg-btn:hover:not(:disabled) {
      background: var(--component-bg-hover);
      color: var(--text-primary);
    }
    .apex-pg-btn--active {
      background: var(--accent-primary) !important;
      color: var(--text-on-accent) !important;
    }
    .apex-pg-btn:disabled { cursor: not-allowed; }
  `],
  imports: [CommonModule],
})
export class GridPaginationComponent {
  total = input<number>(0);
  page = input<number>(0);
  pageSize = input<number>(15);
  pageSizeOptions = input<number[]>([10, 15, 25, 50, 100]);

  pageChange = output<GridPageState>();

  protected totalPages = computed(() => Math.ceil(this.total() / this.pageSize()) || 1);
  protected isFirstPage = computed(() => this.page() <= 0);
  protected isLastPage = computed(() => this.page() >= this.totalPages() - 1);
  protected fromRecord = computed(() => this.total() === 0 ? 0 : this.page() * this.pageSize() + 1);
  protected toRecord = computed(() => Math.min((this.page() + 1) * this.pageSize(), this.total()));

  protected visiblePages = computed<number[]>(() => {
    const total = this.totalPages();
    const cur = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);

    const pages: number[] = [0];
    if (cur > 2) pages.push(-1);                              // ellipsis
    for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i);
    if (cur < total - 3) pages.push(-1);                     // ellipsis
    pages.push(total - 1);
    return pages;
  });

  protected goToPage(p: number): void {
    const clamped = Math.max(0, Math.min(p, this.totalPages() - 1));
    this.pageChange.emit({ page: clamped, pageSize: this.pageSize(), total: this.total() });
  }

  protected onPageSizeChange(val: string): void {
    this.pageChange.emit({ page: 0, pageSize: Number(val), total: this.total() });
  }
}
