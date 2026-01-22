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
  Theme, themeQuartz
} from 'ag-grid-community';

// PrimeNG Imports for Toolbar Buttons
import { ButtonModule } from 'primeng/button'; 

import { GridColDef } from '../grid.types';
import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
import { SmartWrapperComponent } from '../dynamic Columns/smart-wrapper.component';

ModuleRegistry.registerModules([AllCommunityModule]);

export type SharedGridEvent<T> =
  | { type: 'init'; api: GridApi<T> }
  | { type: 'editStart'; row: T }
  | { type: 'save'; row: T }
  | { type: 'bulkSave'; rows: T[] }
  | { type: 'cancel'; row: T }
  | { type: 'delete'; row: T }
  | { type: 'selectionChanged'; rows: T[] };

@Component({
  selector: 'app-shared-grid',
  standalone: true,
  imports: [CommonModule, AgGridAngular, ButtonModule], // Added ButtonModule
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shared-grid.html',
  styleUrl: './app-shared-grid.scss',
})
export class AppSharedGrid<T extends { _id?: string; id?: string }> {
  // --- INPUTS & OUTPUTS ---
  readonly columns = input.required<GridColDef<T>[]>();
  readonly data = input<T[] | null>(null);
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  readonly showActions = input(false);
  readonly gridEvent = output<SharedGridEvent<T>>();

  // --- INTERNAL STATE ---
  private api!: GridApi<T>;
  
  // Track IDs currently in "Edit Mode"
  editingIds = new Set<string>();
  
  // Store original data to support "Cancel"
  private snapshotMap = new Map<string, T>();

  // UI Signals for the Toolbar
  isBulkEditing = signal(false); 
  selectedCount = signal(0);     

  // --- GRID CONFIGURATION ---
  gridOptions: GridOptions<T> = {
    // We disable native click editing because we control it manually
    suppressClickEdit: true, 
    getRowId: p => p.data?._id ?? p.data?.id ?? '',
    
    // Pass our state to the context so components can access it
    context: {
      editingIds: this.editingIds,
      isRowEditing: (row: T) => this.editingIds.has(this.getId(row)),
      // Unified Action Handler for Buttons & Enter Key
      onAction: (a: string, r: T) => this.onAction(a, r)
    }
  };

  columnDefs = computed<ColDef<T>[]>(() => {
    const baseCols: ColDef<T>[] = this.columns().map(col => {
      // If no config, just render normal text
      if (!col.cellConfig) return col;
      
      return {
        ...col,
        // Use SmartWrapper to toggle between Editor/Renderer
        cellRenderer: SmartWrapperComponent,
        cellRendererParams: { cellConfig: col.cellConfig },
      };
    });

    // Add Action Column if enabled
    if (this.showActions()) {
      baseCols.push({
        headerName: 'Actions',
        colId: '__actions__',
        pinned: 'right',
        width: 140,
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: AppSharedGridActionButton
      });
    }
    return baseCols;
  });

  // --- LIFECYCLE HANDLERS ---

  onGridReady(e: GridReadyEvent<T>) {
    this.api = e.api;
    this.gridEvent.emit({ type: 'init', api: this.api });
  }

  onSelectionChanged() {
    const selected = this.api.getSelectedRows();
    // Update Signal -> Update Toolbar UI
    this.selectedCount.set(selected.length);
    
    this.gridEvent.emit({
      type: 'selectionChanged',
      rows: selected
    });
  }

  // --- UNIFIED ACTION LOGIC (Single Row Operations) ---

