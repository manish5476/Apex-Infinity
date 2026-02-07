import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

// Services
import { MasterService } from '../../../../core/services/master.service';
import { LoadingService } from '../../../../core/services/loading.service';

// Grid Components & Types
// Assuming GridColDef is exported from your shared types
import { AppSharedGrid } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
import { GridColDef } from "../../AgGrid/grid/grid.types"; 

// Define Interface for Master Data
export interface Master {
  _id: string;
  type: string;
  name: string;
  code: string;
  description: string;
  isNew?: boolean; // Helper flag for new rows
}

@Component({
  selector: 'app-master-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    AppSharedGrid
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="master-page-container">
      <div class="themed-card master-card">
        
        <p-toolbar styleClass="master-toolbar">
          <div class="p-toolbar-group-start gap-3">
            <h2 class="section-heading m-0">Master Data</h2>
            
            <p-iconfield iconPosition="left">
              <!-- <p-inputicon styleClass="pi pi-search"></p-inputicon> -->
              <input pInputText type="text" (input)="onQuickFilter($event)" 
                     placeholder="Search..." class="p-inputtext-sm w-64" />
            </p-iconfield>
          </div>

          <div class="p-toolbar-group-end flex gap-2">
             <div class="stats mr-4 align-content-center">
              <span class="text-sm text-gray-500">Total: {{ masters().length }}</span>
            </div>
            <p-button label="Refresh" icon="pi pi-refresh" styleClass="p-button-text" 
                      (click)="loadMasters()" [loading]="loading()"></p-button>
            <p-button label="Add New" icon="pi pi-plus" (click)="onAddNew()"></p-button>
          </div>
        </p-toolbar>

        <div class="master-grid-wrapper" style="height: calc(100vh - 200px);">
          <app-shared-grid
            [columns]="columns"
            [data]="masters()"
            [selectionMode]="'multiple'"
            [showActions]="true"
            (gridEvent)="onGridEvent($event)">
          </app-shared-grid>
        </div>

      </div>
    </div>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
  styleUrls: ['./master-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MasterList implements OnInit {
  // --- Services ---
  private masterService = inject(MasterService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private loadingService = inject(LoadingService);
  masters = signal<Master[]>([]);
  loading = signal(false);
  gridApi: any;
  columns: GridColDef<Master>[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      cellConfig: {
        type: 'select',
        placeholder: 'Select Type',
        // Mapping your masterTypes to the format the grid expects
        options: [
          { label: 'Category', value: 'category' },
          { label: 'Brand', value: 'brand' },
          { label: 'Unit', value: 'unit' },
          { label: 'Department', value: 'department' }
        ],
        optionLabel: 'label' // Optional, depends on your grid implementation
      }
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      cellConfig: { 
        type: 'text', 
        placeholder: 'Enter Name' 
      }
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 150,
      cellConfig: { 
        type: 'text', 
        placeholder: 'CODE' // You can handle uppercase in the grid or onSave
      }
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5,
      cellConfig: { 
        type: 'text', 
        placeholder: 'Optional description' 
      }
    }
  ];

  constructor() {
    effect(() => {
    });
  }

  ngOnInit() {
    this.loadMasters();
  }

  // --- Load Data ---
  loadMasters() {
    this.loading.set(true);
    this.masterService.getMasters().subscribe({
      next: (res) => {
        this.masters.set(res.data.masters || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data' });
        this.loading.set(false);
      }
    });
  }

  // --- Grid Event Handler (The Core Logic) ---
  onGridEvent(event: any) {
    console.log(event);
    switch (event.type) {
      case 'init':
        this.gridApi = event.api;
        break;
      case 'cellEdited':
        console.log(`Field ${event.field} changed to ${event.value}`);
        break;
      case 'save':
        this.handleSave(event.row);
        break;
      case 'Entersave':
        this.handleSave(event.row);
        break;
      case 'delete':
        this.handleDelete(event.row);
        break;
      case 'editStart':
        console.log(event.row);
        console.log('Editing started for:', event.row._id);
        break;
    }
  }

  // --- Action Handlers ---

  onAddNew() {
    // Create a temporary new row
    const newMaster: Master = {
      _id: `new_${Date.now()}`,
      type: 'category', 
      name: '',
      code: '',
      description: '',
      isNew: true
    };
    this.masters.update(current => [newMaster, ...current]);   
    this.messageService.add({severity:'info', summary:'New Row', detail:'Please fill details and click Save'});
  }

  handleSave(row: Master) {
    if (!row.name || !row.type) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name and Type are required' });
      return;
    }

    // Prepare payload
    const payload = {
      type: row.type,
      name: row.name,
      code: row.code ? row.code.toUpperCase() : null,
      description: row.description
    };

    // this.loadingService.show();

    if (row.isNew || row._id.startsWith('new_')) {
      // --- CREATE ---
      this.masterService.createMaster(payload).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Master created successfully' });
          this.loadMasters(); // Reload to get real ID
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Create failed' });
        },
        complete: () => this.loadingService.hide()
      });
    } else {
      // --- UPDATE ---
      this.masterService.updateMaster(row._id, payload).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Master updated successfully' });
          // Optional: Update local signal if you don't want to reload the whole list
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Update failed' });
        },
        complete: () => this.loadingService.hide()
      });
    }
  }

  handleDelete(row: Master) {
    // If it's a local new row that hasn't been saved yet
    if (row.isNew || row._id.startsWith('new_')) {
      this.masters.update(current => current.filter(m => m._id !== row._id));
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${row.name}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        // this.loadingService.show();
        this.masterService.deleteMaster(row._id).subscribe({
          next: () => {
            this.masters.update(users => users.filter(u => u._id !== row._id));
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${row.name} removed` });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
          },
          complete: () => this.loadingService.hide()
        });
      }
    });
  }

  onQuickFilter(event: any) {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', event.target.value);
    }
  }
}
