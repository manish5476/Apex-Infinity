import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

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
  private messageService = inject(MessageService);
  private loadingService = inject(LoadingService);

  // --- State ---
  products = signal<any[]>([]);
  loading = signal(false);
  gridApi: any;

  // Search
  selectedProductsToAdd: any[] = [];
  filteredProducts = signal<any[]>([]);

  // --- Master Data ---
  // Note: fixed 'department()' to 'departments()' based on standard naming, check your service
  departments = computed(() => this.masterList.department().map(m => ({ label: m.name, value: m._id })));
  categories = computed(() => this.masterList.categories().map(m => ({ label: m.name, value: m._id })));
  subCategories = computed(() => this.masterList.categories().map(m => ({ label: m.name, value: m._id })));
  brands = computed(() => this.masterList.brands().map(m => ({ label: m.name, value: m._id })));
  units = computed(() => this.masterList.units().map(m => ({ label: m.name, value: m._id })));
  suppliers = computed(() => this.masterList.suppliers().map(m => ({ label: m['companyName'] || m.name, value: m._id })));

  columns: GridColDef<any>[] = [];

  constructor() { 
    // We don't call onAddNew() here automatically if we expect Inputs, 
    // let ngOnInit or ngOnChanges handle initialization 
  }

  ngOnInit() {
    this.initColumns();
    // If no data passed, add one empty row
    if (this.products().length === 0) {
      this.onAddNew();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedData'] && this.selectedData && this.selectedData.length > 0) {
      
      // 1. Process/Flatten the incoming data
      const processedRows = this.selectedData.map(item => this.mapToGridRow(item));
      
      // 2. Set the signal (Replace existing or Append? Usually Replace when opening dialog)
      this.products.set(processedRows);
    }
  }

  // --- Helper: Flattens Objects to IDs for Dropdowns ---
  private mapToGridRow(item: any): any {
    return {
      ...item,
      // Check if field is an object (populated), if so, extract ._id
      departmentId: item.departmentId?._id || item.departmentId,
      categoryId: item.categoryId?._id || item.categoryId,
      subCategoryId: item.subCategoryId?._id || item.subCategoryId,
      brandId: item.brandId?._id || item.brandId,
      unitId: item.unitId?._id || item.unitId,
      defaultSupplierId: item.defaultSupplierId?._id || item.defaultSupplierId,
      // Ensure quantity is 0 for updates (stock adjustment logic), unless you want to show current stock
      // quantity: 0 
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
        // REUSE HELPER HERE
        newRows.push(this.mapToGridRow(item));
      }
    });

    if (newRows.length > 0) this.products.update(prev => [...newRows, ...prev]);
    this.selectedProductsToAdd = [];
  }

  onAddNew() {
    const newProduct = {
      _id: `temp_${Date.now()}`,
      name: '',
      sku: '',
      isActive: true,
      sellingPrice: 0,
      purchasePrice: 0,
      quantity: 0,
      description: '',
      departmentId: null,
      categoryId: null,
      subCategoryId: null,
      brandId: null,
      unitId: null,
      defaultSupplierId: null,
      isTaxInclusive: false,
      taxRate: 0
    };
    this.products.update(curr => [newProduct, ...curr]);
  }

  onClearAll() {
    this.products.set([]);
    this.onAddNew();
  }
