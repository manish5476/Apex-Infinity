import { Component, Input, signal, effect } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'segmentation-chart',
  standalone: true,
  imports: [ChartModule, CommonModule],
  template: `
    <div class="glass-card">
      <div class="header">
        <h3>Customer Segmentation</h3>
      </div>

      @if (chartData()) {
        <div class="chart-box">
          <p-chart type="pie" [data]="chartData()" [options]="chartOptions()" height="220px"></p-chart>
        </div>
      } @else {
        <div class="skeleton-circle"></div>
      }
    </div>
  `,
  styles: [`
    .glass-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: 24px;
      height: 100%;
      min-height: 300px;
      display: flex; flex-direction: column;
      
      .header { margin-bottom: 16px; h3 { margin: 0; font-size: 15px; color: var(--text-primary); } }
      .chart-box { flex: 1; display: flex; align-items: center; justify-content: center; }
      
      .skeleton-circle {
        width: 180px; height: 180px; border-radius: 50%;
        background: var(--bg-ternary); margin: auto;
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
    }
  `]
})
export class SegmentationChartComponent {
  private _data = signal<any | null>(null);
  @Input() set segmentation(v: any | null) { this._data.set(v); }

  chartData = signal<any>(null);
  chartOptions = signal<any>(null);

  constructor() {
    effect(() => {
      const d = this._data();
      if (!d) return;

      const labels = Object.keys(d); // e.g., ['Champions', 'Loyal', 'At Risk']
      const values = Object.values(d);

      this.chartData.set({
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'], // Success, Blue, Warning, Danger
          borderWidth: 0
        }]
      });

      this.chartOptions.set({
        plugins: {
          legend: { position: 'right', labels: { usePointStyle: true, color: '#94a3b8', font: { size: 11 } } }
        }
      });
    });
  }
}


// import { Component, Input, signal, effect } from '@angular/core';
// import { ChartModule } from 'primeng/chart';

// @Component({
//   selector: 'segmentation-chart',
//   standalone: true,
//   imports: [ChartModule],
//   templateUrl: './segmentation-chart.html',
//   styleUrls: ['./segmentation-chart.scss']
// })
// export class SegmentationChartComponent {
//   private _data = signal<any | null>(null);
  
//   @Input() set segmentation(v: any | null) {
//     this._data.set(v);
//   }

//   chartData = signal<any>(null);
//   chartOptions = signal<any>(null);

//   constructor() {
//     effect(() => {
//       if (!this._data()) return;

//       const labels = Object.keys(this._data()!);
//       const values = Object.values(this._data()!);

//       this.chartData.set({
//         labels,
//         datasets: [{ data: values }]
//       });

//       this.chartOptions.set({
//         plugins: {
//           legend: { labels: { color: 'var(--text-secondary)' } }
//         }
//       });
//     });
//   }
// }
