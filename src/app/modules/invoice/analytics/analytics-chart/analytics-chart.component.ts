// components/analytics-chart/analytics-chart.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrapper">
      <canvas #chartCanvas [width]="width" [height]="height"></canvas>
      @if (!data || data.length === 0) {
        <div class="no-data">
          <i class="icon-chart"></i>
          <p>No data available for the selected period</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-wrapper {
      position: relative;
      width: 100%;
      height: 300px;
    }

    canvas {
      width: 100%;
      height: 100%;
    }

    .no-data {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.9);
    }

    .no-data i {
      font-size: 48px;
      margin-bottom: var(--spacing-lg);
      opacity: 0.5;
    }

    .no-data p {
      font-size: var(--font-size-sm);
      margin: 0;
    }
  `]
})
export class AnalyticsChartComponent implements OnInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() data: any[] = [];
  @Input() chartType: 'line' | 'bar' | 'pie' = 'line';
  @Input() metric: string = 'profit';
  @Input() width: number = 800;
  @Input() height: number = 300;
  
  private ctx: CanvasRenderingContext2D | null = null;
  private chartInstance: any = null;

  ngOnInit(): void {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['chartType'] || changes['metric']) && this.data && this.data.length > 0) {
      this.updateChart();
    }
  }

  private initializeChart(): void {
    if (!this.chartCanvas?.nativeElement) return;
    
    this.ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!this.ctx) return;

    this.updateChart();
  }

  private updateChart(): void {
    if (!this.ctx || !this.data || this.data.length === 0) return;

    // Clear previous chart
    if (this.chartInstance) {
      this.chartInstance.clear();
    }

    const canvas = this.chartCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // For now, create a simple chart using Canvas API
    // In a real app, you might use Chart.js, D3.js, or other charting library
    this.createSimpleChart();
  }

  private createSimpleChart(): void {
    if (!this.ctx) return;

    const canvas = this.chartCanvas.nativeElement;
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);

    // Prepare data
    const values = this.data.map(item => {
      switch (this.metric) {
        case 'revenue': return item.revenue || 0;
        case 'cost': return item.cost || 0;
        case 'profit': return item.profit || 0;
        case 'margin': return item.margin || 0;
        default: return item[this.metric] || 0;
      }
    });

    const labels = this.data.map(item => {
      if (item.period) {
        // Format date labels
        const date = new Date(item.period);
        if (isNaN(date.getTime())) return item.period;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      }
      return item.name || item.label || '';
    });

    // Find min and max values
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);

    // Draw grid
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;

    // Horizontal grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight * (1 - (i / gridLines)));
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(canvas.width - padding, y);
      this.ctx.stroke();

      // Y-axis labels
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '10px var(--font-body)';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      const value = minValue + ((maxValue - minValue) * (i / gridLines));
      const formattedValue = this.formatValue(value);
      this.ctx.fillText(formattedValue, padding - 5, y);
    }

    // Vertical grid lines and labels
    const dataPoints = this.data.length;
    const barWidth = chartWidth / Math.max(dataPoints, 1);

    for (let i = 0; i < dataPoints; i++) {
      const x = padding + (barWidth * i) + (barWidth / 2);

      // X-axis labels
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '10px var(--font-body)';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(labels[i], x, canvas.height - padding + 5);

      if (this.chartType === 'bar') {
        this.drawBar(i, values[i], maxValue, minValue, barWidth, padding, chartHeight);
      }
    }

    if (this.chartType === 'line') {
      this.drawLine(values, maxValue, minValue, barWidth, padding, chartHeight);
    }

    // Draw axes
    this.ctx.strokeStyle = '#475569';
    this.ctx.lineWidth = 2;

    // X-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, canvas.height - padding);
    this.ctx.lineTo(canvas.width - padding, canvas.height - padding);
    this.ctx.stroke();

    // Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, canvas.height - padding);
    this.ctx.stroke();

    // Chart title
    const chartTitle = this.getChartTitle();
    this.ctx.fillStyle = '#1e293b';
    this.ctx.font = '14px var(--font-heading)';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(chartTitle, canvas.width / 2, 10);
  }

  private drawBar(index: number, value: number, maxValue: number, minValue: number, barWidth: number, padding: number, chartHeight: number): void {
    if (!this.ctx) return;

    const canvas = this.chartCanvas.nativeElement;
    const normalizedValue = (value - minValue) / (maxValue - minValue || 1);
    const barHeight = chartHeight * normalizedValue;
    const x = padding + (barWidth * index) + (barWidth * 0.1);
    const y = canvas.height - padding - barHeight;
    const width = barWidth * 0.8;

    // Bar color based on value
    const isPositive = value >= 0;
    const gradient = this.ctx.createLinearGradient(0, y, 0, y + barHeight);
    
    if (isPositive) {
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#059669');
    } else {
      gradient.addColorStop(0, '#ef4444');
      gradient.addColorStop(1, '#dc2626');
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width, barHeight);

    // Bar border
    this.ctx.strokeStyle = isPositive ? '#059669' : '#dc2626';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, barHeight);

    // Value label on top of bar
    if (barHeight > 20) {
      this.ctx.fillStyle = isPositive ? '#065f46' : '#991b1b';
      this.ctx.font = '10px var(--font-body)';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      const formattedValue = this.formatValue(value);
      this.ctx.fillText(formattedValue, x + width / 2, y - 5);
    }
  }

  private drawLine(values: number[], maxValue: number, minValue: number, barWidth: number, padding: number, chartHeight: number): void {
    if (!this.ctx || values.length < 2) return;

    const canvas = this.chartCanvas.nativeElement;
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();

    for (let i = 0; i < values.length; i++) {
      const normalizedValue = (values[i] - minValue) / (maxValue - minValue || 1);
      const y = canvas.height - padding - (chartHeight * normalizedValue);
      const x = padding + (barWidth * i) + (barWidth / 2);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      // Draw points
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Point border
      this.ctx.strokeStyle = '#3b82f6';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.lineWidth = 3;
    }

    this.ctx.stroke();

    // Fill area under line
    const gradient = this.ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.moveTo(padding + (barWidth / 2), canvas.height - padding);
    
    for (let i = 0; i < values.length; i++) {
      const normalizedValue = (values[i] - minValue) / (maxValue - minValue || 1);
      const y = canvas.height - padding - (chartHeight * normalizedValue);
      const x = padding + (barWidth * i) + (barWidth / 2);
      this.ctx.lineTo(x, y);
    }
    
    this.ctx.lineTo(padding + (barWidth * (values.length - 1)) + (barWidth / 2), canvas.height - padding);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private formatValue(value: number): string {
    if (Math.abs(value) >= 1000000) {
      return `₹${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${Math.round(value)}`;
  }

  private getChartTitle(): string {
    switch (this.metric) {
      case 'revenue': return 'Revenue Trends';
      case 'cost': return 'Cost Analysis';
      case 'profit': return 'Profit Trends';
      case 'margin': return 'Margin Analysis';
      default: return 'Performance Analysis';
    }
  }
}