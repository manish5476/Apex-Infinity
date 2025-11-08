import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, RowSelectedEvent, CellClickedEvent, GetRowIdParams, themeQuartz, IDatasource, BodyScrollEndEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToolbarModule } from 'primeng/toolbar';
import { ModuleRegistry, TooltipModule, ITooltipParams } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { ActionbuttonsComponent } from '../../AgGridcomponents/actionbuttons/actionbuttons.component';
import { DynamicCellComponent } from '../../AgGridcomponents/dynamic-cell/dynamic-cell.component';
import { ThemeService } from '../../../../../core/services/theme.service';
// FIX: Import the new, cleaner types from the status cell component.
import { StatusCellComponent, StatusCellParams, Severity } from '../../AgGridcomponents/status-cell/status-cell.component';
ModuleRegistry.registerModules([AllCommunityModule, TooltipModule]);

export interface StatusColumnOptions extends ColDef {
  field: string; // The 'field' is mandatory for a status column.
  cellRendererParams: {
    config: StatusCellParams;
  };
}


export interface SharedGridOptions {
  columnDefs?: ColDef[];
  data?: any[];
  rowSelectionMode?: 'single' | 'multiple' | '';
  gridHeight?: string;
  // Use the new, more robust type for statusColumn.
  statusColumn?: StatusColumnOptions;
  paginationPageSize?: number;
  GridName?: string;
  headerFilter?: boolean;
  showActions?: boolean;
  rowClassRules?: any;
  pagination?: boolean;
  tooltipShowDelay?: number;
  tooltipShowMode?: 'standard' | 'whenTruncated';
  rowModelType?: 'clientSide' | 'infinite'; // Default to 'clientSide' for backward compat
  cacheBlockSize?: number; // Rows per block (e.g., 100)
  maxBlocksInCache?: number; // Max blocks to keep in memory (e.g., 10)
  infiniteInitialRowCount?: number; // Placeholder rows before first load (e.g., 1)
  // Add a callback for getRows if you want parent control, or handle internally
  getRowsCallback?: (params: any) => void; // Optional: Parent can provide this
}

// This internal type makes all properties required, but correctly keeps 'statusColumn' optional.
type InternalGridOptions = Required<Omit<SharedGridOptions, 'statusColumn' | 'getRowsCallback'>> & {
  statusColumn?: StatusColumnOptions;
  getRowsCallback?: (params: any) => void;
};