// --- Save Logic ---
  onSaveAll() {
    const rowsToSave: any[] = [];
    
    // 1. Extract Data
    if (this.gridApi) {
      this.gridApi.forEachNode((node: any) => rowsToSave.push(node.data));
    } else {
      rowsToSave.push(...this.products());
    }

    const validRows = rowsToSave.filter(r => r.name && r.name.trim() !== '');
    if (validRows.length === 0) return;

    // 2. Safety: Ensure IDs exist
    validRows.forEach(r => {
      if (!r._id) r._id = `temp_${Date.now()}_fallback`;
    });

    // 3. Split: Create vs Update
    const toCreate = validRows.filter(r => (r._id || '').startsWith('temp_'));
    const toUpdate = validRows.filter(r => !(r._id || '').startsWith('temp_'));

    this.loading.set(true);
    const tasks = [];

    // --- Helper: Clean Data Types ---
    const cleanPayload = (r: any) => ({
      ...r,
      sellingPrice: Number(r.sellingPrice || 0),
      purchasePrice: Number(r.purchasePrice || 0),
      discountedPrice: r.discountedPrice ? Number(r.discountedPrice) : null,
      taxRate: Number(r.taxRate || 0),
      quantity: Number(r.quantity || 0),
      isTaxInclusive: !!r.isTaxInclusive
    });

    // --- TASK 1: CREATE (Bulk Import) ---
    // Backend expects array of objects
    if (toCreate.length > 0) {
      const createPayload = toCreate.map(r => {
        const { _id, ...rest } = cleanPayload(r); // Remove temp ID
        return rest;
      });
      tasks.push(this.productService.bulkImportProducts(createPayload));
    }

    // --- TASK 2: UPDATE (Bulk Update) ---
    // Backend expects: [ { _id: "...", update: { ... } } ]
    if (toUpdate.length > 0) {
      const updatePayload = toUpdate.map(r => {
        const cleaned = cleanPayload(r);
        
        // 1. Extract ID
        const id = cleaned._id;

        // 2. Remove Forbidden Fields (quantity, purchasePrice, inventory)
        //    and the _id itself from the update object
        const { 
          _id, 
          quantity, 
          purchasePrice, 
          inventory, 
          openingStock, 
          costPrice, 
          ...allowedFields 
        } = cleaned;

        // 3. Return Structure expected by Backend
        return {
          _id: id,
          update: allowedFields // Only sends name, sku, sellingPrice, category, etc.
        };
      });

      tasks.push(this.productService.bulkUpdateProducts(updatePayload));
    }

    if (tasks.length === 0) {
      this.loading.set(false);
      return;
    }

    forkJoin(tasks).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Operations completed' });
        this.onClearAll();
        // Optional: Close dialog or emit event to refresh parent grid
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed' });
      },
      complete: () => this.loading.set(false)
    });
  }
  // --- Save Logic ---
  // onSaveAll() {
  //   const rowsToSave: any[] = [];
  //   if (this.gridApi) {
  //     this.gridApi.forEachNode((node: any) => rowsToSave.push(node.data));
  //   } else {
  //     rowsToSave.push(...this.products());
  //   }

  //   const validRows = rowsToSave.filter(r => r.name && r.name.trim() !== '');
  //   if (validRows.length === 0) return;

  //   validRows.forEach(r => {
  //     if (!r._id) r._id = `temp_${Date.now()}_fallback`;
  //   });

  //   const toCreate = validRows.filter(r => (r._id || '').startsWith('temp_'));
  //   const toUpdate = validRows.filter(r => !(r._id || '').startsWith('temp_'));

  //   this.loading.set(true);
  //   const tasks = [];

  //   const cleanPayload = (r: any) => ({
  //     ...r,
  //     sellingPrice: Number(r.sellingPrice || 0),
  //     purchasePrice: Number(r.purchasePrice || 0),
  //     discountedPrice: r.discountedPrice ? Number(r.discountedPrice) : null,
  //     taxRate: Number(r.taxRate || 0),
  //     quantity: Number(r.quantity || 0),
  //     isTaxInclusive: !!r.isTaxInclusive
  //   });

  //   if (toCreate.length > 0) {
  //     const createPayload = toCreate.map(r => {
  //       const { _id, ...rest } = cleanPayload(r);
  //       return rest;
  //     });
  //     tasks.push(this.productService.bulkImportProducts(createPayload));
  //   }

  //   if (toUpdate.length > 0) {
  //     tasks.push(this.productService.bulkUpdateProducts(toUpdate.map(cleanPayload)));
  //   }

  //   if (tasks.length === 0) {
  //     this.loading.set(false);
  //     return;
  //   }

  //   forkJoin(tasks).subscribe({
  //     next: () => {
  //       this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Operations completed' });
  //       this.onClearAll();
  //     },
  //     error: (err) => {
  //       this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed' });
  //     },
  //     complete: () => this.loading.set(false)
  //   });
  // }
}

// import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal, computed, ChangeDetectionStrategy, input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { forkJoin } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { ToastModule } from 'primeng/toast';
// import { ToolbarModule } from 'primeng/toolbar';
// import { AutoCompleteModule } from 'primeng/autocomplete';
// import { MessageService } from 'primeng/api';

// // Services
// import { ProductService } from '../../services/product-service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { LoadingService } from '../../../../core/services/loading.service';

