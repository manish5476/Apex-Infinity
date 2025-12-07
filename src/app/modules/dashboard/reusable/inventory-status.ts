import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'inventory-status',
  imports: [CommonModule],
  template: `
    <div class="glass-card">
      <h3>Inventory Health</h3>
      @if (data()) {
        <div class="grid">
          <div class="stat">
            <span class="val">{{ data()?.totalValue | currency:'INR':'symbol':'1.0-0' }}</span>
            <span class="lbl">Total Value</span>
          </div>
          <div class="stat">
            <span class="val">{{ data()?.totalItems }}</span>
            <span class="lbl">Total Items</span>
          </div>
          <div class="stat">
            <span class="val">{{ data()?.products }}</span>
            <span class="lbl">Unique SKUs</span>
          </div>
          <div class="stat alert">
            <span class="val">{{ data()?.lowStockCount }}</span>
            <span class="lbl">Low Stock</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .glass-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); padding: 20px;
      h3 { margin: 0 0 16px 0; font-size: 15px; color: var(--text-primary); }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .stat { display: flex; flex-direction: column; }
      .val { font-size: 16px; font-weight: 700; color: var(--text-primary); }
      .lbl { font-size: 11px; color: var(--text-secondary); }
      .stat.alert .val { color: var(--color-warning); }
    }
  `]
})
export class InventoryStatusComponent {
  data = signal<any | null>(null);
  @Input() set inventory(v: any) { this.data.set(v); }
}


// import { Component, Input, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'inventory-status',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './inventory-status.html',
//   styleUrls: ['./inventory-status.scss']
// })
// export class InventoryStatusComponent {
//   data = signal<any | null>(null);

//   @Input() set inventory(v: any | null) {
//     this.data.set(v);
//   }
// }
