import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { Tag } from "primeng/tag";

@Component({
  selector: 'app-analytics-export-hub',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule, TooltipModule, FormsModule, Tag],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-8">
        <h2 class="font-bold tracking-tight mb-1" 
            [style.color]="'var(--theme-text-primary)'"
            [style.font-family]="'var(--font-heading)'"
            [style.font-size]="'var(--font-size-2xl)'">Export Intelligence</h2>
        <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
          Generate and download comprehensive CSV reports for offline analysis
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div class="lg:col-span-8 space-y-6">
          <div class="p-6 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" 
               [style.border-color]="'var(--theme-border-primary)'" 
               [style.border-radius]="'var(--ui-border-radius-xl)'">
            
            <h3 class="font-bold uppercase tracking-widest mb-6" 
                [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">1. Select Data Dimension</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              @for (type of exportTypes; track type.id) {
                <div (click)="selectedType.set(type.id)"
                     class="p-4 border cursor-pointer transition-all flex flex-col items-center gap-3 text-center group"
                     [style.border-radius]="'var(--ui-border-radius-lg)'"
                     [style.background]="selectedType() === type.id ? 'var(--theme-bg-ternary)' : 'transparent'"
                     [style.border-color]="selectedType() === type.id ? 'var(--theme-accent-primary)' : 'var(--theme-border-secondary)'">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                       [style.background]="selectedType() === type.id ? 'var(--theme-accent-primary)' : 'var(--theme-bg-ternary)'"
                       [style.color]="selectedType() === type.id ? '#fff' : 'var(--theme-text-tertiary)'">
                    <i class="pi" [ngClass]="type.icon" [style.font-size]="'var(--font-size-md)'"></i>
                  </div>
                  <span class="font-bold uppercase tracking-tighter" 
                        [style.font-size]="'var(--font-size-xs)'"
                        [style.color]="selectedType() === type.id ? 'var(--theme-text-primary)' : 'var(--theme-text-label)'">
                    {{ type.label }}
                  </span>
                </div>
              }
            </div>

            <h3 class="font-bold uppercase tracking-widest mb-4" 
                [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">2. Define Temporal Range</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Start Date</label>
                <input type="date" [(ngModel)]="startDate" class="p-3 border bg-transparent" 
                       [style.border-radius]="'var(--ui-border-radius)'" 
                       [style.border-color]="'var(--theme-border-secondary)'"
                       [style.color]="'var(--theme-text-primary)'">
              </div>
              <div class="flex flex-col gap-2">
                <label [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">End Date</label>
                <input type="date" [(ngModel)]="endDate" class="p-3 border bg-transparent" 
                       [style.border-radius]="'var(--ui-border-radius)'" 
                       [style.border-color]="'var(--theme-border-secondary)'"
                       [style.color]="'var(--theme-text-primary)'">
              </div>
            </div>
          </div>

          <div class="flex justify-end">
             <p-button [label]="exporting() ? 'Generating CSV...' : 'Download Analysis'" 
                       [icon]="exporting() ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-download'" 
                       [disabled]="exporting()"
                       (onClick)="handleExport()"
                       styleClass="p-button-lg shadow-xl"
                       [style.background]="'var(--theme-accent-gradient)'"
                       [style.border]="'none'"
                       [style.border-radius]="'var(--ui-border-radius-lg)'">
             </p-button>
          </div>
        </div>

        <div class="lg:col-span-4 space-y-6">
          <div class="p-6 border h-full flex flex-col" 
               [style.background]="'var(--theme-bg-secondary)'" 
               [style.border-color]="'var(--theme-border-primary)'" 
               [style.border-radius]="'var(--ui-border-radius-xl)'">
            <h4 class="font-bold mb-6 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Export Specification</h4>
            
            <div class="space-y-4 flex-1">
               <div class="flex justify-between items-center">
                 <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">File Format</span>
                 <p-tag value="CSV (RFC 4180)" severity="info"></p-tag>
               </div>
               <div class="flex justify-between items-center">
                 <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Encoding</span>
                 <span class="font-mono text-white text-xs">UTF-8</span>
               </div>
               <div class="flex justify-between items-center border-t pt-4" [style.border-color]="'var(--theme-border-primary)'">
                 <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Target Dimension</span>
                 <span class="font-bold text-white capitalize">{{ selectedType() }}</span>
               </div>
            </div>

            <div class="mt-8 p-4 border border-dashed rounded-lg" 
                 [style.border-color]="'var(--theme-info)'" [style.background]="'rgba(59, 130, 246, 0.05)'">
               <div class="flex gap-3">
                 <i class="pi pi-info-circle text-blue-400 mt-1"></i>
                 <div>
                   <p class="font-bold text-blue-400" [style.font-size]="'var(--font-size-xs)'">Export Tip</p>
                   <p class="mt-1" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="leading-tight">
                     Large datasets may take a few seconds to compile. Your download will start automatically once ready.
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class AnalyticsExportHubComponent {
  exporting = signal<boolean>(false);
  selectedType:any = signal<'sales' | 'inventory' | 'customers'>('sales');
  startDate = '';
  endDate = '';

  exportTypes = [
    { id: 'sales', label: 'Revenue & Sales', icon: 'pi-chart-line' },
    { id: 'inventory', label: 'Inventory Health', icon: 'pi-box' },
    { id: 'customers', label: 'Customer Base', icon: 'pi-users' }
  ];

  constructor(private analyticsService: AdminAnalyticsService) {}

  handleExport() {
    this.exporting.set(true);
    
    this.analyticsService.exportAnalyticsData(
      this.selectedType(),
      this.startDate,
      this.endDate
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