// // Grid
// import { AppSharedGrid, SharedGridEvent } from "../../../shared/AgGrid/grid/app-shared-grid/app-shared-grid"; // Adjust path
// import { GridColDef } from "../../../shared/AgGrid/grid/grid.types"; // Adjust path

// @Component({
//   selector: 'app-bulk-product-entry',
//   standalone: true,
//   imports: [CommonModule, FormsModule, ButtonModule, ToastModule, ToolbarModule, AutoCompleteModule, AppSharedGrid],
//   providers: [MessageService],
//   templateUrl: './bulk-product-entry.html',
//   styleUrls: ['./bulk-product-entry.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class BulkProductEntry implements OnInit, OnChanges {
//   @Input() selectedData: any
//   private productService = inject(ProductService);
//   private masterList = inject(MasterListService);
//   private messageService = inject(MessageService);
//   private loadingService = inject(LoadingService);

//   // --- State ---
//   products = signal<any[]>([]);
//   loading = signal(false);
//   gridApi: any;

//   // Search
//   selectedProductsToAdd: any[] = [];
//   filteredProducts = signal<any[]>([]);

//   // --- Master Data ---
//   departments = computed(() => this.masterList.department().map(m => ({ label: m.name, value: m._id })));
//   categories = computed(() => this.masterList.categories().map(m => ({ label: m.name, value: m._id })));
//   subCategories = computed(() => this.masterList.categories().map(m => ({ label: m.name, value: m._id })));
//   brands = computed(() => this.masterList.brands().map(m => ({ label: m.name, value: m._id })));
//   units = computed(() => this.masterList.units().map(m => ({ label: m.name, value: m._id })));
//   suppliers = computed(() => this.masterList.suppliers().map(m => ({ label: m['companyName'] || m.name, value: m._id })));
//   columns: GridColDef<any>[] = [];
//   constructor() { this.onAddNew(); }
//   ngOnInit() { this.initColumns() }

// ngOnChanges(changes: SimpleChanges): void {
// //  this.products = this.selectedData
// if(this.selectedData.length>0){
//   this.products.update(prev => [...this.selectedData, ...prev])
// }
// }

//   initColumns() {
//     this.columns = [
//       { field: '_id', headerName: 'ID', hide: true },
//       { field: 'name', headerName: 'Product Name', width: 220, pinned: 'left', editable: true, cellConfig: { type: 'text', placeholder: 'Required' } },
//       { field: 'sku', headerName: 'SKU', width: 120, editable: true, cellConfig: { type: 'text', placeholder: 'Unique Code' } },
//       { field: 'departmentId', headerName: 'Department', width: 140, editable: true, cellConfig: { type: 'select', options: this.departments(), optionLabel: 'label' } },
//       { field: 'categoryId', headerName: 'Category', width: 140, editable: true, cellConfig: { type: 'select', options: this.categories(), optionLabel: 'label' } },
//       { field: 'subCategoryId', headerName: 'Sub Cat', width: 140, editable: true, cellConfig: { type: 'select', options: this.subCategories(), optionLabel: 'label' } },
//       { field: 'brandId', headerName: 'Brand', width: 140, editable: true, cellConfig: { type: 'select', options: this.brands(), optionLabel: 'label' } },
//       { field: 'unitId', headerName: 'Unit', width: 100, editable: true, cellConfig: { type: 'select', options: this.units(), optionLabel: 'label' } },
//       // --- 3. Pricing ---
//       { field: 'purchasePrice', headerName: 'Cost Price', width: 110, editable: true, cellConfig: { type: 'number', min: 0 } },
//       { field: 'sellingPrice', headerName: 'Sell Price', width: 110, editable: true, cellConfig: { type: 'number', min: 0 } },
//       { field: 'discountedPrice', headerName: 'Disc. Price', width: 110, editable: true, cellConfig: { type: 'number' } },
//       { field: 'taxRate', headerName: 'Tax %', width: 90, editable: true, cellConfig: { type: 'number', max: 100 } },
//       { field: 'isTaxInclusive', headerName: 'Tax Incl.', width: 90, editable: true, cellConfig: { type: 'boolean' } },
//       // --- 4. Inventory ---
//       {
//         field: 'quantity', headerName: 'Init Qty', width: 100, editable: true, cellConfig: { type: 'number' }, cellRenderer: (params: any) => {
//           const id = params.data._id || '';
//           if (!id.startsWith('temp_')) {
//             return `<span class="text-blue-600 font-bold" title="Add to current stock">+${params.value || 0}</span>`
//           }
//           return params.value;
//         }
//       },

