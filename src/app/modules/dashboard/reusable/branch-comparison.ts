import { Component, Input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';

@Component({
  standalone: true,
  selector: 'branch-comparison',
  imports: [CommonModule, ChartModule],
  template: `
    <div class="glass-card">
      <h3>Branch Performance</h3>
      <div class="chart-box" *ngIf="chartData()">
        <p-chart type="bar" [data]="chartData()" [options]="chartOptions()" height="300px"></p-chart>
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); padding: 24px; margin-top: 24px;
      h3 { margin: 0 0 20px 0; font-size: 16px; color: var(--text-primary); }
    }
  `]
})
export class BranchComparisonComponent {
  @Input() set data(v: any[]) {
    if (!v) return;
    this.chartData.set({
      labels: v.map(b => b.branchName),
      datasets: [
        { label: 'Revenue', data: v.map(b => b.revenue), backgroundColor: '#3b82f6', borderRadius: 4 },
        { label: 'Avg Basket', data: v.map(b => b.avgBasketValue), backgroundColor: '#06b6d4', borderRadius: 4 }
      ]
    });
  }
  chartData = signal<any>(null);
  chartOptions = signal({
    responsive: true, maintainAspectRatio: false,
    scales: { x: { grid: { display: false } }, y: { border: { display: false }, grid: { borderDash: [4, 4], color: 'rgba(0,0,0,0.05)' } } },
    plugins: { legend: { position: 'bottom' } }
  });
}


// import { Component, Input, signal, effect } from '@angular/core';
// import { ChartModule } from 'primeng/chart';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'branch-comparison',
//   standalone: true,
//   imports: [CommonModule, ChartModule],
//   templateUrl: './branch-comparison.html',
//   styleUrls: ['./branch-comparison.scss']
// })
// export class BranchComparisonComponent {

//   public _raw = signal<any[] | null>(null);

//   @Input() set data(v: any[] | null) {
//     this._raw.set(v);
//   }

//   chartData = signal<any>(null);
//   chartOptions = signal<any>(null);

//   constructor() {

//     effect(() => {
//       if (!this._raw()) return;

//       const labels = this._raw()!.map((b) => b.branchName ?? 'Unknown');

//       this.chartData.set({
//         labels,
//         datasets: [
//           {
//             label: 'Revenue',
//             data: this._raw()!.map(b => b.revenue ?? 0),
//           },
//           {
//             label: 'Invoice Count',
//             data: this._raw()!.map(b => b.invoiceCount ?? 0),
//           },
//           {
//             label: 'Avg Basket Value',
//             data: this._raw()!.map(b => b.avgBasketValue ?? 0),
//           }
//         ]
//       });

//       this.chartOptions.set({
//         responsive: true,
//         plugins: {
//           legend: {
//             labels: { color: 'var(--text-secondary)' }
//           },
//           tooltip: {
//             callbacks: {
//               label: (context: any) => {
//                 const val = context.raw;
//                 return typeof val === 'number'
//                   ? val.toLocaleString('en-IN')
//                   : val;
//               }
//             }
//           }
//         },
//         scales: {
//           x: {
//             ticks: { color: 'var(--text-secondary)' },
//             grid: { display: false }
//           },
//           y: {
//             ticks: { color: 'var(--text-secondary)' },
//             grid: { color: 'var(--border-secondary)' }
//           }
//         }
//       });
//     });
//   }
// }