@Component({
  selector: 'app-shared-grid',
  standalone: true,
  imports: [AgGridAngular, FormsModule, ToolbarModule, CommonModule, ColorPickerModule],
  templateUrl: './shared-grid.component.html',
  styleUrls: ['./shared-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedGridComponent implements OnInit, OnChanges {
  @Input() GridOptions: SharedGridOptions = {};
  // DEPRECATED Inputs
  @Input() column: ColDef[] | undefined;
  @Input() data: any[] | undefined;
  @Input() rowSelectionMode: 'single' | 'multiple' | undefined;
  @Input() gridHeight: string | undefined = '80vh';
  @Input() paginationPageSize: number | undefined;
  @Input() GridName: string | undefined;
  @Input() headerFilter: boolean | undefined;
  @Input() showActions: boolean | undefined;
  @Input() rowClassRules: any | undefined;

  @Output() dataChanged = new EventEmitter<any>();
  @Output() eventFromGrid = new EventEmitter<any>();
  @Output() gridReady = new EventEmitter<GridReadyEvent>();
  @Output() infiniteScrollEvent = new EventEmitter<{ startRow: number; endRow: number; page: number }>();
  @Output() scrolledToBottom = new EventEmitter<any>();
  private gridApi!: GridApi;
  public datasource: IDatasource | undefined;
  public usertheme: string = 'ag-theme-quartz';
  public rowData: any[] = [];
  public columnDefs: ColDef[] = [];
  public editingRowId: string | null = null;
  public originalRowData: any = {};
  public accentColor: string = '#3b82f6';
  public mainGridHeight: string = 'calc(100vh - 162px)';
  public mergedRowClassRules: any = {};
  public options: InternalGridOptions = this.getDefaultOptions();
  public defaultColDef: ColDef = {
    sortable: true,
    filter: 'agTextColumnFilter',
    resizable: true,
    flex: 1,
    minWidth: 120,
    editable: (params) => this.editingRowId === (params.data?._id || params.data?.id),
    valueFormatter: (params:any) => {
      const value = params.value;
      if (value == null) return '';
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        if (typeof value[0] !== 'object') {
          return `Array(${value.length}): ${value.slice(0, 2).join(', ')}${value.length > 2 ? '...' : ''
            }`;
        }
        const firstObj = value[0];
        const keys = Object.keys(firstObj);
        if (keys.length > 0) {
          return `Array(${value.length}) [${keys[0]}: ${firstObj[keys[0]]}]`;
        }
        return `Array(${value.length}) [{}]`;
      }

      if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length > 0) {
          return `{${keys[0]}: ${String(value[keys[0]])}}`;
        }
        return '{}';
      }
      return String(value);
    },
    tooltipValueGetter: (params:any) => {
      const value = params.value;
      if (value == null) return '';

      try {
        return JSON.stringify(value, null, 2); // multiline JSON
      } catch {
        return String(value);
      }
    },
  };

  getRowId: (params: GetRowIdParams) => string = (params: GetRowIdParams) => {
    return params.data._id || String(params.data.id);
  };

  constructor(private themeService: ThemeService) { }

  ngOnInit(): void {
    this.processGridOptions();
    this.accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-accent-primary')
      .trim() || '#3b82f6';
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.processGridOptions();

  }

  public processGridOptions(): void {
    const defaults = this.getDefaultOptions();
    this.options = {
      ...defaults,
      ...(this.GridOptions || {}),
      columnDefs: this.column ?? this.GridOptions?.columnDefs ?? defaults.columnDefs,
      data: this.data ?? this.GridOptions?.data ?? defaults.data,
      rowSelectionMode: this.rowSelectionMode ?? this.GridOptions?.rowSelectionMode ?? defaults.rowSelectionMode,
      gridHeight: this.gridHeight ?? this.GridOptions?.gridHeight ?? defaults.gridHeight,
      paginationPageSize: this.paginationPageSize ?? this.GridOptions?.paginationPageSize ?? defaults.paginationPageSize,
      GridName: this.GridName ?? this.GridOptions?.GridName ?? defaults.GridName,
      headerFilter: this.headerFilter ?? this.GridOptions?.headerFilter ?? defaults.headerFilter,
      showActions: this.showActions ?? this.GridOptions?.showActions ?? defaults.showActions,
      rowClassRules: this.rowClassRules ?? this.GridOptions?.rowClassRules ?? defaults.rowClassRules,
      statusColumn: this.GridOptions?.statusColumn ?? defaults.statusColumn,
      tooltipShowDelay: this.GridOptions?.tooltipShowDelay ?? defaults.tooltipShowDelay,
      tooltipShowMode: this.GridOptions?.tooltipShowMode ?? defaults.tooltipShowMode,
      rowModelType: this.GridOptions?.rowModelType ?? defaults.rowModelType,
      cacheBlockSize: this.GridOptions?.cacheBlockSize ?? defaults.cacheBlockSize,
      maxBlocksInCache: this.GridOptions?.maxBlocksInCache ?? defaults.maxBlocksInCache,
      infiniteInitialRowCount: this.GridOptions?.infiniteInitialRowCount ?? defaults.infiniteInitialRowCount,
      getRowsCallback: this.GridOptions?.getRowsCallback ?? defaults.getRowsCallback,
    };
    if (this.options.rowModelType === 'clientSide') {
      this.rowData = Array.isArray(this.options.data) ? this.options.data : [];
      this.updateColumnDefs();
    }

    this.computeGridHeight();
    this.updateRowClassRules();
  }

  public getDefaultOptions(): InternalGridOptions {
    return {
      columnDefs: [],
      data: [],
      rowSelectionMode: '',
      gridHeight: '162px',
      paginationPageSize: 100,
      GridName: '',
      headerFilter: false,
      showActions: false,
      rowClassRules: {},
      pagination: false,
      rowModelType: 'clientSide', // Default to keep existing behavior
      cacheBlockSize: 100,
      maxBlocksInCache: 10,
      infiniteInitialRowCount: 1,
      tooltipShowDelay: 500, // Default delay of 500ms
      tooltipShowMode: 'whenTruncated' // A smart default
    };
  }


  computeGridHeight(): void {
    const height = this.options.gridHeight;
    this.mainGridHeight = `calc(100vh - ${height})`;
  }

  updateRowClassRules(): void {
    this.mergedRowClassRules = {
      ...this.options.rowClassRules
    };
  }

  updateColumnDefs(): void {
    const baseColumns = this.options.columnDefs.length > 0 ? [...this.options.columnDefs] : this.generateDefaultColumns(this.rowData);

    if (this.options.statusColumn && this.options.statusColumn.field) {
      const statusCol: ColDef = {
        // Spread the user's config first to allow overrides
        ...this.options.statusColumn,
        // Enforce properties required for the renderer to work
        cellRenderer: StatusCellComponent,
        editable: false,
        sortable: false,
        filter: false,
      };
      // Add the status column to the beginning of the list
      baseColumns.unshift(statusCol);
    }

    if (this.options.showActions) {
      const actionColumnExists = baseColumns.some(col => col.colId === 'actionButtons');
      if (!actionColumnExists) {
        baseColumns.push({
          headerName: 'Actions',
          cellRenderer: ActionbuttonsComponent,
          editable: false,
          sortable: false,
          filter: false,
          colId: 'actionButtons',
          cellRendererParams: {
            actionHandler: (action: string, data: any) => this.handleCellAction(action, data),
            isRowEditing: (id: string) => this.editingRowId === id
          },
          pinned: 'right',
          width: 120,
          minWidth: 100,
        });
      }
    }
    this.columnDefs = baseColumns;
  }

  handleCellAction(action: string, data: any): void {
    this.eventFromGrid.emit({ eventType: action, data });
    // switch (action) {
    //   case 'edit': this.startEditingRow(data); break;
    //   case 'save': this.saveRow(data); break;
    //   case 'cancel': this.cancelEditingRow(data); break;
    //   case 'delete': this.deleteRow(data); break;
    // }
  }

  startEditingRow(rowData: any): void {
    if (!this.gridApi) return;
    this.editingRowId = rowData._id || rowData.id;
    this.originalRowData = { ...rowData };
    this.gridApi.refreshCells({ force: true });
    const firstEditableField = this.columnDefs.find(col => col.editable !== false)?.field || 'email';
    this.gridApi.startEditingCell({ rowIndex: this.getRowIndex(rowData), colKey: firstEditableField });
  }

  saveRow(rowData: any): void {
    if (!this.gridApi) return;
    this.gridApi.stopEditing(false);
    this.editingRowId = null;
    this.gridApi.refreshCells({ force: true });
    this.dataChanged.emit({ type: 'save', data: rowData });
  }

  cancelEditingRow(rowData: any): void {
    if (!this.gridApi) return;
    const rowIndex = this.getRowIndex(rowData);
    if (rowIndex >= 0) {
      const restoredRow = { ...this.originalRowData };
      this.rowData[rowIndex] = restoredRow;
      this.gridApi.applyTransaction({ update: [restoredRow] });
      this.gridApi.stopEditing(true);
      this.editingRowId = null;
      this.gridApi.refreshCells({ force: true });
      this.dataChanged.emit({ type: 'cancel', data: rowData });
    }
  }

  deleteRow(rowData: any): void {
    if (!this.gridApi) return;
    this.rowData = this.rowData.filter(row => row._id !== rowData._id);
    this.gridApi.applyTransaction({ remove: [rowData] });
    this.dataChanged.emit({ type: 'delete', data: rowData });
  }

  getRowIndex(rowData: any): number {
    return this.rowData.findIndex(row => (row._id || row.id) === (rowData._id || rowData.id));
  }

  generateDefaultColumns(data: any[]): ColDef[] {
    if (!data || data.length === 0) {
      return [{
        headerName: 'No Data',
        field: 'noData',
        valueGetter: () => 'No data available',
        editable: false
      }];
    }
    return Object.keys(data[0]).map(key => {
      const isNumeric = data.every(row => typeof row[key] === 'number' || row[key] == null);
      const isBoolean = data.every(row => typeof row[key] === 'boolean' || row[key] == null);
      return {
        headerName: key.charAt(0).toUpperCase() + key.slice(1),
        field: key,
        cellRenderer: isNumeric || isBoolean ? undefined : DynamicCellComponent,
        cellRendererParams: isNumeric || isBoolean ? undefined : { type: 'text' },
        filter: isNumeric ? 'agNumberColumnFilter' : isBoolean ? 'agSetColumnFilter' : 'agTextColumnFilter'
      };
    });
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    this.eventFromGrid.emit({ eventType: 'onCellValueChanged', event });
  }

  onRowSelected(event: RowSelectedEvent): void {
    this.eventFromGrid.emit({ eventType: 'RowSelectedEvent', event });
  }

  onCellClicked(event: CellClickedEvent): void {
    this.eventFromGrid.emit({ eventType: 'CellClickedEvent', event });
  }

  // Update onGridReady():
  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.gridReady.emit(event);

    if (this.options.rowModelType === 'infinite') {
      const getRows = this.options.getRowsCallback;
      if (!getRows) {
        console.error('getRowsCallback is required for infinite row model');
        return;
      }
      this.datasource = {
        getRows
      };
      this.gridApi.setGridOption('datasource', this.datasource);
    }
  }
  // onGridReady(event: GridReadyEvent): void {
  //   this.gridApi = event.api;
  //   this.gridReady.emit(event);
  // }

  private handleGetRows(params: any): void {

    const startRow = params.startRow;
    const endRow = params.endRow;
    const page = Math.floor(startRow / this.options.cacheBlockSize!) + 1; // e.g., page 1,2,3...
    this.infiniteScrollEvent.emit({ startRow, endRow, page });
    // Replace with your service call (e.g., fetch next page)
    // Example: this.yourService.getData({ page, limit: this.options.cacheBlockSize }).subscribe(...)
    setTimeout(() => { // Simulate async API call
      const allData = []; // Your full dataset or simulate
      for (let i = 0; i < 10000; i++) { // Mock large dataset
        allData.push({ id: i, name: `Item ${i}`, value: i * 10 });
      }

      const rowsThisBlock = allData.slice(startRow, endRow);
      const lastRow = allData.length <= endRow ? endRow : undefined; // Set if you know total rows

      if (rowsThisBlock.length === 0) {
        params.failCallback(); // No more data
      } else {
        params.successCallback(rowsThisBlock, lastRow); // Load successful
      }
    }, 500); // Simulate network delay
  }



  exportToCSV(): void {
    this.gridApi.exportDataAsCsv();
  }

  onColorChange(event: any): void {
    const color = event.value;
    this.accentColor = color;
    document.documentElement.style.setProperty('--theme-accent-primary', color);
    this.gridApi.refreshHeader();
    this.gridApi.refreshCells({ force: true });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.gridApi.setGridOption('quickFilterText', input.value);
  }

  onFilterClick(): void {
    this.gridApi.setFilterModel(null);
  }

  onActionClicked(event: { action: string; data: any }): void {
    this.eventFromGrid.emit({ eventType: 'actionClicked', action: event.action, data: event.data });
  }

  onBodyScrollEnd(event: BodyScrollEndEvent): void {
    if (event.direction !== 'vertical') return;

    const viewport = document.querySelector('.ag-body-viewport') as HTMLElement | null;
    if (!viewport) return;

    const threshold = 1;
    if (viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - threshold) {
      this.scrolledToBottom.emit(event);
    }
  }

  // -------------------------------------------------------------------- Theme Section -------------------------------------------------------------
  public theme = themeQuartz.withParams({
    backgroundColor: 'var(--theme-bg-primary, #ffffff)',
    foregroundColor: 'var(--theme-text-primary, #111827)',
    headerTextColor: 'var(--theme-text-heading, #374151)',
    headerBackgroundColor: 'var(--theme-bg-secondary, #f3f4f6)',
    oddRowBackgroundColor: 'var(--theme-bg-primary, #ffffff)',
    headerColumnResizeHandleColor: 'var(--theme-accent-primary, #3b82f6)',
    borderColor: 'var(--theme-border-primary, #e5e7eb)',
    fontFamily: 'Inter, Poppins, sans-serif',
    fontSize: '0.75rem',
    headerFontFamily: 'Inter, Poppins, sans-serif',
    headerFontWeight: '500',
    rangeSelectionBorderColor: 'var(--theme-accent-primary, #3b82f6)',
    rangeSelectionBorderStyle: 'dashed',
    rangeSelectionBackgroundColor: 'var(--theme-accent-primary-light, #dbeafe)',
    rangeSelectionHighlightColor: 'var(--theme-accent-primary, #3b82f6)',
    inputBorder: { color: 'var(--theme-accent-primary, #3b82f6)', style: 'solid', width: 1 },
    inputBackgroundColor: 'var(--theme-bg-ternary, #f9fafb)',
    inputPlaceholderTextColor: 'var(--theme-text-secondary, #6b7280)',
    inputIconColor: 'var(--theme-accent-primary, #3b82f6)',
    selectedRowBackgroundColor: 'var(--theme-accent-primary-light, #dbeafe)'
  });
  public defaultRowClassRules = {
    'bg-blue-100 dark:bg-blue-900': (params: any) => this.editingRowId === (params.data?._id || params.data?.id),
    'bg-gray-50 dark:bg-gray-700': (params: any) => params.node.rowIndex % 2 === 0,
    'bg-red-100 dark:bg-red-900': (params: any) => params.data.availabilityStatus === 'OutOfStock',
    'bg-green-100 dark:bg-green-900': (params: any) => params.data.availabilityStatus === 'InStock'
  };
}

