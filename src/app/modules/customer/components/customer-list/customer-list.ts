import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext'; // Import InputTextModule

// --- Shared Components / Services ---
import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service'; // Assuming this path

@Component({
  selector: 'app-customer-list',
  standalone: true, // Add standalone: true
  imports: [
    CommonModule, // Add CommonModule
    SharedGridComponent,
    SelectModule,
    AutoCompleteModule,
    FormsModule,
    ButtonModule, // Use ButtonModule
    InputTextModule, // Add InputTextModule
  ],
  providers: [CustomerService], // CustomerService is already provided here
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private customerService = inject(CustomerService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);

  // --- Grid & Data ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20; // Set a clear page size
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  // --- Master List Signals ---
  customerOptions = signal<any[]>([]);

  // --- Filters ---
  customerFilter = {
    _id: null,
    email: '',
    phone: '',
  };

  emailSuggestions: string[] = [];
  private readonly domains: string[] = [
    '@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com',
  ];

  constructor() {
    // Effect to auto-populate dropdowns from master list
    effect(() => {
      // Assuming masterList has a signal .customers()
      this.customerOptions.set(this.masterList.customers());
    });
  }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  /**
   * Applies the current filters and reloads the grid.
   */
  applyFilters() {
    this.getData(true);
  }

  /**
   * Resets all filters and reloads the grid.
   */
  resetFilters() {
    this.customerFilter = {
      _id: null,
      email: '',
      phone: '',
    };
    this.getData(true);
  }

  /**
   * Autocompletes email domains.
   */
  filterEmails(event: AutoCompleteCompleteEvent) {
    const query = event.query;
    if (!query) {
      this.emailSuggestions = [];
      return;
    }
    this.emailSuggestions = query.includes('@')
      ? []
      : this.domains.map(domain => query + domain);
  }

  /**
   * Fetches data from the API based on filters and pagination.
   * @param isReset Resets data and pagination if true.
   */
  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0; // Reset total count on filter change
    }

    const filterParams = {
      ...this.customerFilter, // Spreads _id, email, phone
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.customerService.getAllCustomerData(filterParams).subscribe(
      (res: any) => {
        let newData: any[] = [];
        
        // --- FIX 1: Read from the correct res.data.data path ---
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }

        // --- FIX 2: Read total count from res.results ---
        this.totalCount = res.results || this.totalCount;
        
        this.data = [...this.data, ...newData];
        
        // --- FIX 3: Uncomment grid update logic ---
        if (this.gridApi) {
          if (isReset) {
            // this.gridApi.setRowData(this.data);
          } else {
            this.gridApi.applyTransaction({ add: newData });
          }
        }

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch customer data.');
        console.error('❌ Error fetching data:', err);
      }
    );
  }

  /**
   * Triggered by the grid's infinite scroll.
   */
  onScrolledToBottom(_: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  /**
   * Handles other events from the grid (e.g., row clicks).
   */
  eventFromGrid(event: any) {
    if (event.eventType === 'onRowClicked') {
      console.log('Row clicked:', event.event.data);
    }
  }

  /**
   * Defines the column structure for the AG-Grid.
   * This is now 100% aligned with your Mongoose Customer schema.
   */
  getColumn(): void {
    this.column = [
      {
        field: 'avatar',
        headerName: 'Avatar',
        cellRenderer: ImageCellRendererComponent,
        width: 100,
        autoHeight: true,
        filter: false,
        sortable: false,
      },
      {
        field: 'name',
        headerName: 'Name',
        sortable: true,
        filter: true,
        resizable: true,
        tooltipField: 'name',
      },
      {
        field: 'isActive',
        headerName: 'Status',
        sortable: true,
        filter: true,
        resizable: true,
        valueFormatter: (params: any) => params.value ? 'Active' : 'Inactive',
        cellStyle: (params: any) => {
          return params.value
            ? { backgroundColor: '#ccffcc', color: '#006400', fontWeight: 'bold' }
            : { backgroundColor: '#ffcccc', color: '#8b0000', fontWeight: 'bold' };
        },
      },
      {
        field: 'email',
        headerName: 'Email',
        sortable: true,
        filter: true,
        resizable: true,
        tooltipField: 'email',
      },
      {
        field: 'phone',
        headerName: 'Phone',
        sortable: true,
        filter: true,
        resizable: true,
        tooltipField: 'phone',
      },
      {
        field: 'altPhone',
        headerName: 'Alt. Phone',
        sortable: true,
        filter: true,
        resizable: true,
        tooltipField: 'altPhone',
      },
      {
        field: 'type',
        headerName: 'Type',
        sortable: true,
        filter: true,
        resizable: true,
      },
      {
        field: 'contactPerson',
        headerName: 'Contact Person',
        sortable: true,
        filter: true,
        resizable: true,
        tooltipField: 'contactPerson',
      },
      {
        field: 'outstandingBalance',
        headerName: 'Outstanding',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        // --- FIX 4: Defensive check for toFixed ---
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : '₹ 0.00',
        cellStyle: (params: any) => {
          if (params.value > 0) {
            return { backgroundColor: '#ffe0b3', color: '#d35400', fontWeight: 'bold' };
          }
          if (params.value === 0) {
            return { backgroundColor: '#ccffcc', color: '#006400', fontWeight: 'bold' };
          }
          return {};
        },
      },
      {
        field: 'creditLimit',
        headerName: 'Credit Limit',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        // --- FIX 4: Defensive check for toFixed ---
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : '₹ 0.00',
      },
      {
        field: 'openingBalance',
        headerName: 'Opening Balance',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        // --- FIX 4: Defensive check for toFixed ---
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : '₹ 0.00',
      },
      {
        field: 'billingAddress.city',
        headerName: 'City',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.billingAddress?.city,
      },
      {
        field: 'billingAddress.state',
        headerName: 'State',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.billingAddress?.state,
      },
      {
        field: 'gstNumber',
        headerName: 'GST',
        sortable: true,
        filter: true,
        resizable: true,
        tooltipField: 'gstNumber',
      },
      {
        field: 'tags',
        headerName: 'Tags',
        sortable: false,
        filter: true,
        resizable: true,
        valueFormatter: (params: any) => Array.isArray(params.value) ? params.value.join(', ') : '',
      },
      {
        field: 'createdAt',
        headerName: 'Created On',
        sortable: true,
        filter: 'agDateColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleString() : '',
      },
    ];
    this.cdr.detectChanges();
  }
}