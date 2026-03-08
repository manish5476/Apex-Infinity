import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';

// Services
import { ProductService } from '../../services/product-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { LoadingService } from '../../../../core/services/loading.service';

// Grid
import { AppSharedGrid, SharedGridEvent } from "../../../shared/AgGrid/grid/app-shared-grid/app-shared-grid";
import { GridColDef } from "../../../shared/AgGrid/grid/grid.types";
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-bulk-product-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ToastModule, ToolbarModule, AutoCompleteModule, AppSharedGrid],
  providers: [MessageService],
  templateUrl: './bulk-product-entry.html',
  styleUrls: ['./bulk-product-entry.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BulkProductEntry implements OnInit, OnChanges {
  // Input from Parent
  @Input() selectedData: any[] = [];
  private productService = inject(ProductService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  products = signal<any[]>([]);
  loading = signal(false);
  gridApi: any;
  selectedProductsToAdd: any[] = [];
  filteredProducts = signal<any[]>([]);
  departments = computed(() => this.masterList.department().map(m => ({ label: m.name, value: m._id })));
  categories = computed(() => this.masterList.categories().map(m => ({ label: m.name, value: m._id })));
  subCategories = computed(() => this.masterList.categories().map(m => ({ label: m.name, value: m._id })));
  brands = computed(() => this.masterList.brands().map(m => ({ label: m.name, value: m._id })));
  units = computed(() => this.masterList.units().map(m => ({ label: m.name, value: m._id })));
  suppliers = computed(() => this.masterList.suppliers().map(m => ({ label: m['companyName'] || m.name, value: m._id })));
  columns: GridColDef<any>[] = [];
  constructor() { }
  ngOnInit() {
    this.initColumns();
    if (this.products().length === 0) {
      this.onAddNew();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedData'] && this.selectedData && this.selectedData.length > 0) {
      const processedRows = this.selectedData.map(item => this.mapToGridRow(item));
      this.products.set(processedRows);
    }
  }

  private mapToGridRow(item: any): any {
    return {
      ...item,
      departmentId: item.departmentId?._id || item.departmentId,
      categoryId: item.categoryId?._id || item.categoryId,
      subCategoryId: item.subCategoryId?._id || item.subCategoryId,
      brandId: item.brandId?._id || item.brandId,
      unitId: item.unitId?._id || item.unitId,
      defaultSupplierId: item.defaultSupplierId?._id || item.defaultSupplierId,
    };
  }

  initColumns() {
    this.columns = [
      { field: '_id', headerName: 'ID', hide: true },
      { field: 'name', headerName: 'Product Name', width: 220, pinned: 'left', editable: true, cellConfig: { type: 'text', placeholder: 'Required' } },
      { field: 'sku', headerName: 'SKU', width: 120, editable: true, cellConfig: { type: 'text', placeholder: 'Unique Code' } },
      { field: 'departmentId', headerName: 'Department', width: 140, editable: true, cellConfig: { type: 'select', options: this.departments(), optionLabel: 'label' } },
      { field: 'categoryId', headerName: 'Category', width: 140, editable: true, cellConfig: { type: 'select', options: this.categories(), optionLabel: 'label' } },
      { field: 'subCategoryId', headerName: 'Sub Cat', width: 140, editable: true, cellConfig: { type: 'select', options: this.subCategories(), optionLabel: 'label' } },
      { field: 'brandId', headerName: 'Brand', width: 140, editable: true, cellConfig: { type: 'select', options: this.brands(), optionLabel: 'label' } },
      { field: 'unitId', headerName: 'Unit', width: 100, editable: true, cellConfig: { type: 'select', options: this.units(), optionLabel: 'label' } },
      { field: 'purchasePrice', headerName: 'Cost Price', width: 110, editable: true, cellConfig: { type: 'number', min: 0 } },
      { field: 'sellingPrice', headerName: 'Sell Price', width: 110, editable: true, cellConfig: { type: 'number', min: 0 } },
      { field: 'discountedPrice', headerName: 'Disc. Price', width: 110, editable: true, cellConfig: { type: 'number' } },
      { field: 'taxRate', headerName: 'Tax %', width: 90, editable: true, cellConfig: { type: 'number', max: 100 } },
      { field: 'isTaxInclusive', headerName: 'Tax Incl.', width: 90, editable: true, cellConfig: { type: 'boolean' } },

      {
        field: 'quantity', headerName: 'Init/Add Qty', width: 120, editable: true, cellConfig: { type: 'number' },
        cellRenderer: (params: any) => {
          const id = params.data._id || '';
          if (!id.startsWith('temp_')) {
            return `<span class="text-blue-600 font-bold" title="Current Stock: ${params.data.currentStock || 0}">+${params.value || 0}</span>`
          }
          return params.value;
        }
      },

      { field: 'defaultSupplierId', headerName: 'Supplier', width: 150, editable: true, cellConfig: { type: 'select', options: this.suppliers(), optionLabel: 'label' } },
      { field: 'description', headerName: 'Description', width: 200, editable: true, cellConfig: { type: 'text' } },
      { field: 'isActive', headerName: 'Active', width: 80, editable: true, cellConfig: { type: 'boolean' } }
    ];
  }

  // --- Grid Events ---
  onGridEvent(event: SharedGridEvent<any>) {
    if (event.type === 'init') this.gridApi = event.api;
    if (event.type === 'delete') { this.products.update(curr => curr.filter(p => p._id !== event.row._id)); }
    if (event.type === 'bulkDelete') {
      const idsToRemove = event.rows.map(r => r._id);
      this.products.update(curr => curr.filter(p => !idsToRemove.includes(p._id)));
    }
  }

  // --- Actions ---
  searchProduct(event: any) {
    this.productService.searchProducts({ q: event.query }).subscribe(res => {
      this.filteredProducts.set(res.data || []);
    });
  }

  addExistingProducts(event: any) {
    const items = Array.isArray(event) ? event : [event];
    const currentData = this.products();
    const newRows: any[] = [];

    items.forEach((item: any) => {
      if (!currentData.find(p => p._id === item._id)) {
        newRows.push(this.mapToGridRow(item));
      }
    });

    if (newRows.length > 0) this.products.update(prev => [...newRows, ...prev]);
    this.selectedProductsToAdd = [];
  }

  onAddNew() {
    const newProduct = { _id: `temp_${Date.now()}`, name: '', sku: '', isActive: true, sellingPrice: 0, purchasePrice: 0, quantity: 0, description: '', departmentId: null, categoryId: null, subCategoryId: null, brandId: null, unitId: null, defaultSupplierId: null, isTaxInclusive: false, taxRate: 0 };
    this.products.update(curr => [newProduct, ...curr]);
  }

  onClearAll() {
    this.products.set([]);
    this.onAddNew();
  }

onSaveAll() {
    const rowsToSave: any[] = [];
    if (this.gridApi) {
      this.gridApi.forEachNode((node: any) => rowsToSave.push(node.data));
    } else {
      rowsToSave.push(...this.products());
    }

    const validRows = rowsToSave.filter(r => r.name && r.name.trim() !== '');
    
    if (validRows.length === 0) {
      // Replaced silent return with a user warning
      this.messageService.showWarn('Validation Error: No valid products to save.');
      return; 
    }

    // Assign temporary IDs to distinguish new vs. existing rows
    validRows.forEach(r => { if (!r._id) r._id = `temp_${Date.now()}_fallback`; });
    
    const toCreate = validRows.filter(r => (r._id || '').startsWith('temp_'));
    const toUpdate = validRows.filter(r => !(r._id || '').startsWith('temp_'));

    const cleanPayload = (r: any) => ({
      ...r,
      sellingPrice: Number(r.sellingPrice || 0),
      purchasePrice: Number(r.purchasePrice || 0),
      discountedPrice: r.discountedPrice ? Number(r.discountedPrice) : null,
      taxRate: Number(r.taxRate || 0),
      quantity: Number(r.quantity || 0),
      isTaxInclusive: !!r.isTaxInclusive
    });

    const tasks = [];

    if (toCreate.length > 0) {
      const createPayload = toCreate.map(r => {
        const { _id, ...rest } = cleanPayload(r); // Remove temp ID before creating
        return rest;
      });
      tasks.push(this.productService.bulkImportProducts(createPayload));
    }
    
    if (toUpdate.length > 0) {
      const updatePayload = toUpdate.map(r => {
        const cleaned = cleanPayload(r);
        const id = cleaned._id;
        // Strip out fields that shouldn't be mutated during a generic product update
        const { _id, quantity, purchasePrice, inventory, openingStock, costPrice, ...allowedFields } = cleaned;
        return { _id: id, update: allowedFields };
      });
      tasks.push(this.productService.bulkUpdateProducts(updatePayload));
    }

    if (tasks.length === 0) return;

    this.loading.set(true);

    forkJoin(tasks).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        // Updated to single-string success format
        this.messageService.showSuccess('Bulk save completed successfully.');
        this.onClearAll();
      },
      error: (err) => {
        // Routed to global HTTP error handler
        this.messageService.handleHttpError(err);
      }
    });
  }
}
