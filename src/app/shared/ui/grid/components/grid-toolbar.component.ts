import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { GridBulkAction, GridDensity } from '../grid-types';

/**
 * Component: app-grid-toolbar
 * Integrated smart toolbar with three zones:
 *  LEFT  — search input + filter toggle + record count
 *  CENTER — selection banner (appears when rows selected)
 *  RIGHT  — density • column manager • saved views • export • refresh • add
 *
 * The toolbar automatically adapts its right-side actions to selection context.
 */
@Component({
  selector: 'app-grid-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 mb-3">

      <!-- Main Toolbar Row -->
      <div class="flex items-center justify-between gap-3">

        <!-- LEFT: Search + Filter toggle + Record count -->
        <div class="flex items-center gap-2">

          <!-- Search pill -->
          <div class="flex items-center gap-2 px-3 py-1.5
                      bg-[var(--bg-primary)] border border-transparent
                      rounded-[var(--ui-border-radius-pill)]
                      shadow-[var(--shadow-sm)]
                      focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)]
                      transition-[var(--transition-fast)] min-w-[180px]">
            <i class="pi pi-search text-[10px] text-[var(--text-tertiary)] shrink-0"></i>
            <input
              type="text"
              placeholder="Search all columns…"
              class="flex-1 bg-transparent border-none outline-none
                     text-[length:var(--font-size-xs)] text-[var(--text-primary)]
                     placeholder:text-[var(--text-tertiary)] min-w-0 w-40"
              [value]="searchQuery()"
              (input)="searchChange.emit($any($event.target).value)"
              (keydown.escape)="searchChange.emit('')">
            @if (searchQuery()) {
              <button type="button"
                      class="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] outline-none"
                      (click)="searchChange.emit('')">
                <i class="pi pi-times text-[10px]"></i>
              </button>
            }
          </div>

          <!-- Filter toggle -->
          <button type="button"
                  class="flex items-center gap-1.5 px-3 py-1.5
                         rounded-[var(--ui-border-radius-pill)] text-[length:var(--font-size-xs)]
                         font-[var(--font-weight-medium)] border border-transparent transition-[var(--transition-fast)] outline-none shadow-[var(--shadow-sm)]"
                  [class]="filterActive()
                    ? 'bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)]'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'"
                  (click)="filterToggle.emit()">
            <i class="pi text-[10px]"
               [class.pi-filter-fill]="filterActive()"
               [class.pi-filter]="!filterActive()"></i>
            Filter
            @if (activeFilterCount() > 0) {
              <span class="min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold
                           bg-[var(--accent-primary)] text-[var(--text-on-accent)]
                           flex items-center justify-center">
                {{ activeFilterCount() }}
              </span>
            }
          </button>

          <!-- Record count badge -->
          @if (totalCount() > 0) {
            <span class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)]">
              <span class="font-[var(--font-weight-semibold)] text-[var(--text-primary)]">
                {{ filteredCount() !== totalCount() ? filteredCount() + ' of ' + totalCount() : totalCount() }}
              </span>
              {{ totalCount() === 1 ? 'record' : 'records' }}
            </span>
          }
        </div>

        <!-- RIGHT: Actions Toolbar -->
        <div class="flex items-center gap-1">

          <!-- Projected slot for custom actions -->
          <ng-content select="[grid-actions]"></ng-content>

          <!-- Divider -->
          <div class="w-px h-5 bg-[var(--border-secondary)] mx-1"></div>

          <!-- Density picker -->
          <div class="relative group">
            <button type="button"
                    class="apex-tb-btn"
                    title="Density"
                    (click)="showDensityMenu.set(!showDensityMenu())">
              <i class="pi pi-bars text-xs"></i>
            </button>
            @if (showDensityMenu()) {
              <div class="absolute right-0 top-9 z-50 w-36 py-1
                          bg-[var(--bg-primary)] border border-[var(--border-secondary)]
                          rounded-[var(--ui-border-radius)] shadow-[var(--elevation-2)]"
                   (click)="$event.stopPropagation()">
                @for (d of densityOptions; track d.value) {
                  <button type="button"
                          class="flex items-center gap-2 w-full px-3 py-1.5 text-[length:var(--font-size-xs)]
                                 font-[var(--font-weight-medium)] text-[var(--text-primary)]
                                 hover:bg-[var(--component-bg-hover)] transition-[var(--transition-fast)] outline-none"
                          [class.text-[var(--accent-primary)]]="density() === d.value"
                          (click)="densityChange.emit(d.value); showDensityMenu.set(false)">
                    <i [class]="d.icon + ' text-xs'"></i>
                    {{ d.label }}
                    @if (density() === d.value) {
                      <i class="pi pi-check text-[10px] ml-auto text-[var(--accent-primary)]"></i>
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Column Manager toggle -->
          <button type="button" class="apex-tb-btn" title="Manage Columns"
                  (click)="columnManagerToggle.emit()">
            <i class="pi pi-table text-xs"></i>
          </button>

          <!-- Saved Views toggle -->
          <button type="button" class="apex-tb-btn" title="Saved Views"
                  (click)="savedViewsToggle.emit()">
            <i class="pi pi-bookmark text-xs"></i>
          </button>

          <!-- Divider -->
          <div class="w-px h-5 bg-[var(--border-secondary)] mx-1"></div>

          <!-- Export -->
          @if (enableExport()) {
            <div class="relative">
              <button type="button" class="apex-tb-btn" title="Export"
                      (click)="showExportMenu.set(!showExportMenu())">
                <i class="pi pi-download text-xs"></i>
              </button>
              @if (showExportMenu()) {
                <div class="absolute right-0 top-9 z-50 w-40 py-1
                            bg-[var(--bg-primary)] border border-[var(--border-secondary)]
                            rounded-[var(--ui-border-radius)] shadow-[var(--elevation-2)]"
                     (click)="$event.stopPropagation()">
                  <button class="apex-export-item" (click)="exportAs.emit('csv'); showExportMenu.set(false)">
                    <i class="pi pi-file-excel text-xs text-[var(--color-success)]"></i> Export CSV
                  </button>
                  <button class="apex-export-item" (click)="exportAs.emit('json'); showExportMenu.set(false)">
                    <i class="pi pi-code text-xs text-[var(--color-info)]"></i> Export JSON
                  </button>
                  <button class="apex-export-item" (click)="exportAs.emit('xlsx'); showExportMenu.set(false)">
                    <i class="pi pi-file text-xs text-[var(--accent-primary)]"></i> Export Excel
                  </button>
                </div>
              }
            </div>
          }

          <!-- Refresh -->
          <button type="button" class="apex-tb-btn" title="Refresh"
                  [class.animate-spin]="loading()"
                  (click)="refresh.emit()">
            <i class="pi pi-refresh text-xs"></i>
          </button>

          <!-- Add New -->
          @if (enableAdd()) {
            <button type="button"
                    class="flex items-center gap-1.5 px-3 py-1.5
                           bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]
                           text-[var(--text-on-accent)] text-[length:var(--font-size-xs)]
                           font-[var(--font-weight-semibold)] rounded-[var(--ui-border-radius-pill)]
                           shadow-[var(--shadow-sm)] transition-[var(--transition-fast)] outline-none"
                    (click)="addRow.emit()">
              <i class="pi pi-plus text-[10px]"></i>
              Add
            </button>
          }
        </div>
      </div>

      <!-- SELECTION BANNER (slides in when rows are selected) -->
      @if (selectedCount() > 0) {
        <div class="flex items-center justify-between gap-3 px-4 py-2
                    bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)]
                    border border-[color-mix(in_srgb,var(--accent-primary)_25%,transparent)]
                    rounded-[var(--ui-border-radius)]
                    animate-[apex-slide-down_0.15s_ease]">

          <!-- Count chip + deselect -->
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        bg-[var(--accent-primary)] text-[var(--text-on-accent)]
                        text-[10px] font-bold">
              <i class="pi pi-check text-[9px]"></i>
              {{ selectedCount() }} selected
            </div>
            <button type="button"
                    class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)]
                           hover:text-[var(--text-primary)] underline outline-none"
                    (click)="clearSelection.emit()">
              Clear
            </button>
          </div>

          <!-- Bulk actions -->
          <div class="flex items-center gap-1">
            @for (action of bulkActions(); track action.id) {
              <button type="button"
                      class="flex items-center gap-1.5 px-3 py-1.5
                             text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]
                             rounded-[var(--ui-border-radius-sm)] border transition-[var(--transition-fast)] outline-none"
                      [class]="action.variant === 'danger'
                        ? 'text-[var(--color-error)] border-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)]'
                        : action.variant === 'primary'
                          ? 'text-[var(--text-on-accent)] bg-[var(--accent-primary)] border-[var(--accent-primary)] hover:bg-[var(--accent-hover)]'
                          : 'text-[var(--text-secondary)] border-[var(--border-secondary)] hover:bg-[var(--component-bg-hover)]'"
                      (click)="bulkAction.emit(action.id)">
                <i [class]="action.icon + ' text-xs'"></i>
                {{ action.label }}
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
      border: none;
      cursor: pointer;
      transition: var(--transition-fast);
      outline: none;
    }
    .apex-tb-btn:hover {
      background: var(--component-bg-hover);
      color: var(--text-primary);
    }
    .apex-export-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 12px;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      background: none;
      border: none;
      cursor: pointer;
      outline: none;
      transition: var(--transition-fast);
    }
    .apex-export-item:hover { background: var(--component-bg-hover); }
    @keyframes apex-slide-down {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class GridToolbarComponent {
  searchQuery      = input<string>('');
  selectedCount    = input<number>(0);
  totalCount       = input<number>(0);
  filteredCount    = input<number>(0);
  loading          = input<boolean>(false);
  filterActive     = input<boolean>(false);
  activeFilterCount = input<number>(0);
  density          = input<GridDensity>('compact');
  enableAdd        = input<boolean>(true);
  enableExport     = input<boolean>(true);
  bulkActions      = input<GridBulkAction[]>([]);

  searchChange        = output<string>();
  filterToggle        = output<void>();
  refresh             = output<void>();
  addRow              = output<void>();
  densityChange       = output<GridDensity>();
  exportAs            = output<'csv' | 'json' | 'xlsx'>();
  columnManagerToggle = output<void>();
  savedViewsToggle    = output<void>();
  clearSelection      = output<void>();
  bulkAction          = output<string>();

  protected showDensityMenu = signal(false);
  protected showExportMenu  = signal(false);

  protected densityOptions: { value: GridDensity; label: string; icon: string }[] = [
    { value: 'compact',     label: 'Compact',     icon: 'pi pi-minus' },
    { value: 'normal',      label: 'Normal',       icon: 'pi pi-bars' },
    { value: 'comfortable', label: 'Comfortable',  icon: 'pi pi-align-justify' },
  ];
}