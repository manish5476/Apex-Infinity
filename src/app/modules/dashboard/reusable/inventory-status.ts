import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'inventory-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inv-wrapper">
      <div class="header">
        <span class="title">Inventory Health</span>
        <i class="pi pi-box icon"></i>
      </div>
      
      <div class="stats-row">
        <div class="stat">
          <span class="lbl">Total Items</span>
          <span class="val">{{ inventory?.totalItems || 0 }}</span>
        </div>
        <div class="stat">
          <span class="lbl">Products</span>
          <span class="val">{{ inventory?.products || 0 }}</span>
        </div>
      </div>

      <!-- Visual Warning if Low Stock -->
      <div class="alert-box" *ngIf="inventory?.lowStockCount > 0">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ inventory.lowStockCount }} items need reordering</span>
      </div>
      <div class="healthy-box" *ngIf="inventory?.lowStockCount === 0">
        <i class="pi pi-check-circle"></i>
        <span>Stock levels are optimal</span>
      </div>
    </div>
  `,
  styles: [`
    .inv-wrapper {
      padding: var(--spacing-md);
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header {
      display: flex;
      justify-content: space-between;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      margin-bottom: var(--spacing-md);
      .icon { color: var(--accent-tertiary); }
    }
    .stats-row {
      display: flex;
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-md);
      
      .stat {
        display: flex;
        flex-direction: column;
        .lbl { font-size: var(--font-size-xs); color: var(--text-tertiary); }
        .val { font-size: var(--font-size-xl); font-weight: bold; color: var(--text-primary); }
      }
    }
    .alert-box {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
      padding: var(--spacing-sm);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-sm);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    .healthy-box {
      background: rgba(16, 185, 129, 0.1);
      color: var(--color-success);
      padding: var(--spacing-sm);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-sm);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
  `]
})
export class InventoryStatusComponent {
  @Input() inventory: any;
}

// import { Component, Input, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   standalone: true,
//   selector: 'inventory-status',
//   imports: [CommonModule],
//   template: `
//     <div class="glass-card">
//       <h3>Inventory Health</h3>
//       @if (data()) {
//         <div class="grid">
//           <div class="stat">
//             <span class="val">{{ data()?.totalValue | currency:'INR':'symbol':'1.0-0' }}</span>
//             <span class="lbl">Total Value</span>
//           </div>
//           <div class="stat">
//             <span class="val">{{ data()?.totalItems }}</span>
//             <span class="lbl">Total Items</span>
//           </div>
//           <div class="stat">
//             <span class="val">{{ data()?.products }}</span>
//             <span class="lbl">Unique SKUs</span>
//           </div>
//           <div class="stat alert">
//             <span class="val">{{ data()?.lowStockCount }}</span>
//             <span class="lbl">Low Stock</span>
//           </div>
//         </div>
//       }
//     </div>
//   `,
//   styles: [`
//     .glass-card {
//       background: var(--bg-secondary); border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl); padding: 20px;
//       h3 { margin: 0 0 16px 0; font-size: 15px; color: var(--text-primary); }
//       .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
//       .stat { display: flex; flex-direction: column; }
//       .val { font-size: 16px; font-weight: 700; color: var(--text-primary); }
//       .lbl { font-size: 11px; color: var(--text-secondary); }
//       .stat.alert .val { color: var(--color-warning); }
//     }
//   `]
// })
// export class InventoryStatusComponent {
//   data = signal<any | null>(null);
//   @Input() set inventory(v: any) { this.data.set(v); }
// }


// // import { Component, Input, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';

// // @Component({
// //   selector: 'inventory-status',
// //   standalone: true,
// //   imports: [CommonModule],
// //   templateUrl: './inventory-status.html',
// //   styleUrls: ['./inventory-status.scss']
// // })
// // export class InventoryStatusComponent {
// //   data = signal<any | null>(null);

// //   @Input() set inventory(v: any | null) {
// //     this.data.set(v);
// //   }
// // }