  private onAction(action: string, row: T) {
    const id = this.getId(row);
    const node = this.api.getRowNode(id);
    if (!node) return;

    switch (action) {
      case 'edit':
        // Save state before editing
        this.snapshotMap.set(id, { ...row });
        this.editingIds.add(id);
        // Refresh this row to show inputs
        this.api.refreshCells({ rowNodes: [node], force: true });
        this.gridEvent.emit({ type: 'editStart', row });
        break;

      case 'save':
        // Remove from edit set
        this.editingIds.delete(id);
        this.snapshotMap.delete(id);
        // Refresh this row to show text again
        this.api.refreshCells({ rowNodes: [node], force: true });
        // Emit updated data (Editor updated the node directly)
        this.gridEvent.emit({ type: 'save', row: node.data! });
        break;

      case 'cancel':
        // Restore original data
        const original = this.snapshotMap.get(id);
        if (original) node.setData(original);
        
        this.editingIds.delete(id);
        this.snapshotMap.delete(id);
        this.api.refreshCells({ rowNodes: [node], force: true });
        this.gridEvent.emit({ type: 'cancel', row: node.data! });
        break;

      case 'delete':
        this.gridEvent.emit({ type: 'delete', row });
        break;
    }
  }

  // --- BULK ACTION LOGIC (Called by Internal Toolbar) ---

  enableBulkEdit() {
    const selected = this.api.getSelectedRows();
    if (selected.length === 0) return;

    // Add all selected rows to edit set
    selected.forEach(row => {
      const id = this.getId(row);
      this.snapshotMap.set(id, { ...row });
      this.editingIds.add(id);
    });

    this.isBulkEditing.set(true); // Update Toolbar UI
    this.api.refreshCells({ force: true }); // Refresh all to show inputs
  }

  saveBulkEdit() {
    const updates: T[] = [];
    
    // Collect all rows that were in edit mode
    this.editingIds.forEach(id => {
      const node = this.api.getRowNode(id);
      if (node && node.data) updates.push(node.data);
    });

    // Clear state
    this.editingIds.clear();
    this.snapshotMap.clear();
    this.isBulkEditing.set(false);
    
    // Refresh UI back to read-only
    this.api.refreshCells({ force: true });
    
    this.gridEvent.emit({ type: 'bulkSave', rows: updates });
  }

  cancelBulkEdit() {
    // Restore all original values
    this.editingIds.forEach(id => {
      const node = this.api.getRowNode(id);
      const original = this.snapshotMap.get(id);
      if (node && original) node.setData(original);
    });

    this.editingIds.clear();
    this.snapshotMap.clear();
    this.isBulkEditing.set(false);

    this.api.refreshCells({ force: true });
  }
  
  deleteSelected() {
     const selected = this.api.getSelectedRows();
     // You can loop and emit 'delete' for each, or create a new 'bulkDelete' event
     selected.forEach(row => this.gridEvent.emit({ type: 'delete', row }));
  }

  // --- HELPERS ---

  private getId(row: any): string {
    return row?._id ?? row?.id ?? '';
  }

  get selectionOptions(): RowSelectionOptions | undefined {
    if (!this.selectionMode()) return;
    return {
      mode: this.selectionMode() === 'single' ? 'singleRow' : 'multiRow'
    };
  }

readonly agTheme = computed<Theme>(() =>
  themeQuartz.withParams({
    /* Typography */
    fontFamily: 'var(--font-body)',
    fontSize: '13px', // Slightly smaller for dense data, or use var(--font-size-sm)

    /* Backgrounds */
    backgroundColor: 'var(--theme-bg-primary)',
    headerBackgroundColor: 'var(--theme-bg-secondary)',
    
    /* Text */
    foregroundColor: 'var(--theme-text-primary)',
    headerTextColor: 'var(--theme-text-tertiary)', // Muted headers
    // secondaryForegroundColor: 'var(--theme-text-secondary)', // For disabled/secondary text

    /* Borders */
    borderColor: 'var(--theme-border-primary)',
    headerColumnResizeHandleColor: 'var(--theme-border-secondary)',

    /* Interaction & Selection */
    rowHoverColor: 'var(--component-bg-hover)', // Subtle hover
    selectedRowBackgroundColor: 'rgba(var(--accent-primary-rgb), 0.08)', // Tinted selection
    rangeSelectionBackgroundColor: 'rgba(var(--accent-primary-rgb), 0.15)',
    rangeSelectionBorderColor: 'var(--theme-accent-primary)',
    
    /* Inputs (Editors) */
    inputBackgroundColor: 'var(--theme-bg-primary)',
    inputBorder: '1px solid var(--theme-border-primary)',
    // inputFocusBorderColor: 'var(--theme-accent-primary)',
    inputPlaceholderTextColor: 'var(--theme-text-tertiary)',

    /* Icons & UI Controls */
    checkboxCheckedBackgroundColor: 'var(--theme-accent-primary)',
    checkboxCheckedBorderColor: 'var(--theme-accent-primary)',
    checkboxUncheckedBackgroundColor: 'var(--theme-bg-ternary)',
    checkboxUncheckedBorderColor: 'var(--theme-border-secondary)',

    /* Density & Spacing */
    rowHeight: 40,       // Compact rows (Standard is usually 48-50)
    headerHeight: 42,    // Slightly taller header for clarity
    spacing: 4,          // Tighter cell padding
    cellHorizontalPaddingScale: 0.8, // Reduces left/right padding inside cells
  })
);

}


