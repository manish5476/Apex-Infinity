# ExcelExportComponent — Angular 19 + PrimeNG + ExcelJS

A fully standalone, production-grade Angular component for exporting any
`Record<string, unknown>[]` dataset to a beautifully formatted `.xlsx` file.

---

## 1. Install dependencies

```bash
npm install exceljs file-saver
npm install @types/file-saver --save-dev
```

---

## 2. Files

| File | Purpose |
|------|---------|
| `excel-export.component.ts` | Component logic, ExcelJS workbook builder |
| `excel-export.component.html` | PrimeNG button template |
| `excel-export.component.scss` | Green Excel-style button styles |
| `usage-example.component.ts` | Full working usage example with invoices |

---

## 3. Register in angular.json (for allowSyntheticDefaultImports)

In `tsconfig.json` add:
```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

---

## 4. Basic usage

```html
<app-excel-export
  [data]="myArray"
  [columns]="columnDefs"
  [config]="exportConfig"
/>
```

---

## 5. ColumnConfig — full control per column

```ts
const columns: ColumnConfig[] = [
  { key: 'id',          label: 'ID',          isId: true      },   // hidden unless showIds=true
  { key: 'name',        label: 'Customer',    type: 'text'    },
  { key: 'amount',      label: 'Amount (₹)',  type: 'currency', showTotal: true },
  { key: 'gst',         label: 'GST',         type: 'currency', showTotal: true, headerColor: 'C55A11' },
  { key: 'date',        label: 'Date',        type: 'date'    },
  { key: 'qty',         label: 'Qty',         type: 'number',   showTotal: true },
  { key: 'paid',        label: 'Paid?',       type: 'boolean' },  // renders Yes/No
  { key: 'notes',       label: 'Notes',       visible: false  },  // always hidden
];
```

---

## 6. ExcelExportConfig — runtime control

```ts
const config: ExcelExportConfig = {
  fileName:           'my-report-2024',
  sheetTitle:         'Sales Report',
  showTimestamp:      true,       // "Generated on …" row
  showTotals:         true,       // SUM row at bottom for numeric columns
  showIds:            false,      // hide all isId=true columns
  hiddenKeys:         ['notes', 'gstNumber'],  // hide by key at runtime
  freezeHeader:       true,
  autoFilter:         true,
  tabColor:           '2E75B6',
  alternateRowColor:  'EEF4FB',
  creator:            'My App',
};
```

---

## 7. Excel output features

| Feature | Detail |
|---------|--------|
| Title row | Merged, styled with sheet name |
| Timestamp row | "Generated on DD MMM YYYY HH:MM" aligned right |
| Header row | Bold white text on coloured background |
| Data rows | Alternating fill, proper number formats |
| Totals row | SUM formula for all `showTotal: true` columns |
| Freeze pane | Header row frozen |
| Auto filter | Dropdown on all columns |
| Column types | text, number, currency (₹), percent, date, boolean |
| Custom header colour | Per-column `headerColor` hex |
| Hidden columns | `hiddenKeys[]` or `visible: false` or `isId: true` + `showIds: false` |

---

## 8. Column visibility priority (highest to lowest)

1. `config.hiddenKeys` — if key is in this array → **HIDDEN** (wins over everything)
2. `col.isId === true && config.showIds === false` → **HIDDEN**
3. `col.visible === false` → **HIDDEN**
4. Everything else → **VISIBLE**
