import { Component, ChangeDetectionStrategy, input, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridBulkAction, GridDensity } from '../grid-types';
import type { GridFilterChip } from './grid-filter-chips.component';

@Component({
  selector: 'app-grid-toolbar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div class="flex flex-col w-full relative z-50">
      
      <!-- Main Toolbar Row -->
      <div class="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-[var(--border-secondary)] bg-[var(--bg-primary)]">
        
        <!-- LEFT: Search + Filter Chips + Filter + Clear Filters + Count -->
        <div class="flex items-center gap-2 flex-wrap min-w-0">
          
          <!-- Search -->
          <div class="flex items-center gap-2 px-3 py-1.5 min-w-[220px]
                      bg-[var(--bg-secondary)] border border-[var(--border-secondary)]
                      rounded-[var(--ui-border-radius-pill)] transition-[var(--transition-fast)]
                      focus-within:border-[var(--accent-primary)] focus-within:bg-[var(--bg-primary)]
                      focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)]">
            <i class="pi pi-search text-[11px] text-[var(--text-tertiary)] shrink-0"></i>
            <input
              type="text"
              placeholder="Search all columns..."
              class="flex-1 bg-transparent border-none outline-none text-[length:var(--font-size-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-full"
              [value]="searchQuery()"
              (input)="searchChange.emit($any($event.target).value)"
              (keydown.escape)="searchChange.emit('')">
            @if (searchQuery()) {
              <button type="button" class="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] outline-none" (click)="searchChange.emit('')">
                <i class="pi pi-times text-[10px]"></i>
              </button>
            }
          </div>

          <!-- Filter Chips slot (projected from DataGridComponent) -->
          <ng-content select="[grid-chips]"></ng-content>

          <!-- Filter Toggle Button -->
          <button type="button"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ui-border-radius-pill)] text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] border transition-[var(--transition-fast)] outline-none"
                  [class]="filterActive() 
                    ? 'bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)] border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)]' 
                    : 'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]'"
                  (click)="filterToggle.emit()">
            <i class="pi text-[11px]" [class.pi-filter-fill]="filterActive()" [class.pi-filter]="!filterActive()"></i>
            Filter
            @if (activeFilterCount() > 0) {
              <span class="min-w-[16px] h-4 px-1 ml-1 rounded-full text-[9px] font-bold bg-[var(--accent-primary)] text-[var(--text-on-accent)] flex items-center justify-center">
                {{ activeFilterCount() }}
              </span>
            }
          </button>

          <div class="h-4 w-px bg-[var(--border-secondary)] mx-1"></div>
          <span class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] shrink-0">
            <span class="font-[var(--font-weight-semibold)] text-[var(--text-primary)]">
              {{ filteredCount() !== totalCount() ? (filteredCount() | number) + ' of ' + (totalCount() | number) : (totalCount() | number) }}
            </span>
            records
          </span>
        </div>

        <!-- RIGHT: Tools & Actions -->
        <div class="flex items-center gap-1.5">
          <ng-content select="[grid-actions]"></ng-content>

          <div class="h-5 w-px bg-[var(--border-secondary)] mx-1"></div>

          <!-- Density Picker -->
          <div class="relative">
            <button type="button" class="apex-tb-btn" title="Density" [disabled]="isEditing()" (click)="toggleMenu('density', $event)">
              <i class="pi pi-bars text-[13px]"></i>
            </button>
            @if (activeMenu() === 'density') {
              <div class="apex-tb-dropdown">
                @for (d of densityOptions; track d.value) {
                  <button type="button" class="apex-tb-dropdown-item" [class.text-[var(--accent-primary)]]="density() === d.value" (click)="densityChange.emit(d.value); activeMenu.set(null)">
                    <i [class]="d.icon + ' text-[11px] w-4'"></i> {{ d.label }}
                    @if (density() === d.value) { <i class="pi pi-check text-[10px] ml-auto"></i> }
                  </button>
                }
              </div>
            }
          </div>

          <button type="button" class="apex-tb-btn" title="Manage Columns" [disabled]="isEditing()" (click)="columnManagerToggle.emit()"><i class="pi pi-table text-[13px]"></i></button>
          <button type="button" class="apex-tb-btn" title="Saved Views" [disabled]="isEditing()" (click)="savedViewsToggle.emit()"><i class="pi pi-bookmark text-[13px]"></i></button>

          <div class="h-5 w-px bg-[var(--border-secondary)] mx-1"></div>

          <!-- Pagination Mode -->
          <div class="relative">
            <button type="button" class="apex-tb-btn" title="Pagination Mode" [disabled]="isEditing()" (click)="toggleMenu('pagination', $event)">
              <i class="pi pi-list text-[13px]"></i>
            </button>
            @if (activeMenu() === 'pagination') {
              <div class="apex-tb-dropdown">
                <button type="button" class="apex-tb-dropdown-item" [class.text-[var(--accent-primary)]]="paginationMode() === 'pages'" (click)="paginationModeChange.emit('pages'); activeMenu.set(null)">
                  <i class="pi pi-file text-[11px] w-4"></i> Pages
                  @if (paginationMode() === 'pages') { <i class="pi pi-check text-[10px] ml-auto"></i> }
                </button>
                <button type="button" class="apex-tb-dropdown-item" [class.text-[var(--accent-primary)]]="paginationMode() === 'infinite'" (click)="paginationModeChange.emit('infinite'); activeMenu.set(null)">
                  <i class="pi pi-sort-amount-down text-[11px] w-4"></i> Infinite Scroll
                  @if (paginationMode() === 'infinite') { <i class="pi pi-check text-[10px] ml-auto"></i> }
                </button>
              </div>
            }
          </div>

          <!-- Export -->
          @if (enableExport()) {
            <div class="relative">
              <button type="button" class="apex-tb-btn" title="Export" [disabled]="isEditing()" (click)="toggleMenu('export', $event)">
                <i class="pi pi-download text-[13px]"></i>
              </button>
              @if (activeMenu() === 'export') {
                <div class="apex-tb-dropdown">
                  <button class="apex-tb-dropdown-item" (click)="exportAs.emit('csv'); activeMenu.set(null)"><i class="pi pi-file-excel text-[var(--color-success)] w-4"></i> Export CSV</button>
                  <button class="apex-tb-dropdown-item" (click)="exportAs.emit('json'); activeMenu.set(null)"><i class="pi pi-code text-[var(--color-info)] w-4"></i> Export JSON</button>
                  <button class="apex-tb-dropdown-item" (click)="exportAs.emit('xlsx'); activeMenu.set(null)"><i class="pi pi-file text-[var(--accent-primary)] w-4"></i> Export Excel</button>
                </div>
              }
            </div>
          }

          <button type="button" class="apex-tb-btn" title="Refresh" [disabled]="isEditing()" (click)="refresh.emit()">
            <i class="pi pi-refresh text-[13px]" [class.animate-spin]="loading()"></i>
          </button>

          @if (enableAdd()) {
            <div class="h-5 w-px bg-[var(--border-secondary)] mx-1"></div>
            <button type="button"
                    class="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-on-accent)] text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] rounded-[var(--ui-border-radius-sm)] shadow-[var(--shadow-sm)] transition-[var(--transition-fast)] disabled:opacity-50 disabled:cursor-not-allowed outline-none"
                    [disabled]="isEditing()"
                    (click)="addRow.emit()">
              <i class="pi pi-plus text-[10px]"></i> Add
            </button>
          }
        </div>
      </div>

      <!-- OVERLAYS: BULK EDIT & SELECTION BANNER -->
      @if (editingCount() > 0) {
        <div class="absolute inset-0 z-30 flex items-center justify-between px-5 bg-[var(--bg-secondary)] backdrop-blur-md border-b border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] animate-[apex-slide-down_0.2s_ease-out]">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 px-3 py-1 bg-[var(--color-warning)] text-[var(--text-on-warning)] rounded-[var(--ui-border-radius-pill)] text-[length:var(--font-size-xs)] font-[var(--font-weight-bold)] shadow-sm">
              <i class="pi pi-pencil text-[11px]"></i>
              Editing {{ editingCount() }} records
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" class="text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline-offset-2 hover:underline outline-none" (click)="cancelEdits.emit()">
              Cancel Edits
            </button>
            <button type="button" class="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--color-success)] hover:opacity-90 text-[var(--text-on-success)] text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] rounded-[var(--ui-border-radius-sm)] shadow-[var(--shadow-sm)] transition-[var(--transition-fast)] outline-none" (click)="saveEdits.emit()">
              <i class="pi pi-check text-[10px]"></i> Save All
            </button>
          </div>
        </div>
      } @else if (selectedCount() > 0) {
        <div class="absolute inset-0 z-30 flex items-center justify-between px-5 bg-[var(--selection-bg)] backdrop-blur-md border-b border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] animate-[apex-slide-down_0.2s_ease-out]">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 px-3 py-1 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-[var(--ui-border-radius-pill)] text-[length:var(--font-size-xs)] font-[var(--font-weight-bold)] shadow-sm">
              <i class="pi pi-check-circle text-[11px]"></i>
              {{ selectedCount() }} Selected
            </div>
            <button type="button" class="text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline-offset-2 hover:underline outline-none" (click)="clearSelection.emit()">
              Clear Selection
            </button>
          </div>
          <div class="flex items-center gap-2">
            <!-- Edit Multiple Button -->
            <button type="button"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] rounded-[var(--ui-border-radius-sm)] border border-[var(--border-secondary)] text-[var(--text-primary)] hover:bg-[var(--component-bg-hover)] hover:border-[var(--border-primary)] transition-[var(--transition-fast)] outline-none shadow-sm bg-[var(--bg-primary)]"
                    (click)="startBulkEdit.emit()">
              <i class="pi pi-pencil text-[11px]"></i> Edit Selected
            </button>
            
            @for (action of bulkActions(); track action.id) {
              <button type="button"
                      [disabled]="isEditing()"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] rounded-[var(--ui-border-radius-sm)] border transition-[var(--transition-fast)] outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm bg-[var(--bg-primary)]"
                      [class]="action.variant === 'danger' ? 'text-[var(--color-error)] border-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]' : 'text-[var(--text-primary)] border-[var(--border-secondary)] hover:bg-[var(--component-bg-hover)] hover:border-[var(--border-primary)]'"
                      (click)="bulkAction.emit(action.id)">
                <i [class]="action.icon + ' text-[11px]'"></i> {{ action.label }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .apex-tb-btn {
      width: 30px;
      height: 30px;
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
      
      &:hover:not(:disabled) {
        background: var(--component-bg-hover);
        color: var(--text-primary);
        border-color: var(--border-secondary);
      }
      
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .apex-tb-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      width: 160px;
      padding: 4px;
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      box-shadow: var(--elevation-2);
      z-index: 100;
      animation: apex-pop-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .apex-tb-dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      background: transparent;
      border: none;
      border-radius: var(--ui-border-radius-sm);
      cursor: pointer;
      text-align: left;
      transition: var(--transition-fast);
      
      &:hover { background: var(--component-bg-hover); }
    }

    @keyframes apex-slide-down {
      from { opacity: 0; transform: translateY(-10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes apex-pop-in {
      from { opacity: 0; transform: scale(0.96) translateY(-4px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class GridToolbarComponent {
  searchQuery = input<string>('');
  selectedCount = input<number>(0);
  totalCount = input<number>(0);
  filteredCount = input<number>(0);
  loading = input<boolean>(false);
  filterActive = input<boolean>(false);
  activeFilterCount = input<number>(0);
  density = input<GridDensity>('compact');
  enableAdd = input<boolean>(true);
  enableExport = input<boolean>(true);
  bulkActions = input<GridBulkAction[]>([]);
  isEditing = input<boolean>(false);
  editingCount = input<number>(0); // NEW: To toggle Bulk Edit Banner
  paginationMode = input<'pages' | 'infinite'>('pages');

  searchChange = output<string>();
  filterToggle = output<void>();
  refresh = output<void>();
  addRow = output<void>();
  densityChange = output<GridDensity>();
  exportAs = output<'csv' | 'json' | 'xlsx'>();
  columnManagerToggle = output<void>();
  savedViewsToggle = output<void>();
  clearSelection = output<void>();
  bulkAction = output<string>();
  paginationModeChange = output<'pages' | 'infinite'>();

  startBulkEdit = output<void>();
  saveEdits = output<void>();
  cancelEdits = output<void>();
  clearFilters = output<void>(); // NEW — triggers clearAllFilters() in DataGrid

  // Filter chips inputs (data flows down from DataGrid via template projection)
  filterChips = input<GridFilterChip[]>([]);
  hasActiveFilters = input<boolean>(false);

  activeMenu = signal<'density' | 'export' | 'pagination' | null>(null);

  densityOptions: { value: GridDensity; label: string; icon: string }[] = [
    { value: 'compact', label: 'Compact', icon: 'pi pi-list' },
    { value: 'normal', label: 'Normal', icon: 'pi pi-bars' },
    { value: 'comfortable', label: 'Comfortable', icon: 'pi pi-align-justify' },
  ];

  toggleMenu(menu: 'density' | 'export' | 'pagination', event: MouseEvent) {
    event.stopPropagation();
    this.activeMenu.set(this.activeMenu() === menu ? null : menu);
  }

  @HostListener('document:click')
  closeMenus() {
    this.activeMenu.set(null);
  }
}


