import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag'; 
import { DatePickerModule } from 'primeng/datepicker';
import { AdminAnalyticsService } from '../admin-analytics.service';


@Component({
  selector: 'app-analytics-export-hub',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    ProgressSpinnerModule, 
    TooltipModule, 
    FormsModule, 
    TagModule,
    DatePickerModule
  ],

  template: `
    <div class="export-container">

      <div class="header-section">
        <h2 class="page-title">Export Intelligence</h2>
        <p class="page-subtitle">
          Generate and download comprehensive CSV reports for offline analysis
        </p>
      </div>

      <div class="layout-grid">
        
        <div class="main-column">
          <div class="control-card">
            
            <div class="section-block">
              <h3 class="section-label">1. Select Data Dimension</h3>
              
              <div class="dimension-grid">
                @for (type of exportTypes; track type.id) {
                  <div (click)="selectedType.set(type.id)"
                       class="dimension-card"
                       [class.active]="selectedType() === type.id">
                    
                    <div class="icon-circle" [class.active]="selectedType() === type.id">
                      <i class="pi" [ngClass]="type.icon"></i>
                    </div>
                    
                    <span class="dimension-name">{{ type.label }}</span>
                    
                    <div *ngIf="selectedType() === type.id" class="check-badge">
                      <i class="pi pi-check"></i>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="section-block">
              <h3 class="section-label">2. Define Temporal Range</h3>
              
              <div class="date-grid">
                <div class="form-group">
                  <label class="input-label">Start Date</label>
                  <p-datepicker [(ngModel)]="startDate" placeholder="Start Date" dateFormat="yy-mm-dd" [showIcon]="true" iconDisplay="input" appendTo="body" styleClass="w-full"></p-datepicker>
                </div>
                <div class="form-group">
                  <label class="input-label">End Date</label>
                  <p-datepicker [(ngModel)]="endDate" placeholder="End Date" dateFormat="yy-mm-dd" [showIcon]="true" iconDisplay="input" appendTo="body" styleClass="w-full"></p-datepicker>
                </div>
              </div>

            </div>
          </div>

          <div class="action-bar">
             <p-button [label]="exporting() ? 'Generating CSV...' : 'Download Analysis'" 
                       [icon]="exporting() ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-download'" 
                       [disabled]="exporting()"
                       (onClick)="handleExport()"
                       styleClass="p-button-lg export-btn">
             </p-button>
          </div>
        </div>

        <div class="side-column">
          <div class="info-card">
            <h4 class="section-label mb-lg">Export Specification</h4>
            
            <div class="specs-list">
               <div class="spec-row">
                 <span class="spec-label">File Format</span>
                 <p-tag value="CSV (RFC 4180)" severity="info" styleClass="text-xs"></p-tag>
               </div>
               <div class="spec-row">
                 <span class="spec-label">Encoding</span>
                 <span class="spec-value mono">UTF-8</span>
               </div>
               <div class="spec-row border-top">
                 <span class="spec-label">Target Dimension</span>
                 <span class="spec-value highlight capitalize">{{ getLabel(selectedType()) }}</span>
               </div>
            </div>

            <div class="tip-box">
               <div class="tip-content">
                 <i class="pi pi-info-circle tip-icon"></i>
                 <div>
                   <p class="tip-title">Export Tip</p>
                   <p class="tip-text">
                     Large datasets may take a few seconds to compile. Your download will start automatically once ready.
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .export-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    .header-section { margin-bottom: var(--spacing-2xl); }

    .page-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-3xl); /* Scaled slightly larger */
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs) 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .layout-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    @media (min-width: 1024px) {
      .layout-grid { grid-template-columns: 2fr 1fr; }
    }

    /* CARD STYLES */
    .control-card, .info-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-xl);
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .section-block { margin-bottom: var(--spacing-xl); }

    .section-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-label);
      margin: 0 0 var(--spacing-md) 0;
    }
    .mb-lg { margin-bottom: var(--spacing-lg); }

    /* DIMENSION GRID */
    .dimension-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: var(--spacing-md);
    }

    .dimension-card {
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
      cursor: pointer;
      position: relative;
      transition: var(--transition-base);
      background: transparent;
    }

    .dimension-card:hover {
      background: var(--component-bg-hover);
      border-color: var(--border-primary);
      transform: translateY(-2px);
    }

    .dimension-card.active {
      background: var(--bg-ternary);
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 1px var(--accent-primary);
    }

    .icon-circle {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: var(--bg-ternary);
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xl);
      transition: var(--transition-colors);
    }
    
    .dimension-card:hover .icon-circle {
      color: var(--text-primary);
    }

    .icon-circle.active {
      background: var(--accent-primary);
      color: #ffffff;
    }

    .dimension-name {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      text-align: center;
      color: var(--text-secondary);
    }
    .dimension-card.active .dimension-name { color: var(--text-primary); }

    .check-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 18px;
      height: 18px;
      background: var(--accent-primary);
      border-radius: 50%;
      color: #fff;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* DATE INPUTS */
    .date-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }
    @media(min-width: 640px) {
      .date-grid { grid-template-columns: 1fr 1fr; }
    }

    .form-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }

    .input-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    .custom-date-input {
      background: var(--bg-ternary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-sm) var(--spacing-md);
      color: var(--text-primary);
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      transition: var(--transition-base);
    }
    .custom-date-input:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
    }

    /* ACTION BAR */
    .action-bar {
      display: flex;
      justify-content: flex-end;
      margin-top: var(--spacing-lg);
    }
    
    /* RIGHT COLUMN SPECS */
    .side-column { height: 100%; }

    .specs-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      flex: 1; /* Push tip box down */
    }

    .spec-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .spec-row.border-top {
      border-top: 1px solid var(--border-primary);
      padding-top: var(--spacing-md);
      margin-top: var(--spacing-xs);
    }

    .spec-label { font-size: var(--font-size-sm); color: var(--text-tertiary); }
    
    .spec-value { font-size: var(--font-size-sm); color: var(--text-primary); }
    .spec-value.mono { font-family: var(--font-mono); font-size: var(--font-size-xs); }
    .spec-value.highlight { font-weight: var(--font-weight-bold); color: var(--accent-primary); }
    .capitalize { text-transform: capitalize; }

    /* TIP BOX */
    .tip-box {
      margin-top: var(--spacing-2xl);
      padding: var(--spacing-md);
      border: 1px dashed var(--color-info-border); /* Use mix token */
      border-radius: var(--ui-border-radius);
      background: var(--color-info-bg);
    }

    .tip-content { display: flex; gap: var(--spacing-sm); }
    .tip-icon { color: var(--color-info); margin-top: 2px; }
    
    .tip-title { font-weight: bold; font-size: var(--font-size-xs); color: var(--color-info); margin: 0 0 2px 0; }
    .tip-text { font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.4; margin: 0; }
  `]
})
export class AnalyticsExportHubComponent {
  exporting = signal<boolean>(false);
  selectedType:any = signal<'sales' | 'inventory' | 'customers'>('sales');
  startDate: Date | null = null;
  endDate: Date | null = null;


  exportTypes = [
    { id: 'sales', label: 'Revenue & Sales', icon: 'pi-chart-line' },
    { id: 'inventory', label: 'Inventory Health', icon: 'pi-box' },
    { id: 'customers', label: 'Customer Base', icon: 'pi-users' }
  ];

  constructor(private analyticsService: AdminAnalyticsService) {}

  getLabel(id: string): string {
    return this.exportTypes.find(t => t.id === id)?.label || id;
  }

  handleExport() {
    this.exporting.set(true);

    const startStr = this.startDate instanceof Date ? this.startDate.toISOString().split('T')[0] : (this.startDate || '');
    const endStr = this.endDate instanceof Date ? this.endDate.toISOString().split('T')[0] : (this.endDate || '');

    this.analyticsService.exportAnalyticsData(
      this.selectedType(),
      startStr,
      endStr
    ).subscribe({

      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shivam_${this.selectedType()}_report_${new Date().getTime()}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false)
    });
  }
}