import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'top-products',
  imports: [CommonModule],
  template: `
    <div class="glass-card">
      <div class="card-header">
        <h3>Top Products</h3>
        <i class="pi pi-ellipsis-h" style="cursor: pointer; color: var(--text-secondary)"></i>
      </div>

      @if (products()) {
        <div class="list">
          @for (p of products(); track p._id) {
            <div class="list-item">
              <div class="info">
                <div class="icon"><i class="pi pi-box"></i></div>
                <div>
                  <div class="name">{{ p.name }}</div>
                  <div class="sub">{{ p.soldQty }} units</div>
                </div>
              </div>
              <div class="stat">
                <div class="rev">{{ p.revenue | currency:'INR':'symbol':'1.0-0' }}</div>
                <div class="bar-bg"><div class="bar-fill" [style.width.%]="getPercent(p.revenue)"></div></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="skeleton-list"></div>
      }
    </div>
  `,
  styles: [`
    .glass-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); padding: 20px; height: 100%;
      box-shadow: var(--shadow-sm);

      .card-header { display: flex; justify-content: space-between; margin-bottom: 16px; h3 { margin: 0; font-size: 15px; color: var(--text-primary); }}
      
      .list { display: flex; flex-direction: column; gap: 16px; }
      .list-item { display: flex; justify-content: space-between; align-items: center; }
      
      .info { display: flex; align-items: center; gap: 12px; }
      .icon { width: 36px; height: 36px; background: var(--bg-ternary); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--accent-primary); }
      .name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
      .sub { font-size: 11px; color: var(--text-secondary); }

      .stat { text-align: right; width: 80px; }
      .rev { font-size: 13px; font-weight: 600; color: var(--text-primary); }
      .bar-bg { height: 4px; background: var(--bg-ternary); border-radius: 2px; margin-top: 4px; overflow: hidden; }
      .bar-fill { height: 100%; background: var(--accent-primary); border-radius: 2px; }

      .skeleton-list { height: 200px; background: var(--bg-ternary); border-radius: 10px; animation: pulse 1.5s infinite; }
      @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
    }
  `]
})
export class TopProductsComponent {
  products = signal<any[] | null>(null);
  @Input('products') set _products(v: any[] | null) {
    if(v) this.products.set([...v].sort((a,b) => b.revenue - a.revenue).slice(0, 5));
  }

  maxRev = computed(() => Math.max(...(this.products()?.map(p => p.revenue) || [0])));
  getPercent(val: number) { return (val / this.maxRev()) * 100; }
}


// import { Component, Input, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   standalone: true,
//   selector: 'top-products',
//   imports: [CommonModule],
//   templateUrl: './top-products.html',
//   styleUrls: ['./top-products.scss']
// })
// export class TopProductsComponent {

//   public _raw = signal<any[] | null>(null);

//   @Input() set products(v: any[] | null) {
//     this._raw.set(v);
//   }

//   formatted = signal<any[]>([]);

//   constructor() {
//     effect(() => {
//       if (!this._raw()) return;

//       const sorted = [...this._raw()!].sort((a, b) => b.revenue - a.revenue);
//       this.formatted.set(sorted);
//     });
//   }
// }
