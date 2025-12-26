import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDetailTableComponent } from './dynamic-detail-table.component'; // Ensure correct path

@Component({
  standalone: true,
  template: `
    <button class="action-btn" (click)="viewDetails()" pTooltip="View Full Details" tooltipPosition="left">
      <i class="pi pi-expand"></i>
    </button>
  `,
  styles: [`
    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: var(--ui-border-radius);
      border: 1px solid var(--border-secondary);
      background: var(--bg-ternary);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-fast);
    }
    .action-btn:hover {
      background: var(--accent-primary);
      color: white;
      border-color: var(--accent-primary);
      box-shadow: var(--shadow-sm);
    }
    .action-btn i { font-size: 0.8rem; }
  `],
  providers: [DialogService]
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
      header: 'Record Details', // PrimeNG header (optional, we use custom inside)
      width: '90vw',           // Much wider
      height: '92vh',          // Much taller
      maximizable: true,
      closeOnEscape: true,
      baseZIndex: 10000,
      styleClass: 'dynamic-detail-dialog', // Add global CSS if needed to remove default padding
      contentStyle: { padding: '0', overflow: 'hidden' } // Remove default padding
    });
  }
}
