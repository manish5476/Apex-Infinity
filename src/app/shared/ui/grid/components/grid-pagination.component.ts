import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridPageState } from '../grid-types';

@Component({
  selector: 'app-grid-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div class="flex items-center justify-between px-4 py-2 text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] select-none">
      
      <!-- Left: Record Math -->
      <div class="flex items-center gap-3">
        <div class="font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
          {{ fromRecord() }} – {{ toRecord() }} <span class="font-normal mx-1">of</span> <span class="font-[var(--font-weight-semibold)] text-[var(--text-primary)]">{{ total() | number }}</span>
        </div>

        <div class="w-px h-4 bg-[var(--border-secondary)]"></div>

        <!-- Page Size Selector -->
        <div class="flex items-center gap-1.5">
          <span>Rows per page:</span>
          <select class="bg-transparent border border-transparent hover:border-[var(--border-secondary)] text-[var(--text-primary)] font-[var(--font-weight-medium)] rounded-[var(--ui-border-radius-sm)] px-1 py-0.5 outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)] transition-all cursor-pointer"
                  [value]="pageSize()"
                  (change)="onPageSizeChange($any($event.target).value)">
            @for (size of pageSizeOptions(); track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Right: Navigation Pills -->
      <div class="flex items-center gap-1">
        
        <button type="button" class="apex-pg-nav" [disabled]="isFirstPage()" (click)="goToPage(0)" aria-label="First page">
          <i class="pi pi-angle-double-left"></i>
        </button>
        <button type="button" class="apex-pg-nav" [disabled]="isFirstPage()" (click)="goToPage(page() - 1)" aria-label="Previous page">
          <i class="pi pi-angle-left"></i>
        </button>

        <div class="flex items-center gap-0.5 px-2">
          @for (p of visiblePages(); track p) {
            @if (p === -1) {
              <span class="px-1 text-[var(--text-tertiary)]">...</span>
            } @else {
              <button type="button" 
                      class="apex-pg-pill" 
                      [class.apex-pg-pill--active]="p === page()" 
                      (click)="goToPage(p)">
                {{ p + 1 }}
              </button>
            }
          }
        </div>

        <button type="button" class="apex-pg-nav" [disabled]="isLastPage()" (click)="goToPage(page() + 1)" aria-label="Next page">
          <i class="pi pi-angle-right"></i>
        </button>
        <button type="button" class="apex-pg-nav" [disabled]="isLastPage()" (click)="goToPage(totalPages() - 1)" aria-label="Last page">
          <i class="pi pi-angle-double-right"></i>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .apex-pg-nav {
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ui-border-radius-sm);
      color: var(--text-secondary);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: var(--transition-fast);
      outline: none;

      i { font-size: 10px; }

      &:hover:not(:disabled) {
        background: var(--component-bg-hover);
        color: var(--text-primary);
      }
      &:focus-visible { box-shadow: 0 0 0 2px var(--accent-focus); }
      &:disabled { opacity: 0.3; cursor: not-allowed; }
    }

    .apex-pg-pill {
      min-width: 24px;
      height: 24px;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ui-border-radius-sm);
      font-size: 11px;
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: var(--transition-fast);
      outline: none;

      &:hover:not(.apex-pg-pill--active) {
        background: var(--component-bg-hover);
        color: var(--text-primary);
      }
      &:focus-visible { box-shadow: 0 0 0 2px var(--accent-focus); }
    }

    .apex-pg-pill--active {
      background: var(--bg-primary);
      color: var(--accent-primary);
      border-color: var(--border-secondary);
      box-shadow: var(--shadow-xs);
      font-weight: var(--font-weight-semibold);
    }
  `]
})
export class GridPaginationComponent {
  total = input<number>(0);
  page = input<number>(0);
  pageSize = input<number>(50);
  pageSizeOptions = input<number[]>([25, 50, 100, 250]);

  pageChange = output<GridPageState>();
  pageSizeChange = output<number>();

  protected totalPages = computed(() => Math.ceil(this.total() / this.pageSize()) || 1);
  protected isFirstPage = computed(() => this.page() <= 0);
  protected isLastPage = computed(() => this.page() >= this.totalPages() - 1);
  protected fromRecord = computed(() => this.total() === 0 ? 0 : this.page() * this.pageSize() + 1);
  protected toRecord = computed(() => Math.min((this.page() + 1) * this.pageSize(), this.total()));

  protected visiblePages = computed<number[]>(() => {
    const total = this.totalPages();
    const cur = this.page();

    // Show all if 7 or fewer pages
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);

    const pages: number[] = [0];
    if (cur > 2) pages.push(-1); // Left ellipsis

    // Middle chunk
    for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) {
      pages.push(i);
    }

    if (cur < total - 3) pages.push(-1); // Right ellipsis
    pages.push(total - 1);

    return pages;
  });

  protected goToPage(p: number): void {
    const clamped = Math.max(0, Math.min(p, this.totalPages() - 1));
    this.pageChange.emit({
      page: clamped,
      pageSize: this.pageSize(),
      total: this.total(),
      pageNumber: clamped + 1
    });
  }

  protected onPageSizeChange(val: string): void {
    const size = Number(val);
    this.pageSizeChange.emit(size);
  }
}