//       // --- 5. Meta ---
//       { field: 'defaultSupplierId', headerName: 'Supplier', width: 150, editable: true, cellConfig: { type: 'select', options: this.suppliers(), optionLabel: 'label' } },
//       { field: 'description', headerName: 'Description', width: 200, editable: true, cellConfig: { type: 'text' } },
//       { field: 'isActive', headerName: 'Active', width: 80, editable: true, cellConfig: { type: 'boolean' } }
//     ];
//   }

//   // --- Grid Events ---
//   onGridEvent(event: SharedGridEvent<any>) {
//     if (event.type === 'init') this.gridApi = event.api;
//     if (event.type === 'delete') { this.products.update(curr => curr.filter(p => p._id !== event.row._id)); }
//     if (event.type === 'bulkDelete') {
//       const idsToRemove = event.rows.map(r => r._id); this.products.update(curr => curr.filter(p => !idsToRemove.includes(p._id)));
//     }
//   }

//   // --- Actions ---
//   searchProduct(event: any) {
//     this.productService.searchProducts({ q: event.query }).subscribe(res => {
//       this.filteredProducts.set(res.data || []);
//     });
//   }

//   addExistingProducts(event: any) {
//     const items = Array.isArray(event) ? event : [event];
//     const currentData = this.products();
//     const newRows: any[] = [];

//     items.forEach((item: any) => {
//       if (!currentData.find(p => p._id === item._id)) {
//         newRows.push({
//           ...item,
//           // Flatten objects for dropdowns
//           departmentId: item.departmentId?._id || item.departmentId,
//           categoryId: item.categoryId?._id || item.categoryId,
//           subCategoryId: item.subCategoryId?._id || item.subCategoryId,
//           brandId: item.brandId?._id || item.brandId,
//           unitId: item.unitId?._id || item.unitId,
//           defaultSupplierId: item.defaultSupplierId?._id || item.defaultSupplierId,
//           quantity: 0
//         });
//       }
//     });

//     if (newRows.length > 0) this.products.update(prev => [...newRows, ...prev]);
//     this.selectedProductsToAdd = [];
//   }

//   onAddNew() {
//     const newProduct = {
//       // 🟢 IMPORTANT: We set _id so the Shared Grid & Save Logic works
//       _id: `temp_${Date.now()}`,
//       name: '',
//       sku: '',
//       isActive: true,
//       sellingPrice: 0,
//       purchasePrice: 0,
//       quantity: 0,
//       description: '',
//       departmentId: null,
//       categoryId: null,
//       subCategoryId: null,
//       brandId: null,
//       unitId: null,
//       defaultSupplierId: null,
//       isTaxInclusive: false,
//       taxRate: 0
//     };
//     this.products.update(curr => [newProduct, ...curr]);
//   }

//   onClearAll() {
//     this.products.set([]);
//     this.onAddNew();
//   }

//   // --- Save Logic ---
//   onSaveAll() {
//     const rowsToSave: any[] = [];

//     // 1. Extract Data safely
//     if (this.gridApi) {
//       this.gridApi.forEachNode((node: any) => rowsToSave.push(node.data));
//     } else {
//       rowsToSave.push(...this.products());
//     }

//     const validRows = rowsToSave.filter(r => r.name && r.name.trim() !== '');
//     if (validRows.length === 0) return;

//     // 2. SAFETY: Handle missing IDs gracefully
//     validRows.forEach(r => {
//       if (!r._id) r._id = `temp_${Date.now()}_fallback`;
//     });

//     // 3. Logic: Split based on ID prefix
//     // Safe check: (r._id || '') ensures startsWith never hits undefined
//     const toCreate = validRows.filter(r => (r._id || '').startsWith('temp_'));
//     const toUpdate = validRows.filter(r => !(r._id || '').startsWith('temp_'));

//     this.loading.set(true);
//     const tasks = [];

//     // Map function to ensure numbers are numbers
//     const cleanPayload = (r: any) => ({
//       ...r,
//       sellingPrice: Number(r.sellingPrice || 0),
//       purchasePrice: Number(r.purchasePrice || 0),
//       discountedPrice: r.discountedPrice ? Number(r.discountedPrice) : null,
//       taxRate: Number(r.taxRate || 0),
//       quantity: Number(r.quantity || 0),
//       isTaxInclusive: !!r.isTaxInclusive
//     });

