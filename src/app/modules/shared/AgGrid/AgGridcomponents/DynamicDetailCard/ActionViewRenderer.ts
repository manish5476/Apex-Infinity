import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip'; // Required for pTooltip
import { DialogService } from 'primeng/dynamicdialog';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
// Update this path to match your actual file structure
import { DynamicDetailTableComponent } from './dynamic-detail-table.component'; 

@Component({
  standalone: true,
  // ✅ FIX: Import TooltipModule so pTooltip works
  imports: [CommonModule, TooltipModule], 
  providers: [DialogService],
  template: `
    <button class="action-btn" (click)="viewDetails()" 
            pTooltip="Expand Details" tooltipPosition="left" [showDelay]="300">
      <i class="pi pi-expand"></i>
    </button>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--ui-border-radius, 6px);
      border: 1px solid var(--border-secondary, #e2e8f0);
      background: var(--bg-secondary, #ffffff);
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      /* Subtle Shadow */
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .action-btn:hover {
      background: var(--accent-primary, #3b82f6);
      color: #ffffff;
      border-color: var(--accent-primary, #3b82f6);
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
      transform: translateY(-1px);
    }

    .action-btn:active {
      transform: translateY(0);
    }

    .action-btn i {
      font-size: 0.85rem;
      font-weight: 600;
    }
  `]
})
export class ActionViewRenderer implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor(private dialogService: DialogService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(): boolean { return false; }

  viewDetails() {
    this.dialogService.open(DynamicDetailTableComponent, {
      data: this.params.data,
      header: 'Record Details',
      width: '90vw',           // Big Width
      height: '92vh',          // Big Height
      maximizable: true,
      closeOnEscape: true,
      dismissableMask: true,   // Click outside to close
      baseZIndex: 10000,
      styleClass: 'dynamic-detail-dialog', // Global class for padding overrides
      contentStyle: { padding: '0', overflow: 'hidden' } // Remove default padding
    });
  }
}
