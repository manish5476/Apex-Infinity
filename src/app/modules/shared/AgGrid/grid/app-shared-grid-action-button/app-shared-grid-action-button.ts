import { Component, ViewEncapsulation } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-shared-action-btn',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  encapsulation: ViewEncapsulation.None, // Ensures tooltip styles work seamlessly
  template: `
    <div class="action-cell-wrapper" (mousedown)="$event.stopPropagation()">
      
      @if (isEditing) {
        <button 
          pButton 
          icon="pi pi-check" 
          class="action-btn btn-save"
          pTooltip="Save Changes" 
          tooltipPosition="top"
          (click)="onAction('save')">
        </button>

        <button 
          pButton 
          icon="pi pi-times" 
          class="action-btn btn-cancel"
          pTooltip="Discard" 
          tooltipPosition="top"
          (click)="onAction('cancel')">
        </button>

      } @else {
        <button 
          pButton 
          icon="pi pi-pencil" 
          class="action-btn btn-edit"
          pTooltip="Edit Row" 
          tooltipPosition="top"
          (click)="onAction('edit')">
        </button>

        <button 
          pButton 
          icon="pi pi-trash" 
          class="action-btn btn-delete"
          pTooltip="Delete Row" 
          tooltipPosition="top"
          (click)="onAction('delete')">
        </button>
      }

    </div>
  `,
  styles: [`
    /* ==========================================================================
       ACTION CELL CONTAINER
       ========================================================================== */
    .action-cell-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center; /* Center buttons in cell */
      gap: var(--spacing-sm);  /* 0.375rem (6px) - Compact Gap */
    }

    /* ==========================================================================
       BASE ACTION BUTTON
       "Ghost" style: Transparent until hovered
       ========================================================================== */
    .action-btn.p-button {
      width: 28px;
      height: 28px;
      padding: 0;
      border: 1px solid transparent;
      border-radius: var(--ui-border-radius); /* 5px */
      background: transparent;
      transition: var(--transition-fast); /* 0.12s snappy response */
      
      /* Default Icon Style */
      color: var(--text-secondary);
      
      .p-button-icon {
        font-size: 0.85rem; /* ~13-14px balanced icon */
        font-weight: var(--font-weight-medium);
      }

      /* Hover: Slight background lift for generic state */
      &:hover {
        background: var(--component-bg-hover);
        color: var(--text-primary);
      }
      
      /* Focus: Accessibility Ring */
      &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
      }
    }

    /* ==========================================================================
       SEMANTIC VARIANTS (Hover States)
       Uses your color-mix tokens for perfect harmony
       ========================================================================== */

    /* 1. EDIT (Primary/Accent) */
    .action-btn.btn-edit:hover {
      background: var(--color-primary-bg); /* Tinted Background */
      color: var(--accent-primary);        /* Bold Text */
      border-color: rgba(var(--accent-primary-rgb), 0.2); /* Subtle Border */
    }

    /* 2. DELETE (Error) */
    .action-btn.btn-delete:hover {
      background: var(--color-error-bg);
      color: var(--color-error);
      border-color: var(--color-error-border);
    }

    /* 3. SAVE (Success) */
    .action-btn.btn-save {
      /* Save is special: It's often green even before hover to indicate "Safe" */
      color: var(--color-success);
      
      &:hover {
        background: var(--color-success);
        color: white; /* Invert on hover for strong call to action */
        box-shadow: var(--shadow-sm);
      }
    }

    /* 4. CANCEL (Secondary/Muted) */
    .action-btn.btn-cancel:hover {
      background: var(--bg-ternary);
      color: var(--text-primary);
      border-color: var(--border-secondary);
    }
  `]
})
export class AppSharedGridActionButton implements ICellRendererAngularComp {
  params: any;
  isEditing = false;

  agInit(params: any): void {
    this.params = params;
    this.checkState();
  }

  refresh(params: any): boolean {
    this.params = params;
    this.checkState();
    return true;
  }

  checkState() {
    // Check Parent Signal for editing state
    const parent = this.params.context.componentParent;
    if (parent) {
      this.isEditing = parent.editingIds().has(this.params.node.id);
    }
  }

  onAction(action: string) {
    this.params.context.componentParent.handleRowAction(action, this.params.data);
  }
}