// import {
//   Component, ChangeDetectionStrategy,
//   input, output, computed,
//   signal
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { AgGridAngular } from 'ag-grid-angular';
// import {
//   GridApi, GridOptions, ColDef,
//   GridReadyEvent, RowSelectionOptions,
//   ModuleRegistry, AllCommunityModule,
//   Theme, themeQuartz
// } from 'ag-grid-community';

// import { GridColDef } from '../grid.types';
// import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
// import { SmartWrapperComponent } from '../dynamic Columns/smart-wrapper.component';
// import { Button } from "primeng/button";

// ModuleRegistry.registerModules([AllCommunityModule]);

// export type SharedGridEvent<T> =
//   | { type: 'init'; api: GridApi<T> }
//   | { type: 'editStart'; row: T }
//   | { type: 'save'; row: T }
//   | { type: 'bulkSave'; rows: T[] }
//   | { type: 'cancel'; row: T }
//   | { type: 'delete'; row: T }
//   | { type: 'selectionChanged'; rows: T[] };

// @Component({
//   selector: 'app-shared-grid',
//   standalone: true,
//   imports: [CommonModule, AgGridAngular, Button],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './app-shared-grid.html',
//   styleUrl: './app-shared-grid.scss',
// })
// export class AppSharedGrid<T extends { _id?: string; id?: string }> {
//   readonly columns = input.required<GridColDef<T>[]>();
//   readonly data = input<T[] | null>(null);
//   readonly selectionMode = input<'single' | 'multiple' | null>(null);
//   readonly showActions = input(false);
//   readonly gridEvent = output<SharedGridEvent<T>>();

//   private api!: GridApi<T>;
//   editingIds = new Set<string>();
//   private snapshotMap = new Map<string, T>();
//   // --- INTERNAL STATE (UI Signals) ---
//   isBulkEditing = signal(false); // Controls Toolbar State
//   selectedCount = signal(0);     // Controls Button Disable State
//   // Grid Logic State


//   gridOptions: GridOptions<T> = {
//     suppressClickEdit: true, // We handle edit state manually
//     getRowId: p => p.data?._id ?? p.data?.id ?? '',
//     context: {
//       editingIds: this.editingIds,
//       isRowEditing: (row: T) => this.editingIds.has(this.getId(row)),
//       // This listener handles BOTH Button Clicks and Enter Key events
//       onAction: (a: string, r: T) => this.onAction(a, r)
//     }
//   };

//   columnDefs = computed<ColDef<T>[]>(() => {
//     const baseCols: ColDef<T>[] = this.columns().map(col => {
//       if (!col.cellConfig) return col;
//       return {
//         ...col,
//         cellRenderer: SmartWrapperComponent,
//         cellRendererParams: { cellConfig: col.cellConfig },
//       };
//     });

//     if (this.showActions()) {
//       baseCols.push({
//         headerName: 'Actions',
//         colId: '__actions__',
//         pinned: 'right',
//         width: 140,
//         editable: false,
//         sortable: false,
//         filter: false,
//         cellRenderer: AppSharedGridActionButton
//       });
//     }
//     return baseCols;
//   });

//   onGridReady(e: GridReadyEvent<T>) {
//     this.api = e.api;
//     this.gridEvent.emit({ type: 'init', api: this.api });
//   }