//     // REMOVE TEMP ID before Creating
//     if (toCreate.length > 0) {
//       const createPayload = toCreate.map(r => {
//         const { _id, ...rest } = cleanPayload(r); // remove _id for create
//         return rest;
//       });
//       tasks.push(this.productService.bulkImportProducts(createPayload));
//     }

//     if (toUpdate.length > 0) {
//       tasks.push(this.productService.bulkUpdateProducts(toUpdate.map(cleanPayload)));
//     }

//     if (tasks.length === 0) {
//       this.loading.set(false);
//       return;
//     }

//     forkJoin(tasks).subscribe({
//       next: () => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Operations completed' });
//         this.onClearAll();
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed' });
//       },
//       complete: () => this.loading.set(false)
//     });
//   }
// }

// // import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { Router } from '@angular/router';
// // import { ButtonModule } from 'primeng/button';
// // import { ToastModule } from 'primeng/toast';
// // import { ToolbarModule } from 'primeng/toolbar';
// // import { IconFieldModule } from 'primeng/iconfield';
// // import { InputIconModule } from 'primeng/inputicon';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { MessageService } from 'primeng/api';
// // import { ProductService } from '../../services/product-service';
// // import { MasterListService } from '../../../../core/services/master-list.service';
// // import { LoadingService } from '../../../../core/services/loading.service';
// // import { AppSharedGrid } from "../../../shared/AgGrid/grid/app-shared-grid/app-shared-grid";
// // import { GridColDef } from "../../../shared/AgGrid/grid/grid.types";
// // @Component({
// //   selector: 'app-bulk-product-entry',
// //   standalone: true,
// //   imports: [CommonModule, ButtonModule, ToastModule, ToolbarModule, IconFieldModule, InputIconModule, InputTextModule, AppSharedGrid],
// //   providers: [MessageService],
// //   template: `
// //     <div class="master-page-container">
// //       <div class="themed-card master-card">
// //         <p-toolbar styleClass="master-toolbar">
// //           <div class="p-toolbar-group-start gap-3">
// //             <h2 class="section-heading m-0">Bulk Product Entry</h2>
// //             <span class="text-sm text-gray-500">Add multiple rows and click Save All</span>
// //           </div>
// //           <div class="p-toolbar-group-end flex gap-2">
// //              <div class="stats mr-4 align-content-center">
// //                <span class="text-sm text-gray-500">Rows: {{ products().length }}</span>
// //             </div>
// //              <!-- <p-button label="Clear" icon="pi pi-trash" styleClass="p-button-text p-button-danger"  (click)="onClearAll()" [disabled]="products().length === 0"></p-button>              -->
// //              <p-button label="Save All" icon="pi pi-check" styleClass="p-button-success" (click)="onSaveAll()" [loading]="loading()"></p-button>
// //         </div>
// //         </p-toolbar>
// //         <div class="master-grid-wrapper" style="height: calc(100vh - 200px);">
// //           <app-shared-grid
// //             [columns]="columns"
// //             [data]="products()"
// //             [showActions]="true"
// //             (gridEvent)="onGridEvent($event)">
// //           </app-shared-grid>
// //         </div>
// //       </div>
// //     </div>
// //     <p-toast></p-toast>
// //   `,
// //   styleUrls: ['./bulk-product-entry.scss'],
// //   changeDetection: ChangeDetectionStrategy.OnPush
// // })
// // export class BulkProductEntry implements OnInit {

// //   private productService = inject(ProductService);
// //   private masterList = inject(MasterListService);
// //   private messageService = inject(MessageService);
// //   private loadingService = inject(LoadingService);
// //   private router = inject(Router);
// //   products = signal<any[]>([]);
// //   loading = signal(false);
// //   gridApi: any;
// //   categories = computed(() => this.masterList.categories().map(m => ({ label: m.name, value: m._id })));
// //   brands = computed(() => this.masterList.brands().map(m => ({ label: m.name, value: m._id })));
// //   units = computed(() => this.masterList.units().map(m => ({ label: m.name, value: m._id })));


// //   columns: GridColDef<any>[] = [];

// //   constructor() {

// //     this.onAddNew();
// //   }

