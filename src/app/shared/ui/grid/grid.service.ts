import { Injectable, signal } from '@angular/core';
import { GridColumn, GridUndoEntry } from './grid-types';

/**
 * Service: GridService
 * Provided at the DataGridComponent level (not root) so each grid instance
 * gets its own undo stack and clipboard buffer.
 *
 * Handles:
 *  - Undo / Redo stack (cell, row, bulk operations)
 *  - Clipboard (copy rows as JSON, paste back)
 *  - Export (CSV, JSON, XLS-compatible TSV) — no external deps
 */
@Injectable()
export class GridService {

  // ─── Undo / Redo ─────────────────────────────────────────────────────────

  private undoStack: GridUndoEntry[] = [];
  private redoStack: GridUndoEntry[] = [];

  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  push(entry: GridUndoEntry): void {
    this.undoStack.push(entry);
    this.redoStack = []; // clear redo branch on new action
    this.syncSignals();
  }

  undo(): GridUndoEntry | null {
    if (this.undoStack.length === 0) return null;
    const entry = this.undoStack.pop()!;
    this.redoStack.push(entry);
    this.syncSignals();
    return entry;
  }

  redo(): GridUndoEntry | null {
    if (this.redoStack.length === 0) return null;
    const entry = this.redoStack.pop()!;
    this.undoStack.push(entry);
    this.syncSignals();
    return entry;
  }

  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.syncSignals();
  }

  // ─── Clipboard ───────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private clipboard: any[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  copyRows(rows: any[]): void {
    this.clipboard = rows.map(r => ({ ...r }));
    try {
      const text = rows.map(r => JSON.stringify(r)).join('\n');
      navigator.clipboard.writeText(text).catch(() => { /* ignore */ });
    } catch { /* ignore */ }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pasteRows(): any[] {
    return this.clipboard.map(r => ({ ...r }));
  }

  hasClipboard(): boolean {
    return this.clipboard.length > 0;
  }

  // ─── Export ──────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportAsCSV(data: any[], columns: GridColumn[], filename = 'export'): void {
    const cols = columns.filter(c => c.visible !== false && c.type !== 'action');
    const header = cols.map(c => `"${c.header}"`).join(',');
    const rows = data.map(row =>
      cols.map(col => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val: any = row[col.field];
        if (val == null) return '""';
        const str = col.formatter ? col.formatter(val, row) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    this.download([header, ...rows].join('\r\n'), `${filename}.csv`, 'text/csv;charset=utf-8;');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportAsJSON(data: any[], columns: GridColumn[], filename = 'export'): void {
    const cols = columns.filter(c => c.visible !== false && c.type !== 'action');
    const exported = data.map(row => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: Record<string, any> = {};
      cols.forEach(col => { obj[col.field] = row[col.field]; });
      return obj;
    });
    this.download(JSON.stringify(exported, null, 2), `${filename}.json`, 'application/json');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportAsXLSX(data: any[], columns: GridColumn[], filename = 'export'): void {
    // Uses tab-separated format that Excel opens natively — no SheetJS dependency
    const cols = columns.filter(c => c.visible !== false && c.type !== 'action');
    const header = cols.map(c => c.header).join('\t');
    const rows = data.map(row =>
      cols.map(col => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val: any = row[col.field];
        if (val == null) return '';
        return col.formatter ? col.formatter(val, row) : String(val);
      }).join('\t')
    );
    this.download([header, ...rows].join('\r\n'), `${filename}.xls`, 'application/vnd.ms-excel');
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private syncSignals(): void {
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
  }

  private download(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
