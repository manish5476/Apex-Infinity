import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridColumn, GridFilterState } from '../grid-types';

@Component({
  selector: 'app-grid-filter-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div class="flex items-center border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-4 py-2 gap-3 overflow-x-auto custom-scrollbar animate-[apex-slide-down_0.15s_ease-out]">

      <div class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--ui-border-radius-sm)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] text-[11px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">
        <i class="pi pi-filter-fill text-[10px]"></i> Filters
      </div>

      <!-- Divider -->
      <div class="h-4 w-px bg-[var(--border-secondary)] shrink-0"></div>

      <div class="flex items-center gap-2.5 flex-1 min-w-0">
        @for (col of filterableColumns(); track col.field) {
          @let val = getFilterValue(col.field);
          <div class="flex items-center gap-2 shrink-0 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius)] px-2.5 py-1 transition-all focus-within:border-[var(--accent-primary)] focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)]"
               [class.border-[var(--accent-primary)]]="!!val"
               [class.bg-[color-mix(in_srgb,var(--accent-primary)_4%,var(--bg-primary))]]="!!val">
            
            <label class="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider truncate max-w-[90px]" [title]="col.header">
              {{ col.header }}
            </label>

            <div class="w-px h-3.5 bg-[var(--border-secondary)]"></div>

            @if (col.type === 'boolean' || col.type === 'toggleswitch') {
              <select class="apex-filter-ctrl"
                      [value]="val"
                      (change)="onSelectFilter(col.field, $any($event.target).value)">
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            } @else if (col.type === 'select' && col.options?.length) {
              <select class="apex-filter-ctrl"
                      [value]="val"
                      (change)="onSelectFilter(col.field, $any($event.target).value)">
                <option value="">All</option>
                @for (opt of col.options!; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            } @else if (col.type === 'number' || col.type === 'currency') {
              <input type="number" class="apex-filter-ctrl w-24"
                     placeholder="Value..."
                     [value]="val"
                     (input)="onTextFilter(col.field, $any($event.target).value)">
            } @else {
              <input type="text" class="apex-filter-ctrl w-28"
                     placeholder="Search..."
                     [value]="val"
                     (input)="onTextFilter(col.field, $any($event.target).value)">
            }

            @if (val) {
              <button type="button" class="text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors p-0.5 outline-none"
                      (click)="removeFilter(col.field)" title="Clear filter">
                <i class="pi pi-times text-[9px]"></i>
              </button>
            }
          </div>
        }
      </div>

      <!-- Clear All -->
      @if (hasActiveFilters()) {
        <button type="button"
                class="shrink-0 ml-auto flex items-center gap-1.5 px-3 py-1 rounded-[var(--ui-border-radius)] text-xs font-semibold text-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-error)_16%,transparent)] transition-all outline-none"
                (click)="clearAll()">
          <i class="pi pi-times-circle text-[11px]"></i> Clear All
        </button>
      }
    </div>
  `,
  styles: [`
    .apex-filter-ctrl {
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 12px;
      font-family: inherit;
      padding: 0;
      
      &::placeholder { color: var(--text-tertiary); }
    }
    
    @keyframes apex-slide-down {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class GridFilterBarComponent implements OnInit {
  columns = input<GridColumn[]>([]);
  activeFilters = input<GridFilterState[]>([]);

  filterChange = output<GridFilterState[]>();

  private filters = signal<Map<string, GridFilterState>>(new Map());

  protected filterableColumns = computed(() =>
    this.columns().filter(c => c.filterable !== false && c.visible !== false && c.type !== 'action')
  );

  protected hasActiveFilters = computed(() => this.filters().size > 0);

  ngOnInit(): void {
    const map = new Map<string, GridFilterState>();
    this.activeFilters().forEach(f => map.set(f.field, f));
    this.filters.set(map);
  }

  protected getFilterValue(field: string): string {
    return String(this.filters().get(field)?.value ?? '');
  }

  protected onTextFilter(field: string, value: string): void {
    this.setFilter(field, value, 'contains');
  }

  protected onSelectFilter(field: string, value: string): void {
    value === '' ? this.removeFilter(field) : this.setFilter(field, value, 'equals');
  }

  protected clearAll(): void {
    this.filters.set(new Map());
    this.filterChange.emit([]);
  }

  private setFilter(field: string, value: string, operator: GridFilterState['operator']): void {
    if (value === '') {
      this.removeFilter(field);
      return;
    }
    const map = new Map(this.filters());
    map.set(field, { field, operator, value });
    this.filters.set(map);
    this.filterChange.emit(Array.from(map.values()));
  }

  protected removeFilter(field: string): void {
    const map = new Map(this.filters());
    map.delete(field);
    this.filters.set(map);
    this.filterChange.emit(Array.from(map.values()));
  }
}