// import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
// import { AgGridAngular } from 'ag-grid-angular';
// import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, RowSelectedEvent, CellClickedEvent, GetRowIdParams, themeQuartz } from 'ag-grid-community';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { ColorPickerModule } from 'primeng/colorpicker';
// import { ToolbarModule } from 'primeng/toolbar';
// import { ModuleRegistry, TooltipModule, ITooltipParams } from 'ag-grid-community';
// import { AllCommunityModule } from 'ag-grid-community';
// import { ActionbuttonsComponent } from '../../AgGridcomponents/actionbuttons/actionbuttons.component';
// import { DynamicCellComponent } from '../../AgGridcomponents/dynamic-cell/dynamic-cell.component';
// import { ThemeService } from '../../../../core/services/theme.service';
// // FIX: Import the new, cleaner types from the status cell component.
// import { StatusCellComponent, StatusCellParams, Severity } from '../../AgGridcomponents/status-cell/status-cell.component';
// ModuleRegistry.registerModules([AllCommunityModule, TooltipModule]);

// export interface StatusColumnOptions extends ColDef {
//   field: string; // The 'field' is mandatory for a status column.
//   cellRendererParams: {
//     config: StatusCellParams;
//   };
// }


// export interface SharedGridOptions {
//   columnDefs?: ColDef[];
//   data?: any[];
//   rowSelectionMode?: 'single' | 'multiple';
//   gridHeight?: string;
//   // Use the new, more robust type for statusColumn.
//   statusColumn?: StatusColumnOptions;
//   paginationPageSize?: number;
//   GridName?: string;
//   headerFilter?: boolean;
//   showActions?: boolean;
//   rowClassRules?: any;
//   pagination?: boolean;
//   tooltipShowDelay?: number;
//   tooltipShowMode?: 'standard' | 'whenTruncated';
// }

// // This internal type makes all properties required, but correctly keeps 'statusColumn' optional.
// type InternalGridOptions = Required<Omit<SharedGridOptions, 'statusColumn'>> & {
//   statusColumn?: StatusColumnOptions;
// };


// @Component({
//   selector: 'app-shared-grid',
//   standalone: true,
//   imports: [AgGridAngular, FormsModule, ToolbarModule, CommonModule, ColorPickerModule],
//   templateUrl: './shared-grid.component.html',
//   styleUrls: ['./shared-grid.component.css'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class SharedGridComponent implements OnInit, OnChanges {
//   @Input() GridOptions: SharedGridOptions = {};
//   // DEPRECATED Inputs
//   @Input() column: ColDef[] | undefined;
//   @Input() data: any[] | undefined;
//   @Input() rowSelectionMode: 'single' | 'multiple' | undefined;
//   @Input() gridHeight: string | undefined;
//   @Input() paginationPageSize: number | undefined;
//   @Input() GridName: string | undefined;
//   @Input() headerFilter: boolean | undefined;
//   @Input() showActions: boolean | undefined;
//   @Input() rowClassRules: any | undefined;

//   @Output() dataChanged = new EventEmitter<any>();
//   @Output() eventFromGrid = new EventEmitter<any>();
//   @Output() gridReady = new EventEmitter<GridReadyEvent>();

//   private gridApi!: GridApi;
//   public usertheme: string = 'ag-theme-quartz';
//   public rowData: any[] = [];
//   public columnDefs: ColDef[] = [];
//   public editingRowId: string | null = null;
//   public originalRowData: any = {};
//   public accentColor: string = '#3b82f6';
//   public mainGridHeight: string = 'calc(100vh - 162px)';
//   public mergedRowClassRules: any = {};
//   public options: InternalGridOptions = this.getDefaultOptions();
//   public defaultColDef: ColDef = {
//     sortable: true,
//     filter: 'agTextColumnFilter',
//     resizable: true,
//     flex: 1,
//     minWidth: 120,
//     editable: (params) => this.editingRowId === (params.data?._id || params.data?.id),
//     valueFormatter: (params) => {
//       const value = params.value;
//       if (value == null) return '';
//       if (Array.isArray(value)) {
//         if (value.length === 0) return '[]';
//         if (typeof value[0] !== 'object') {
//           return `Array(${value.length}): ${value.slice(0, 2).join(', ')}${value.length > 2 ? '...' : ''
//             }`;
//         }
//         const firstObj = value[0];
//         const keys = Object.keys(firstObj);
//         if (keys.length > 0) {
//           return `Array(${value.length}) [${keys[0]}: ${firstObj[keys[0]]}]`;
//         }
//         return `Array(${value.length}) [{}]`;
//       }

//       if (typeof value === 'object') {
//         const keys = Object.keys(value);
//         if (keys.length > 0) {
//           return `{${keys[0]}: ${String(value[keys[0]])}}`;
//         }
//         return '{}';
//       }
//       return String(value);
//     },
//     tooltipValueGetter: (params) => {
//       const value = params.value;
//       if (value == null) return '';

