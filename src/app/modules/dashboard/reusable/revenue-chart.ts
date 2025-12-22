import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
// NOTE: In a real Angular project with dependencies, we would import NgApexchartsModule here.
// Since we are ensuring this runs purely with the provided context, I will implement a responsive
// SVG/CSS visualization or a mock placeholder that assumes ApexCharts availability if installed.
// For the purpose of "Visually Stunning" without external deps failure, I will build a Custom CSS Bar Chart.

@Component({
  selector: 'revenue-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <!-- Bars visualization -->
      <div class="bars-area">
        <div 
          class="bar-group" 
          *ngFor="let item of normalizeData(); let i = index"
          [style.height.%]="100">
          
          <div class="tooltip">
            ₹{{ item.value | number }}<br>
            <span class="date">{{ item.label }}</span>
          </div>
          
          <div 
            class="bar" 
            [style.height.%]="(item.value / maxValue) * 100">
          </div>
          <span class="x-label">{{ item.label | date:'dd MMM' }}</span>
        </div>
      </div>
      
      <!-- Y-Axis Lines (Background) -->
      <div class="grid-lines">
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 100%;
      min-height: 300px;
      padding-bottom: 30px; // space for x-labels
      padding-top: 20px;
    }

    .bars-area {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 100%;
      position: relative;
      z-index: 2;
    }

    .bar-group {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      position: relative;
      width: 40px;
      
      &:hover {
        .bar {
          background: var(--accent-gradient);
          opacity: 1;
          transform: scaleX(1.1);
        }
        .tooltip {
          opacity: 1;
          transform: translate(-50%, -10px);
        }
      }
    }

    .bar {
      width: 12px;
      background: var(--accent-primary);
      border-radius: 6px 6px 0 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0.7;
      cursor: pointer;
    }

    .x-label {
      position: absolute;
      bottom: -25px;
      font-size: 10px;
      color: var(--text-tertiary);
      white-space: nowrap;
    }

    .tooltip {
      position: absolute;
      top: 0; // Relative to bar-group top, essentially floating above chart area
      left: 50%;
      transform: translate(-50%, 0);
      background: var(--text-primary);
      color: var(--bg-secondary);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s ease;
      white-space: nowrap;
      z-index: 10;
      box-shadow: var(--shadow-lg);
      margin-top: -40px; // Push up

      .date {
        opacity: 0.7;
        font-size: 10px;
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 4px;
        border-style: solid;
        border-color: var(--text-primary) transparent transparent transparent;
      }
    }

    .grid-lines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 30px; // match chart padding
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 1;
      pointer-events: none;

      .line {
        width: 100%;
        height: 1px;
        background: var(--border-secondary);
        border-top: 1px dashed var(--border-primary);
        opacity: 0.5;
      }
    }
  `]
})
export class RevenueChartComponent implements OnChanges {
  @Input() data: { labels: string[], series: number[] } | null = null;

  maxValue = 100;

  ngOnChanges(changes: SimpleChanges) {
    if (this.data && this.data.series) {
      this.maxValue = Math.max(...this.data.series, 100) * 1.1; // Add 10% buffer
    }
  }

  normalizeData() {
    if (!this.data || !this.data.labels || !this.data.series) return [];
    return this.data.labels.map((label, index) => ({
      label,
      value: this.data!.series[index]
    }));
  }
}

// import { Component, Input, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';

// @Component({
//   standalone: true,
//   selector: 'revenue-chart',
//   imports: [CommonModule, ChartModule],
//   template: `
//     <div class="glass-card" [class.loading]="!_raw()">
//       <div class="card-header">
//         <h3>Revenue Trend</h3>
//         <span class="badge">Live</span>
//       </div>
      
//       @if (_raw()) {
//         <div class="chart-container">
//           <p-chart type="line" [data]="chartData()" [options]="chartOptions()"></p-chart>
//         </div>
//       } @else {
//         <div class="skeleton-rect"></div>
//       }
//     </div>
//   `,
//   styles: [`
//     .glass-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: 24px;
//       height: 100%;
//       min-height: 360px;
//       display: flex; flex-direction: column;
//       box-shadow: var(--shadow-sm);

//       .card-header {
//         display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
//         h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
//         .badge { font-size: 11px; padding: 4px 8px; background: rgba(16, 185, 129, 0.1); color: var(--color-success); border-radius: 6px; font-weight: 600; }
//       }
//       .chart-container { flex: 1; min-height: 0; position: relative; }
      