// //   ngOnInit() {
// //     this.initColumns();
// //   }

// //   initColumns() {
// //     this.columns = [
// //       {
// //         field: 'name',
// //         headerName: 'Name',
// //         width: 200,
// //         pinned: 'left',
// //         cellConfig: { type: 'text', placeholder: 'Product Name' }
// //       },
// //       {
// //         field: 'sku',
// //         headerName: 'SKU',
// //         width: 120,
// //         cellConfig: { type: 'text', placeholder: 'Optional' }
// //       },
// //       {
// //         field: 'categoryId',
// //         headerName: 'Category',
// //         width: 150,
// //         cellConfig: {
// //           type: 'select',
// //           placeholder: 'Select Category',
// //           options: this.categories(),
// //           optionLabel: 'label'
// //         }
// //       },
// //       {
// //         field: 'brandId',
// //         headerName: 'Brand',
// //         width: 150,
// //         cellConfig: {
// //           type: 'select',
// //           placeholder: 'Select Brand',
// //           options: this.brands(),
// //           optionLabel: 'label'
// //         }
// //       },
// //       {
// //         field: 'sellingPrice',
// //         headerName: 'Sell Price',
// //         width: 110,
// //         cellConfig: { type: 'number', placeholder: '0.00' }
// //       },
// //       {
// //         field: 'purchasePrice',
// //         headerName: 'Cost Price',
// //         width: 110,
// //         cellConfig: { type: 'number', placeholder: '0.00' }
// //       },
// //       {
// //         field: 'quantity',
// //         headerName: 'Init Qty',
// //         width: 100,
// //         cellConfig: { type: 'number', placeholder: '0' }
// //       }
// //     ];
// //   }


// //   onGridEvent(event: any) {
// //     switch (event.type) {
// //       case 'init':
// //         this.gridApi = event.api;
// //         break;
// //       case 'delete':
// //         this.handleDelete(event.row);
// //         break;

// //     }
// //   }



// //   onAddNew() {
// //     const newProduct = {
// //       _id: `temp_${Date.now()}`,
// //       name: '',
// //       sku: '',
// //       categoryId: null,
// //       brandId: null,
// //       sellingPrice: 0,
// //       purchasePrice: 0,
// //       quantity: 0
// //     };

// //     this.products.update(current => [newProduct, ...current]);
// //   }

// //   handleDelete(row: any) {
// //     this.products.update(current => current.filter(p => p._id !== row._id));
// //   }

// //   onClearAll() {
// //     this.products.set([]);
// //     this.onAddNew();
// //   }


// //   onSaveAll() {

// //     const rowsToSave: any[] = [];
// //     if (this.gridApi) {
// //       this.gridApi.forEachNode((node: any) => {
// //         rowsToSave.push(node.data);
// //       });
// //     } else {

// //       rowsToSave.push(...this.products());
// //     }



// //     const validRows = rowsToSave.filter(r => r.name && r.name.trim() !== '');

// //     if (validRows.length === 0) {
// //       this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'Please enter at least one product Name.' });
// //       return;
// //     }


// //     const invalidCost = validRows.some(r => Number(r.quantity) > 0 && (!r.purchasePrice || Number(r.purchasePrice) <= 0));
// //     if (invalidCost) {
// //       this.messageService.add({ severity: 'error', summary: 'Validation', detail: 'Purchase Price is required if Quantity > 0.' });
// //       return;
// //     }

// //     const payload = validRows.map(r => ({
// //       name: r.name,
// //       sku: r.sku,
// //       categoryId: r.categoryId,
// //       brandId: r.brandId,
// //       sellingPrice: Number(r.sellingPrice),
// //       purchasePrice: Number(r.purchasePrice),
// //       quantity: Number(r.quantity)
// //     }));
// //     this.loading.set(true);
// //     this.productService.bulkImportProducts(payload).subscribe({
// //       next: (res) => {
// //         this.messageService.add({ severity: 'success', summary: 'Success', detail: res.message || 'Bulk import completed' });
// //         this.products.set([]);
// //         this.onAddNew();
// //       },
// //       error: (err) => {
// //         this.messageService.add({ severity: 'error', summary: 'Import Failed', detail: err.error?.message || 'Server error' });
// //       },
// //       complete: () => {
// //         this.loading.set(false);
// //         this.loadingService.hide();
// //       }
// //     });
// //   }
// // }
