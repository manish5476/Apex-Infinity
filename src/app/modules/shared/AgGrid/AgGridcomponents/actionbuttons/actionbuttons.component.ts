import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';

// Define a custom interface for the cell renderer parameters
// It includes a custom actionHandler function and a utility function to check editing status.
interface ActionbuttonsCellRendererParams extends ICellRendererParams {
  actionHandler: (action: string, data: any) => void;
  isRowEditing: (id: string) => boolean;
}

@Component({
  selector: 'app-actionbuttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center space-x-2 h-full">
      <ng-container *ngIf="isEditing">
        <!-- Save Button -->
        <button
          (click)="onSaveClick($event)"
          class="text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full w-6 h-6 flex items-center justify-center"
          title="Save"
          aria-label="Save row changes"
        >
          <i class="pi pi-check text-sm"></i>
        </button>
        <!-- Cancel Button -->
        <button
          (click)="onCancelClick($event)"
          class="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full w-6 h-6 flex items-center justify-center"
          title="Cancel"
          aria-label="Cancel row changes"
        >
        <i class="pi pi-times text-sm"></i>
        </button>
      </ng-container>
      <ng-container *ngIf="!isEditing">
        <!-- Edit Button -->
        <button
          *ngIf="params.data"
          (click)="onEditClick($event)"
          class="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full w-6 h-6 flex items-center justify-center"
          title="Edit"
          aria-label="Edit row"
        >
          <i class="pi pi-pencil text-sm"></i>
        </button>
        <!-- Delete Button -->
        <button
          *ngIf="params.data"
          (click)="onDeleteClick($event)"
          class="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full w-6 h-6 flex items-center justify-center"
          title="Delete"
          aria-label="Delete row"
        >
          <i class="pi pi-trash text-sm"></i>
        </button>
      </ng-container>
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
