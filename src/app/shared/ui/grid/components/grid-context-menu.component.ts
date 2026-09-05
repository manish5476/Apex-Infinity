import { Component, ChangeDetectionStrategy, input, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridRowAction } from '../grid-types';

export interface ContextMenuActionEvent {
  id: string;
  row: any;
}

@Component({
  selector: 'app-grid-context-menu',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block fixed z-[1000] origin-top-left',
    '[style.top.px]': 'position().y',
    '[style.left.px]': 'position().x',
  },
  template: `
    <div class="w-48 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius)] shadow-[var(--elevation-3)] overflow-hidden animate-[apex-menu-in_0.1s_ease-out]">

      @if (isEditing()) {
        <button class="apex-ctx-item text-[var(--color-success)]" (click)="emit('save')">
          <i class="pi pi-check text-[11px] w-4"></i> Save Row
        </button>
        <button class="apex-ctx-item text-[var(--text-secondary)]" (click)="emit('cancel')">
          <i class="pi pi-times text-[11px] w-4"></i> Cancel Edit
        </button>
      } @else {
        <button class="apex-ctx-item" (click)="emit('edit')">
          <i class="pi pi-pencil text-[11px] w-4"></i> Edit Row
        </button>
      }

      <button class="apex-ctx-item" (click)="emit('duplicate')">
        <i class="pi pi-copy text-[11px] w-4"></i> Duplicate Row
      </button>

      <div class="h-px bg-[var(--border-secondary)] my-1.5 mx-2"></div>

      <!-- Clipboard -->
      <button class="apex-ctx-item" (click)="emit('copy')">
        <i class="pi pi-clone text-[11px] w-4"></i> Copy Row
        <span class="apex-ctx-kbd">Ctrl+C</span>
      </button>
      <button class="apex-ctx-item" (click)="emit('paste')">
        <i class="pi pi-file-import text-[11px] w-4"></i> Paste Below
        <span class="apex-ctx-kbd">Ctrl+V</span>
      </button>

      <!-- History -->
      <div class="h-px bg-[var(--border-secondary)] my-1.5 mx-2"></div>
      
      <button class="apex-ctx-item" [disabled]="!canUndo()" (click)="emit('undo')">
        <i class="pi pi-undo text-[11px] w-4"></i> Undo
        <span class="apex-ctx-kbd">Ctrl+Z</span>
      </button>
      <button class="apex-ctx-item" [disabled]="!canRedo()" (click)="emit('redo')">
        <i class="pi pi-refresh text-[11px] w-4"></i> Redo
        <span class="apex-ctx-kbd">Ctrl+Y</span>
      </button>

      <!-- Custom Actions -->
      @if (rowActions().length > 0) {
        <div class="h-px bg-[var(--border-secondary)] my-1.5 mx-2"></div>
        @for (action of rowActions(); track action.id) {
          <button class="apex-ctx-item"
                  [class.text-[var(--color-error)]]="action.variant === 'danger'"
                  [class.text-[var(--color-success)]]="action.variant === 'success'"
                  (click)="emitCustom(action)">
            <i [class]="action.icon + ' text-[11px] w-4'"></i>
            {{ action.label ?? action.id }}
          </button>
        }
      }

      <!-- Danger Zone -->
      <div class="h-px bg-[var(--border-secondary)] my-1.5 mx-2"></div>
      <button class="apex-ctx-item text-[var(--color-error)]" (click)="emit('delete')">
        <i class="pi pi-trash text-[11px] w-4"></i> Delete Row
      </button>
      
    </div>
  `,
  styles: [`
    .apex-ctx-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 12px;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: var(--transition-fast);
      outline: none;

      &:hover:not(:disabled) {
        background: var(--component-bg-hover);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .apex-ctx-kbd {
      margin-left: auto;
      font-size: 9px;
      font-family: var(--font-mono);
      color: var(--text-tertiary);
    }

    @keyframes apex-menu-in {
      from { opacity: 0; transform: scale(0.98); }
      to   { opacity: 1; transform: scale(1); }
    }
  `]
})
export class GridContextMenuComponent {
  position = input<{ x: number; y: number }>({ x: 0, y: 0 });
  row = input<any>(null);
  isEditing = input<boolean>(false);
  rowActions = input<GridRowAction[]>([]);
  enableExport = input<boolean>(true);
  canUndo = input<boolean>(false);
  canRedo = input<boolean>(false);

  action = output<ContextMenuActionEvent>();
  close = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void { this.close.emit(); }

  @HostListener('document:click')
  onDocClick(): void { this.close.emit(); }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent): void {
    event.preventDefault(); // Prevent double right-click issues
  }

  protected emit(id: string): void {
    this.action.emit({ id, row: this.row() });
    this.close.emit();
  }

  protected emitCustom(rowAction: GridRowAction): void {
    this.action.emit({ id: rowAction.id, row: this.row() });
    this.close.emit();
  }
}