//   onSelectionChanged() {
//     this.gridEvent.emit({
//       type: 'selectionChanged',
//       rows: this.api.getSelectedRows()
//     });
//   }

//   private onAction(action: string, row: T) {
//     const id = this.getId(row);
//     const node = this.api.getRowNode(id);
//     if (!node) return;

//     switch (action) {
//       case 'edit':
//         this.snapshotMap.set(id, { ...row });
//         this.editingIds.add(id);
//         this.api.refreshCells({ rowNodes: [node], force: true });
//         this.gridEvent.emit({ type: 'editStart', row });
//         break;

//       case 'save':
//         // Triggered by Button OR Enter Key
//         this.editingIds.delete(id);
//         this.snapshotMap.delete(id);
//         this.api.refreshCells({ rowNodes: [node], force: true });
//         this.gridEvent.emit({ type: 'save', row: node.data! });
//         break;

//       case 'cancel':
//         const original = this.snapshotMap.get(id);
//         if (original) node.setData(original);
//         this.editingIds.delete(id);
//         this.snapshotMap.delete(id);
//         this.api.refreshCells({ rowNodes: [node], force: true });
//         this.gridEvent.emit({ type: 'cancel', row: node.data! });
//         break;

//       case 'delete':
//         this.gridEvent.emit({ type: 'delete', row });
//         break;
//     }
//   }

//   // --- BULK METHODS ---
//   enableBulkEdit() {
//     const selected = this.api.getSelectedRows();
//     if (selected.length === 0) return;
//     selected.forEach(row => {
//       const id = this.getId(row);
//       this.snapshotMap.set(id, { ...row });
//       this.editingIds.add(id);
//     });
//     this.api.refreshCells({ force: true });
//   }

//   saveBulkEdit() {
//     const updates: T[] = [];
//     this.editingIds.forEach(id => {
//       const node = this.api.getRowNode(id);
//       if (node && node.data) updates.push(node.data);
//     });
//     this.editingIds.clear();
//     this.snapshotMap.clear();
//     this.api.refreshCells({ force: true });
//     this.gridEvent.emit({ type: 'bulkSave', rows: updates });
//   }

//   cancelBulkEdit() {
//     this.editingIds.forEach(id => {
//       const node = this.api.getRowNode(id);
//       const original = this.snapshotMap.get(id);
//       if (node && original) node.setData(original);
//     });
//     this.editingIds.clear();
//     this.snapshotMap.clear();
//     this.api.refreshCells({ force: true });
//   }

//   private getId(row: any): string {
//     return row?._id ?? row?.id ?? '';
//   }

//   get selectionOptions(): RowSelectionOptions | undefined {
//     if (!this.selectionMode()) return;
//     return {
//       mode: this.selectionMode() === 'single' ? 'singleRow' : 'multiRow'
//     };
//   }


//   readonly agTheme = computed<Theme>(() =>
//     themeQuartz.withParams({
//       /* Typography */
//       fontFamily: 'var(--font-body)',
//       fontSize: 'var(--font-size-base)',

//       /* Backgrounds */
//       backgroundColor: 'var(--bg-primary)',
//       headerBackgroundColor: 'var(--bg-secondary)',

//       /* Text */
//       foregroundColor: 'var(--text-primary)',
//       headerTextColor: 'var(--text-label)',

//       /* Borders */
//       borderColor: 'var(--border-primary)',

//       /* Interaction */
//       rowHoverColor: 'var(--component-bg-hover)',
//       selectedRowBackgroundColor: 'var(--accent-focus)',
//       rangeSelectionBackgroundColor: 'var(--accent-focus)',
//       rangeSelectionBorderColor: 'var(--accent-primary)',

//       /* Inputs */
//       inputBackgroundColor: 'var(--bg-ternary)',
//       inputBorder: 'var(--component-border-focus)',
//       inputPlaceholderTextColor: 'var(--text-tertiary)',

//       /* Scrollbars */
//       // scrollbarThumbColor: 'var(--scroll-thumb-c)',
//       // scrollbarTrackColor: 'var(--scroll-track-c)',

