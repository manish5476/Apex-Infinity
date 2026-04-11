import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DialogService } from 'primeng/dynamicdialog';
import { TooltipModule } from 'primeng/tooltip';
import { PermissionService } from '@core/auth/services/permission.service';
import { Permission } from '@core/auth/permissions.constants';
import { DynamicDetailTableComponent } from '../AgGrid/AgGridcomponents/DynamicDetailCard/DynamicDetailCardComponent';

/* --------------------------------------------------
   ACTION CONFIG CONTRACT
   Fully drives which buttons appear per grid column.
--------------------------------------------------- */
export interface GridActionConfig {
  /** Show the expand/view-details button */
  showView?: boolean;
  /** Show the edit button (and save/cancel during edit mode) */
  showEdit?: boolean;
  /** Show the delete button */
  showDelete?: boolean;
  /** Show the return button */
  showReturn?: boolean;

  /** Optional RBAC guards — omit to always show */
  viewPermission?: Permission;
  editPermission?: Permission;
  deletePermission?: Permission;
  returnPermission?: Permission;


  /**
   * Callback fired for every action.
   * action: 'view' | 'edit' | 'save' | 'cancel' | 'delete'
   */
  actionHandler: (action: GridAction, data: any) => void;

  /**
   * Injected by AgShareGrid so this renderer knows which row
   * is currently being edited. Returns true if this row is editing.
   */
  isRowEditing: (id: string | number) => boolean;
}

export type GridAction = 'view' | 'edit' | 'save' | 'cancel' | 'delete' | 'return';

/* --------------------------------------------------
   PARAMS INTERFACE
--------------------------------------------------- */
interface UnifiedActionParams extends ICellRendererParams {
  actionConfig: GridActionConfig;
}

