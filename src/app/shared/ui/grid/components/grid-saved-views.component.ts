import { Component, ChangeDetectionStrategy, input, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridSavedView } from '../grid-types';

@Component({
  selector: 'app-grid-saved-views',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block absolute right-4 z-[500] origin-top-right',
    style: 'top: 52px;'
  },
  template: `
    <div class="w-[260px] bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius-lg)] shadow-[var(--elevation-3)] overflow-hidden flex flex-col animate-[apex-pop-in_0.15s_ease-out]" (click)="$event.stopPropagation()">
      
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
        <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] flex items-center gap-2">
          <i class="pi pi-bookmark text-[var(--accent-primary)] text-[13px]"></i>
          Saved Views
        </span>
        <button type="button" (click)="close.emit()" class="w-6 h-6 flex items-center justify-center rounded-[var(--ui-border-radius-sm)] text-[var(--text-tertiary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] hover:text-[var(--text-primary)] transition-colors outline-none">
          <i class="pi pi-times text-xs"></i>
        </button>
      </div>

      <!-- Views List -->
      <div class="max-h-[280px] overflow-y-auto p-2 custom-scrollbar">
        @for (view of views(); track view.id) {
          <div class="flex items-center gap-3 px-3 py-2 rounded-[var(--ui-border-radius-sm)] group transition-colors cursor-pointer"
               [class.bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]]="activeViewId() === view.id"
               [class.hover:bg-[var(--component-bg-hover)]]="activeViewId() !== view.id"
               (click)="applyView.emit(view)">

            <i [class]="(view.icon ?? 'pi pi-table') + ' text-[11px]'"
               [class.text-[var(--accent-primary)]]="activeViewId() === view.id"
               [class.text-[var(--text-tertiary)]]="activeViewId() !== view.id"></i>

            <div class="flex flex-col flex-1 min-w-0">
              <span class="text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] truncate"
                    [class.text-[var(--accent-primary)]]="activeViewId() === view.id"
                    [class.text-[var(--text-primary)]]="activeViewId() !== view.id">
                {{ view.name }}
              </span>
              @if (view.isDefault) {
                <span class="text-[9px] font-semibold text-[var(--text-tertiary)]">DEFAULT</span>
              }
            </div>

            @if (!view.isBuiltIn) {
              <button type="button" class="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] text-[var(--color-error)] transition-all outline-none"
                      (click)="$event.stopPropagation(); deleteView.emit(view.id)">
                <i class="pi pi-trash text-[10px]"></i>
              </button>
            }
          </div>
        }

        @if (views().length === 0) {
          <div class="px-4 py-6 text-center text-[length:var(--font-size-xs)] text-[var(--text-tertiary)]">
            No views saved yet.
          </div>
        }
      </div>

      <!-- Save Action -->
      <div class="p-3 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
        @if (!showSaveForm()) {
          <button type="button" class="w-full flex items-center justify-center gap-2 py-2 text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius-sm)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-[var(--transition-fast)] outline-none shadow-sm"
                  (click)="showSaveForm.set(true)">
            <i class="pi pi-plus text-[10px]"></i> Save Current Layout
          </button>
        } @else {
          <div class="flex gap-2">
            <input type="text" placeholder="Name this view..." class="flex-1 px-3 py-1.5 text-[length:var(--font-size-xs)] bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius-sm)] text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)] transition-all"
                   #viewNameInput
                   (keydown.enter)="onSave(viewNameInput.value)"
                   (keydown.escape)="showSaveForm.set(false)"
                   autofocus>
            <button type="button" class="px-3 py-1.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] rounded-[var(--ui-border-radius-sm)] hover:bg-[var(--accent-hover)] transition-[var(--transition-fast)] outline-none shadow-sm"
                    (click)="onSave(viewNameInput.value)">
              Save
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes apex-pop-in {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class GridSavedViewsComponent {
  views = input<GridSavedView[]>([]);
  activeViewId = input<string | null>(null);

  applyView = output<GridSavedView>();
  saveView = output<string>();
  deleteView = output<string>();
  close = output<void>();

  protected showSaveForm = signal(false);

  protected onSave(name: string): void {
    if (!name.trim()) return;
    this.saveView.emit(name.trim());
    this.showSaveForm.set(false);
    this.close.emit();
  }

  @HostListener('document:click')
  onDocClick(): void { this.close.emit(); }
}