//       try {
//         return JSON.stringify(value, null, 2); // multiline JSON
//       } catch {
//         return String(value);
//       }
//     },
//   };

//   getRowId: (params: GetRowIdParams) => string = (params: GetRowIdParams) => {
//     return params.data._id || String(params.data.id);
//   };

//   constructor(private themeService: ThemeService) { }

//   ngOnInit(): void {
//     this.processGridOptions();
//     this.accentColor = getComputedStyle(document.documentElement)
//       .getPropertyValue('--theme-accent-primary')
//       .trim() || '#3b82f6';
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     this.processGridOptions();
//   }

//   public processGridOptions(): void {
//     const defaults = this.getDefaultOptions();
//     this.options = {
//       ...defaults,
//       ...(this.GridOptions || {}),
//       columnDefs: this.column ?? this.GridOptions?.columnDefs ?? defaults.columnDefs,
//       data: this.data ?? this.GridOptions?.data ?? defaults.data,
//       rowSelectionMode: this.rowSelectionMode ?? this.GridOptions?.rowSelectionMode ?? defaults.rowSelectionMode,
//       gridHeight: this.gridHeight ?? this.GridOptions?.gridHeight ?? defaults.gridHeight,
//       paginationPageSize: this.paginationPageSize ?? this.GridOptions?.paginationPageSize ?? defaults.paginationPageSize,
//       GridName: this.GridName ?? this.GridOptions?.GridName ?? defaults.GridName,
//       headerFilter: this.headerFilter ?? this.GridOptions?.headerFilter ?? defaults.headerFilter,
//       showActions: this.showActions ?? this.GridOptions?.showActions ?? defaults.showActions,
//       rowClassRules: this.rowClassRules ?? this.GridOptions?.rowClassRules ?? defaults.rowClassRules,
//       statusColumn: this.GridOptions?.statusColumn ?? defaults.statusColumn,
//       // tooltipShowDelay: 500, // Default delay of 500ms
//       // tooltipShowMode: 'whenTruncated', // A smart default,
//       tooltipShowDelay: this.GridOptions?.tooltipShowDelay ?? defaults.tooltipShowDelay,
//       tooltipShowMode: this.GridOptions?.tooltipShowMode ?? defaults.tooltipShowMode,
//     };

//     this.rowData = Array.isArray(this.options.data) ? this.options.data : [];
//     this.updateColumnDefs();
//     this.computeGridHeight();
//     this.updateRowClassRules();
//   }

//   public getDefaultOptions(): InternalGridOptions {
//     return {
//       columnDefs: [],
//       data: [],
//       rowSelectionMode: 'single',
//       gridHeight: '162px',
//       paginationPageSize: 100,
//       GridName: '',
//       headerFilter: false,
//       showActions: false,
//       rowClassRules: {},
//       pagination: false,
//       statusColumn: undefined,
//       tooltipShowDelay: 500, // Default delay of 500ms
//       tooltipShowMode: 'whenTruncated' // A smart default
//     };
//   }


//   computeGridHeight(): void {
//     const height = this.options.gridHeight;
//     this.mainGridHeight = `calc(100vh - ${height})`;
//   }

//   updateRowClassRules(): void {
//     this.mergedRowClassRules = {
//       ...this.options.rowClassRules
//     };
//   }

//   updateColumnDefs(): void {
//     const baseColumns = this.options.columnDefs.length > 0 ? [...this.options.columnDefs] : this.generateDefaultColumns(this.rowData);

//     if (this.options.statusColumn && this.options.statusColumn.field) {
//       const statusCol: ColDef = {
//         // Spread the user's config first to allow overrides
//         ...this.options.statusColumn,
//         // Enforce properties required for the renderer to work
//         cellRenderer: StatusCellComponent,
//         editable: false,
//         sortable: false,
//         filter: false,
//       };
//       // Add the status column to the beginning of the list
//       baseColumns.unshift(statusCol);
//     }

//     if (this.options.showActions) {
//       const actionColumnExists = baseColumns.some(col => col.colId === 'actionButtons');
//       if (!actionColumnExists) {
//         baseColumns.push({
//           headerName: 'Actions',
//           cellRenderer: ActionbuttonsComponent,
//           editable: false,
//           sortable: false,
//           filter: false,
//           colId: 'actionButtons',
//           cellRendererParams: {
//             actionHandler: (action: string, data: any) => this.handleCellAction(action, data),
//             isRowEditing: (id: string) => this.editingRowId === id
//           },
//           pinned: 'right',
//           width: 120,
//           minWidth: 100,
//         });
//       }
//     }
//     this.columnDefs = baseColumns;
//   }

//   handleCellAction(action: string, data: any): void {
//     switch (action) {
//       case 'edit': this.startEditingRow(data); break;
//       case 'save': this.saveRow(data); break;
//       case 'cancel': this.cancelEditingRow(data); break;
//       case 'delete': this.deleteRow(data); break;
//     }
//   }

//   startEditingRow(rowData: any): void {
//     if (!this.gridApi) return;
//     this.editingRowId = rowData._id || rowData.id;
//     this.originalRowData = { ...rowData };
//     this.gridApi.refreshCells({ force: true });
//     const firstEditableField = this.columnDefs.find(col => col.editable !== false)?.field || 'email';
//     this.gridApi.startEditingCell({ rowIndex: this.getRowIndex(rowData), colKey: firstEditableField });
//   }

//   saveRow(rowData: any): void {
//     if (!this.gridApi) return;
//     this.gridApi.stopEditing(false);
//     this.editingRowId = null;
//     this.gridApi.refreshCells({ force: true });
//     this.dataChanged.emit({ type: 'save', data: rowData });
//   }

//   cancelEditingRow(rowData: any): void {
//     if (!this.gridApi) return;
//     const rowIndex = this.getRowIndex(rowData);
//     if (rowIndex >= 0) {
//       const restoredRow = { ...this.originalRowData };
//       this.rowData[rowIndex] = restoredRow;
//       this.gridApi.applyTransaction({ update: [restoredRow] });
//       this.gridApi.stopEditing(true);
//       this.editingRowId = null;
//       this.gridApi.refreshCells({ force: true });
//       this.dataChanged.emit({ type: 'cancel', data: rowData });
//     }
//   }

//   deleteRow(rowData: any): void {
//     if (!this.gridApi) return;
//     this.rowData = this.rowData.filter(row => row._id !== rowData._id);
//     this.gridApi.applyTransaction({ remove: [rowData] });
//     this.dataChanged.emit({ type: 'delete', data: rowData });
//   }

//   getRowIndex(rowData: any): number {
//     return this.rowData.findIndex(row => (row._id || row.id) === (rowData._id || rowData.id));
//   }

//   generateDefaultColumns(data: any[]): ColDef[] {
//     if (!data || data.length === 0) {
//       return [{
//         headerName: 'No Data',
//         field: 'noData',
//         valueGetter: () => 'No data available',
//         editable: false
//       }];
//     }
//     return Object.keys(data[0]).map(key => {
//       const isNumeric = data.every(row => typeof row[key] === 'number' || row[key] == null);
//       const isBoolean = data.every(row => typeof row[key] === 'boolean' || row[key] == null);
//       return {
//         headerName: key.charAt(0).toUpperCase() + key.slice(1),
//         field: key,
//         cellRenderer: isNumeric || isBoolean ? undefined : DynamicCellComponent,
//         cellRendererParams: isNumeric || isBoolean ? undefined : { type: 'text' },
//         filter: isNumeric ? 'agNumberColumnFilter' : isBoolean ? 'agSetColumnFilter' : 'agTextColumnFilter'
//       };
//     });
//   }

