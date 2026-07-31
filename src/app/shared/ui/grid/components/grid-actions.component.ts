import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { GridRowAction, GridContext } from '../grid-types';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Component: app-grid-actions
 * Sticky right-side action column for each row.
 *
 * View state:  shows 'Edit' icon (appears on row hover via CSS parent)
 * Edit state:  shows 'Save' (success) + 'Cancel' (ghost) inline
 * Additional custom rowActions rendered as icon buttons or collapsed menu
 */
@Component({
  selector: 'app-grid-actions',
  standalone: true,
  imports: [TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center justify-end gap-1 h-full',
  },
  template: `
    @if (isEditing()) {
      <!-- Edit mode: Save + Cancel -->
      <button type="button"
              class="apex-act-btn apex-act-btn--save"
              pTooltip="Save (Enter)" tooltipPosition="top"
              (click)="save.emit()">
        <i class="pi pi-check text-[10px]"></i>
      </button>
      <button type="button"
              class="apex-act-btn apex-act-btn--cancel"
              pTooltip="Cancel (Esc)" tooltipPosition="top"
              (click)="cancel.emit()">
        <i class="pi pi-times text-[10px]"></i>
      </button>
    } @else {
      <!-- View mode: Edit + custom actions -->
      @if (!isEditingAnyRow()) {
        <button type="button"
                class="apex-act-btn apex-act-btn--edit apex-act-btn--reveal"
                pTooltip="Edit row (E)" tooltipPosition="top"
                (click)="edit.emit()">
          <i class="pi pi-pencil text-[10px]"></i>
        </button>

        <!-- Custom row actions (always visible when not editing any) -->
        @for (action of visibleAlwaysActions(); track action.id) {
          <button type="button"
                  class="apex-act-btn apex-act-btn--reveal"
                  [class.apex-act-btn--danger]="action.variant === 'danger'"
                  [class.apex-act-btn--success]="action.variant === 'success'"
                  [pTooltip]="action.tooltip ?? action.label ?? action.id"
                  tooltipPosition="top"
                  (click)="customAction.emit(action)">
            <i [class]="action.icon + ' text-[10px]'"></i>
          </button>
        }

        <!-- Delete (always available when not editing any) -->
        <button type="button"
                class="apex-act-btn apex-act-btn--danger apex-act-btn--reveal"
                pTooltip="Delete row (Del)" tooltipPosition="top"
                (click)="delete.emit()">
          <i class="pi pi-trash text-[10px]"></i>
        </button>
      }
    }
  `,
  styles: [`
    .apex-act-btn {
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: var(--text-tertiary);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: var(--transition-fast);
      outline: none;
    }
    .apex-act-btn:hover {
      background: var(--component-bg-hover);
      color: var(--text-primary);
    }
    /* Only shown on row hover — parent row's :hover triggers this via CSS */
    .apex-act-btn--reveal {
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s ease;
    }
    /* The parent tr:hover will un-hide these via the global apex-dg-row:hover .apex-act-btn--reveal selector */
    .apex-act-btn--edit:hover {
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
      color: var(--accent-primary);
    }
    .apex-act-btn--save {
      background: color-mix(in srgb, var(--color-success) 12%, transparent);
      color: var(--color-success);
      border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
    }
    .apex-act-btn--save:hover {
      background: color-mix(in srgb, var(--color-success) 20%, transparent);
    }
    .apex-act-btn--cancel {
      background: var(--component-bg-hover);
      color: var(--text-secondary);
    }
    .apex-act-btn--cancel:hover {
      color: var(--color-error);
    }
    .apex-act-btn--danger {
      color: var(--color-error);
    }
    .apex-act-btn--danger:hover {
      background: color-mix(in srgb, var(--color-error) 10%, transparent);
    }
    .apex-act-btn--success {
      color: var(--color-success);
    }
  `],
})
export class GridActionsComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row        = input<any>(null);
  rowActions = input<GridRowAction[]>([]);
  isEditing = input<boolean>(false);
  isEditingAnyRow = input<boolean>(false);

  edit         = output<void>();
  save         = output<void>();
  cancel       = output<void>();
  delete       = output<void>();
  duplicate    = output<void>();
  customAction = output<GridRowAction>();

  protected visibleAlwaysActions = computed(() =>
    this.rowActions().filter(a =>
      a.id !== 'edit' && a.id !== 'delete' && a.id !== 'duplicate' &&
      (a.showWhen === 'always' || a.showWhen === undefined)
    )
  );
}
