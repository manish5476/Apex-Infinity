import { Component, OnInit, inject, signal, ViewChild, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

// Services
import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { AppSharedGrid, SharedGridEvent } from '../../../shared/AgGrid/grid/app-shared-grid/app-shared-grid';
import { GridColDef } from '../../../shared/AgGrid/grid/grid.types';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

// Grid Components & Types

@Component({
  selector: 'app-bulk-customer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    ToolbarModule,
    AppSharedGrid
  ],
  template: `
    <div class="bulk-page-container fade-in" [class.is-dialog]="isDialog()">
      <div class="themed-card">
        
        @if (!isDialog()) {
          <p-toolbar styleClass="mb-4">
            <div class="p-toolbar-group-start gap-3 flex-col items-start">
              <h2 class="section-heading m-0">Bulk Customer Import</h2>
              <span class="text-sm text-gray-500">Easily import your customer base for Shivam Electronics in bulk.</span>
            </div>

            <div class="p-toolbar-group-end flex gap-2">
              <p-button 
                  label="Add Empty Row" 
                  icon="pi pi-plus" 
                  styleClass="p-button-outlined p-button-secondary"
                  (click)="addBulkRow()">
              </p-button>
              <p-button 
                  label="Save Customers" 
                  icon="pi pi-check" 
                  [loading]="isBulkSaving()" 
                  (click)="saveBulkImport()">
              </p-button>
            </div>
          </p-toolbar>
        }

        <div class="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-4 border border-blue-100 flex items-center">
          <i class="pi pi-info-circle mr-2 text-lg"></i>
          <span>
            <b>Name</b> and <b>Phone Number</b> are required. Rows missing these fields will be automatically ignored during save.
          </span>
        </div>

        <div class="grid-wrapper border rounded-md" style="height: calc(100vh - 280px);">
          <app-shared-grid
            #bulkGrid
            [columns]="columns"
            [data]="bulkData()"
            [selectionMode]="'multiple'"
            [showActions]="true"
            (gridEvent)="onGridEvent($event)">
          </app-shared-grid>
        </div>

      </div>
    </div>
    <p-toast></p-toast>
  `,
  styles: [`
    .bulk-page-container.is-dialog { padding: 0.5rem; }
    .themed-card { background: var(--theme-bg-primary, #fff); border-radius: 8px; padding: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BulkCustomerComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  // Dialog Mode
  @Input() isDialog = signal(false);
  // Dependencies
  private customerService = inject(CustomerService);
  private appMessage = inject(AppMessageService);
  private config = inject(DynamicDialogConfig, { optional: true });

  @ViewChild('bulkGrid') bulkGrid!: AppSharedGrid<any>;

  // State Signals
  bulkData = signal<any[]>([]);
  isBulkSaving = signal(false);
  gridApi: any;

  // Dropdown Options
  readonly customerTypes = [
    { label: 'Individual', value: 'individual' },
    { label: 'Business', value: 'business' }
  ];

  // Grid Columns strictly mapped to MasterCellComponent types
  columns: GridColDef<any>[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 140,
      cellConfig: {
        type: 'select',
        options: this.customerTypes,
        optionLabel: 'label',
        optionValue: 'value'
      }
    },
    {
      field: 'name',
      headerName: 'Customer Name*',
      flex: 1,
      minWidth: 180,
      cellConfig: { type: 'text', placeholder: 'Enter Name' }
    },
    {
      field: 'phone',
      headerName: 'Phone*',
      width: 160,
      cellConfig: { type: 'phone', placeholder: '+91...' }
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      cellConfig: { type: 'email', placeholder: 'name@example.com' }
    },
    {
      field: 'gstNumber',
      headerName: 'GST Number',
      width: 160,
      cellConfig: { type: 'text', placeholder: 'Ex: 22AAAAA0000A1Z5' }
    },
    {
      field: 'openingBalance',
      headerName: 'Opening Balance',
      width: 150,
      cellConfig: { type: 'currency', currencyCode: 'INR' }
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 90,
      cellConfig: { type: 'boolean' }
    }
  ];

  ngOnInit(): void {
    // If opened in a dialog, pick up state from config
    if (this.config?.data?.isDialog) {
      this.isDialog.set(true);
    }

    // Initialize with 10 empty rows for quick data entry
    const initialRows = Array.from({ length: 10 }, () => this.createEmptyCustomer());
    this.bulkData.set(initialRows);
  }

  // Handle AG Grid lifecycle events
  onGridEvent(event: any) {
    if (event.type === 'init') {
      this.gridApi = event.api;
    }
  }

  // Add a new row via the shared grid component
  addBulkRow() {
    if (this.bulkGrid) {
      this.bulkGrid.addNewRow();
    } else {
      const newRow = this.createEmptyCustomer();
      this.bulkData.update(d => [newRow, ...d]);
    }
  }

  // Format data and dispatch to service
  saveBulkImport() {
    if (!this.gridApi) return;

    // Ensure all active cell editors are closed and data is committed
    this.gridApi.stopEditing();

    const validItems: any[] = [];

    this.gridApi.forEachNode((node: any) => {
      const data = node.data;
      if (!data) return;

      // Ensure required fields exist before adding to payload
      if (data.name?.trim() && data.phone?.trim()) {
        validItems.push(this.preparePayload(data));
      }
    });

    if (validItems.length === 0) {
      this.appMessage.showWarn('No valid customers found. Please ensure Name and Phone are filled.');
      return;
    }

    this.isBulkSaving.set(true);

    this.customerService.createBulkCustomer(validItems).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.appMessage.showSuccess(`${validItems.length} customers imported successfully!`);
        // Reset grid on success
        this.bulkData.set(Array.from({ length: 5 }, () => this.createEmptyCustomer()));
        this.isBulkSaving.set(false);
      },
      error: (err: any) => {
        this.appMessage.handleHttpError(err);
        this.isBulkSaving.set(false);
      }
    });
  }

  // --- HELPERS ---

  private createEmptyCustomer(): any {
    const tempId = `new_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      _id: tempId,
      _tempId: tempId,
      type: 'individual', // Default
      name: '',
      phone: '',
      email: '',
      gstNumber: '',
      openingBalance: 0,
      isActive: true
    };
  }

  private preparePayload(row: any): any {
    // Ensure type un-nests if the select component returns an object instead of string
    const typeValue = (row.type && typeof row.type === 'object') ? row.type.value : row.type;

    return {
      type: typeValue || 'individual',
      name: row.name.trim(),
      phone: row.phone.trim(),
      email: row.email?.trim() || '',
      gstNumber: row.gstNumber?.trim() || '',
      openingBalance: Number(row.openingBalance) || 0,
      creditLimit: 0, // Defaulting as it's not in grid to save space
      isActive: row.isActive ?? true,

      // Providing empty address structures since your single form uses them
      billingAddress: { street: '', city: '', state: '', zipCode: '', country: 'India' },
      shippingAddress: { street: '', city: '', state: '', zipCode: '', country: 'India' }
    };
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}