//   onCellValueChanged(event: CellValueChangedEvent): void {
//     this.eventFromGrid.emit({ eventType: 'onCellValueChanged', event });
//   }

//   onRowSelected(event: RowSelectedEvent): void {
//     this.eventFromGrid.emit({ eventType: 'RowSelectedEvent', event });
//   }

//   onCellClicked(event: CellClickedEvent): void {
//     this.eventFromGrid.emit({ eventType: 'CellClickedEvent', event });
//   }

//   onGridReady(event: GridReadyEvent): void {
//     this.gridApi = event.api;
//     this.gridReady.emit(event);
//   }

//   exportToCSV(): void {
//     this.gridApi.exportDataAsCsv();
//   }

//   onColorChange(event: any): void {
//     const color = event.value;
//     this.accentColor = color;
//     document.documentElement.style.setProperty('--theme-accent-primary', color);
//     this.gridApi.refreshHeader();
//     this.gridApi.refreshCells({ force: true });
//   }

//   onSearch(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     this.gridApi.setGridOption('quickFilterText', input.value);
//   }

//   onFilterClick(): void {
//     this.gridApi.setFilterModel(null);
//   }

//   onActionClicked(event: { action: string; data: any }): void {
//     this.eventFromGrid.emit({ eventType: 'actionClicked', action: event.action, data: event.data });
//   }

//   // -------------------------------------------------------------------- Theme Section -------------------------------------------------------------
//   public theme = themeQuartz.withParams({
//     backgroundColor: 'var(--theme-bg-primary, #ffffff)',
//     foregroundColor: 'var(--theme-text-primary, #111827)',
//     headerTextColor: 'var(--theme-text-heading, #374151)',
//     headerBackgroundColor: 'var(--theme-bg-secondary, #f3f4f6)',
//     oddRowBackgroundColor: 'var(--theme-bg-primary, #ffffff)',
//     headerColumnResizeHandleColor: 'var(--theme-accent-primary, #3b82f6)',
//     borderColor: 'var(--theme-border-primary, #e5e7eb)',
//     fontFamily: 'Inter, Poppins, sans-serif',
//     fontSize: '0.75rem',
//     headerFontFamily: 'Inter, Poppins, sans-serif',
//     headerFontWeight: '500',
//     rangeSelectionBorderColor: 'var(--theme-accent-primary, #3b82f6)',
//     rangeSelectionBorderStyle: 'dashed',
//     rangeSelectionBackgroundColor: 'var(--theme-accent-primary-light, #dbeafe)',
//     rangeSelectionHighlightColor: 'var(--theme-accent-primary, #3b82f6)',
//     inputBorder: { color: 'var(--theme-accent-primary, #3b82f6)', style: 'solid', width: 1 },
//     inputBackgroundColor: 'var(--theme-bg-ternary, #f9fafb)',
//     inputPlaceholderTextColor: 'var(--theme-text-secondary, #6b7280)',
//     inputIconColor: 'var(--theme-accent-primary, #3b82f6)',
//     selectedRowBackgroundColor: 'var(--theme-accent-primary-light, #dbeafe)'
//   });
//   public defaultRowClassRules = {
//     'bg-blue-100 dark:bg-blue-900': (params: any) => this.editingRowId === (params.data?._id || params.data?.id),
//     'bg-gray-50 dark:bg-gray-700': (params: any) => params.node.rowIndex % 2 === 0,
//     'bg-red-100 dark:bg-red-900': (params: any) => params.data.availabilityStatus === 'OutOfStock',
//     'bg-green-100 dark:bg-green-900': (params: any) => params.data.availabilityStatus === 'InStock'
//   };


// }










// // ---------------------------------------------------------- version 2 ---------------------------------------------------------------------------------


// // import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
// // import { AgGridAngular } from 'ag-grid-angular';
// // import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, RowSelectedEvent, CellClickedEvent, GetRowIdParams } from 'ag-grid-community';
// // import { FormsModule } from '@angular/forms';
// // import { CommonModule } from '@angular/common';
// // import { SelectModule } from 'primeng/select';
// // import { ToolbarModule } from 'primeng/toolbar';
// // // import { ColorPickerModule } from 'primeng/color-picker';
// // import { AllCommunityModule } from 'ag-grid-community';
// // import { ModuleRegistry } from 'ag-grid-community';
// // import { ActionbuttonsComponent } from '../../AgGridcomponents/actionbuttons/actionbuttons.component';
// // import { DynamicCellComponent } from '../../AgGridcomponents/dynamic-cell/dynamic-cell.component';
// // import { ThemeService } from '../../../../core/services/theme.service';
// // import { themeQuartz } from 'ag-grid-community';
// // import { StatusCellComponent, StatusColumnConfig } from '../../AgGridcomponents/status-cell/status-cell.component';

// // ModuleRegistry.registerModules([AllCommunityModule]);

// // export interface SharedGridOptions {
// //   columnDefs: ColDef[];
// //   data: any[];
// //   rowSelectionMode?: 'single' | 'multiple';
// //   gridHeight?: string;
// //   statusColumn?: StatusColumnConfig;
// //   paginationPageSize?:number,
// //   GridName?:string,
// //   headerFilter?:boolean,
// //   showActions?:boolean,
// // }

// // @Component({
// //   selector: 'app-shared-grid',
// //   standalone: true,
// //   imports: [AgGridAngular, FormsModule, ToolbarModule, CommonModule, SelectModule],
// //   templateUrl: './shared-grid.component.html',
// //   styleUrls: ['./shared-grid.component.css']
// // })
// // export class SharedGridComponent implements OnInit, OnChanges {
// // @Input() column: ColDef[] = []

// // @Input() GridOptions:SharedGridOptions={
// //   data:[],
// //   rowSelectionMode:'single',
// //   gridHeight:'162px',
// //   paginationPageSize:100,
// //   GridName:'',
// //   headerFilter:false,
// //   showActions:false,
// // }

// //   @Input() rowClassRules: any = {};
// //   usertheme: string = 'ag-theme-quartz';
// //   @Input() data: any
// //   @Input() rowSelectionMode: string = 'single';
// //   @Input() gridHeight: string = '162px';
// //   @Input() paginationPageSize: number = 100;
// //   @Input() GridName: string = '';
// //   @Input() headerFilter: boolean = true;
// //   @Input() showActions: boolean = false;
// //   @Output() dataChanged = new EventEmitter<any>();
// //   @Output() eventFromGrid = new EventEmitter<any>();
// //   @Output() gridReady = new EventEmitter<GridReadyEvent>();
// //   private gridApi!: GridApi;
// //   public rowData: any[] = [];
// //   public columnDefs: ColDef[] = [];
// //   public editingRowId: string | null = null;
// //   public originalRowData: any = {};
// //   public accentColor: string = '#3b82f6';
// //   public mainGridHeight: string = 'calc(100vh - 162px)';
// //   public rowSelection: any = { mode: 'single' };

// //   public mergedRowClassRules: any = {};

// //   public defaultColDef: ColDef = {
// //     sortable: true,
// //     filter: 'agTextColumnFilter',
// //     resizable: true,
// //     flex: 1,
// //     minWidth: 120,
// //     editable: (params) => this.editingRowId === (params.data?._id || params.data?.id)
// //   };
// //   getRowId: (params: GetRowIdParams) => string = (params: GetRowIdParams) => {
// //     return params.data._id || String(params.data.id);
// //   };

// //   constructor(private themeService: ThemeService) { }

