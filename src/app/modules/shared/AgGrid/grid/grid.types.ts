import { ColDef, ICellEditorParams, ICellRendererParams } from 'ag-grid-community';

export type CellType =
  | 'text' | 'number' | 'currency' | 'date' | 'boolean'
  | 'select' | 'multiselect'
  | 'textarea' | 'password'
  | 'color' | 'switch'
  | 'image' | 'badge' | 'tags';

export interface CellConfig {
  type: CellType;

  options?: any[];
  optionLabel?: string;
  optionValue?: string;

  placeholder?: string;
  currencyCode?: string;
  dateFormat?: string;

  min?: number;
  max?: number;
  disabled?: boolean;
  required?: boolean;

  imageHeight?: string;

  badgeSeverity?: (value: any) =>
    'success' | 'info' | 'warn' | 'danger' | null;
}

export interface MasterEditorParams<T = any>
  extends ICellEditorParams<T> {
  cellConfig: CellConfig;
}

export interface MasterRendererParams<T = any>
  extends ICellRendererParams<T> {
  cellConfig: CellConfig;
}

export type GridColDef<T = any> = ColDef<T> & {
  cellConfig?: CellConfig;
};
