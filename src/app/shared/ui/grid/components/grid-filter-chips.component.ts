import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GridFilterChip {
  label: string;
  field: string;
  value: string;
}

/**
 * GridFilterChipsComponent — Phase A
 *
 * Standalone display component for active filter + search chips.
 * Owns no state — everything is driven by inputs.
 * Projected into the toolbar via <ng-content select="[chips]">.
 *
 * Emits:
 *   removeChip(field)  ? remove one filter chip
 *   clearSearch()      ? clear the search chip
 *   clearAll()         ? clear all filters + search
 */
@Component({
  selector: 'app-grid-filter-chips',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show() && (chips().length > 0 || hasSearch())) {
      <div class="flex items-center gap-1.5 flex-wrap py-0.5">

        @if (hasSearch()) {
          <div class="apex-filter-chip apex-filter-chip--search">
            <i class="pi pi-search text-[9px] opacity-70"></i>
            <span class="max-w-[120px] truncate">{{ searchQuery() }}</span>
            <button
              type="button"
              class="apex-chip-remove"
              title="Clear search"
              (click)="clearSearch.emit()">
              <i class="pi pi-times text-[8px]"></i>
            </button>
          </div>
        }

        @for (chip of chips(); track chip.field) {
          <div class="apex-filter-chip">
            <span class="max-w-[140px] truncate" [title]="chip.label">{{ chip.label }}</span>
            <button
              type="button"
              class="apex-chip-remove"
              [title]="'Remove ' + chip.field + ' filter'"
              (click)="removeChip.emit(chip.field)">
              <i class="pi pi-times text-[8px]"></i>
            </button>
          </div>
        }

        @if (showClearAll() && (chips().length > 0 || hasSearch())) {
          <button
            type="button"
            class="apex-chip-clear-all"
            title="Clear all filters and search"
            (click)="clearAll.emit()">
            Clear all
          </button>
        }

      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .apex-filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px 2px 8px;
      border-radius: var(--ui-border-radius-pill);
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent);
      color: var(--accent-primary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      max-width: 220px;
      animation: apex-chip-appear 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      transition: background 0.1s, border-color 0.1s;

      &:hover {
        background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
      }
    }

    .apex-filter-chip--search {
      background: color-mix(in srgb, var(--text-secondary) 8%, transparent);
      border-color: var(--border-secondary);
      color: var(--text-secondary);

      &:hover {
        background: color-mix(in srgb, var(--text-secondary) 13%, transparent);
      }
    }

    .apex-chip-remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      color: inherit;
      opacity: 0.6;
      transition: opacity 0.1s, background 0.1s;
      padding: 0;
      flex-shrink: 0;

      &:hover {
        opacity: 1;
        background: color-mix(in srgb, currentColor 15%, transparent);
      }

      &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--accent-focus);
      }
    }

    .apex-chip-clear-all {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: var(--ui-border-radius-sm);
      text-decoration: underline;
      text-underline-offset: 2px;
      transition: color 0.1s;

      &:hover { color: var(--text-primary); }
      &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--accent-focus);
      }
    }

    @keyframes apex-chip-appear {
      from { opacity: 0; transform: scale(0.80) translateY(2px); }
      to   { opacity: 1; transform: scale(1)    translateY(0); }
    }
  `]
})
export class GridFilterChipsComponent {
  chips        = input<GridFilterChip[]>([]);
  hasSearch    = input<boolean>(false);
  searchQuery  = input<string>('');
  show         = input<boolean>(true);
  showClearAll = input<boolean>(false);

  removeChip  = output<string>();   // emits the field name
  clearSearch = output<void>();
  clearAll    = output<void>();
}
