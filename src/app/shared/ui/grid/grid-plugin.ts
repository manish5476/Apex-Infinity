import { InjectionToken } from '@angular/core';
import { GridPlugin, GridContext } from './grid-types';

/**
 * InjectionToken for providing plugins to the DataGrid.
 *
 * Usage in a parent component/module:
 * providers: [
 *   { provide: GRID_PLUGINS, useValue: [new MyAuditPlugin()], multi: true }
 * ]
 */
export const GRID_PLUGINS = new InjectionToken<GridPlugin[]>('GRID_PLUGINS');

/**
 * Abstract base class for DataGrid plugins.
 * Extend this class and implement only the hooks you need.
 */
export abstract class BaseGridPlugin implements GridPlugin {
  abstract id: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onInit(_context: GridContext): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  onRowEdit(_row: any, _context: GridContext): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  onRowSave(_row: any, _context: GridContext): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  onSelectionChange(_rows: any[], _context: GridContext): void {}
  onDestroy(): void {}
}
