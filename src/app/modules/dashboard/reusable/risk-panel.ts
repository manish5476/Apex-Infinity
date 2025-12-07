import { Component, Input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'risk-panel',
  imports: [CommonModule],
  template: `
    <div class="risk-card" [ngClass]="riskLevel()">
      <div class="header">
        <div class="status">
          <span class="dot"></span>
          <span class="txt">{{ riskLevel() | titlecase }} Risk</span>
        </div>
        <i class="pi pi-shield"></i>
      </div>

      @if(data()) {
        <div class="metrics">
          <div class="box">
            <span class="lbl">Stock Alerts</span>
            <span class="val">{{ data()?.lowStockCount ?? 0 }}</span>
          </div>
          <div class="div"></div>
          <div class="box">
            <span class="lbl">Debt Risk</span>
            <span class="val">{{ data()?.highDebtCount ?? 0 }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .risk-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); padding: 20px; transition: 0.3s;
      
      &.low { .dot { background: var(--color-success); box-shadow: 0 0 8px var(--color-success); } .txt { color: var(--color-success); }}
      &.medium { border-color: var(--color-warning); .dot { background: var(--color-warning); box-shadow: 0 0 8px var(--color-warning); } .txt { color: var(--color-warning); }}
      &.high { border-color: var(--color-error); background: color-mix(in srgb, var(--color-error) 5%, var(--bg-secondary)); .dot { background: var(--color-error); box-shadow: 0 0 8px var(--color-error); } .txt { color: var(--color-error); }}

      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .status { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; .dot { width: 8px; height: 8px; border-radius: 50%; } }
      
      .metrics { display: flex; background: var(--bg-ternary); padding: 12px; border-radius: 10px; }
      .box { flex: 1; text-align: center; display: flex; flex-direction: column; }
      .lbl { font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; }
      .val { font-size: 18px; font-weight: 700; color: var(--text-primary); }
      .div { width: 1px; background: var(--border-secondary); margin: 0 10px; }
    }
  `]
})
export class RiskPanelComponent {
  data = signal<any | null>(null);
  riskLevel = signal('low');
  @Input() set risk(v: any) { 
    this.data.set(v);
    if(v) {
      const score = (v.lowStockCount || 0) + (v.highDebtCount || 0);
      this.riskLevel.set(score === 0 ? 'low' : score < 5 ? 'medium' : 'high');
    }
  }
}


// import { Component, Input, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   standalone: true,
//   selector: 'risk-panel',
//   imports: [CommonModule],
//   templateUrl: './risk-panel.html',
//   styleUrls: ['./risk-panel.scss'],
// })
// export class RiskPanelComponent {

//   public _data = signal<any | null>(null);

//   @Input() set risk(v: any) {
//     this._data.set(v);
//   }

//   riskLevel = signal<'low' | 'medium' | 'high'>('low');

//   constructor() {
//     effect(() => {
//       const d = this._data();
//       if (!d) return;

//       const score = (d.lowStockCount ?? 0) + (d.highDebtCount ?? 0);

//       if (score === 0) this.riskLevel.set('low');
//       else if (score <= 3) this.riskLevel.set('medium');
//       else this.riskLevel.set('high');
//     });
//   }
// }
