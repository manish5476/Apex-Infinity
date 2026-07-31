import {
  Component, ChangeDetectionStrategy, input, output,
  signal, computed, HostListener
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GridSavedView, GridDensity, GridSortState, GridFilterState } from '../grid-types';

/**
 * Component: app-grid-saved-views
 * Popover panel for managing saved view presets.
 * Views persist column visibility, sort, filter, density.
 */
@Component({
  selector: 'app-grid-saved-views',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    style: 'position: absolute; top: 44px; right: 8px; z-index: 500;',
  },
  template: `
    <div class="w-72 bg-[var(--bg-primary)] border border-[var(--border-secondary)]
                rounded-[var(--ui-border-radius)] shadow-[var(--elevation-3)] overflow-hidden"
         (click)="$event.stopPropagation()">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)]">
        <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)]
                     text-[var(--text-primary)] flex items-center gap-2">
          <i class="pi pi-bookmark text-[var(--accent-primary)] text-xs"></i>
          Saved Views
        </span>
        <button type="button" (click)="close.emit()"
                class="w-6 h-6 flex items-center justify-center rounded
                       text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] outline-none">
          <i class="pi pi-times text-xs"></i>
        </button>
      </div>

      <!-- Built-in + user views list -->
      <div class="max-h-60 overflow-y-auto py-1">
        @for (view of views(); track view.id) {
          <div class="flex items-center gap-2 px-3 py-2 cursor-pointer group
                      hover:bg-[var(--component-bg-hover)] transition-[var(--transition-fast)]"
               [class.bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)]]="activeViewId() === view.id"
               (click)="applyView.emit(view)">

            <i [class]="(view.icon ?? 'pi pi-table') + ' text-xs text-[var(--text-tertiary)]'"></i>

            <span class="flex-1 text-[length:var(--font-size-xs)] text-[var(--text-primary)]
                         font-[var(--font-weight-medium)] truncate">
              {{ view.name }}
            </span>

            @if (view.isDefault) {
              <span class="text-[9px] font-medium text-[var(--accent-primary)]">DEFAULT</span>
            }

            @if (activeViewId() === view.id) {
              <i class="pi pi-check text-[10px] text-[var(--accent-primary)]"></i>
            }

            @if (!view.isBuiltIn) {
              <button type="button"
                      class="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center
                             rounded text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]
                             transition-[var(--transition-fast)] outline-none"
                      (click)="$event.stopPropagation(); deleteView.emit(view.id)">
                <i class="pi pi-times text-[10px]"></i>
              </button>
            }
          </div>
        }

        @if (views().length === 0) {
          <p class="px-4 py-3 text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] text-center">
            No saved views yet
          </p>
        }
      </div>

      <!-- Save current view -->
      <div class="px-3 py-3 border-t border-[var(--border-secondary)]">
        @if (!showSaveForm()) {
          <button type="button"
                  class="w-full flex items-center justify-center gap-2 py-2
                         text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]
                         text-[var(--accent-primary)] border border-dashed border-[var(--accent-primary)]
                         rounded-[var(--ui-border-radius-sm)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_6%,transparent)]
                         transition-[var(--transition-fast)] outline-none"
                  (click)="showSaveForm.set(true)">
            <i class="pi pi-plus text-xs"></i>
            Save Current View
          </button>
        } @else {
          <div class="flex gap-2">
            <input type="text" placeholder="View name…"
                   class="flex-1 px-2 py-1.5 text-[length:var(--font-size-xs)]
                          bg-[var(--bg-secondary)] border border-[var(--border-secondary)]
                          rounded-[var(--ui-border-radius-sm)] text-[var(--text-primary)]
                          outline-none focus:border-[var(--accent-primary)]"
                   [(ngModel)]="newViewName"
                   (keydown.enter)="onSave()"
                   (keydown.escape)="showSaveForm.set(false)">
            <button type="button"
                    class="px-3 py-1.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)]
                           text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]
                           rounded-[var(--ui-border-radius-sm)] outline-none
                           hover:bg-[var(--accent-hover)] transition-[var(--transition-fast)]"
                    (click)="onSave()">
              Save
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class GridSavedViewsComponent {
  views       = input<GridSavedView[]>([]);
  activeViewId = input<string | null>(null);

  applyView  = output<GridSavedView>();
  saveView   = output<string>(); // emits the view name
  deleteView = output<string>(); // emits the view id
  close      = output<void>();

  protected showSaveForm = signal(false);
  protected newViewName  = '';

  protected onSave(): void {
    const name = this.newViewName.trim();
    if (!name) return;
    this.saveView.emit(name);
    this.newViewName = '';
    this.showSaveForm.set(false);
    this.close.emit();
  }

  @HostListener('document:click')
  onDocClick(): void { this.close.emit(); }
}