// //   ngOnInit(): void {
// //     this.rowSelection = { mode: this.rowSelectionMode };
// //     this.computeGridHeight();
// //     this.rowData = Array.isArray(this.data) ? this.data : [];
// //     this.updateColumnDefs();
// //     this.updateRowClassRules();
// //     this.accentColor = getComputedStyle(document.documentElement)
// //       .getPropertyValue('--theme-accent-primary')
// //       .trim() || '#3b82f6';
// //   }

// //   ngOnChanges(changes: SimpleChanges): void {
// //     if (changes['data'] && changes['data'].currentValue) {
// //       this.rowData = Array.isArray(changes['data'].currentValue) ? changes['data'].currentValue : [];
// //     }
// //     if (changes['column'] || changes['showActions']) {
// //       this.updateColumnDefs();
// //     }
// //     if (changes['rowSelectionMode']) {
// //       this.rowSelection = { mode: this.rowSelectionMode };
// //     }
// //     if (changes['gridHeight']) {
// //       this.computeGridHeight();
// //     }
// //     if (changes['rowClassRules']) {
// //       this.updateRowClassRules();
// //     }
// //   }

// //   computeGridHeight(): void {
// //     const isValidLength = (value: string): boolean => {
// //       if (!/^\d+(\.\d+)?(\w+|%)$/.test(value)) {
// //         console.warn(`Invalid CSS length for gridHeight: ${value}. Using default '162px'.`);
// //         return false;
// //       }
// //       return true;
// //     };
// //     const height = isValidLength(this.gridHeight) ? this.gridHeight : '162px';
// //     this.mainGridHeight = `calc(100vh - ${height})`;
// //   }

// //   updateRowClassRules(): void {
// //     this.mergedRowClassRules = {
// //       ...this.defaultRowClassRules,
// //       ...this.rowClassRules
// //     };
// //   }

// //   updateColumnDefs(): void {
// //     const baseColumns = this.column && this.column.length > 0 ? [...this.column] : this.generateDefaultColumns(this.rowData);
// //     if (this.showActions) {
// //       const actionColumnExists = baseColumns.some(col => col.colId === 'actionButtons');
// //       if (!actionColumnExists) {
// //         baseColumns.push({
// //           headerName: 'Actions',
// //           field: 'actions',
// //           cellRenderer: ActionbuttonsComponent,
// //           editable: false,
// //           colId: 'actionButtons',
// //           cellRendererParams: {
// //             actionHandler: (action: string, data: any) => this.handleCellAction(action, data),
// //             isRowEditing: (id: string) => this.editingRowId === id
// //           },
// //           pinned: 'right',
// //           width: 120,
// //           minWidth: 100,
// //         });
// //       }
// //     }

// //     this.columnDefs = baseColumns;
// //   }

// //   handleCellAction(action: string, data: any): void {
// //     switch (action) {
// //       case 'edit':
// //         this.startEditingRow(data);
// //         break;
// //       case 'save':
// //         this.saveRow(data);
// //         break;
// //       case 'cancel':
// //         this.cancelEditingRow(data);
// //         break;
// //       case 'delete':
// //         this.deleteRow(data);
// //         break;
// //     }
// //   }

// //   startEditingRow(rowData: any): void {
// //     if (!this.gridApi) return;
// //     this.editingRowId = rowData._id || rowData.id;
// //     this.originalRowData = { ...rowData };
// //     this.gridApi.refreshCells({ force: true });
// //     const firstEditableField = this.columnDefs.find(col => col.editable !== false)?.field || 'email';
// //     this.gridApi.startEditingCell({ rowIndex: this.getRowIndex(rowData), colKey: firstEditableField });
// //   }

// //   saveRow(rowData: any): void {
// //     if (!this.gridApi) return;
// //     this.gridApi.stopEditing(false);
// //     this.editingRowId = null;
// //     this.gridApi.refreshCells({ force: true });
// //     this.dataChanged.emit({ type: 'save', data: rowData });
// //   }

// //   cancelEditingRow(rowData: any): void {
// //     if (!this.gridApi) return;
// //     const rowIndex = this.getRowIndex(rowData);
// //     if (rowIndex >= 0) {
// //       const restoredRow = { ...this.originalRowData };
// //       this.rowData[rowIndex] = restoredRow;
// //       this.gridApi.applyTransaction({ update: [restoredRow] });
// //       this.gridApi.stopEditing(true);
// //       this.editingRowId = null;
// //       this.gridApi.refreshCells({ force: true });
// //       this.dataChanged.emit({ type: 'cancel', data: rowData });
// //     }
// //   }

// //   deleteRow(rowData: any): void {
// //     if (!this.gridApi) return;
// //     this.rowData = this.rowData.filter(row => row._id !== rowData._id);
// //     this.gridApi.applyTransaction({ remove: [rowData] });
// //     this.dataChanged.emit({ type: 'delete', data: rowData });
// //   }

// //   getRowIndex(rowData: any): number {
// //     return this.rowData.findIndex(row => (row._id || row.id) === (rowData._id || rowData.id));
// //   }

// //   generateDefaultColumns(data: any[]): ColDef[] {
// //     if (!data || data.length === 0) {
// //       return [
// //         {
// //           headerName: 'No Data',
// //           field: 'noData',
// //           valueGetter: () => 'No data available',
// //           editable: false
// //         }
// //       ];
// //     }
// //     return Object.keys(data[0]).map(key => {
// //       const isNumeric = data.every(row => typeof row[key] === 'number' || row[key] == null);
// //       const isBoolean = data.every(row => typeof row[key] === 'boolean' || row[key] == null);
// //       return {
// //         headerName: key.charAt(0).toUpperCase() + key.slice(1),
// //         field: key,
// //         cellRenderer: isNumeric || isBoolean ? undefined : DynamicCellComponent,
// //         cellRendererParams: isNumeric || isBoolean ? undefined : { type: 'text' },
// //         filter: isNumeric ? 'agNumberColumnFilter' : isBoolean ? 'agSetColumnFilter' : 'agTextColumnFilter'
// //       };
// //     });
// //   }

// //   onCellValueChanged(event: CellValueChangedEvent): void {
// //     this.eventFromGrid.emit({ eventType: 'onCellValueChanged', event });
// //   }

// //   onRowSelected(event: RowSelectedEvent): void {
// //     this.eventFromGrid.emit({ eventType: 'RowSelectedEvent', event });
// //   }

// //   onCellClicked(event: CellClickedEvent): void {
// //     this.eventFromGrid.emit({ eventType: 'CellClickedEvent', event });
// //   }

// //   onGridReady(event: GridReadyEvent): void {
// //     this.gridApi = event.api;
// //     this.gridReady.emit(event);
// //   }

// //   exportToCSV(): void {
// //     this.gridApi.exportDataAsCsv();
// //   }

// //   onColorChange(event: any): void {
// //     const color = event.value;
// //     this.accentColor = color;
// //     document.documentElement.style.setProperty('--theme-accent-primary', color);
// //     this.gridApi.refreshHeader();
// //     this.gridApi.refreshCells({ force: true });
// //     // this.themeService.updateGradient(color);
// //   }

// //   onSearch(event: Event): void {
// //     const input = event.target as HTMLInputElement;
// //     this.gridApi.setGridOption('quickFilterText', input.value);
// //   }

// //   onFilterClick(): void {
// //     this.gridApi.setFilterModel(null);
// //     this.gridApi.onFilterChanged();
// //   }

