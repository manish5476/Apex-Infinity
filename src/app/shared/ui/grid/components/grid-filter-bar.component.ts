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
    <div class="flex items-center border-b border-[var(--border-secondary)] bg-[color-mix(in_srgb,var(--accent-primary)_4%,var(--bg-primary))] px-4 py-2 gap-4 overflow-x-auto custom-scrollbar animate-[apex-slide-down_0.15s_ease-out]">

      <div class="shrink-0 flex items-center gap-1.5 text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--accent-primary)] uppercase tracking-wider">
        <i class="pi pi-filter-fill text-[11px]"></i> Filters
      </div>

      <!-- Divider -->
      <div class="h-4 w-px bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] shrink-0"></div>

      <div class="flex items-center gap-3 flex-1 min-w-0">
        @for (col of filterableColumns(); track col.field) {
          <div class="flex items-center gap-2 shrink-0 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius-sm)] px-2 py-1 transition-[var(--transition-fast)] focus-within:border-[var(--accent-primary)] focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)]">
            
            <label class="text-[10px] text-[var(--text-tertiary)] font-[var(--font-weight-medium)] uppercase tracking-wide truncate max-w-[80px]" [title]="col.header">
              {{ col.header }}
            </label>

            <div class="w-px h-3 bg-[var(--border-secondary)]"></div>

            @if (col.type === 'boolean' || col.type === 'toggleswitch') {
              <select class="apex-filter-ctrl"
                      [value]="getFilterValue(col.field)"
                      (change)="onSelectFilter(col.field, $any($event.target).value)">
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            } @else if (col.type === 'select' && col.options?.length) {
              <select class="apex-filter-ctrl"
                      [value]="getFilterValue(col.field)"
                      (change)="onSelectFilter(col.field, $any($event.target).value)">
                <option value="">All</option>
                @for (opt of col.options!; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            } @else if (col.type === 'number' || col.type === 'currency') {
              <input type="number" class="apex-filter-ctrl w-24"
                     placeholder="Value..."
                     [value]="getFilterValue(col.field)"
                     (input)="onTextFilter(col.field, $any($event.target).value)">
            } @else {
              <input type="text" class="apex-filter-ctrl w-32"
                     placeholder="Search..."
                     [value]="getFilterValue(col.field)"
                     (input)="onTextFilter(col.field, $any($event.target).value)">
            }
          </div>
        }
      </div>

      <!-- Clear All -->
      @if (hasActiveFilters()) {
        <button type="button"
                class="shrink-0 ml-auto flex items-center gap-1.5 px-3 py-1 rounded-[var(--ui-border-radius-sm)] text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] transition-[var(--transition-fast)] outline-none"
                (click)="clearAll()">
          <i class="pi pi-times-circle text-[11px]"></i> Clear Filters
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
      font-size: var(--font-size-xs);
      font-family: inherit;
      padding: 0;
      
      &::placeholder { color: var(--text-tertiary); }
    }
    
    @keyframes apex-slide-down {
      from { opacity: 0; transform: translateY(-10px); }
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

  private removeFilter(field: string): void {
    const map = new Map(this.filters());
    map.delete(field);
    this.filters.set(map);
    this.filterChange.emit(Array.from(map.values()));
  }
}

// import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit } from '@angular/core';
// import { GridColumn, GridFilterState } from '../grid-types';
// import { FormsModule } from '@angular/forms';

// /**
//  * Component: app-grid-filter-bar
//  * Collapsible filter row shown below the header.
//  * Renders one filter input per filterable column using the column's type to pick the right control.
//  */
// @Component({
//   selector: 'app-grid-filter-bar',
//   standalone: true,
//   imports: [FormsModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="flex items-center border-b border-[var(--border-secondary)]
//                 bg-[color-mix(in_srgb,var(--accent-primary)_3%,var(--bg-primary))]
//                 px-4 py-2 gap-3 overflow-x-auto">

//       <span class="shrink-0 text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)]
//                    text-[var(--accent-primary)] uppercase tracking-wide flex items-center gap-1">
//         <i class="pi pi-filter-fill text-[10px]"></i> Filters
//       </span>

//       @for (col of filterableColumns(); track col.field) {
//         <div class="flex flex-col gap-0.5 shrink-0" [style.min-width]="col.width ?? '160px'">
//           <label class="text-[10px] text-[var(--text-tertiary)] font-[var(--font-weight-medium)] uppercase tracking-wide">
//             {{ col.header }}
//           </label>

//           @if (col.type === 'boolean' || col.type === 'toggleswitch') {
//             <!-- Boolean filter -->
//             <select class="apex-filter-input"
//                     [value]="getFilterValue(col.field)"
//                     (change)="onSelectFilter(col.field, $any($event.target).value)">
//               <option value="">All</option>
//               <option value="true">Yes</option>
//               <option value="false">No</option>
//             </select>
//           } @else if (col.type === 'select' && col.options?.length) {
//             <!-- Dropdown filter -->
//             <select class="apex-filter-input"
//                     [value]="getFilterValue(col.field)"
//                     (change)="onSelectFilter(col.field, $any($event.target).value)">
//               <option value="">All</option>
//               @for (opt of col.options!; track opt.value) {
//                 <option [value]="opt.value">{{ opt.label }}</option>
//               }
//             </select>
//           } @else if (col.type === 'number' || col.type === 'currency') {
//             <!-- Number filter -->
//             <input type="number" class="apex-filter-input"
//                    [placeholder]="'Filter ' + col.header"
//                    [value]="getFilterValue(col.field)"
//                    (input)="onTextFilter(col.field, $any($event.target).value)">
//           } @else {
//             <!-- Default text filter -->
//             <input type="text" class="apex-filter-input"
//                    [placeholder]="'Search ' + col.header + '…'"
//                    [value]="getFilterValue(col.field)"
//                    (input)="onTextFilter(col.field, $any($event.target).value)">
//           }
//         </div>
//       }

//       <!-- Clear all -->
//       @if (hasActiveFilters()) {
//         <button type="button"
//                 class="shrink-0 ml-auto flex items-center gap-1 px-3 py-1 rounded-[var(--ui-border-radius-pill)]
//                        text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]
//                        text-[var(--color-error)] border border-[var(--color-error)]
//                        hover:bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)]
//                        transition-[var(--transition-fast)] outline-none"
//                 (click)="clearAll()">
//           <i class="pi pi-times text-[10px]"></i>
//           Clear all
//         </button>
//       }
//     </div>
//   `,
//   styles: [`
//     .apex-filter-input {
//       width: 100%;
//       height: 26px;
//       padding: 2px 8px;
//       font-size: var(--font-size-xs);
//       color: var(--text-primary);
//       background: var(--bg-primary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-sm);
//       outline: none;
//       transition: var(--transition-fast);
//     }
//     .apex-filter-input:focus {
//       border-color: var(--accent-primary);
//       box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-primary) 20%, transparent);
//     }
//     .apex-filter-input::placeholder { color: var(--input-placeholder); }
//   `],
// })
// export class GridFilterBarComponent implements OnInit {
//   columns      = input<GridColumn[]>([]);
//   activeFilters = input<GridFilterState[]>([]);

//   filterChange = output<GridFilterState[]>();
//   close        = output<void>();

//   private filters = signal<Map<string, GridFilterState>>(new Map());

//   protected filterableColumns = computed(() =>
//     this.columns().filter(c => c.filterable !== false && c.visible !== false && c.type !== 'action')
//   );

//   protected hasActiveFilters = computed(() => this.filters().size > 0);

//   ngOnInit(): void {
//     // Seed from initial activeFilters input
//     const map = new Map<string, GridFilterState>();
//     this.activeFilters().forEach(f => map.set(f.field, f));
//     this.filters.set(map);
//   }

//   protected getFilterValue(field: string): string {
//     return String(this.filters().get(field)?.value ?? '');
//   }

//   protected onTextFilter(field: string, value: string): void {
//     this.setFilter(field, value, 'contains');
//   }

//   protected onSelectFilter(field: string, value: string): void {
//     if (value === '') {
//       this.removeFilter(field);
//     } else {
//       this.setFilter(field, value, 'equals');
//     }
//   }

//   protected clearAll(): void {
//     this.filters.set(new Map());
//     this.filterChange.emit([]);
//   }

//   private setFilter(field: string, value: string, operator: GridFilterState['operator']): void {
//     if (value === '') {
//       this.removeFilter(field);
//       return;
//     }
//     const map = new Map(this.filters());
//     map.set(field, { field, operator, value });
//     this.filters.set(map);
//     this.filterChange.emit(Array.from(map.values()));
//   }

//   private removeFilter(field: string): void {
//     const map = new Map(this.filters());
//     map.delete(field);
//     this.filters.set(map);
//     this.filterChange.emit(Array.from(map.values()));
//   }
// }
