# AppSharedGrid — Complete Usage Guide

## File Structure (4 files total, down from 5)

```
grid/
├── grid.types.ts                          ← CellConfig, GridColDef, all types
├── master-cell/
│   └── master-cell.component.ts           ← SINGLE cell component (view + edit)
├── app-shared-grid/
│   ├── app-shared-grid.component.ts       ← Main grid
├── app-shared-grid-action-button/
│   └── app-shared-grid-action-button.ts   ← Edit/Save/Cancel/Delete buttons
```

**What was removed:** `master-cell-editor.component.ts` + `master-cell-renderer.component.ts`
**Replaced by:** Single `master-cell.component.ts` that handles both modes internally.

---

## Why One Component Instead of Two

The old `cellRendererSelector` approach told AG Grid to swap between two different
components depending on edit state. Every swap destroys + recreates the component,
which causes:
- Input focus loss
- Animation flicker
- Unnecessary DOM churn

The new approach uses ONE component with an internal `@if (showEditor)` toggle.
AG Grid never swaps — it just calls `refresh()`, the component reads the signal,
and Angular's template updates in-place. Zero flicker, full focus retention.

---

## Column Config Reference

### `cellConfig.alwaysEditable`
Column stays in edit mode regardless of whether the row is being edited.
Use for inline-form grids where users type directly without clicking Edit.

### `cellConfig.enterToSave`
When `true`, pressing Enter in this cell triggers `handleRowAction('save')`.
Default is `false` — Enter does nothing special, preventing accidental saves.

### `cellConfig.readOnly`
Column NEVER shows an editor, even when the row is in edit mode.
Use for computed fields, IDs, timestamps.

---

## All Supported Column Types

```typescript
import { GridColDef } from './grid.types';

const columns: GridColDef<MyRow>[] = [

  // ── TEXT (default) ──────────────────────────────────
  {
    field: 'name',
    headerName: 'Name',
    cellConfig: { type: 'text', enterToSave: true }
  },

  // ── NUMBER ──────────────────────────────────────────
  {
    field: 'quantity',
    headerName: 'Qty',
    cellConfig: {
      type: 'number',
      minFractionDigits: 0,
      maxFractionDigits: 0,
      min: 0,
      max: 9999
    }
  },

  // ── CURRENCY ────────────────────────────────────────
  {
    field: 'amount',
    headerName: 'Amount',
    cellConfig: {
      type: 'currency',
      currencyCode: 'INR',
      currencyLocale: 'en-IN',
      minFractionDigits: 2
    }
  },

  // ── DATE ────────────────────────────────────────────
  {
    field: 'dueDate',
    headerName: 'Due Date',
    cellConfig: {
      type: 'date',
      dateFormat: 'dd MMM yyyy',      // Angular pipe (view mode)
      datePickerFormat: 'dd/mm/yy',   // PrimeNG picker (edit mode)
      showTime: false
    }
  },

  // ── BOOLEAN / CHECKBOX ───────────────────────────────
  {
    field: 'isActive',
    headerName: 'Active',
    cellConfig: { type: 'boolean' }
  },

  // ── SELECT / DROPDOWN ────────────────────────────────
  {
    field: 'status',
    headerName: 'Status',
    cellConfig: {
      type: 'select',
      options: [
        { label: 'Active',   value: 'active',   severity: 'success' },
        { label: 'Pending',  value: 'pending',  severity: 'warning' },
        { label: 'Inactive', value: 'inactive', severity: 'danger'  }
      ]
    }
  },

  // ── BADGE (view-only status chip) ────────────────────
  {
    field: 'paymentStatus',
    headerName: 'Payment',
    cellConfig: {
      type: 'badge',
      // Optional: explicit map overrides keyword matching
      badgeMap: {
        paid: 'success',
        overdue: 'danger',
        partial: 'warning'
      }
    }
  },

  // ── EMAIL ───────────────────────────────────────────
  {
    field: 'email',
    headerName: 'Email',
    cellConfig: { type: 'email' }
  },

  // ── PHONE ───────────────────────────────────────────
  {
    field: 'phone',
    headerName: 'Phone',
    cellConfig: { type: 'phone' }
  },

  // ── URL ─────────────────────────────────────────────
  {
    field: 'website',
    headerName: 'Website',
    cellConfig: { type: 'url' }
  },

  // ── TEXTAREA ────────────────────────────────────────
  {
    field: 'notes',
    headerName: 'Notes',
    cellConfig: { type: 'textarea', rows: 3 }
  },

  // ── COLOR ───────────────────────────────────────────
  {
    field: 'brandColor',
    headerName: 'Color',
    cellConfig: { type: 'color', alwaysEditable: true }
  },

  // ── PROGRESS (view only) ────────────────────────────
  {
    field: 'completion',
    headerName: 'Progress',
    cellConfig: { type: 'progress', max: 100, showValue: true, readOnly: true }
  },

  // ── AVATAR (view only) ──────────────────────────────
  {
    field: 'avatarUrl',
    headerName: 'Photo',
    cellConfig: { type: 'avatar', labelField: 'name', readOnly: true }
  },

  // ── TAGS (view only) ────────────────────────────────
  {
    field: 'tags',
    headerName: 'Tags',
    cellConfig: { type: 'tags', readOnly: true }
  },

  // ── READ-ONLY (never editable) ───────────────────────
  {
    field: '_id',
    headerName: 'ID',
    cellConfig: { type: 'text', readOnly: true }
  },

  // ── ALWAYS EDITABLE (no row edit required) ───────────
  {
    field: 'quickNote',
    headerName: 'Quick Note',
    cellConfig: { type: 'text', alwaysEditable: true, enterToSave: true }
  },

];
```

---

## Handling Grid Events

```typescript
// In your parent component:
onGridEvent(event: SharedGridEvent<MyRow>) {
  switch (event.type) {
    case 'init':
      // Store API if needed: this.gridApi = event.api;
      break;

    case 'rowAdded':
      // New row was added to grid (not yet saved to server)
      break;

    case 'editStart':
      // Single row entered edit mode
      break;

    case 'save':
      // Single row saved — call your API
      this.myService.update(event.row._id!, event.data).subscribe();
      break;

    case 'bulkSave':
      // Multiple rows saved at once
      this.myService.bulkUpdate(event.rows).subscribe();
      break;

    case 'cancel':
      // Row reverted — no action needed (grid already restored)
      break;

    case 'delete':
      this.myService.delete((event.row as any)._id).subscribe();
      break;

    case 'bulkDelete':
      // Handle deletion of multiple rows
      break;

    case 'selectionChanged':
      this.selectedRows = event.rows;
      break;
  }
}
```

---

## Keyboard Shortcuts (per column config)

| Key | Behaviour |
|---|---|
| `Enter` | Saves row **only if** `cellConfig.enterToSave = true`. Otherwise does nothing. |
| `Escape` | Always cancels the current row edit. |
| `Tab` | Moves focus to next cell (browser default). |

---

## Adding a New Cell Type (future)

1. Add the type string to `CellType` in `grid.types.ts`
2. Add an `@case ('yourtype')` block in the `@if (showEditor)` section of `master-cell.component.ts`
3. Add an `@case ('yourtype')` block in the `@if (!showEditor)` section
4. Done — available everywhere immediately.