import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip'; 
import { DialogService } from 'primeng/dynamicdialog';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DynamicDetailTableComponent } from './DynamicDetailCardComponent';
import { PermissionService } from '@core/auth/services/permission.service';
import { Permission } from '@core/auth/permissions.constants';

@Component({
  standalone: true,
  imports: [CommonModule, TooltipModule], 
  providers: [DialogService],
  template: `
    @if (canExpand()) {
    <button class="action-btn" (click)="viewDetails()" 
            pTooltip="Expand Details" tooltipPosition="left" [showDelay]="300">
      <i class="pi pi-expand"></i>
    </button>
    }
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
  private readonly permSvc = inject(PermissionService);
  private viewPermission?: Permission;

  constructor(private dialogService: DialogService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    const extra = params.colDef?.cellRendererParams as { viewPermission?: Permission } | undefined;
    this.viewPermission = extra?.viewPermission;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    const extra = params.colDef?.cellRendererParams as { viewPermission?: Permission } | undefined;
    this.viewPermission = extra?.viewPermission;
    return true;
  }

  /** When `viewPermission` is omitted, the action is shown (backward compatible). */
  canExpand(): boolean {
    if (!this.viewPermission) return true;
    return this.permSvc.hasPermission(this.viewPermission);
  }

  viewDetails() {
    this.dialogService.open(DynamicDetailTableComponent, {
      data: this.params.data,
      header: 'Record Details',
      width: '85%',          // Optimized width for readability
         // Prevent getting too wide on huge screens
      height: '80%',         // Maximized height
      maximizable: true,
      closeOnEscape: true,
      dismissableMask: true,
      baseZIndex: 10000,
      styleClass: 'dynamic-detail-dialog', 
      contentStyle: { padding: '0', overflow: 'hidden', 'border-radius': '0 0 6px 6px' } 
    });
  }
}
