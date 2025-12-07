import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'top-customers',
  imports: [CommonModule],
  template: `
    <div class="glass-card">
      <div class="head">
        <h3>Top Customers</h3>
      </div>
      <div class="list">
        @for(c of sorted(); track c._id) {
          <div class="row">
            <div class="avatar">{{ c.name.charAt(0) }}</div>
            <div class="details">
              <div class="name">{{ c.name }}</div>
              <div class="spent">{{ c.totalSpent | currency:'INR':'symbol':'1.0-0' }}</div>
            </div>
            <div class="rank">#{{ $index + 1 }}</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); padding: 20px; height: 100%; box-shadow: var(--shadow-sm);
      .head { margin-bottom: 16px; h3 { margin: 0; font-size: 15px; color: var(--text-primary); } }
      .list { display: flex; flex-direction: column; gap: 12px; }
      .row { display: flex; align-items: center; gap: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-secondary); }
      .row:last-child { border: none; }
      .avatar { width: 32px; height: 32px; background: var(--accent-primary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
      .details { flex: 1; display: flex; flex-direction: column; }
      .name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
      .spent { font-size: 11px; color: var(--text-secondary); }
      .rank { font-size: 12px; font-weight: 700; color: var(--border-primary); opacity: 0.5; }
    }
  `]
})
export class TopCustomersComponent {
  sorted = signal<any[]>([]);
  @Input() set customers(v: any[] | null) {
    if(v) this.sorted.set([...v].sort((a,b) => b.totalSpent - a.totalSpent).slice(0, 5));
  }
}
// import { Component, Input, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   standalone: true,
//   selector: 'top-customers',
//   imports: [CommonModule],
//   templateUrl: './top-customer.html',
//   styleUrls: ['./top-customer.scss'],
// })
// export class TopCustomersComponent {

//   public _raw = signal<any[] | null>(null);

//   @Input() set customers(v: any[] | null) {
//     this._raw.set(v);
//   }

//   sorted = signal<any[]>([]);

//   constructor() {
//     effect(() => {
//       if (!this._raw()) return;
//       this.sorted.set([...this._raw()!].sort((a, b) => b.totalSpent - a.totalSpent));
//     });
//   }
// }
