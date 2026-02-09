import {
  Component, ChangeDetectionStrategy,
  input, output, computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {
  GridApi, GridOptions, ColDef,
  GridReadyEvent, RowSelectionOptions,
  ModuleRegistry, AllCommunityModule,
  Theme, themeQuartz,
  ICellRendererParams,
  GetRowIdParams
} from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';

import { GridColDef } from '../grid.types';

// Child Components
import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
import { MasterCellEditorComponent } from '../dynamic Columns/master-cell-editor.component';
import { MasterCellRendererComponent } from '../dynamic Columns/master-cell-renderer.component';

ModuleRegistry.registerModules([AllCommunityModule]);

export type SharedGridEvent<T> =
  | { type: 'init'; api: GridApi<T> }
  | { type: 'rowAdded'; row: T }
  | { type: 'editStart'; row: T }
  | { type: 'save'; row: T; data: T }
  | { type: 'bulkSave'; rows: T[] }
  | { type: 'cancel'; row: T }
  | { type: 'delete'; row: T }
  | { type: 'bulkDelete'; rows: T[] }
  | { type: 'selectionChanged'; rows: T[] };

@Component({
  selector: 'app-shared-grid',
  standalone: true,
  imports: [CommonModule, AgGridAngular, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shared-grid.html',
  styleUrl: './app-shared-grid.scss',
})
export class AppSharedGrid<T extends { _id?: string; id?: string }> {

  // --- INPUTS ---
  readonly columns = input.required<GridColDef<T>[]>();
  readonly data = input<T[] | null>(null);
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  readonly showActions = input(false);

  // --- OUTPUTS ---
  readonly gridEvent = output<SharedGridEvent<T>>();

  // --- INTERNAL STATE ---
  private api!: GridApi<T>;

  // 1. DRAFT STATE: Stores "in-progress" edits before saving
  // Key = Row ID, Value = Partial<T> (Modified fields)
  draftMap = new Map<string, Partial<T>>();

  // 2. SIGNALS for UI
  editingIds = signal<Set<string>>(new Set());
  selectedCount = signal(0);
  isBulkEditing = signal(false);

  // --- GRID CONFIGURATION ---
  gridOptions: GridOptions<T> = {
    suppressClickEdit: true,
    animateRows: true, // Smooth animations for Add/Delete
    
    // Robust ID generation (Supports MongoDB _id, generic id, or temp _tempId)
    getRowId: (p: GetRowIdParams<T>) => {
      const data = p.data;
      return data._id || data.id || (data as any)._tempId; 
    },

    // Pass THIS component instance to context so cells can call methods
    context: {
      componentParent: this
    }
  };

  // --- COLUMN DEFINITIONS (Using Optimized Selector) ---
  columnDefs = computed<ColDef<T>[]>(() => {
    const baseCols: ColDef<T>[] = this.columns().map(col => {
      // If no config, just render normal text
      if (!col.cellConfig) return col;

      return {
        ...col,
          editable: false, // 🔑 THIS IS CRITICAL
        // NATIVE AG GRID SELECTOR (High Performance)
        // Decides dynamically whether to show Editor or Renderer
        cellRendererSelector: (params: ICellRendererParams<T>) => {
          const id = params.node.id!;
          const isEditing = this.editingIds().has(id);
          
          return {
            component: isEditing ? MasterCellEditorComponent : MasterCellRendererComponent,
            params: {
              // If editing, show Draft Value. If not, show Real Value.
              value: isEditing ? (this.draftMap.get(id)?.[col.field as keyof T] ?? params.value) : params.value,
              cellConfig: col.cellConfig
            }
          };
        }
      };
    });

    // Append Action Column if enabled
    if (this.showActions()) {
      baseCols.push({
        headerName: 'Actions',
        colId: '__actions__',
        pinned: 'right',
        width: 140,
        cellRenderer: AppSharedGridActionButton
      });
    }
    return baseCols;
  });

  get selectionOptions(): RowSelectionOptions | undefined {
    if (!this.selectionMode()) return undefined;
    return {
      mode: this.selectionMode() === 'single' ? 'singleRow' : 'multiRow'
    };
  }

  // --- LIFECYCLE ---

  onGridReady(e: GridReadyEvent<T>) {
    this.api = e.api;
    this.gridEvent.emit({ type: 'init', api: this.api });
  }

  onSelectionChanged() {
    const selected = this.api.getSelectedRows();
    this.selectedCount.set(selected.length);
    this.gridEvent.emit({ type: 'selectionChanged', rows: selected });
  }

  // --- FEATURE: ADD NEW ROW (Master Feature) ---

  addNewRow() {
    const tempId = `new_${Date.now()}`;
    const newRow: any = { _tempId: tempId };

    // Initialize fields with null or defaults
    this.columns().forEach(c => {
      if (c.field) newRow[c.field] = null;
    });

    // 1. Transaction: Add to Grid immediately
    this.api.applyTransaction({
      add: [newRow],
      addIndex: 0 // Add to top
    });

    // 2. Auto-Start Edit & Init Draft
    this.updateEditingState([tempId], true);
    this.draftMap.set(tempId, { ...newRow });

    this.gridEvent.emit({ type: 'rowAdded', row: newRow });
  }

  // --- FEATURE: BULK EDITING ---

  enableBulkEdit() {
    const selected = this.api.getSelectedNodes();
    if (selected.length === 0) return;

    const idsToEdit: string[] = [];

    selected.forEach(node => {
      if (node.id && node.data) {
        idsToEdit.push(node.id);
        // Initialize draft with current data
        this.draftMap.set(node.id, { ...node.data });
      }
    });

    this.updateEditingState(idsToEdit, true);
    this.isBulkEditing.set(true);
  }

  saveBulkEdit() {
    const updates: T[] = [];
    const nodesToRefresh: any[] = [];
    const idsToStop: string[] = [];

    // Process all currently editing IDs
    this.editingIds().forEach(id => {
      const node = this.api.getRowNode(id);
      const changes = this.draftMap.get(id);

      // We ensure node.data exists before proceeding
      if (node && node.data && changes) {
        
        // 1. Force cast the merged result to T.
        const finalData = { ...node.data, ...changes } as T;
        
        // 2. Safely remove the temp ID property
        delete (finalData as any)._tempId; 

        // Update Grid Data
        node.setData(finalData);
        updates.push(finalData);
        nodesToRefresh.push(node);
      }
      idsToStop.push(id);
    });

    // Cleanup
    this.draftMap.clear();
    this.updateEditingState(idsToStop, false);
    this.isBulkEditing.set(false);

    this.gridEvent.emit({ type: 'bulkSave', rows: updates });
  }

  cancelBulkEdit() {
    const idsToStop: string[] = [];
    
    this.editingIds().forEach(id => {
      idsToStop.push(id);
      
      // Check for new rows that were never saved -> Remove them
      if (id.startsWith('new_')) {
        const node = this.api.getRowNode(id);
        if (node && node.data) {
          this.api.applyTransaction({ remove: [node.data] });
        }
      }
    });

    this.draftMap.clear();
    this.updateEditingState(idsToStop, false);
    this.isBulkEditing.set(false);
  }

  deleteSelected() {
    const selected = this.api.getSelectedRows();
    if (selected.length === 0) return;

    this.api.applyTransaction({ remove: selected });
    this.gridEvent.emit({ type: 'bulkDelete', rows: selected });
    this.selectedCount.set(0); 
  }

  // --- FEATURE: SINGLE ROW ACTIONS ---

  handleRowAction(action: string, row: T) {
    const id = this.getId(row);
    const node = this.api.getRowNode(id);
    if (!id || !node) return;

    switch (action) {
      case 'edit':
        this.draftMap.set(id, { ...row });
        this.updateEditingState([id], true);
        this.gridEvent.emit({ type: 'editStart', row });
        break;

      case 'save':
        const changes = this.draftMap.get(id);
        // Merge & Cast
        const finalData = { ...row, ...changes } as T;
        delete (finalData as any)._tempId;

        // Commit to Grid
        node.setData(finalData);
        
        this.draftMap.delete(id);
        this.updateEditingState([id], false);
        this.gridEvent.emit({ type: 'save', row: finalData, data: finalData });
        break;

      case 'cancel':
        this.draftMap.delete(id);
        // If new row, remove entirely
        if (id.startsWith('new_')) {
          this.api.applyTransaction({ remove: [row] });
        } else {
          this.updateEditingState([id], false);
        }
        this.gridEvent.emit({ type: 'cancel', row });
        break;

      case 'delete':
        this.api.applyTransaction({ remove: [row] });
        this.gridEvent.emit({ type: 'delete', row });
        break;
    }
  }

  /**
   * Called by MasterCellEditorComponent to update Draft State
   */
  updateDraft(id: string, field: string, value: any) {
    const current = this.draftMap.get(id) || {};
    this.draftMap.set(id, { ...current, [field]: value });
  }

  // --- HELPERS ---

  private updateEditingState(ids: string[], isEditing: boolean) {
    const currentSet = new Set(this.editingIds());
    const nodesToRefresh: any[] = [];

    ids.forEach(id => {
      if (isEditing) currentSet.add(id);
      else currentSet.delete(id);

      const node = this.api.getRowNode(id);
      if (node) nodesToRefresh.push(node);
    });

    // Update Signal
    this.editingIds.set(currentSet);

    // Efficient Refresh (Only refreshes changed rows, not whole grid)
    if (nodesToRefresh.length > 0) {
      this.api.refreshCells({ rowNodes: nodesToRefresh, force: true });
    }
  }

  private getId(row: any): string {
    return row._id ?? row.id ?? row._tempId ?? '';
  }

  // Computed Theme for Styling
  readonly agTheme = computed<Theme>(() =>
    themeQuartz.withParams({
      fontFamily: 'var(--font-body)',
      fontSize: '13px',
      backgroundColor: 'var(--theme-bg-primary)',
      headerBackgroundColor: 'var(--theme-bg-secondary)',
      foregroundColor: 'var(--theme-text-primary)',
      borderColor: 'var(--theme-border-primary)',
      rowHoverColor: 'var(--component-bg-hover)',
      rowHeight: 42,
      headerHeight: 46,
      spacing: 5,
    })
  );
}

// import {
//   Component, ChangeDetectionStrategy,
//   input, output, computed,
//   signal, ViewChild
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { AgGridAngular } from 'ag-grid-angular';
// import {
//   GridApi, GridOptions, ColDef,
//   GridReadyEvent, RowSelectionOptions,
//   ModuleRegistry, AllCommunityModule,
//   Theme, themeQuartz,
//   ICellRendererParams,
//   GetRowIdParams
// } from 'ag-grid-community';
// import { ButtonModule } from 'primeng/button';

// import { GridColDef } from '../grid.types';

// import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
// import { MasterCellEditorComponent } from '../dynamic Columns/master-cell-editor.component';
// import { MasterCellRendererComponent } from '../dynamic Columns/master-cell-renderer.component';

// ModuleRegistry.registerModules([AllCommunityModule]);

// export type SharedGridEvent<T> =
//   | { type: 'init'; api: GridApi<T> }
//   | { type: 'rowAdded'; row: T }
//   | { type: 'editStart'; row: T }
//   | { type: 'save'; row: T; data: T }
//   | { type: 'bulkSave'; rows: T[] } // Restored
//   | { type: 'cancel'; row: T }
//   | { type: 'delete'; row: T }
//   | { type: 'bulkDelete'; rows: T[] } // Restored
//   | { type: 'selectionChanged'; rows: T[] };

// @Component({
//   selector: 'app-shared-grid',
//   standalone: true,
//   imports: [CommonModule, AgGridAngular, ButtonModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './app-shared-grid.html',
//   styleUrl: './app-shared-grid.scss',
// })
// export class AppSharedGrid<T extends { _id?: string; id?: string }> {

//   // --- INPUTS ---
//   readonly columns = input.required<GridColDef<T>[]>();
//   readonly data = input<T[] | null>(null);
//   readonly selectionMode = input<'single' | 'multiple' | null>(null);
//   readonly showActions = input(false);

//   // --- OUTPUTS ---
//   readonly gridEvent = output<SharedGridEvent<T>>();

//   // --- INTERNAL STATE ---
//   private api!: GridApi<T>;

//   // 1. DRAFT STATE: Stores "in-progress" edits before saving
//   // Key = Row ID, Value = Partial<T> (Modified fields)
//   draftMap = new Map<string, Partial<T>>();

//   // 2. SIGNALS for UI
//   editingIds = signal<Set<string>>(new Set());
//   selectedCount = signal(0);
//   isBulkEditing = signal(false);

//   // --- GRID CONFIGURATION ---
//   gridOptions: GridOptions<T> = {
//     suppressClickEdit: true,
//     animateRows: true, // Smooth animations for Add/Delete
    
//     // Robust ID generation
//     getRowId: (p: GetRowIdParams<T>) => {
//       const data = p.data;
//       return data._id || data.id || (data as any)._tempId; 
//     },

//     // Pass THIS component instance to context so cells can call methods
//     context: {
//       componentParent: this
//     }
//   };

//   // --- COLUMN DEFINITIONS (Using Optimized Selector) ---
//   columnDefs = computed<ColDef<T>[]>(() => {
//     const baseCols: ColDef<T>[] = this.columns().map(col => {
//       if (!col.cellConfig) return col;

//       return {
//         ...col,
//         // NATIVE AG GRID SELECTOR (High Performance)
//         cellRendererSelector: (params: ICellRendererParams<T>) => {
//           const id = params.node.id!;
//           const isEditing = this.editingIds().has(id);
          
//           return {
//             component: isEditing ? MasterCellEditorComponent : MasterCellRendererComponent,
//             params: {
//               // If editing, show Draft Value. If not, show Real Value.
//               value: isEditing ? (this.draftMap.get(id)?.[col.field as keyof T] ?? params.value) : params.value,
//               cellConfig: col.cellConfig
//             }
//           };
//         }
//       };
//     });

//     if (this.showActions()) {
//       baseCols.push({
//         headerName: 'Actions',
//         colId: '__actions__',
//         pinned: 'right',
//         width: 140,
//         cellRenderer: AppSharedGridActionButton
//       });
//     }
//     return baseCols;
//   });

//   get selectionOptions(): RowSelectionOptions | undefined {
//     if (!this.selectionMode()) return undefined;
//     return {
//       mode: this.selectionMode() === 'single' ? 'singleRow' : 'multiRow'
//     };
//   }

//   // --- LIFECYCLE ---

//   onGridReady(e: GridReadyEvent<T>) {
//     this.api = e.api;
//     this.gridEvent.emit({ type: 'init', api: this.api });
//   }

//   onSelectionChanged() {
//     const selected = this.api.getSelectedRows();
//     this.selectedCount.set(selected.length);
//     this.gridEvent.emit({ type: 'selectionChanged', rows: selected });
//   }

//   // --- FEATURE: ADD NEW ROW (Master Feature) ---

//   addNewRow() {
//     const tempId = `new_${Date.now()}`;
//     const newRow: any = { _tempId: tempId };

//     // Initialize fields
//     this.columns().forEach(c => {
//       if (c.field) newRow[c.field] = null;
//     });

//     // Transaction Add
//     this.api.applyTransaction({
//       add: [newRow],
//       addIndex: 0
//     });

//     // Auto-Start Edit
//     this.updateEditingState([tempId], true);
//     this.draftMap.set(tempId, { ...newRow }); // Init draft

//     this.gridEvent.emit({ type: 'rowAdded', row: newRow });
//   }

//   // --- FEATURE: BULK EDITING (Restored) ---

//   enableBulkEdit() {
//     const selected = this.api.getSelectedNodes();
//     if (selected.length === 0) return;

//     const idsToEdit: string[] = [];

//     selected.forEach(node => {
//       if (node.id && node.data) {
//         idsToEdit.push(node.id);
//         // Initialize draft with current data
//         this.draftMap.set(node.id, { ...node.data });
//       }
//     });

//     this.updateEditingState(idsToEdit, true);
//     this.isBulkEditing.set(true);
//   }

//   saveBulkEdit() {
//     const updates: T[] = [];
//     const nodesToRefresh: any[] = [];
//     const idsToStop: string[] = [];

//     // Process all currently editing IDs
//     this.editingIds().forEach(id => {
//       const node = this.api.getRowNode(id);
//       const changes = this.draftMap.get(id);

//       // We ensure node.data exists before proceeding
//       if (node && node.data && changes) {
        
//         // 1. Force cast the merged result to T.
//         // We know this is safe because we are merging 'T' with 'Partial<T>'
//         const finalData = { ...node.data, ...changes } as T;
        
//         // 2. Safely remove the temp ID property
//         // (casting to 'any' is standard for deleting optional/dynamic props)
//         delete (finalData as any)._tempId; 

//         // Update Grid Data
//         node.setData(finalData);
//         updates.push(finalData);
//         nodesToRefresh.push(node);
//       }
//       idsToStop.push(id);
//     });

//     // Cleanup
//     this.draftMap.clear();
//     this.updateEditingState(idsToStop, false);
//     this.isBulkEditing.set(false);

//     this.gridEvent.emit({ type: 'bulkSave', rows: updates });
//   }

//   cancelBulkEdit() {
//     const idsToStop: string[] = [];
    
//     this.editingIds().forEach(id => {
//       idsToStop.push(id);
      
//       // Check for new rows that were never saved
//       if (id.startsWith('new_')) {
//         const node = this.api.getRowNode(id);
//         // Only remove if node.data exists
//         if (node && node.data) {
//           this.api.applyTransaction({ remove: [node.data] });
//         }
//       }
//     });

//     this.draftMap.clear();
//     this.updateEditingState(idsToStop, false);
//     this.isBulkEditing.set(false);
//   }
  
//   // saveBulkEdit() {
//   //   const updates: T[] = [];
//   //   const nodesToRefresh: any[] = [];
//   //   const idsToStop: string[] = [];

//   //   // Process all currently editing IDs
//   //   this.editingIds().forEach(id => {
//   //     const node = this.api.getRowNode(id);
//   //     const changes = this.draftMap.get(id);

//   //     if (node && changes) {
//   //       const finalData = { ...node.data, ...changes };
//   //       delete (finalData as any)._tempId; // Clean temp ID if any

//   //       // Update Grid Data
//   //       node.setData(finalData);
//   //       updates.push(finalData);
//   //       nodesToRefresh.push(node);
//   //     }
//   //     idsToStop.push(id);
//   //   });

//   //   // Cleanup
//   //   this.draftMap.clear();
//   //   this.updateEditingState(idsToStop, false);
//   //   this.isBulkEditing.set(false);

//   //   this.gridEvent.emit({ type: 'bulkSave', rows: updates });
//   // }

//   // cancelBulkEdit() {
//   //   const idsToStop: string[] = [];
    
//   //   // Just stop editing. Since we used Draft Map, original data in grid is untouched!
//   //   this.editingIds().forEach(id => {
//   //     idsToStop.push(id);
      
//   //     // If it was a new row (never saved), remove it from grid
//   //     if (id.startsWith('new_')) {
//   //       const node = this.api.getRowNode(id);
//   //       if (node) this.api.applyTransaction({ remove: [node.data] });
//   //     }
//   //   });

//   //   this.draftMap.clear();
//   //   this.updateEditingState(idsToStop, false);
//   //   this.isBulkEditing.set(false);
//   // }

//   deleteSelected() {
//     const selected = this.api.getSelectedRows();
//     if (selected.length === 0) return;

//     this.api.applyTransaction({ remove: selected });
//     this.gridEvent.emit({ type: 'bulkDelete', rows: selected });
//     // Reset selection count
//     this.selectedCount.set(0); 
//   }

//   // --- FEATURE: SINGLE ROW ACTIONS ---

//   handleRowAction(action: string, row: T) {
//     const id = this.getId(row);
//     const node = this.api.getRowNode(id);
//     if (!id || !node) return;

//     switch (action) {
//       case 'edit':
//         this.draftMap.set(id, { ...row });
//         this.updateEditingState([id], true);
//         this.gridEvent.emit({ type: 'editStart', row });
//         break;

//       case 'save':
//         const changes = this.draftMap.get(id);
//         const finalData = { ...row, ...changes };
//         delete (finalData as any)._tempId;

//         node.setData(finalData);
        
//         this.draftMap.delete(id);
//         this.updateEditingState([id], false);
//         this.gridEvent.emit({ type: 'save', row: finalData, data: finalData });
//         break;

//       case 'cancel':
//         this.draftMap.delete(id);
//         if (id.startsWith('new_')) {
//           this.api.applyTransaction({ remove: [row] });
//         } else {
//           this.updateEditingState([id], false);
//         }
//         this.gridEvent.emit({ type: 'cancel', row });
//         break;

//       case 'delete':
//         this.api.applyTransaction({ remove: [row] });
//         this.gridEvent.emit({ type: 'delete', row });
//         break;
//     }
//   }

//   /**
//    * Called by Editor Component to update Draft State
//    */
//   updateDraft(id: string, field: string, value: any) {
//     const current = this.draftMap.get(id) || {};
//     this.draftMap.set(id, { ...current, [field]: value });
//   }

//   // --- HELPERS ---

//   private updateEditingState(ids: string[], isEditing: boolean) {
//     const currentSet = new Set(this.editingIds());
//     const nodesToRefresh: any[] = [];

//     ids.forEach(id => {
//       if (isEditing) currentSet.add(id);
//       else currentSet.delete(id);

//       const node = this.api.getRowNode(id);
//       if (node) nodesToRefresh.push(node);
//     });

//     // Update Signal
//     this.editingIds.set(currentSet);

//     // Efficient Refresh (Only refreshes changed rows, not whole grid)
//     if (nodesToRefresh.length > 0) {
//       this.api.refreshCells({ rowNodes: nodesToRefresh, force: true });
//     }
//   }

//   private getId(row: any): string {
//     return row._id ?? row.id ?? row._tempId ?? '';
//   }

//   readonly agTheme = computed<Theme>(() =>
//     themeQuartz.withParams({
//       fontFamily: 'var(--font-body)',
//       fontSize: '13px',
//       backgroundColor: 'var(--theme-bg-primary)',
//       headerBackgroundColor: 'var(--theme-bg-secondary)',
//       foregroundColor: 'var(--theme-text-primary)',
//       borderColor: 'var(--theme-border-primary)',
//       rowHoverColor: 'var(--component-bg-hover)',
//       rowHeight: 42,
//       headerHeight: 46,
//       spacing: 5,
//     })
//   );
// }
// // import {
// //   Component, ChangeDetectionStrategy,
// //   input, output, computed,
// //   signal
// // } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { AgGridAngular } from 'ag-grid-angular';
// // import {
// //   GridApi, GridOptions, ColDef,
// //   GridReadyEvent, RowSelectionOptions,
// //   ModuleRegistry, AllCommunityModule,
// //   Theme, themeQuartz
// // } from 'ag-grid-community';

// // // PrimeNG Imports for Toolbar Buttons
// // import { ButtonModule } from 'primeng/button';

// // import { GridColDef } from '../grid.types';
// // import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
// // import { SmartWrapperComponent } from '../dynamic Columns/smart-wrapper.component';

// // ModuleRegistry.registerModules([AllCommunityModule]);

// // export type SharedGridEvent<T> =
// //   | { type: 'init'; api: GridApi<T> }
// //   | { type: 'editStart'; row: T }
// //   | { type: 'save'; row: T }
// //   | { type: 'bulkSave'; rows: T[] }
// //   | { type: 'cancel'; row: T }
// //   | { type: 'delete'; row: T }
// //   | { type: 'selectionChanged'; rows: T[] };

// // @Component({
// //   selector: 'app-shared-grid',
// //   standalone: true,
// //   imports: [CommonModule, AgGridAngular, ButtonModule], // Added ButtonModule
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   templateUrl: './app-shared-grid.html',
// //   styleUrl: './app-shared-grid.scss',
// // })
// // export class AppSharedGrid<T extends { _id?: string; id?: string }> {
// //   // --- INPUTS & OUTPUTS ---
// //   readonly columns = input.required<GridColDef<T>[]>();
// //   readonly data = input<T[] | null>(null);
// //   readonly selectionMode = input<'single' | 'multiple' | null>(null);
// //   readonly showActions = input(false);
// //   readonly gridEvent = output<SharedGridEvent<T>>();

// //   // --- INTERNAL STATE ---
// //   private api!: GridApi<T>;

// //   // Track IDs currently in "Edit Mode"
// //   editingIds = new Set<string>();

// //   // Store original data to support "Cancel"
// //   private snapshotMap = new Map<string, T>();

// //   // UI Signals for the Toolbar
// //   isBulkEditing = signal(false);
// //   selectedCount = signal(0);

// //   // --- GRID CONFIGURATION ---
// //   gridOptions: GridOptions<T> = {
// //     // We disable native click editing because we control it manually
// //     suppressClickEdit: true,
// //     getRowId: p => p.data?._id ?? p.data?.id ?? '',

// //     // Pass our state to the context so components can access it
// //     context: {
// //       editingIds: this.editingIds,
// //       isRowEditing: (row: T) => this.editingIds.has(this.getId(row)),
// //       // Unified Action Handler for Buttons & Enter Key
// //       onAction: (a: string, r: T) => this.onAction(a, r)
// //     }
// //   };

// //   columnDefs = computed<ColDef<T>[]>(() => {
// //     const baseCols: ColDef<T>[] = this.columns().map(col => {
// //       // If no config, just render normal text
// //       if (!col.cellConfig) return col;

// //       return {
// //         ...col,
// //         // Use SmartWrapper to toggle between Editor/Renderer
// //         cellRenderer: SmartWrapperComponent,
// //         cellRendererParams: { cellConfig: col.cellConfig },
// //       };
// //     });

// //     // Add Action Column if enabled
// //     if (this.showActions()) {
// //       baseCols.push({
// //         headerName: 'Actions',
// //         colId: '__actions__',
// //         pinned: 'right',
// //         width: 140,
// //         editable: false,
// //         sortable: false,
// //         filter: false,
// //         cellRenderer: AppSharedGridActionButton
// //       });
// //     }
// //     return baseCols;
// //   });

// //   // --- LIFECYCLE HANDLERS ---

// //   onGridReady(e: GridReadyEvent<T>) {
// //     this.api = e.api;
// //     this.gridEvent.emit({ type: 'init', api: this.api });
// //   }

// //   onSelectionChanged() {
// //     const selected = this.api.getSelectedRows();
// //     // Update Signal -> Update Toolbar UI
// //     this.selectedCount.set(selected.length);

// //     this.gridEvent.emit({
// //       type: 'selectionChanged',
// //       rows: selected
// //     });
// //   }

// //   // --- UNIFIED ACTION LOGIC (Single Row Operations) ---

// //   private onAction(action: string, row: T) {
// //     const id = this.getId(row);
// //     const node = this.api.getRowNode(id);
// //     if (!node) return;

// //     switch (action) {
// //       case 'edit':
// //         // Save state before editing
// //         this.snapshotMap.set(id, { ...row });
// //         this.editingIds.add(id);
// //         // Refresh this row to show inputs
// //         this.api.refreshCells({ rowNodes: [node], force: true });
// //         this.gridEvent.emit({ type: 'editStart', row });
// //         break;

// //       case 'save':
// //         // Remove from edit set
// //         this.editingIds.delete(id);
// //         this.snapshotMap.delete(id);
// //         // Refresh this row to show text again
// //         this.api.refreshCells({ rowNodes: [node], force: true });
// //         // Emit updated data (Editor updated the node directly)
// //         this.gridEvent.emit({ type: 'save', row: node.data! });
// //         break;

// //       case 'cancel':
// //         // Restore original data
// //         const original = this.snapshotMap.get(id);
// //         if (original) node.setData(original);

// //         this.editingIds.delete(id);
// //         this.snapshotMap.delete(id);
// //         this.api.refreshCells({ rowNodes: [node], force: true });
// //         this.gridEvent.emit({ type: 'cancel', row: node.data! });
// //         break;

// //       case 'delete':
// //         this.gridEvent.emit({ type: 'delete', row });
// //         break;
// //     }
// //   }

// //   // --- BULK ACTION LOGIC (Called by Internal Toolbar) ---

// //   enableBulkEdit() {
// //     const selected = this.api.getSelectedRows();
// //     if (selected.length === 0) return;

// //     // Add all selected rows to edit set
// //     selected.forEach(row => {
// //       const id = this.getId(row);
// //       this.snapshotMap.set(id, { ...row });
// //       this.editingIds.add(id);
// //     });

// //     this.isBulkEditing.set(true); // Update Toolbar UI
// //     this.api.refreshCells({ force: true }); // Refresh all to show inputs
// //   }

// //   saveBulkEdit() {
// //     const updates: T[] = [];

// //     // Collect all rows that were in edit mode
// //     this.editingIds.forEach(id => {
// //       const node = this.api.getRowNode(id);
// //       if (node && node.data) updates.push(node.data);
// //     });

// //     // Clear state
// //     this.editingIds.clear();
// //     this.snapshotMap.clear();
// //     this.isBulkEditing.set(false);

// //     // Refresh UI back to read-only
// //     this.api.refreshCells({ force: true });

// //     this.gridEvent.emit({ type: 'bulkSave', rows: updates });
// //   }

// //   cancelBulkEdit() {
// //     // Restore all original values
// //     this.editingIds.forEach(id => {
// //       const node = this.api.getRowNode(id);
// //       const original = this.snapshotMap.get(id);
// //       if (node && original) node.setData(original);
// //     });

// //     this.editingIds.clear();
// //     this.snapshotMap.clear();
// //     this.isBulkEditing.set(false);

// //     this.api.refreshCells({ force: true });
// //   }

// //   deleteSelected() {
// //     const selected = this.api.getSelectedRows();
// //     // You can loop and emit 'delete' for each, or create a new 'bulkDelete' event
// //     selected.forEach(row => this.gridEvent.emit({ type: 'delete', row }));
// //   }

// //   // --- HELPERS ---

// //   private getId(row: any): string {
// //     return row?._id ?? row?.id ?? '';
// //   }

// //   get selectionOptions(): RowSelectionOptions | undefined {
// //     if (!this.selectionMode()) return;
// //     return {
// //       mode: this.selectionMode() === 'single' ? 'singleRow' : 'multiRow'
// //     };
// //   }

// //   readonly agTheme = computed<Theme>(() =>
// //     themeQuartz.withParams({
// //       /* Typography */
// //       fontFamily: 'var(--font-body)',
// //       fontSize: '13px', // Slightly smaller for dense data, or use var(--font-size-sm)

// //       /* Backgrounds */
// //       backgroundColor: 'var(--theme-bg-primary)',
// //       headerBackgroundColor: 'var(--theme-bg-secondary)',

// //       /* Text */
// //       foregroundColor: 'var(--theme-text-primary)',
// //       headerTextColor: 'var(--theme-text-tertiary)', // Muted headers
// //       // secondaryForegroundColor: 'var(--theme-text-secondary)', // For disabled/secondary text

// //       /* Borders */
// //       borderColor: 'var(--theme-border-primary)',
// //       headerColumnResizeHandleColor: 'var(--theme-border-secondary)',

// //       /* Interaction & Selection */
// //       rowHoverColor: 'var(--component-bg-hover)', // Subtle hover
// //       selectedRowBackgroundColor: 'rgba(var(--accent-primary-rgb), 0.08)', // Tinted selection
// //       rangeSelectionBackgroundColor: 'rgba(var(--accent-primary-rgb), 0.15)',
// //       rangeSelectionBorderColor: 'var(--theme-accent-primary)',

// //       /* Inputs (Editors) */
// //       inputBackgroundColor: 'var(--theme-bg-primary)',
// //       inputBorder: '1px solid var(--theme-border-primary)',
// //       // inputFocusBorderColor: 'var(--theme-accent-primary)',
// //       inputPlaceholderTextColor: 'var(--theme-text-tertiary)',

// //       /* Icons & UI Controls */
// //       checkboxCheckedBackgroundColor: 'var(--theme-accent-primary)',
// //       checkboxCheckedBorderColor: 'var(--theme-accent-primary)',
// //       checkboxUncheckedBackgroundColor: 'var(--theme-bg-ternary)',
// //       checkboxUncheckedBorderColor: 'var(--theme-border-secondary)',

// //       /* Density & Spacing */
// //       rowHeight: 40,       // Compact rows (Standard is usually 48-50)
// //       headerHeight: 42,    // Slightly taller header for clarity
// //       spacing: 4,          // Tighter cell padding
// //       cellHorizontalPaddingScale: 0.8, // Reduces left/right padding inside cells
// //     })
// //   );
// // }