//       /* Density */
//       rowHeight: 44,
//       headerHeight: 44,
//       spacing: 6
//     })
//   );
// }



// // // import {
// // //   Component, ChangeDetectionStrategy,
// // //   input, output, computed
// // // } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { AgGridAngular } from 'ag-grid-angular';
// // // import {
// // //   GridApi, GridOptions, ColDef,
// // //   GridReadyEvent, RowSelectionOptions,
// // //   ModuleRegistry, AllCommunityModule,
// // //   Theme,
// // //   themeQuartz,
// // //   RowEditingStoppedEvent
// // // } from 'ag-grid-community';

// // // import { GridColDef } from '../grid.types';
// // // import { MasterCellEditorComponent } from '../dynamic Columns/master-cell-editor.component';
// // // import { MasterCellRendererComponent } from '../dynamic Columns/master-cell-renderer.component';
// // // import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
// // // ModuleRegistry.registerModules([AllCommunityModule]);

// // // export type SharedGridEvent<T> =
// // //   | { type: 'init'; api: GridApi<T> }
// // //   | { type: 'editStart'; row: T }
// // //   | { type: 'save'; row: T }
// // //   | { type: 'Entersave'; row: T }
// // //   | { type: 'reachedBottom'; row: T }
// // //   | { type: 'cellClicked'; row: T; field: keyof T; oldValue?: any; value?: any } // renamed newValue to value
// // //   | { type: 'cellEdited'; row: T; field: keyof T; oldValue?: any; value?: any } // renamed newValue to value
// // //   | { type: 'cancel'; row: T }
// // //   | { type: 'delete'; row: T }
// // //   | { type: 'selectionChanged'; rows: T[] };

// // // @Component({
// // //   selector: 'app-shared-grid',
// // //   imports: [
// // //     CommonModule,
// // //     AgGridAngular
// // //   ],
// // //   changeDetection: ChangeDetectionStrategy.OnPush,
// // //   templateUrl: './app-shared-grid.html',
// // //   styleUrl: './app-shared-grid.scss',
// // // })
// // // export class AppSharedGrid<T extends { _id?: string; id?: string }> {
// // //   readonly columns = input.required<GridColDef<T>[]>();
// // //   readonly data = input<T[] | null>(null);
// // //   readonly selectionMode = input<'single' | 'multiple' | null>(null);
// // //   readonly showActions = input(false);
// // //   readonly gridEvent = output<SharedGridEvent<T>>();
// // //   private api!: GridApi<T>;
// // //   private editingRowId: string | null = null;
// // //   private snapshot: T | null = null;
// // //   editingIds = new Set<string>();

// // //   gridOptions: GridOptions<T> = {
// // //     editType: 'fullRow',
// // //     stopEditingWhenCellsLoseFocus: false,
// // //     getRowId: p => p.data?._id ?? p.data?.id ?? '',
// // //     defaultColDef: {
// // //       flex: 1,
// // //       editable: p => this.getId(p.data) === this.editingRowId
// // //     },

// // //     context: {
// // //       isRowEditing: (row: T) => this.getId(row) === this.editingRowId,
// // //       onAction: (a: string, r: T) => this.onAction(a, r)
// // //     }
// // //   };

// // //   columnDefs = computed<ColDef<T>[]>(() => {
// // //     const baseCols: ColDef<T>[] = this.columns().map(col => {
// // //       if (!col.cellConfig) {
// // //         return col;
// // //       }

// // //       return {
// // //         ...col,
// // //         cellRenderer: MasterCellRendererComponent,
// // //         cellEditor: MasterCellEditorComponent,
// // //         cellRendererParams: { cellConfig: col.cellConfig },
// // //         cellEditorParams: { cellConfig: col.cellConfig }
// // //       };
// // //     });

// // //     if (this.showActions()) {
// // //       const actionCol: ColDef<T> = {
// // //         headerName: 'Actions',
// // //         colId: '__actions__',
// // //         pinned: 'right',
// // //         width: 140,
// // //         editable: false,
// // //         sortable: false,
// // //         filter: false,
// // //         cellRenderer: AppSharedGridActionButton
// // //       };
// // //       baseCols.push(actionCol);
// // //     }

