import { Component, Input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';

@Component({
  standalone: true,
  selector: 'payment-donut',
  imports: [CommonModule, ChartModule],
  template: `
    <div class="glass-card center-content">
      <div *ngIf="chartData(); else loader" class="chart-wrapper">
         <p-chart type="doughnut" [data]="chartData()" [options]="chartOptions()" width="220px" height="220px"></p-chart>
      </div>
      <ng-template #loader><div class="spinner"></div></ng-template>
    </div>
  `,
  styles: [`
    .glass-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); padding: 20px; height: 260px;
      display: flex; align-items: center; justify-content: center;
      .spinner { width: 40px; height: 40px; border: 3px solid var(--border-primary); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
    }
  `]
})
export class PaymentDonutComponent {
  @Input() set data(v: any) {
    if (!v) return;
    this.chartData.set({
      labels: v.labels,
      datasets: [{
        data: v.values,
        backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981'],
        borderWidth: 0, hoverOffset: 4
      }]
    });
  }
  chartData = signal<any>(null);
  chartOptions = signal({ cutout: '70%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } } });
}





// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-payment-donut',
// //   imports: [],
// //   templateUrl: './payment-donut.html',
// //   styleUrl: './payment-donut.scss',
// // })
// // export class PaymentDonut {

// // }
// import { Component, Input, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';

// @Component({
//   standalone: true,
//   selector: 'payment-donut',
//   imports: [CommonModule, ChartModule],
//   templateUrl: './payment-donut.html',
//   styleUrls: ['./payment-donut.scss']
// })
// export class PaymentDonutComponent {

//   @Input() set data(v: any) {
//     this._raw.set(v);
//   }

//   public _raw = signal<any | null>(null);

//   chartData = signal<any>(null);
//   chartOptions = signal<any>(null);

//   constructor() {
//     effect(() => {
//       if (!this._raw()) return;
//       this.buildChart();
//     });
//   }

//   public buildChart() {

//     const raw = this._raw();
//     const labels = raw?.labels ?? [];
//     const values = raw?.values ?? [];

//     const themeColors = [
//       `var(--accent-primary)`,
//       `var(--accent-secondary)`,
//       `var(--accent-tertiary)`,
//       `var(--color-success)`,
//       `var(--color-warning)`
//     ];

//     this.chartData.set({
//       labels,
//       datasets: [
//         {
//           data: values,
//           backgroundColor: labels.map((_: any, i: number) =>
//             themeColors[i % themeColors.length]
//           ),
//           borderColor: `var(--bg-secondary)`,
//           borderWidth: 2
//         }
//       ]
//     });

//     this.chartOptions.set({
//       responsive: true,
//       maintainAspectRatio: false,
//       cutout: '55%',
//       plugins: {
//         legend: {
//           position: 'bottom',
//           labels: {
//             color: `var(--text-secondary)`,
//             padding: 12,
//             font: { size: 11 }
//           }
//         },
//         tooltip: {
//           callbacks: {
//             label: (ctx: any) =>
//               `${ctx.label}: ${new Intl.NumberFormat('en-IN', {
//                 style: 'currency',
//                 currency: 'INR',
//                 maximumFractionDigits: 0
//               }).format(ctx.raw)}`
//           }
//         }
//       }
//     });
//   }
// }
