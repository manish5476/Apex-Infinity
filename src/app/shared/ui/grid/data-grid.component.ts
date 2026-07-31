import { Component, ChangeDetectionStrategy, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { GridColumn } from './grid-types';
import { GridCellComponent } from './components/grid-cell.component';
import { GridToolbarComponent } from './components/grid-toolbar.component';
import { ButtonComponent } from '../form/button.component'; // Your custom button

@Component({
    selector: 'app-data-grid',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, GridCellComponent, GridToolbarComponent, ButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block w-full' },
    template: `
    <div class="w-full flex flex-col">
      
      <!-- Toolbar with Batch Edit Controls -->
      @if (toolbar()) {
        <app-grid-toolbar (search)="onGlobalSearch($event)">
          <ng-content select="[grid-filters]" ngProjectAs="[grid-filters]"></ng-content>
          
          <div grid-actions class="flex items-center gap-2">
            <!-- Normal Actions (Hidden during Bulk Edit) -->
            @if (!batchEditMode()) {
              <ng-content select="[grid-actions]"></ng-content>
              @if (enableBatchEdit()) {
                <app-button variant="secondary" icon="pi pi-pencil" label="Bulk Edit" size="sm" (clicked)="toggleBatchEdit()"></app-button>
              }
            } 
            <!-- Bulk Edit Actions -->
            @else {
              <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-warning)] mr-2 animate-pulse">Editing Mode Active</span>
              <app-button variant="ghost" icon="pi pi-times" label="Cancel" size="sm" (clicked)="cancelBatchEdit()"></app-button>
              <app-button variant="success" icon="pi pi-check" label="Save Changes" size="sm" (clicked)="saveBatchEdit()"></app-button>
            }
          </div>
        </app-grid-toolbar>
      }

      <div class="bg-[var(--bg-primary)] rounded-[1.5rem] shadow-sm border border-[var(--border-secondary)] overflow-hidden transition-all duration-300"
           [class.ring-2]="batchEditMode()" [class.ring-[var(--color-warning)]]="batchEditMode()">
        
        <p-table
          #dt
          [value]="data()"
          [columns]="columns()"
          [selectionMode]="rowSelection() && !batchEditMode() ? (multipleSelection() ? 'multiple' : 'single') : null"
          [(selection)]="selectedRows"
          [paginator]="pagination()"
          [rows]="pageSize()"
          [dataKey]="dataKey()"
          [scrollable]="true"
          scrollHeight="flex"
          styleClass="premium-data-grid">
          
          <ng-template pTemplate="header" let-columns>
            <tr>
              @if (rowSelection()) {
                <th style="width: 4rem" class="border-b border-dashed border-[var(--border-secondary)] bg-transparent">
                  <p-tableHeaderCheckbox [disabled]="batchEditMode()"></p-tableHeaderCheckbox>
                </th>
              }
              @for (col of columns; track col.field) {
                <th [style.width]="col.width || 'auto'" class="border-b border-dashed border-[var(--border-secondary)] bg-transparent text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] uppercase tracking-wider font-[var(--font-weight-medium)] py-4">
                  {{ col.header }}
                  @if (col.editable && batchEditMode()) { <i class="pi pi-pencil ml-1 text-[var(--color-warning)] opacity-70"></i> }
                </th>
              }
              <!-- Action Column Header -->
              @if (hasActions()) { <th style="width: 5rem" class="border-b border-dashed border-[var(--border-secondary)] bg-transparent"></th> }
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-rowData let-columns="columns">
            <tr [pSelectableRow]="rowData">
              
              @if (rowSelection()) {
                <td><p-tableCheckbox [value]="rowData" [disabled]="batchEditMode()"></p-tableCheckbox></td>
              }
              
              @for (col of columns; track col.field) {
                <td [style.width]="col.width || 'auto'" class="py-2" [class.bg-[var(--bg-secondary)]]="batchEditMode() && col.editable">
                   <!-- Magic: Pass batchEditMode down to the cell -->
                   <app-grid-cell [column]="col" [rowData]="rowData" [isEditing]="batchEditMode()"></app-grid-cell>
                </td>
              }

              <!-- Action Column (Disabled/Hidden during batch edit) -->
              @if (hasActions()) {
                <td class="text-right">
                  <app-button variant="ghost" icon="pi pi-ellipsis-v" [disabled]="batchEditMode()"></app-button>
                </td>
              }
            </tr>
          </ng-template>

        </p-table>
      </div>
    </div>
  `
})
export class DataGridComponent {
    data = input.required<any[]>();
    columns = input.required<GridColumn[]>();
    dataKey = input<string>('id');

    toolbar = input<boolean>(true);
    rowSelection = input<boolean>(true);
    multipleSelection = input<boolean>(true);
    pagination = input<boolean>(true);
    pageSize = input<number>(10);
    hasActions = input<boolean>(true);

    // Bulk Edit Config
    enableBatchEdit = input<boolean>(false);
    batchSave = output<any[]>(); // Emits the modified data array

    selectedRows = model<any[]>([]);

    // Internal State
    batchEditMode = signal<boolean>(false);
    private originalDataSnapshot: any[] = [];

    onGlobalSearch(query: string) {
        console.log('Search:', query);
    }

    toggleBatchEdit() {
        // Save a deep clone snapshot in case the user cancels
        this.originalDataSnapshot = JSON.parse(JSON.stringify(this.data()));
        this.batchEditMode.set(true);
    }

    cancelBatchEdit() {
        // Revert data to snapshot
        // In a real app, you would emit an event or mutate the input signal to restore state
        Object.assign(this.data(), this.originalDataSnapshot);
        this.batchEditMode.set(false);
    }

    saveBatchEdit() {
        this.batchEditMode.set(false);
        // Emit the mutated data back to the parent component
        this.batchSave.emit(this.data());
    }
}