// // //     return baseCols;
// // //   });

// // //   onGridReady(e: GridReadyEvent<T>) {
// // //     this.api = e.api;
// // //     this.gridEvent.emit({ type: 'init', api: this.api });
// // //   }

// // //   onSelectionChanged() {
// // //     this.gridEvent.emit({
// // //       type: 'selectionChanged',
// // //       rows: this.api.getSelectedRows()
// // //     });
// // //   }

// // //   // private onAction(action: string, row: T) {

// // // onRowEditingStopped(event: RowEditingStoppedEvent) {
// // //   this.gridEvent.emit({ type: 'Entersave', row: event.data });
// // //   this.editingRowId = null;
// // //   if (event.node) {
// // //     this.api.refreshCells({ rowNodes: [event.node], force: true });
// // //   }
// // // }
// // //   private onAction(action: string, row: T) {
// // //     const id = this.getId(row);
// // //     const node = this.api.getRowNode(id);
// // //     if (!node) return;

// // //     switch (action) {
// // //       case 'edit':
// // //         this.editingRowId = id;
// // //         this.api.startEditingCell({
// // //           rowIndex: node.rowIndex!,
// // //           colKey: this.columns()[0].field as string
// // //         });
// // //         this.api.refreshCells({ rowNodes: [node], force: true });
// // //         this.gridEvent.emit({ type: 'editStart', row });
// // //         break;
// // //       case 'save':
// // //         this.api.stopEditing(false);
// // //         break;
// // //       case 'cancel':
// // //         if (this.snapshot) node.setData(this.snapshot);
// // //         this.api.stopEditing(true);
// // //         this.editingRowId = null;
// // //         this.api.refreshCells({ rowNodes: [node], force: true });
// // //         if (node.data) {
// // //           this.gridEvent.emit({ type: 'cancel', row: node.data });
// // //         }
// // //         break;

// // //       case 'delete':
// // //         this.gridEvent.emit({ type: 'delete', row });
// // //         break;
// // //     }
// // //   }

// // //   private getId(row: any): string {
// // //     return row?._id ?? row?.id ?? '';
// // //   }

// // //   get selectionOptions(): RowSelectionOptions | undefined {
// // //     if (!this.selectionMode()) return;
// // //     return {
// // //       mode: this.selectionMode() === 'single'
// // //         ? 'singleRow'
// // //         : 'multiRow'
// // //     };
// // //   }

// // // readonly agTheme = computed<Theme>(() =>
// // //   themeQuartz.withParams({
// // //     /* Typography */
// // //     fontFamily: 'var(--font-body)',
// // //     fontSize: 'var(--font-size-base)',

// // //     /* Backgrounds */
// // //     backgroundColor: 'var(--bg-primary)',
// // //     headerBackgroundColor: 'var(--bg-secondary)',

// // //     /* Text */
// // //     foregroundColor: 'var(--text-primary)',
// // //     headerTextColor: 'var(--text-label)',

// // //     /* Borders */
// // //     borderColor: 'var(--border-primary)',

// // //     /* Interaction */
// // //     rowHoverColor: 'var(--component-bg-hover)',
// // //     selectedRowBackgroundColor: 'var(--accent-focus)',
// // //     rangeSelectionBackgroundColor: 'var(--accent-focus)',
// // //     rangeSelectionBorderColor: 'var(--accent-primary)',

// // //     /* Inputs */
// // //     inputBackgroundColor: 'var(--bg-ternary)',
// // //     inputBorder: 'var(--component-border-focus)',
// // //     inputPlaceholderTextColor: 'var(--text-tertiary)',

// // //     /* Scrollbars */
// // //     // scrollbarThumbColor: 'var(--scroll-thumb-c)',
// // //     // scrollbarTrackColor: 'var(--scroll-track-c)',

