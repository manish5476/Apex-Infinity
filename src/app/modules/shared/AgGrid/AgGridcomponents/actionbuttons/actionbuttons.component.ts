import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

import { PermissionService } from '@core/auth/services/permission.service';
import { Permission } from '@core/auth/permissions.constants';

interface ActionbuttonsCellRendererParams extends ICellRendererParams {
  actionHandler: (action: string, data: any) => void;
  isRowEditing: (id: string) => boolean;
  editPermission?: Permission;
  deletePermission?: Permission;
}

@Component({
  selector: 'app-actionbuttons',
  standalone: true,
  imports: [],
  template: `
    <div class="flex items-center justify-center space-x-2 h-full">
      @if (isEditing) {
        <!-- Save Button -->
        @if (canEdit()) {
          <button
            (click)="onSaveClick($event)"
            class="text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full w-6 h-6 flex items-center justify-center"
            title="Save"
            aria-label="Save row changes"
            >
            <i class="pi pi-check text-sm"></i>
          </button>
        }
        <!-- Cancel Button -->
        @if (canEdit()) {
          <button
            (click)="onCancelClick($event)"
            class="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full w-6 h-6 flex items-center justify-center"
            title="Cancel"
            aria-label="Cancel row changes"
            >
            <i class="pi pi-times text-sm"></i>
          </button>
        }
      }
      @if (!isEditing) {
        <!-- Edit Button -->
        @if (params.data && canEdit()) {
          <button
            (click)="onEditClick($event)"
            class="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full w-6 h-6 flex items-center justify-center"
            title="Edit"
            aria-label="Edit row"
            >
            <i class="pi pi-pencil text-sm"></i>
          </button>
        }
        <!-- Delete Button -->
        @if (params.data && canDelete()) {
          <button
            (click)="onDeleteClick($event)"
            class="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full w-6 h-6 flex items-center justify-center"
            title="Delete"
            aria-label="Delete row"
            >
            <i class="pi pi-trash text-sm"></i>
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
    .ag-cell {
      overflow: visible !important;
    }
  `]
})
export class ActionbuttonsComponent implements ICellRendererAngularComp {
  params!: ActionbuttonsCellRendererParams;
  isEditing: boolean = false;
  private readonly permSvc = inject(PermissionService);

  agInit(params: ActionbuttonsCellRendererParams): void {
    this.params = params;
    this.updateEditingState();
  }

  refresh(params: ActionbuttonsCellRendererParams): boolean {
    this.params = params;
    this.updateEditingState();
    return true;
  }

  private updateEditingState(): void {
    const rowId = this.params.data?._id || this.params.data?.id;
    this.isEditing = this.params.isRowEditing(rowId);
  }

  /** Omitted permission = show (backward compatible). */
  canEdit(): boolean {
    const p = this.params?.editPermission;
    if (!p) return true;
    return this.permSvc.hasPermission(p);
  }

  canDelete(): boolean {
    const p = this.params?.deletePermission;
    if (!p) return true;
    return this.permSvc.hasPermission(p);
  }

  onEditClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.params.actionHandler) {
      this.params.actionHandler('edit', this.params.data);
    }
  }

  onSaveClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.params.actionHandler) {
      this.params.actionHandler('save', this.params.data);
    }
  }

  onCancelClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.params.actionHandler) {
      this.params.actionHandler('cancel', this.params.data);
    }
  }

  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.params.actionHandler) {
      this.params.actionHandler('delete', this.params.data);
    }
  }
}
