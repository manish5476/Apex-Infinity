export interface GridContext {
  isRowEditing: (id: string) => boolean;
  startEditingRow: (rowData: any) => void;
  stopEditing:(rowData: any) => void;
  saveRow: (rowData: any) => void;
  cancelEditingRow: (rowData: any) => void;
  deleteRow: (rowData: any) => void;
}