// // //     /* Density */
// // //     rowHeight: 44,
// // //     headerHeight: 44,
// // //     spacing: 6
// // //   })
// // // );
// // // }
// // import {
// //   Component, ChangeDetectionStrategy,
// //   input, output, computed
// // } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { AgGridAngular } from 'ag-grid-angular';
// // import {
// //   GridApi, GridOptions, ColDef,
// //   GridReadyEvent, RowSelectionOptions,
// //   ModuleRegistry, AllCommunityModule,
// //   Theme, themeQuartz,
// //   RowEditingStoppedEvent
// // } from 'ag-grid-community';

// // import { GridColDef } from '../grid.types';
// // import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
// // import { SmartWrapperComponent } from '../dynamic Columns/smart-wrapper.component';

// // ModuleRegistry.registerModules([AllCommunityModule]);

// // export type SharedGridEvent<T> =
// //   | { type: 'init'; api: GridApi<T> }
// //   | { type: 'editStart'; row: T }
// //   | { type: 'save'; row: T }
// //   | { type: 'Entersave'; row: T }
// //   | { type: 'bulkSave'; rows: T[] } // New Event
// //   | { type: 'cancel'; row: T }
// //   | { type: 'delete'; row: T }
// //   | { type: 'selectionChanged'; rows: T[] };

// // @Component({
// //   selector: 'app-shared-grid',
// //   standalone: true,
// //   imports: [CommonModule, AgGridAngular],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   templateUrl: './app-shared-grid.html',
// //   styleUrl: './app-shared-grid.scss',
// // })
// // export class AppSharedGrid<T extends { _id?: string; id?: string }> {
// //   readonly columns = input.required<GridColDef<T>[]>();
// //   readonly data = input<T[] | null>(null);
// //   readonly selectionMode = input<'single' | 'multiple' | null>(null);
// //   readonly showActions = input(false);
// //   readonly gridEvent = output<SharedGridEvent<T>>();

// //   private api!: GridApi<T>;

// //   // STATE: We now track a Set of IDs instead of just one
// //   editingIds = new Set<string>();
// //   private snapshotMap = new Map<string, T>(); // To support cancel logic

// //   gridOptions: GridOptions<T> = {
// //     // DISABLE Native Editing - We handle it manually via SmartWrapper
// //     suppressClickEdit: true,

// //     getRowId: p => p.data?._id ?? p.data?.id ?? '',

// //     // Pass State to Context so SmartWrapper can read it
// //     context: {
// //       editingIds: this.editingIds,
// //       // Helper for Action Button to know if it should show Save/Cancel
// //       isRowEditing: (row: T) => this.editingIds.has(this.getId(row)),
// //       onAction: (a: string, r: T) => this.onAction(a, r)
// //     }
// //   };

// //   columnDefs = computed<ColDef<T>[]>(() => {
// //     const baseCols: ColDef<T>[] = this.columns().map(col => {
// //       // If no config, render normally
// //       if (!col.cellConfig) return col;

// //       return {
// //         ...col,
// //         // USE THE WRAPPER!
// //         cellRenderer: SmartWrapperComponent,
// //         cellRendererParams: { cellConfig: col.cellConfig },
// //         // We don't need 'cellEditor' anymore because Wrapper handles the switch
// //       };
// //     });

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

// //   onGridReady(e: GridReadyEvent<T>) {
// //     this.api = e.api;
// //     this.gridEvent.emit({ type: 'init', api: this.api });
// //   }

// //   onSelectionChanged() {
// //     this.gridEvent.emit({
// //       type: 'selectionChanged',
// //       rows: this.api.getSelectedRows()
// //     });
// //   }

// //   // --- UNIFIED ACTION HANDLER (Single & Bulk) ---

// //   private onAction(action: string, row: T) {
// //     const id = this.getId(row);
// //     const node = this.api.getRowNode(id);
// //     if (!node) return;

// //     switch (action) {
// //       case 'edit':
// //         // 1. Save Snapshot for Cancel
// //         this.snapshotMap.set(id, { ...row });
// //         // 2. Add to Set
// //         this.editingIds.add(id);
// //         // 3. Refresh Row (SmartWrapper switches to Editor)
// //         this.api.refreshCells({ rowNodes: [node], force: true });
// //         this.gridEvent.emit({ type: 'editStart', row });
// //         break;

