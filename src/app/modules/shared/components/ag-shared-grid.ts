import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';

import {
  ColDef, GridApi, GridReadyEvent, GridOptions, RowSelectionOptions, ClientSideRowModelModule, CsvExportModule, TooltipModule, BodyScrollEndEvent, CellClickedEvent, themeQuartz, Theme
} from 'ag-grid-community';

import { ActionbuttonsComponent } from '../AgGrid/AgGridcomponents/actionbuttons/actionbuttons.component';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
/* --------------------------------------------------
   GRID EVENT CONTRACT
--------------------------------------------------- */
export type SharedGridEvent<T> =
  | { type: 'init'; api: GridApi<T> }
  | { type: 'cellClicked'; row: T; field: string; value: any }
  | { type: 'selectionChanged'; rows: T[] }
  | { type: 'cellEdited'; row: T; field: string; value: any }
  | { type: 'editStart'; row: T }
  | { type: 'save'; row: T }
  | { type: 'cancel'; row: T }
  | { type: 'delete'; row: T }
  | { type: 'reachedBottom' };

@Component({
  selector: 'app-ag-share-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="shared-grid-root">
      <ag-grid-angular
        class="ag-theme-quartz"
        style="width:100%; height:100%;"
        [theme]="agTheme()"
        [components]="components"
        [rowData]="data() ?? []"
        [columnDefs]="resolvedColumns()"
        [gridOptions]="gridOptions"
        [rowSelection]="selectionOptions"
        (gridReady)="onGridReady($event)"
        (cellClicked)="onCellClicked($event)"
        (cellValueChanged)="onCellValueChanged($event)"
        (selectionChanged)="onSelectionChanged()"
        (bodyScrollEnd)="onBodyScrollEnd($event)">
      </ag-grid-angular>
    </div>
  `,
styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      height: 100%;
      /* Enforces a minimum height on PC */
      min-height: 400px; 
      box-sizing: border-box;
    }

    .shared-grid-root {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;

      ag-grid-angular {
        flex: 1;
        width: 100%;
        height: 100% !important;
      }
    }

    /* Mobile Adjustment */
    @media (max-width: 768px) {
      :host {
        /* On small screens, we allow a smaller floor to prevent overflow */
        min-height: 300px; 
        height: auto;
      }
      
      .shared-grid-root {
        height: 450px; 
      }
    }
  `]
//   styles: [`
//     // :host {
//     //   display: block;
//     //   width: 100%;
//     //   height: 100%;
//     // }

//     // .shared-grid-root {
//     //   width: 100%;
//     //   height: 100%;
//     //   min-height: 350px;
//     //   border: 1px solid var(--border-primary);
//     //   border-radius: var(--ui-border-radius-lg);
//     //   overflow: hidden;
//     //   background: var(--bg-primary);
//     // }
//     :host {
//   display: flex;
//   flex-direction: column;
//   flex: 1;
//   height: 100%;
//   min-height:200px;
// }

// .shared-grid-root {
//   flex: 1;
//   height: 100%;
//   width: 100%;
//   display: flex;
//   flex-direction: column;
//   ag-grid-angular {
//     flex: 1;
//     height: 100% !important;
//   }
// }
//   `]
})
export class AgShareGrid<T = any> {

  /* --------------------------------------------------
     INPUTS
  --------------------------------------------------- */
  readonly columns = input.required<ColDef<T>[]>();
  readonly data = input<T[] | null>([]);
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  readonly showActions = input(false);

  /* --------------------------------------------------
     OUTPUT
  --------------------------------------------------- */
  readonly gridEvent = output<SharedGridEvent<T>>();

  /* --------------------------------------------------
     INTERNAL STATE
  --------------------------------------------------- */
  private api!: GridApi<T>;
  private editingRowId: string | number | null = null;
  private originalRowSnapshot: any = null;

  /* --------------------------------------------------
     AG GRID COMPONENT REGISTRY (v33+)
  --------------------------------------------------- */
  components = {
    ActionbuttonsComponent
  };

