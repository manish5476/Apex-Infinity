// ════════════════════════════════════════════════════════════════════════════
//  USAGE EXAMPLE — app.component.ts (or any parent component)
// ════════════════════════════════════════════════════════════════════════════

import { Component } from '@angular/core';

import { ColumnConfig, ExcelExportComponent, ExcelExportConfig } from './excel-export';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ExcelExportComponent],
  template: `
    <div style="padding: 2rem; font-family: Segoe UI, sans-serif;">
      <h2>Invoice Register</h2>

      <!-- ── Example 1: Basic usage ── -->
      <app-excel-export
        [data]="invoices"
        [columns]="invoiceColumns"
        [config]="exportConfig"
      />

      <!-- ── Example 2: Hide IDs + some keys ── -->
      <app-excel-export
        style="margin-left: 12px"
        [data]="invoices"
        [columns]="invoiceColumns"
        [config]="{
          fileName: 'invoices-summary',
          sheetTitle: 'Invoice Summary',
          showIds: false,
          hiddenKeys: ['gstNumber', 'notes'],
          showTotals: true,
          tabColor: '70AD47'
        }"
      />
    </div>
  `,
})
export class AppComponent {

  // ── Sample data ─────────────────────────────────────────────────────────
  invoices = [
    {
      id: 'INV-001',
      invoiceNumber: 'INV-2024-001',
      date: new Date('2024-01-15'),
      customerName: 'Rajesh Traders',
      gstNumber: '24AAFCR1234A1Z5',
      qty: 10,
      unitPrice: 1500,
      subtotal: 15000,
      gstAmount: 2700,
      totalAmount: 17700,
      isPaid: true,
      notes: 'Urgent delivery',
    },
    {
      id: 'INV-002',
      invoiceNumber: 'INV-2024-002',
      date: new Date('2024-01-18'),
      customerName: 'Mehta Enterprises',
      gstNumber: '27AAHFM5678B1Z9',
      qty: 5,
      unitPrice: 3200,
      subtotal: 16000,
      gstAmount: 2880,
      totalAmount: 18880,
      isPaid: false,
      notes: '',
    },
    {
      id: 'INV-003',
      invoiceNumber: 'INV-2024-003',
      date: new Date('2024-02-01'),
      customerName: 'Sharma & Sons',
      gstNumber: '07AAEFS9012C1Z3',
      qty: 20,
      unitPrice: 850,
      subtotal: 17000,
      gstAmount: 3060,
      totalAmount: 20060,
      isPaid: true,
      notes: 'Bulk order discount applied',
    },
  ];

  // ── Column definitions ──────────────────────────────────────────────────
  invoiceColumns: ColumnConfig[] = [
    {
      key: 'id',
      label: 'Record ID',
      isId: true,           // ← only shown when config.showIds = true
      type: 'text',
      width: 14,
    },
    {
      key: 'invoiceNumber',
      label: 'Invoice No.',
      type: 'text',
      width: 18,
    },
    {
      key: 'date',
      label: 'Invoice Date',
      type: 'date',
      width: 14,
    },
    {
      key: 'customerName',
      label: 'Customer',
      type: 'text',
      width: 24,
    },
    {
      key: 'gstNumber',
      label: 'GST Number',
      type: 'text',
      width: 20,
      // ← can also be hidden via hiddenKeys: ['gstNumber'] in config
    },
    {
      key: 'qty',
      label: 'Qty',
      type: 'number',
      width: 10,
      showTotal: true,      // ← sum appears in totals row
    },
    {
      key: 'unitPrice',
      label: 'Unit Price (₹)',
      type: 'currency',
      currencySymbol: '₹',
      width: 16,
      showTotal: false,     // ← no total for unit price (it wouldn't make sense)
    },
    {
      key: 'subtotal',
      label: 'Subtotal (₹)',
      type: 'currency',
      currencySymbol: '₹',
      width: 16,
      showTotal: true,
    },
    {
      key: 'gstAmount',
      label: 'GST (₹)',
      type: 'currency',
      currencySymbol: '₹',
      width: 14,
      showTotal: true,
      headerColor: 'C55A11', // ← custom orange header for this column
    },
    {
      key: 'totalAmount',
      label: 'Total Amount (₹)',
      type: 'currency',
      currencySymbol: '₹',
      width: 18,
      showTotal: true,
      headerColor: '1F3864', // ← dark blue header
    },
    {
      key: 'isPaid',
      label: 'Paid?',
      type: 'boolean',      // ← renders as "Yes" / "No"
      width: 10,
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'text',
      width: 28,
    },
  ];

  // ── Export config ────────────────────────────────────────────────────────
  exportConfig: ExcelExportConfig = {
    fileName: 'invoice-register-2024',
    sheetTitle: 'Invoice Register — 2024',
    showTimestamp: true,
    showTotals: true,
    showIds: true,          // ← toggle to false to hide the 'id' column
    hiddenKeys: [],         // ← add keys here to hide columns dynamically e.g. ['notes']
    freezeHeader: true,
    autoFilter: true,
    tabColor: '2E75B6',
    alternateRowColor: 'EEF4FB',
    creator: 'Learning Aksh ERP',
  };
}


// ════════════════════════════════════════════════════════════════════════════
//  QUICK REFERENCE — All ColumnConfig options
// ════════════════════════════════════════════════════════════════════════════
/*
interface ColumnConfig {
  key: string;              // REQUIRED — matches the object property name
  label: string;            // REQUIRED — header text in Excel
  visible?: boolean;        // default true — set false to permanently hide
  isId?: boolean;           // marks as an ID column — shown only when showIds=true
  width?: number;           // column width in chars (ExcelJS unit)
  type?: 'text'             // plain string (default)
       | 'number'           // numeric with commas  → #,##0.00
       | 'currency'         // numeric with symbol  → ₹#,##0.00
       | 'percent'          // percent format       → 0.00%
       | 'date'             // Date object / ISO    → DD-MM-YYYY
       | 'boolean';         // true/false           → Yes / No
  currencySymbol?: string;  // default '₹', used with type='currency'
  showTotal?: boolean;      // default true for numeric — false disables SUM
  formatter?: (value: unknown) => string;  // custom cell value override
  headerColor?: string;     // hex WITHOUT '#' (e.g. 'C55A11') for column header
}
*/

// ════════════════════════════════════════════════════════════════════════════
//  QUICK REFERENCE — All ExcelExportConfig options
// ════════════════════════════════════════════════════════════════════════════
/*
interface ExcelExportConfig {
  fileName?: string;            // output file name without extension (default: 'export')
  sheetTitle?: string;          // title row text and worksheet name
  showTimestamp?: boolean;      // show "Generated on …" row (default: true)
  showTotals?: boolean;         // show SUM row at bottom (default: true)
  hiddenKeys?: string[];        // array of column keys to HIDE at runtime
  showIds?: boolean;            // whether isId columns are visible (default: false)
  freezeHeader?: boolean;       // freeze first header row (default: true)
  autoFilter?: boolean;         // Excel auto-filter dropdowns (default: true)
  tabColor?: string;            // sheet tab hex colour (default: '2E75B6')
  alternateRowColor?: string;   // alternate row fill hex (default: 'EEF4FB')
  creator?: string;             // workbook metadata
}
*/