// //       case 'save':
// //         // 1. Remove from Set
// //         this.editingIds.delete(id);
// //         this.snapshotMap.delete(id);
// //         // 2. Refresh Row (SmartWrapper switches back to Renderer)
// //         this.api.refreshCells({ rowNodes: [node], force: true });

// //         // Data is already updated via ngModelChange in editor
// //         this.gridEvent.emit({ type: 'save', row: node.data! });
// //         break;

// //       case 'cancel':
// //         // 1. Restore Data
// //         const original = this.snapshotMap.get(id);
// //         if (original) node.setData(original);

// //         // 2. Remove from Set
// //         this.editingIds.delete(id);
// //         this.snapshotMap.delete(id);

// //         // 3. Refresh
// //         this.api.refreshCells({ rowNodes: [node], force: true });
// //         this.gridEvent.emit({ type: 'cancel', row: node.data! });
// //         break;

// //       case 'delete':
// //         this.gridEvent.emit({ type: 'delete', row });
// //         break;
// //     }
// //   }

// //   // --- NEW BULK METHODS (Call these from Parent) ---

// //   enableBulkEdit() {
// //     const selected = this.api.getSelectedRows();
// //     if (selected.length === 0) return;

// //     selected.forEach(row => {
// //       const id = this.getId(row);
// //       this.snapshotMap.set(id, { ...row }); // Save state
// //       this.editingIds.add(id);
// //     });

// //     this.api.refreshCells({ force: true });
// //   }

// //   onRowEditingStopped(event: RowEditingStoppedEvent) {
// //     this.gridEvent.emit({ type: 'Entersave', row: event.data });
// //     this.editingIds.clear()
// //     if (event.node) {
// //       this.api.refreshCells({ rowNodes: [event.node], force: true });
// //     }
// //   }

// //   saveBulkEdit() {
// //     const updates: T[] = [];

// //     // Collect data from nodes that were editing
// //     this.editingIds.forEach(id => {
// //       const node = this.api.getRowNode(id);
// //       if (node && node.data) updates.push(node.data);
// //     });

// //     // Clear State
// //     this.editingIds.clear();
// //     this.snapshotMap.clear();
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
// //     this.api.refreshCells({ force: true });
// //   }

// //   // --- Helpers ---

// //   private getId(row: any): string {
// //     return row?._id ?? row?.id ?? '';
// //   }

// //   get selectionOptions(): RowSelectionOptions | undefined {
// //     if (!this.selectionMode()) return;
// //     return {
// //       mode: this.selectionMode() === 'single' ? 'singleRow' : 'multiRow'
// //     };
// //   }


// // readonly agTheme = computed<Theme>(() =>
// //   themeQuartz.withParams({
// //     /* Typography */
// //     fontFamily: 'var(--font-body)',
// //     fontSize: 'var(--font-size-base)',

// //     /* Backgrounds */
// //     backgroundColor: 'var(--bg-primary)',
// //     headerBackgroundColor: 'var(--bg-secondary)',

// //     /* Text */
// //     foregroundColor: 'var(--text-primary)',
// //     headerTextColor: 'var(--text-label)',

// //     /* Borders */
// //     borderColor: 'var(--border-primary)',

// //     /* Interaction */
// //     rowHoverColor: 'var(--component-bg-hover)',
// //     selectedRowBackgroundColor: 'var(--accent-focus)',
// //     rangeSelectionBackgroundColor: 'var(--accent-focus)',
// //     rangeSelectionBorderColor: 'var(--accent-primary)',

// //     /* Inputs */
// //     inputBackgroundColor: 'var(--bg-ternary)',
// //     inputBorder: 'var(--component-border-focus)',
// //     inputPlaceholderTextColor: 'var(--text-tertiary)',

// //     /* Scrollbars */
// //     // scrollbarThumbColor: 'var(--scroll-thumb-c)',
// //     // scrollbarTrackColor: 'var(--scroll-track-c)',

// //     /* Density */
// //     rowHeight: 44,
// //     headerHeight: 44,
// //     spacing: 6
// //   })
// // );
// // }