// //   onActionClicked(event: { action: string; data: any }): void {
// //     this.eventFromGrid.emit({ eventType: 'actionClicked', action: event.action, data: event.data });
// //   }
// //   // -------------------------------------------------------------------- Theme Section -------------------------------------------------------------
// //   public theme = themeQuartz.withParams({
// //     backgroundColor: 'var(--theme-bg-primary, #ffffff)',
// //     foregroundColor: 'var(--theme-text-primary, #111827)',
// //     headerTextColor: 'var(--theme-text-heading, #374151)',
// //     headerBackgroundColor: 'var(--theme-bg-secondary, #f3f4f6)',
// //     oddRowBackgroundColor: 'var(--theme-bg-primary, #ffffff)',
// //     headerColumnResizeHandleColor: 'var(--theme-accent-primary, #3b82f6)',
// //     borderColor: 'var(--theme-border-primary, #e5e7eb)',
// //     fontFamily: 'Inter, Poppins, sans-serif',
// //     fontSize: '0.75rem',
// //     headerFontFamily: 'Inter, Poppins, sans-serif',
// //     headerFontWeight: '500',
// //     rangeSelectionBorderColor: 'var(--theme-accent-primary, #3b82f6)',
// //     rangeSelectionBorderStyle: 'dashed',
// //     rangeSelectionBackgroundColor: 'var(--theme-accent-primary-light, #dbeafe)',
// //     rangeSelectionHighlightColor: 'var(--theme-accent-primary, #3b82f6)',
// //     inputBorder: { color: 'var(--theme-accent-primary, #3b82f6)', style: 'solid', width: 1 },
// //     inputBackgroundColor: 'var(--theme-bg-ternary, #f9fafb)',
// //     inputPlaceholderTextColor: 'var(--theme-text-secondary, #6b7280)',
// //     inputIconColor: 'var(--theme-accent-primary, #3b82f6)',
// //     selectedRowBackgroundColor: 'var(--theme-accent-primary-light, #dbeafe)'
// //   });
// //   public defaultRowClassRules = {
// //     'bg-blue-100 dark:bg-blue-900': (params: any) => this.editingRowId === (params.data?._id || params.data?.id),
// //     'bg-gray-50 dark:bg-gray-700': (params: any) => params.node.rowIndex % 2 === 0,
// //     'bg-red-100 dark:bg-red-900': (params: any) => params.data.availabilityStatus === 'OutOfStock',
// //     'bg-green-100 dark:bg-green-900': (params: any) => params.data.availabilityStatus === 'InStock'
// //   };


// // }












// // ---------------------------------------------------------- version 1---------------------------------------------

// // import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
// // import { AgGridAngular } from 'ag-grid-angular';
// // import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, RowSelectedEvent, CellClickedEvent, GetRowIdParams } from 'ag-grid-community';
// // import { FormsModule } from '@angular/forms';
// // import { CommonModule } from '@angular/common';
// // import { SelectModule } from 'primeng/select';
// // import { ToolbarModule } from 'primeng/toolbar';
// // // import { ColorPickerModule } from 'primeng/color-picker';
// // import { AllCommunityModule } from 'ag-grid-community';
// // import { ModuleRegistry } from 'ag-grid-community';
// // import { ActionbuttonsComponent } from '../../AgGridcomponents/actionbuttons/actionbuttons.component';
// // import { DynamicCellComponent } from '../../AgGridcomponents/dynamic-cell/dynamic-cell.component';
// // import { ThemeService } from '../../../../core/services/theme.service';
// // import { themeQuartz } from 'ag-grid-community';

// // ModuleRegistry.registerModules([AllCommunityModule]);

// // @Component({
// //   selector: 'app-shared-grid',
// //   standalone: true,
// //   imports: [AgGridAngular, FormsModule, ToolbarModule, CommonModule, SelectModule],
// //   templateUrl: './shared-grid.component.html',
// //   styleUrls: ['./shared-grid.component.css']
// // })
// // export class SharedGridComponent implements OnInit, OnChanges {
// //   @Input() rowClassRules: any = {};
// //   @Input() usertheme: string = 'ag-theme-quartz';
// //   @Input() data: any[] = [];
// //   @Input() rowSelectionMode: string = 'single';
// //   @Input() column: ColDef[] = [];
// //   @Input() gridHeight: string = '162px';
// //   @Input() paginationPageSize: number = 100;
// //   @Input() GridName: string = '';
// //   @Input() headerFilter: boolean = true;
// //   @Input() showActions: boolean = true;
// //   @Output() dataChanged = new EventEmitter<any>();
// //   @Output() eventFromGrid = new EventEmitter<any>();
// //   @Output() gridReady = new EventEmitter<GridReadyEvent>();

// //   private gridApi!: GridApi;
// //   rowData: any[] = [];
// //   columnDefs: ColDef[] = [];
// //   editingRowId: string | null = null;
// //   originalRowData: any = {};
// //   accentColor: string = '#3b82f6';
// //   mainGridHeight: string = 'calc(100vh - 162px)';

// //   defaultColDef: ColDef = {
// //     sortable: true,
// //     filter: 'agTextColumnFilter',
// //     resizable: true,
// //     editable: (params) => this.editingRowId === (params.data?._id || params.data?.id)
// //   };

// //   rowSelection: any = { mode: 'single' };

// //   defaultRowClassRules = {
// //     'bg-blue-100 dark:bg-blue-900': (params: any) => this.editingRowId === (params.data?._id || params.data?.id),
// //     'bg-gray-50 dark:bg-gray-700': (params: any) => params.node.rowIndex % 2 === 0,
// //     'bg-red-100 dark:bg-red-900': (params: any) => params.data.availabilityStatus === 'OutOfStock',
// //     'bg-green-100 dark:bg-green-900': (params: any) => params.data.availabilityStatus === 'InStock'
// //   };

// //   mergedRowClassRules: any = {};

// //   theme = themeQuartz.withParams({
// //     backgroundColor: 'var(--theme-bg-primary, #ffffff)',
// //     foregroundColor: 'var(--theme-text-primary, #111827)',
// //     headerTextColor: 'var(--theme-text-heading, #374151)',
// //     headerBackgroundColor: 'var(--theme-bg-secondary, #f3f4f6)',
// //     oddRowBackgroundColor: 'var(--theme-bg-primary, #ffffff)',
// //     headerColumnResizeHandleColor: 'var(--theme-accent-primary, #3b82f6)',
// //     borderColor: 'var(--theme-border-primary, #e5e7eb)',
// //     fontFamily: 'Inter, Poppins, sans-serif',
// //     fontSize: '0.75rem',
// //     headerFontFamily: 'Inter, Poppins, sans-serif',
// //     headerFontWeight: '500',
// //     rangeSelectionBorderColor: 'var(--theme-accent-primary, #3b82f6)',
// //     rangeSelectionBorderStyle: 'dashed',
// //     rangeSelectionBackgroundColor: 'var(--theme-accent-primary-light, #dbeafe)',
// //     rangeSelectionHighlightColor: 'var(--theme-accent-primary, #3b82f6)',
// //     inputBorder: { color: 'var(--theme-accent-primary, #3b82f6)', style: 'solid', width: 1 },
// //     inputBackgroundColor: 'var(--theme-bg-ternary, #f9fafb)',
// //     inputPlaceholderTextColor: 'var(--theme-text-secondary, #6b7280)',
// //     inputIconColor: 'var(--theme-accent-primary, #3b82f6)',
// //     selectedRowBackgroundColor: 'var(--theme-accent-primary-light, #dbeafe)'
// //   });

// //   getRowId: (params: GetRowIdParams) => string = (params: GetRowIdParams) => {
// //     return params.data._id || String(params.data.id);
// //   };

// //   constructor(private themeService: ThemeService) { }

