/**
 * GridQueryBuilder — Phase A
 *
 * Pure utility functions. Zero Angular dependencies. Zero HttpParams coupling.
 *
 * Usage:
 *   const payload = buildGridQuery(state, columns);
 *   // REST:     new HttpParams({ fromObject: toQueryString(payload) })
 *   // GraphQL:  { variables: { input: payload } }
 *   // Supabase: supabase.from('table').order(payload.sortField ?? 'id')
 *
 * Phase B will add: buildRestQuery(), buildGraphQLQuery(), buildSupabaseQuery()
 */

import { GridColumn, GridFilterState, GridSortState, GridQueryPayload } from '../grid-types';

// --- Internal State Shape ----------------------------------------------------
// Accepts the subset of state actually needed — avoids depending on a full GridState type
// so this file stays usable before Phase B's unified state interface.
export interface GridQueryInput {
  search: string;
  filters: GridFilterState[];
  sorting: GridSortState[];
  pagination: { page: number; pageSize: number; total: number };
}

// --- Path Resolution ---------------------------------------------------------

/**
 * Resolves the backend path for a given field.
 * Prefers `col.queryPath` (dot notation), falls back to `col.field`.
 *
 * Examples:
 *   queryPath: 'employee.department.name' ? 'employee.department.name'
 *   queryPath: undefined, field: 'status' ? 'status'
 */
function resolveQueryPath(field: string, columns: GridColumn[]): string {
  const col = columns.find(c => c.field === field);
  return col?.queryPath ?? field;
}

// --- Primary Builder ---------------------------------------------------------

/**
 * Converts internal grid state + column definitions into a backend-agnostic
 * GridQueryPayload.
 *
 * Key behaviors:
 *  - `sortField` / `sortOrder` are the single-sort shorthand (most REST APIs expect this)
 *  - `sorts` is the full multi-sort array (for backends that support it)
 *  - `filters[].path` uses `queryPath` when defined, otherwise `field`
 *  - `search` is omitted entirely when empty (cleaner API calls)
 *  - `filters` / `sorts` are omitted when empty arrays
 */
export function buildGridQuery(
  state: GridQueryInput,
  columns: GridColumn[]
): GridQueryPayload {
  const primarySort = state.sorting[0];

  const payload: GridQueryPayload = {
    page:     state.pagination.page,
    pageSize: state.pagination.pageSize,
  };

  // Search — omit key entirely if empty
  if (state.search?.trim()) {
    payload.search = state.search.trim();
  }

  // Single-sort shorthand (most backends)
  if (primarySort) {
    payload.sortField = resolveQueryPath(primarySort.field, columns);
    payload.sortOrder = primarySort.direction;
  }

  // Multi-sort array (only when there is something to include)
  if (state.sorting.length > 0) {
    payload.sorts = state.sorting.map(s => ({
      path:  resolveQueryPath(s.field, columns),
      order: s.direction,
    }));
  }

  // Filters (only when active)
  if (state.filters.length > 0) {
    payload.filters = state.filters.map(f => ({
      path:     resolveQueryPath(f.field, columns),
      operator: f.operator,
      value:    f.value,
    }));
  }

  return payload;
}

// --- Flat String Converter ---------------------------------------------------

/**
 * Converts a GridQueryPayload to a flat Record<string, string>.
 * Use this to create HttpParams or URLSearchParams:
 *
 *   const params = new HttpParams({ fromObject: toQueryString(payload) });
 *   // ? ?page=0&pageSize=50&sortField=name&sortOrder=asc&search=john
 *
 * Complex fields (sorts, filters) are JSON-stringified for transport.
 */
export function toQueryString(payload: GridQueryPayload): Record<string, string> {
  const result: Record<string, string> = {
    page:     String(payload.page),
    pageSize: String(payload.pageSize),
  };

  if (payload.search)    result['search']    = payload.search;
  if (payload.sortField) result['sortField'] = payload.sortField;
  if (payload.sortOrder) result['sortOrder'] = payload.sortOrder;

  if (payload.sorts?.length)
    result['sorts']   = JSON.stringify(payload.sorts);
  if (payload.filters?.length)
    result['filters'] = JSON.stringify(payload.filters);

  return result;
}