/* --------------------------------------------------
   COMPONENT
--------------------------------------------------- */
@Component({
  selector: 'app-unified-action-renderer',
  standalone: true,
  imports: [TooltipModule],
  providers: [DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="action-cell">

      <!-- ── VIEW-ONLY STATE ────────────────────────── -->
      @if (!isEditing) {

        <!-- View / Expand -->
        @if (cfg.showView && canDo('view')) {
          <button
            class="act-btn view"
            (click)="onAction('view', $event)"
            pTooltip="View Details"
            tooltipPosition="top"
            [showDelay]="300"
            aria-label="View details"
          >
            <i class="pi pi-expand"></i>
          </button>
        }

        <!-- Edit -->
        @if (cfg.showEdit && canDo('edit')) {
          <button
            class="act-btn edit"
            (click)="onAction('edit', $event)"
            pTooltip="Edit Row"
            tooltipPosition="top"
            [showDelay]="300"
            aria-label="Edit row"
          >
            <i class="pi pi-pencil"></i>
          </button>
        }

        <!-- Delete -->
        @if (cfg.showDelete && canDo('delete')) {
          <button
            class="act-btn delete"
            (click)="onAction('delete', $event)"
            pTooltip="Delete Row"
            tooltipPosition="top"
            [showDelay]="300"
            aria-label="Delete row"
          >
            <i class="pi pi-trash"></i>
          </button>
        }

        <!-- Return -->
        @if (cfg.showReturn && canDo('return')) {
          <button
            class="act-btn return"
            (click)="onAction('return', $event)"
            pTooltip="Return Items"
            tooltipPosition="top"
            [showDelay]="300"
            aria-label="Return items"
          >
            <i class="pi pi-replay"></i>
          </button>
        }
      }


      <!-- ── EDITING STATE ──────────────────────────── -->
      @if (isEditing) {

        <!-- Save -->
        @if (cfg.showEdit && canDo('edit')) {
          <button
            class="act-btn save"
            (click)="onAction('save', $event)"
            pTooltip="Save Changes"
            tooltipPosition="top"
            [showDelay]="300"
            aria-label="Save changes"
          >
            <i class="pi pi-check"></i>
          </button>
        }

        <!-- Cancel -->
        @if (cfg.showEdit && canDo('edit')) {
          <button
            class="act-btn cancel"
            (click)="onAction('cancel', $event)"
            pTooltip="Cancel Edit"
            tooltipPosition="top"
            [showDelay]="300"
            aria-label="Cancel edit"
          >
            <i class="pi pi-times"></i>
          </button>
        }
      }

    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .action-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 100%;
    }

    /* ── BASE BUTTON ── */
    .act-btn {
      width: 28px;
      height: 28px;
      border-radius: var(--ui-border-radius, 6px);
      border: 1px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease,
                  border-color 0.15s ease, transform 0.12s ease,
                  box-shadow 0.15s ease;
      background: transparent;
      color: var(--theme-text-tertiary);
      line-height: 1;

      i { font-size: 0.78rem; }

      &:focus-visible {
        outline: 2px solid var(--theme-accent-primary);
        outline-offset: 2px;
      }

      &:active { transform: scale(0.92); }
    }

    /* ── VARIANTS ── */
    .act-btn.view {
      &:hover {
        background: rgba(var(--accent-primary-rgb, 59 130 246), 0.1);
        color: var(--theme-accent-primary);
        border-color: rgba(var(--accent-primary-rgb, 59 130 246), 0.25);
        box-shadow: 0 2px 6px rgba(var(--accent-primary-rgb, 59 130 246), 0.15);
      }
    }

    .act-btn.edit {
      &:hover {
        background: rgba(234, 179, 8, 0.1);
        color: #ca8a04;
        border-color: rgba(234, 179, 8, 0.3);
        box-shadow: 0 2px 6px rgba(234, 179, 8, 0.15);
      }
    }

    .act-btn.delete {
      &:hover {
        background: rgba(239, 68, 68, 0.1);
        color: var(--color-error, #ef4444);
        border-color: rgba(239, 68, 68, 0.3);
        box-shadow: 0 2px 6px rgba(239, 68, 68, 0.15);
      }
    }

    .act-btn.return {
      &:hover {
        background: rgba(var(--primary-rgb), 0.1);
        color: var(--primary-color);
        border-color: rgba(var(--primary-rgb), 0.3);
        box-shadow: 0 2px 6px rgba(var(--primary-rgb), 0.15);
      }
    }


    .act-btn.save {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
      border-color: rgba(34, 197, 94, 0.25);

      &:hover {
        background: rgba(34, 197, 94, 0.2);
        box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);
        transform: translateY(-1px);
      }
    }

    .act-btn.cancel {
      background: rgba(var(--border-primary-rgb, 148 163 184), 0.1);
      color: var(--theme-text-secondary);
      border-color: var(--theme-border-primary);

      &:hover {
        background: rgba(148, 163, 184, 0.2);
        transform: translateY(-1px);
      }
    }
  `]
})
export class UnifiedActionRenderer implements ICellRendererAngularComp {
  params!: UnifiedActionParams;
  cfg!: GridActionConfig;
  isEditing = false;

  private readonly permSvc = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogService = inject(DialogService);

  agInit(params: UnifiedActionParams): void {
    this.params = params;
    this.cfg = params.actionConfig;
    this.syncEditState();
  }

  refresh(params: UnifiedActionParams): boolean {
    this.params = params;
    this.cfg = params.actionConfig;
    this.syncEditState();
    this.cdr.markForCheck();
    return true;
  }

  /* ── PERMISSION GUARD ────────────────────────────── */
  canDo(action: GridAction): boolean {
    const permMap: Partial<Record<GridAction, Permission | undefined>> = {
      view: this.cfg.viewPermission,
      edit: this.cfg.editPermission,
      delete: this.cfg.deletePermission,
      return: this.cfg.returnPermission,
    };

    const perm = permMap[action];
    if (!perm) return true; // no guard → always show
    return this.permSvc.hasPermission(perm);
  }

  /* ── ACTION DISPATCH ─────────────────────────────── */
  onAction(action: GridAction, event: MouseEvent): void {
    event.stopPropagation();

    if (action === 'view') {
      this.openDetailDialog();
      return;
    }

    this.cfg.actionHandler(action, this.params.data);
  }

  /* ── DETAIL DIALOG ───────────────────────────────── */
  private openDetailDialog(): void {
    this.dialogService.open(DynamicDetailTableComponent, {
      data: this.params.data,
      header: 'Record Details',
      width: '85%',
      height: '80%',
      maximizable: true,
      closeOnEscape: true,
      dismissableMask: true,
      baseZIndex: 10000,
      styleClass: 'dynamic-detail-dialog',
      contentStyle: {
        padding: '0',
        overflow: 'hidden',
        'border-radius': '0 0 8px 8px',
      },
    });
  }

  /* ── SYNC EDIT STATE ─────────────────────────────── */
  private syncEditState(): void {
    const id = this.params.data?._id ?? this.params.data?.id;
    this.isEditing = !!this.cfg?.isRowEditing?.(id);
  }
}