// //   ngOnInit(): void {
// //     this.rowSelection = { mode: this.rowSelectionMode };
// //     this.computeGridHeight();
// //     this.rowData = Array.isArray(this.data) ? this.data : [];
// //     this.updateColumnDefs();
// //     this.updateRowClassRules();
// //     this.accentColor = getComputedStyle(document.documentElement)
// //       .getPropertyValue('--theme-accent-primary')
// //       .trim() || '#3b82f6';
// //   }

// //   ngOnChanges(changes: SimpleChanges): void {
// //     if (changes['data'] && changes['data'].currentValue) {
// //       this.rowData = Array.isArray(changes['data'].currentValue) ? changes['data'].currentValue : [];
// //     }
// //     if (changes['column'] || changes['showActions']) {
// //       this.updateColumnDefs();
// //     }
// //     if (changes['rowSelectionMode']) {
// //       this.rowSelection = { mode: this.rowSelectionMode };
// //     }
// //     if (changes['gridHeight']) {
// //       this.computeGridHeight();
// //     }
// //     if (changes['rowClassRules']) {
// //       this.updateRowClassRules();
// //     }
// //   }

// //   computeGridHeight(): void {
// //     const isValidLength = (value: string): boolean => {
// //       if (!/^\d+(\.\d+)?(\w+|%)$/.test(value)) {
// //         console.warn(`Invalid CSS length for gridHeight: ${value}. Using default '162px'.`);
// //         return false;
// //       }
// //       return true;
// //     };
// //     const height = isValidLength(this.gridHeight) ? this.gridHeight : '162px';
// //     this.mainGridHeight = `calc(100vh - ${height})`;
// //   }

// //   updateRowClassRules(): void {
// //     this.mergedRowClassRules = {
// //       ...this.defaultRowClassRules,
// //       ...this.rowClassRules
// //     };
// //   }

// //   updateColumnDefs(): void {
// //     // Start with the base columns from the input
// //     const baseColumns = this.column && this.column.length > 0 ? [...this.column] : this.generateDefaultColumns(this.rowData);

// //     if (this.showActions) {
// //       const actionColumnExists = baseColumns.some(col => col.colId === 'actionButtons');
// //       if (!actionColumnExists) {
// //         // Add the action button column if it's not already there and showActions is true
// //         baseColumns.push({
// //           headerName: 'Actions',
// //           field: 'actions',
// //           cellRenderer: ActionbuttonsComponent,
// //           editable: false,
// //           colId: 'actionButtons',
// //           cellRendererParams: {
// //             context: {
// //               isRowEditing: (id: string) => this.editingRowId === id,
// //               startEditingRow: (rowData: any) => this.startEditingRow(rowData),
// //               saveRow: (rowData: any) => this.saveRow(rowData),
// //               cancelEditingRow: (rowData: any) => this.cancelEditingRow(rowData),
// //               deleteRow: (rowData: any) => this.deleteRow(rowData),
// //             },
// //             // Pass a function to the cell renderer
// //             actionHandler: (action: string, data: any) => this.onActionClicked({ action, data })
// //           },
// //           pinned: 'right',
// //           width: 120,
// //           minWidth: 100
// //         });
// //       }
// //     }

// //     this.columnDefs = baseColumns;
// //   }

// //   startEditingRow(rowData: any): void {
// //     if (!this.gridApi) return;
// //     this.editingRowId = rowData._id || rowData.id;
// //     this.originalRowData = { ...rowData };
// //     this.gridApi.refreshCells({ force: true });
// //     const firstEditableField = this.columnDefs.find(col => col.editable !== false)?.field || 'email';
// //     this.gridApi.startEditingCell({ rowIndex: this.getRowIndex(rowData), colKey: firstEditableField });
// //   }

// //   saveRow(rowData: any): void {
// //     if (!this.gridApi) return;
// //     this.gridApi.stopEditing(false);
// //     this.editingRowId = null;
// //     this.gridApi.refreshCells({ force: true });
// //     this.dataChanged.emit({ type: 'save', data: rowData });
// //   }

// //   cancelEditingRow(rowData: any): void {
// //     if (!this.gridApi) return;
// //     const rowIndex = this.getRowIndex(rowData);
// //     if (rowIndex >= 0) {
// //       const restoredRow = { ...this.originalRowData };
// //       this.rowData[rowIndex] = restoredRow;
// //       this.gridApi.applyTransaction({ update: [restoredRow] });
// //       this.gridApi.stopEditing(true);
// //       this.editingRowId = null;
// //       this.gridApi.refreshCells({ force: true });
// //       this.dataChanged.emit({ type: 'cancel', data: rowData });
// //     }
// //   }

// //   deleteRow(rowData: any): void {
// //     if (!this.gridApi) return;
// //     this.rowData = this.rowData.filter(row => row._id !== rowData._id);
// //     this.gridApi.applyTransaction({ remove: [rowData] });
// //     this.dataChanged.emit({ type: 'delete', data: rowData });
// //   }

// //   getRowIndex(rowData: any): number {
// //     return this.rowData.findIndex(row => (row._id || row.id) === (rowData._id || rowData.id));
// //   }

// //   generateDefaultColumns(data: any[]): ColDef[] {
// //     if (!data || data.length === 0) {
// //       return [
// //         {
// //           headerName: 'No Data',
// //           field: 'noData',
// //           valueGetter: () => 'No data available',
// //           editable: false
// //         }
// //       ];
// //     }
// //     return Object.keys(data[0]).map(key => {
// //       const isNumeric = data.every(row => typeof row[key] === 'number' || row[key] == null);
// //       const isBoolean = data.every(row => typeof row[key] === 'boolean' || row[key] == null);
// //       return {
// //         headerName: key.charAt(0).toUpperCase() + key.slice(1),
// //         field: key,
// //         cellRenderer: isNumeric || isBoolean ? undefined : DynamicCellComponent,
// //         cellRendererParams: isNumeric || isBoolean ? undefined : { type: 'text' },
// //         filter: isNumeric ? 'agNumberColumnFilter' : isBoolean ? 'agSetColumnFilter' : 'agTextColumnFilter'
// //       };
// //     });
// //   }

// //   onCellValueChanged(event: CellValueChangedEvent): void {
// //     this.eventFromGrid.emit({ eventType: 'onCellValueChanged', event });
// //   }

// //   onRowSelected(event: RowSelectedEvent): void {
// //     this.eventFromGrid.emit({ eventType: 'RowSelectedEvent', event });
// //   }

// //   onCellClicked(event: CellClickedEvent): void {
// //     this.eventFromGrid.emit({ eventType: 'CellClickedEvent', event });
// //   }

// //   onGridReady(event: GridReadyEvent): void {
// //     this.gridApi = event.api;
// //     this.gridReady.emit(event);
// //   }

// //   exportToCSV(): void {
// //     this.gridApi.exportDataAsCsv();
// //   }

// //   onColorChange(event: any): void {
// //     const color = event.value;
// //     this.accentColor = color;
// //     document.documentElement.style.setProperty('--theme-accent-primary', color);
// //     this.gridApi.refreshHeader();
// //     this.gridApi.refreshCells({ force: true });
// //     this.themeService.updateGradient(color);
// //   }

// //   onSearch(event: Event): void {
// //     const input = event.target as HTMLInputElement;
// //     this.gridApi.setGridOption('quickFilterText', input.value);
// //   }

// //   onFilterClick(): void {
// //     this.gridApi.setFilterModel(null);
// //     this.gridApi.onFilterChanged();
// //   }

// //   onActionClicked(event: { action: string; data: any }): void {
// //     this.eventFromGrid.emit({ eventType: 'actionClicked', action: event.action, data: event.data });
// //   }