  readonly agTheme = computed<Theme>(() =>
    themeQuartz.withParams({
      /* Typography */
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--font-size-base)',

      /* Backgrounds */
      backgroundColor: 'var(--bg-primary)',
      headerBackgroundColor: 'var(--bg-secondary)',

      /* Text */
      foregroundColor: 'var(--text-primary)',
      headerTextColor: 'var(--text-label)',

      /* Borders */
      borderColor: 'var(--border-primary)',

      /* Interaction */
      rowHoverColor: 'var(--component-bg-hover)',
      selectedRowBackgroundColor: 'var(--accent-focus)',
      rangeSelectionBackgroundColor: 'var(--accent-focus)',
      rangeSelectionBorderColor: 'var(--accent-primary)',

      /* Inputs */
      inputBackgroundColor: 'var(--bg-ternary)',
      inputBorder: 'var(--component-border-focus)',
      inputPlaceholderTextColor: 'var(--text-tertiary)',

      /* Scrollbars */
      // scrollbarThumbColor: 'var(--scroll-thumb-c)',
      // scrollbarTrackColor: 'var(--scroll-track-c)',

      /* Density */
      rowHeight: 44,
      headerHeight: 44,
      spacing: 6
    })
  );

  /* --------------------------------------------------
     GRID OPTIONS (CLIENT SIDE SAFE)
  --------------------------------------------------- */
  gridOptions: GridOptions<T> = {
    defaultColDef: {
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      resizable: true,
      editable: params =>
        this.editingRowId === this.getRowId(params.data)
    },
    suppressCellFocus: false, // IMPORTANT for clicks
    animateRows: false,
    rowBuffer: 20
  };

  /* --------------------------------------------------
     COLUMN RESOLUTION
  --------------------------------------------------- */
  resolvedColumns = computed<ColDef<T>[]>(() => {
    const base = this.columns?.();
    if (!base || base.length === 0) return [];

    const cols = [...base];

    if (this.showActions()) {
      cols.push({
        headerName: 'Actions',
        colId: '__actions__',
        pinned: 'right',
        width: 120,
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: 'ActionbuttonsComponent',
        cellRendererParams: {
          actionHandler: (action: string, row: T) =>
            this.handleRowAction(action, row),
          isRowEditing: (id: string | number) =>
            this.editingRowId === id
        }
      });
    }

    return cols;
  });

  /* --------------------------------------------------
     SELECTION
  --------------------------------------------------- */
  get selectionOptions(): RowSelectionOptions | undefined {
    if (!this.selectionMode()) return undefined;
    return {
      mode: this.selectionMode() === 'single' ? 'singleRow' : 'multiRow'
    };
  }

  /* --------------------------------------------------
     GRID EVENTS
  --------------------------------------------------- */
  onGridReady(e: GridReadyEvent<T>) {
    this.api = e.api;
    this.gridEvent.emit({ type: 'init', api: this.api });
  }

  onSelectionChanged() {
    this.gridEvent.emit({
      type: 'selectionChanged',
      rows: this.api.getSelectedRows()
    });
  }

  /**
   * ✅ THIS IS WHAT YOU WERE MISSING
   * Fires ONLY when NOT editing
   */
  onCellClicked(e: CellClickedEvent<T>) {
    if (!e.data) return;

    const rowId = this.getRowId(e.data);
    if (this.editingRowId === rowId) return; // ignore clicks during edit

    this.gridEvent.emit({
      type: 'cellClicked',
      row: e.data,
      field: e.colDef.field!,
      value: e.value
    });
  }

  onCellValueChanged(e: any) {
    this.gridEvent.emit({
      type: 'cellEdited',
      row: e.data,
      field: e.colDef.field!,
      value: e.newValue
    });
  }

  onBodyScrollEnd(_: BodyScrollEndEvent) {
    const viewport = document.querySelector('.ag-body-viewport') as HTMLElement;
    if (!viewport) return;

    if (viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2) {
      this.gridEvent.emit({ type: 'reachedBottom' });
    }
  }

  /* --------------------------------------------------
     CRUD CORE
  --------------------------------------------------- */
  private handleRowAction(action: string, row: T) {
    const id = this.getRowId(row);

    switch (action) {
      case 'edit':
        this.editingRowId = id;
        this.originalRowSnapshot = { ...row };
        this.gridEvent.emit({ type: 'editStart', row });
        break;

      case 'save':
        this.editingRowId = null;
        this.originalRowSnapshot = null;
        this.gridEvent.emit({ type: 'save', row });
        break;

      case 'cancel':
        this.restoreRow(id);
        this.editingRowId = null;
        this.originalRowSnapshot = null;
        this.gridEvent.emit({ type: 'cancel', row });
        break;

      case 'delete':
        this.gridEvent.emit({ type: 'delete', row });
        break;
    }

    this.api.refreshCells({ force: true });
  }

  private restoreRow(rowId: string | number) {
    if (!this.originalRowSnapshot) return;
    const node = this.api.getRowNode(String(rowId));
    node?.setData(this.originalRowSnapshot);
  }

  private getRowId(row: any): string | number {
    return row?._id ?? row?.id;
  }
}
