import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';

import { ICellRendererAngularComp } from 'ag-grid-angular';
import { TooltipModule } from 'primeng/tooltip';

/* ==========================================================================
   ACTION BUTTON CELL RENDERER
   
   Reads editing state directly from the parent grid via context.componentParent.
   No props needed — state is always fresh via signal read in refresh().
   ========================================================================== */
@Component({
  selector: 'app-shared-action-btn',
  standalone: true,
  imports: [TooltipModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="action-cell" (mousedown)="$event.stopPropagation()">

      @if (isEditing) {

        <!-- SAVE -->
        <button
          class="act-btn save"
          (click)="onAction('save')"
          pTooltip="Save changes"
          tooltipPosition="top"
          [showDelay]="300"
          aria-label="Save row"
        >
          <i class="pi pi-check"></i>
        </button>

        <!-- CANCEL -->
        <button
          class="act-btn cancel"
          (click)="onAction('cancel')"
          pTooltip="Discard changes"
          tooltipPosition="top"
          [showDelay]="300"
          aria-label="Cancel edit"
        >
          <i class="pi pi-times"></i>
        </button>

      } @else {

        <!-- EDIT -->
        <button
          class="act-btn edit"
          (click)="onAction('edit')"
          pTooltip="Edit row"
          tooltipPosition="top"
          [showDelay]="300"
          aria-label="Edit row"
        >
          <i class="pi pi-pencil"></i>
        </button>

        <!-- NOTES -->
        <button
          class="act-btn notes"
          (click)="onAction('notes')"
          pTooltip="View Notes"
          tooltipPosition="top"
          [showDelay]="300"
          aria-label="View notes"
        >
          <i class="pi pi-book"></i>
        </button>

        <!-- DELETE -->
        <button
          class="act-btn delete"
          (click)="onAction('delete')"
          pTooltip="Delete row"
          tooltipPosition="top"
          [showDelay]="300"
          aria-label="Delete row"
        >
          <i class="pi pi-trash"></i>
        </button>

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
      gap: 8px; /* Slightly more breathing room */
      height: 100%;
    }

    /* ── BASE BUTTON ── */
    .act-btn {
      width: 32px; /* Slightly larger hit area */
      height: 32px;
      border-radius: 50% !important; /* Premium circular buttons */
      border: 1px solid transparent !important; /* Force no weird global borders */
      background: transparent !important; /* Force transparent background */
      color: var(--text-tertiary, #9ca3af) !important;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      line-height: 1;
      padding: 0;

      i { font-size: 0.85rem; }

      &:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
      }
      &:active { transform: scale(0.92); }
    }

    /* ── SEMANTIC VARIANTS ── */
    .act-btn.edit:hover {
      background: rgba(var(--accent-primary-rgb), 0.1);
      color: var(--theme-accent-primary);
      border-color: rgba(var(--accent-primary-rgb), 0.22);
      box-shadow: 0 2px 5px rgba(var(--accent-primary-rgb), 0.12);
      transform: translateY(-1px);
    }

    .act-btn.delete:hover {
      background: rgba(239, 68, 68, 0.09);
      color: var(--color-error, #ef4444);
      border-color: rgba(239, 68, 68, 0.22);
      box-shadow: 0 2px 5px rgba(239, 68, 68, 0.12);
      transform: translateY(-1px);
    }

    .act-btn.notes:hover {
      background: rgba(139, 92, 246, 0.09);
      color: #8b5cf6;
      border-color: rgba(139, 92, 246, 0.22);
      box-shadow: 0 2px 5px rgba(139, 92, 246, 0.12);
      transform: translateY(-1px);
    }

    .act-btn.save {
      color: var(--color-success, #22c55e);
      background: rgba(34, 197, 94, 0.08);
      border-color: rgba(34, 197, 94, 0.2);

      &:hover {
        background: var(--color-success, #22c55e);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 3px 7px rgba(34, 197, 94, 0.25);
        transform: translateY(-1px);
      }
    }

    .act-btn.cancel {
      color: var(--theme-text-secondary);
      background: var(--theme-bg-ternary);
      border-color: var(--theme-border-primary);

      &:hover {
        background: var(--component-bg-hover);
        color: var(--theme-text-primary);
        transform: translateY(-1px);
      }
    }
  `],
})
export class AppSharedGridActionButton implements ICellRendererAngularComp {
  private readonly cdr = inject(ChangeDetectorRef);
  params: any;
  isEditing = false;

  agInit(params: any): void {
    this.params = params;
    this.syncState();
  }

  refresh(params: any): boolean {
    this.params = params;
    this.syncState();
    this.cdr.markForCheck();
    return true;
  }

  private syncState(): void {
    const parent = this.params?.context?.componentParent;
    const nodeId = this.params?.node?.id;
    // Read the signal — always fresh
    this.isEditing = parent?.editingIds?.()?.has(nodeId) ?? false;
  }

  onAction(action: string): void {
    this.params.context.componentParent.handleRowAction(action, this.params.data);
  }
}
