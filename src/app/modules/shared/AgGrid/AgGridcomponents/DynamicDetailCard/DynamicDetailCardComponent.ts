import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  standalone: true,
  selector: 'app-dynamic-detail-table',
  imports: [CommonModule, TableModule],
  template: `
    <div class="detail-wrapper theme-glass">

      <!-- HEADER -->
      <header class="detail-header">
        <div>
          <h1>Record details</h1>
          <p>Structured system data</p>
        </div>
        <button class="close-btn" (click)="close()">×</button>
      </header>

      <!-- ROOT TABLE -->
      <section class="table-section">
        <p-table
          [value]="rootRows"
          [tableStyle]="{ 'min-width': '100%' }"
          class="detail-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-row>
            <tr>
              <td class="cell-label">{{ row.label }}</td>
              <td class="cell-value">{{ row.value }}</td>
            </tr>
          </ng-template>
        </p-table>
      </section>

      <!-- OBJECT SECTIONS -->
      @for (section of objectSections; track section.key) {
        <section class="table-section">
          <h2>{{ section.title }}</h2>

          <p-table
            [value]="section.rows"
            [tableStyle]="{ 'min-width': '100%' }"
            class="detail-table"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-row>
              <tr>
                <td class="cell-label">{{ row.label }}</td>
                <td class="cell-value">{{ row.value }}</td>
              </tr>
            </ng-template>
          </p-table>
        </section>
      }

      <!-- ARRAY SECTIONS -->
      @for (section of arraySections; track section.key) {
        <section class="table-section">
          <h2>{{ section.title }}</h2>

          @for (table of section.tables; track $index) {
            <div class="array-block">
              <div class="array-title">Item {{ $index + 1 }}</div>

              <p-table
                [value]="table"
                [tableStyle]="{ 'min-width': '100%' }"
                class="detail-table"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </ng-template>

                <ng-template pTemplate="body" let-row>
                  <tr>
                    <td class="cell-label">{{ row.label }}</td>
                    <td class="cell-value">{{ row.value }}</td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          }
        </section>
      }

    </div>
  `,
  styles: [`
/* =========================================================
   WRAPPER
========================================================= */
.detail-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* =========================================================
   HEADER
========================================================= */
.detail-header {
  padding: var(--spacing-2xl) var(--spacing-3xl);
  border-bottom: var(--ui-border-width) solid var(--component-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header h1 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.detail-header p {
  margin: 2px 0 0;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--ui-border-radius-sm);
}
.close-btn:hover {
  background: var(--component-bg-hover);
}

/* =========================================================
   SECTIONS
========================================================= */
.table-section {
  padding: var(--spacing-3xl);
}

.table-section h2 {
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

/* =========================================================
   TABLE (PRIME OVERRIDE)
========================================================= */
:host ::ng-deep .detail-table {
  border: var(--ui-border-width) solid var(--component-divider);
  border-radius: var(--ui-border-radius);
  overflow: hidden;
  background: var(--bg-secondary);
}

:host ::ng-deep .detail-table th {
  background: var(--bg-ternary);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  padding: var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--component-divider);
}

:host ::ng-deep .detail-table td {
  padding: var(--spacing-lg);
  font-size: var(--font-size-sm);
  border-bottom: var(--ui-border-width) solid var(--component-divider);
}

:host ::ng-deep .detail-table tr:nth-child(even) td {
  background: var(--bg-ternary);
}

/* =========================================================
   CELLS
========================================================= */
.cell-label {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  width: 35%;
}

.cell-value {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  word-break: break-word;
}

/* =========================================================
   ARRAY
========================================================= */
.array-block {
  margin-bottom: var(--spacing-3xl);
}

.array-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-sm);
}
  `]
})
export class DynamicDetailTableComponent {

  private ref = inject(DynamicDialogRef);
  private cfg = inject(DynamicDialogConfig);

  private data = this.cfg.data ?? {};

  rootRows = this.toRows(this.data, true);
  objectSections = this.getObjectSections();
  arraySections = this.getArraySections();

  close() {
    this.ref.close();
  }

  /* ===============================
     DATA TRANSFORM
  =============================== */

  private toRows(obj: any, root = false) {
    return Object.entries(obj)
      .filter(([_, v]) => typeof v !== 'object' || v === null)
      .map(([k, v]) => ({
        label: this.label(k),
        value: this.format(k, v)
      }));
  }

  private getObjectSections() {
    return Object.entries(this.data)
      .filter(([_, v]) => this.isObject(v))
      .map(([k, v]: any) => ({
        key: k,
        title: this.label(k),
        rows: this.toRows(v)
      }));
  }

  private getArraySections() {
    return Object.entries(this.data)
      .filter(([_, v]) => Array.isArray(v))
      .map(([k, arr]: any) => ({
        key: k,
        title: this.label(k),
        tables: arr.map((item: any) => this.toRows(item))
      }));
  }

  /* ===============================
     HELPERS
  =============================== */

  private isObject(v: any) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  }

  private label(key: string) {
    return key
      .replace(/^_+/g, '')
      .replace(/[-_]/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .replace(/^./, s => s.toUpperCase());
  }

  private format(key: string, val: any) {
    if (val === null || val === undefined || val === '') return '—';

    if (key.toLowerCase().includes('date')) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-IN');
    }

    if (/(amount|total|price|balance|tax)/i.test(key) && typeof val === 'number') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(val);
    }

    if (typeof val === 'boolean') return val ? 'Yes' : 'No';

    return String(val);
  }
}