//       .skeleton-rect {
//         flex: 1; background: var(--bg-ternary); border-radius: 12px; animation: pulse 1.5s infinite;
//       }
//       @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
//     }
//   `]
// })
// export class RevenueChartComponent {
//   public _raw = signal<any | null>(null);
//   @Input() set data(v: any) { this._raw.set(v); }
  
//   chartData = signal<any>(null);
//   chartOptions = signal<any>(null);

//   constructor() {
//     effect(() => {
//       if (!this._raw()) return;
//       this.initChart();
//     });
//   }

//   initChart() {
//     const raw = this._raw();
//     this.chartData.set({
//       labels: raw.labels,
//       datasets: [{
//         label: 'Revenue',
//         data: raw.revenue,
//         fill: true,
//         borderColor: '#3b82f6', // Use hex for chart.js internal
//         backgroundColor: (ctx: any) => {
//           const canvas = ctx.chart.ctx;
//           const gradient = canvas.createLinearGradient(0, 0, 0, 350);
//           gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
//           gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
//           return gradient;
//         },
//         tension: 0.4,
//         pointBackgroundColor: '#fff',
//         pointBorderColor: '#3b82f6',
//         pointRadius: 0,
//         pointHoverRadius: 6
//       }]
//     });

//     this.chartOptions.set({
//       responsive: true,
//       maintainAspectRatio: false,
//       plugins: { legend: { display: false } },
//       scales: {
//         x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
//         y: { 
//           border: { display: false }, 
//           grid: { color: 'rgba(148, 163, 184, 0.1)', borderDash: [5, 5] }, 
//           ticks: { color: '#94a3b8', callback: (v: any) => v >= 1000 ? `${v/1000}k` : v } 
//         }
//       }
//     });
//   }
// }


// // import { Component, Input, computed, signal, effect } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ChartModule } from 'primeng/chart';

// // @Component({
// //   standalone: true,
// //   selector: 'revenue-chart',
// //   imports: [CommonModule, ChartModule],
// //   templateUrl: './revenue-chart.html',
// //   styleUrls: ['./revenue-chart.scss']
// // })
// // export class RevenueChartComponent {
// //   @Input() set data(v: any) { this._raw.set(v);}
// //   public _raw = signal<any | null>(null);
// //   chartData = signal<any>(null);
// //   chartOptions = signal<any>(null);
// //   constructor() {
// //     effect(() => {
// //       if (!this._raw()) return;
// //       this.buildChart();
// //     });
// //   }
// //   public buildChart() {
// //     const raw = this._raw();
// //     const labels = raw?.labels ?? [];
// //     const values = raw?.series ?? [];
// //     this.chartData.set({
// //       labels,
// //       datasets: [
// //         {
// //           label: 'Monthly Revenue',
// //           data: values,
// //           borderColor: `var(--accent-primary)`,
// //           backgroundColor: `color-mix(in srgb, var(--accent-primary) 15%, transparent)`,
// //           tension: 0.35,
// //           borderWidth: 2,
// //           fill: true,
// //         }
// //       ]
// //     });

// //     this.chartOptions.set({
// //       responsive: true,
// //       maintainAspectRatio: false,
// //       plugins: {
// //         legend: { display: false },
// //         tooltip: {
// //           callbacks: {
// //             label: (ctx: any) =>
// //               new Intl.NumberFormat('en-IN', {
// //                 style: 'currency',
// //                 currency: 'INR',
// //                 maximumFractionDigits: 0
// //               }).format(ctx.raw)
// //           }
// //         }
// //       },
// //       scales: {
// //         x: {
// //           ticks: {
// //             color: `var(--text-secondary)`,
// //             font: { size: 11 }
// //           },
// //           grid: { display: false }
// //         },
// //         y: {
// //           ticks: {
// //             color: `var(--text-secondary)`,
// //             callback: (v: any) =>
// //               new Intl.NumberFormat('en-IN', {
// //                 style: 'currency',
// //                 currency: 'INR',
// //                 maximumFractionDigits: 0
// //               }).format(v)
// //           },
// //           grid: {
// //             color: `var(--border-secondary)`
// //           }
// //         }
// //       }
// //     });
// //   }
// // }
