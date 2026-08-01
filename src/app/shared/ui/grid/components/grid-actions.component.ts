import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridRowAction } from '../grid-types';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-grid-actions',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center justify-end gap-1 w-full h-full'
  },
  template: `
    @if (isEditing()) {
      <!-- Edit Mode: Save / Cancel -->
      <button type="button" class="apex-row-btn apex-row-btn--save" pTooltip="Save (Enter)" tooltipPosition="top" (click)="save.emit()">
        <i class="pi pi-check"></i>
      </button>
      <button type="button" class="apex-row-btn apex-row-btn--cancel" pTooltip="Cancel (Esc)" tooltipPosition="top" (click)="cancel.emit()">
        <i class="pi pi-times"></i>
      </button>
    } @else {
      <!-- View Mode -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        
        @if (!isEditingAnyRow()) {
          <button type="button" class="apex-row-btn apex-row-btn--primary" pTooltip="Edit Row" tooltipPosition="top" (click)="edit.emit()">
            <i class="pi pi-pencil"></i>
          </button>

          <!-- Custom Actions -->
          @for (action of visibleActions(); track action.id) {
            <button type="button" 
                    class="apex-row-btn"
                    [class.apex-row-btn--danger]="action.variant === 'danger'"
                    [class.apex-row-btn--success]="action.variant === 'success'"
                    [pTooltip]="action.tooltip ?? action.label ?? action.id" 
                    tooltipPosition="top" 
                    (click)="customAction.emit(action)">
              <i [class]="action.icon"></i>
            </button>
          }

          <!-- Delete Action -->
          <button type="button" class="apex-row-btn apex-row-btn--danger" pTooltip="Delete Row" tooltipPosition="top" (click)="delete.emit()">
            <i class="pi pi-trash"></i>
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .apex-row-btn {
      width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ui-border-radius-sm);
      color: var(--text-tertiary);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: var(--transition-fast);
      outline: none;

      i { font-size: 11px; }

      &:hover {
        background: var(--component-bg-hover);
        color: var(--text-primary);
      }

      &:focus-visible {
        box-shadow: 0 0 0 2px var(--accent-focus);
        opacity: 1 !important; /* Ensure visible on keyboard focus */
      }
    }

    .apex-row-btn--primary:hover {
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
      color: var(--accent-primary);
    }

    .apex-row-btn--save {
      background: color-mix(in srgb, var(--color-success) 12%, transparent);
      color: var(--color-success);
      border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
      
      &:hover { background: color-mix(in srgb, var(--color-success) 20%, transparent); }
    }

    .apex-row-btn--cancel:hover {
      background: color-mix(in srgb, var(--color-error) 10%, transparent);
      color: var(--color-error);
    }

    .apex-row-btn--danger:hover {
      background: color-mix(in srgb, var(--color-error) 10%, transparent);
      color: var(--color-error);
    }

    .apex-row-btn--success:hover {
      background: color-mix(in srgb, var(--color-success) 10%, transparent);
      color: var(--color-success);
    }
  `]
})
export class GridActionsComponent {
  row = input<any>(null);
  rowActions = input<GridRowAction[]>([]);
  isEditing = input<boolean>(false);
  isEditingAnyRow = input<boolean>(false);

  edit = output<void>();
  save = output<void>();
  cancel = output<void>();
  delete = output<void>();
  duplicate = output<void>();
  customAction = output<GridRowAction>();

  protected visibleActions = computed(() =>
    this.rowActions().filter(a =>
      a.id !== 'edit' && a.id !== 'delete' && a.id !== 'duplicate' &&
      (a.showWhen === 'always' || a.showWhen === undefined)
    )
  );
}

