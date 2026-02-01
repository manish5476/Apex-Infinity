import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { CellConfig, MasterRendererParams } from '../grid.types';

@Component({
  selector: 'app-master-cell-renderer',
  standalone: true,
  imports: [CommonModule, TagModule],
  styles: [`
    :host { display: block; height: 100%; }

    .renderer-wrapper {
      display: flex;
      align-items: center; /* Crucial for vertical centering */
      height: 100%;        /* Fill the cell height */
      width: 100%;
      padding: 0 4px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      
      /* Typography */
      font-size: 13px;
      color: var(--theme-text-primary);
    }

    // /* Compact Badge */
    // ::ng-deep .custom-badge {
    //   font-size: 10px !important; /* Smaller text */
    //   font-weight: 700;
    //   padding: 1px 6px !important; /* Tighter padding */
    //   height: 20px; /* Fixed small height */
    //   line-height: 18px;
    //   text-transform: uppercase;
    //   letter-spacing: 0.5px;
      
    //   /* Theme Mapping */
    //   &.badge-success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    //   &.badge-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    //   &.badge-danger  { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    //   &.badge-info    { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    // }

    /* Utility Classes */
    .text-success  { color: var(--color-success); }
    .text-error    { color: var(--color-error); }
    .text-secondary{ color: var(--theme-text-secondary); font-size: 12px; }
    .font-mono     { font-family: var(--font-mono); letter-spacing: -0.5px; }
  `],
  template: `
    <div class="renderer-wrapper">
      @switch (config.type) {

        @case ('boolean') {
          <i class="pi" style="font-size: 14px;"
             [class.pi-check-circle]="value"
             [class.text-success]="value"
             [class.pi-times-circle]="!value"
             [class.text-secondary]="!value"></i>
        }

        @case ('date') {
          <span class="text-secondary">
            {{ value | date:(config.dateFormat ?? 'dd MMM yyyy') }}
          </span>
        }

        @case ('currency') {
          <span class="font-mono font-semibold" 
                [class.text-error]="value < 0">
            {{ value | currency:(config.currencyCode ?? 'USD') }}
          </span>
        }

        @case ('badge') {
          <p-tag [value]="value" 
                 [rounded]="true" 
                 [styleClass]="'custom-badge ' + getSeverityClass(value)">
          </p-tag>
        }

        @case ('color') {
           <div class="flex items-center gap-2">
             <div class="w-3 h-3 rounded-full border border-gray-300" 
                  [style.background-color]="value"></div>
             <span class="text-xs">{{ value }}</span>
           </div>
        }

        @default {
          <span [title]="value">{{ value ?? '-' }}</span>
        }
      }
    </div>
  `
})
export class MasterCellRendererComponent implements ICellRendererAngularComp {
  @Input() set cellParams(params: MasterRendererParams) { this.refresh(params); }

  params!: MasterRendererParams;
  config!: CellConfig;
  value: any;

  agInit(params: MasterRendererParams): void { this.refresh(params); }

  refresh(params: MasterRendererParams): boolean {
    this.params = params;
    this.config = params.cellConfig || { type: 'text' };
    this.value = params.value;
    return true;
  }

  getSeverityClass(val: string): string {
    const v = (val || '').toLowerCase();
    if (['active', 'paid', 'approved', 'completed'].includes(v)) return 'badge-success';
    if (['pending', 'processing', 'draft'].includes(v)) return 'badge-warning';
    if (['rejected', 'cancelled', 'overdue', 'inactive'].includes(v)) return 'badge-danger';
    return 'badge-info';
  }}