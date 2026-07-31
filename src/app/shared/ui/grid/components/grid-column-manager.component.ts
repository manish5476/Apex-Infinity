import {
  Component, ChangeDetectionStrategy, input, output,
  signal, computed, HostListener
} from '@angular/core';
import { GridColumn } from '../grid-types';

interface ColumnToggle {
  field: string;
  header: string;
  visible: boolean;
  hideable: boolean;
  sticky?: 'left' | 'right' | false;
}

/**
 * Component: app-grid-column-manager
 * Popover panel for toggling column visibility.
 * Persists changes immediately via (visibilityChange) output.
 */
@Component({
  selector: 'app-grid-column-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    style: 'position: absolute; top: 44px; right: 8px; z-index: 500;',
  },
  template: `
    <div class="w-64 bg-[var(--bg-primary)] border border-[var(--border-secondary)]
                rounded-[var(--ui-border-radius)] shadow-[var(--elevation-3)] overflow-hidden"
         (click)="$event.stopPropagation()">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3
                  border-b border-[var(--border-secondary)]">
        <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)]
                     text-[var(--text-primary)] flex items-center gap-2">
          <i class="pi pi-table text-[var(--accent-primary)] text-xs"></i>
          Columns
        </span>
        <div class="flex items-center gap-2">
          <button type="button" (click)="showAll()"
                  class="text-[10px] text-[var(--accent-primary)] hover:underline font-medium outline-none">
            Show all
          </button>
          <button type="button" (click)="close.emit()"
                  class="w-6 h-6 flex items-center justify-center rounded
                         text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] outline-none">
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="px-3 py-2 border-b border-[var(--border-secondary)]">
        <div class="flex items-center gap-2 px-2 py-1 rounded-[var(--ui-border-radius-sm)]
                    bg-[var(--bg-secondary)] border border-[var(--border-secondary)]">
          <i class="pi pi-search text-[10px] text-[var(--text-tertiary)]"></i>
          <input type="text" placeholder="Search columns…"
                 class="flex-1 bg-transparent border-none outline-none
                        text-[length:var(--font-size-xs)] text-[var(--text-primary)]
                        placeholder:text-[var(--text-tertiary)]"
                 (input)="searchQuery.set($any($event.target).value)">
        </div>
      </div>

      <!-- Column List -->
      <div class="max-h-72 overflow-y-auto">
        @for (col of filteredColumns(); track col.field) {
          <label class="flex items-center gap-3 px-4 py-2 cursor-pointer group
                        hover:bg-[var(--component-bg-hover)] transition-[var(--transition-fast)]"
                 [class.opacity-50]="!col.hideable && !col.visible">
            <!-- Toggle -->
            <div class="relative flex items-center justify-center shrink-0">
              <input type="checkbox"
                     class="sr-only peer"
                     [checked]="col.visible"
                     [disabled]="!col.hideable && col.visible"
                     (change)="onToggle(col.field, $any($event.target).checked)">
              <div class="w-8 h-4 rounded-full transition-[var(--transition-fast)] relative
                          peer-checked:bg-[var(--accent-primary)]
                          peer-not-checked:bg-[var(--bg-ternary)]
                          border border-[var(--border-secondary)]">
                <div class="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[var(--transition-fast)]"
                     [class.left-0.5]="!col.visible"
                     [class.left-4]="col.visible"></div>
              </div>
            </div>

            <!-- Column name -->
            <span class="flex-1 text-[length:var(--font-size-xs)] text-[var(--text-primary)]
                         font-[var(--font-weight-medium)] truncate">
              {{ col.header }}
            </span>

            <!-- Sticky indicator -->
            @if (col.sticky) {
              <span class="text-[9px] px-1.5 py-0.5 rounded-full font-medium
                           bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)]
                           text-[var(--accent-primary)]">
                {{ col.sticky }}
              </span>
            }
          </label>
        }
      </div>

      <!-- Footer: stats -->
      <div class="px-4 py-2 border-t border-[var(--border-secondary)]
                  text-[10px] text-[var(--text-tertiary)] flex items-center justify-between">
        <span>{{ visibleCount() }} of {{ toggles().length }} visible</span>
        <button type="button" (click)="reset()"
                class="text-[var(--accent-primary)] hover:underline outline-none font-medium">
          Reset
        </button>
      </div>
    </div>
  `,
})
export class GridColumnManagerComponent {
  columns       = input<GridColumn[]>([]);
  visibleColumns = input<string[]>([]);

  visibilityChange = output<string[]>();
  close            = output<void>();

  protected searchQuery = signal('');

  protected toggles = computed<ColumnToggle[]>(() =>
    this.columns().map(col => ({
      field:    col.field,
      header:   col.header,
      visible:  this.visibleColumns().includes(col.field),
      hideable: col.hideable !== false,
      sticky:   col.sticky,
    }))
  );

  protected filteredColumns = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.toggles().filter(c => !q || c.header.toLowerCase().includes(q));
  });

  protected visibleCount = computed(() => this.toggles().filter(c => c.visible).length);

  protected onToggle(field: string, visible: boolean): void {
    const current = new Set(this.visibleColumns());
    if (visible) current.add(field);
    else current.delete(field);
    this.visibilityChange.emit(Array.from(current));
  }

  protected showAll(): void {
    this.visibilityChange.emit(this.columns().map(c => c.field));
  }

  protected reset(): void {
    const defaults = this.columns()
      .filter(c => c.visible !== false)
      .map(c => c.field);
    this.visibilityChange.emit(defaults);
  }

  @HostListener('document:click')
  onDocClick(): void { this.close.emit(); }
}
