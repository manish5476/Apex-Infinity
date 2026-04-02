import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-holiday-hub',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, TableModule, ButtonModule,
    TagModule, SelectModule, SkeletonModule, TooltipModule, Toast,
    DialogModule, ConfirmDialogModule, IconFieldModule, InputIconModule, InputTextModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    <p-confirmDialog styleClass="premium-confirm-dialog"></p-confirmDialog>

    <div class="page-wrapper fade-in">
      
      <header class="dashboard-header slide-down mb-5">
        <div class="header-left">
          <div class="icon-brand bg-primary text-white shadow-md"><i class="pi pi-calendar"></i></div>
          <div class="header-titles">
            <h1 class="page-title m-0">Organizational Holidays</h1>
            <p class="page-subtitle mt-1">Manage public holidays, company observances, and restricted leaves.</p>
          </div>
        </div>
        <div class="header-right flex-align gap-3">
          <p-select [options]="years" [(ngModel)]="selectedYear" (onChange)="loadYearData()" styleClass="premium-select font-bold" [filter]="true" filterBy="label"></p-select>

          <p-button icon="pi pi-copy" label="Copy Previous Year" severity="secondary" [outlined]="true" (onClick)="displayCopyDialog = true"></p-button>
          <p-button icon="pi pi-plus" label="Add Holiday" styleClass="p-button-primary" (onClick)="onAdd()"></p-button>
        </div>
      </header>

      @if (isLoading()) {
        <div class="grid-layout-top mb-4">
          <div class="grid-2 gap-4"><p-skeleton height="120px" borderRadius="12px"></p-skeleton><p-skeleton height="120px" borderRadius="12px"></p-skeleton></div>
          <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
        </div>
        <p-skeleton height="500px" borderRadius="12px"></p-skeleton>
      } @else {
        
        <div class="grid-layout-top mb-5 slide-down" style="animation-delay: 0.1s">
          
          <div class="grid-2 gap-4 h-full">
            <p-card styleClass="premium-card h-full border-left-primary">
              <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Total Holidays ({{ selectedYear }})</span>
              <div class="flex-align gap-3 mt-2">
                <span class="text-4xl font-bold text-primary">{{ stats()?.total || holidays().length || 0 }}</span>
                <span class="text-sm text-secondary font-medium">days off</span>
              </div>
            </p-card>
            <p-card styleClass="premium-card h-full border-left-warning">
              <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Optional / Restricted</span>
              <div class="flex-align gap-3 mt-2">
                <span class="text-4xl font-bold text-warning">{{ stats()?.optional || countOptional() }}</span>
                <span class="text-sm text-secondary font-medium">events</span>
              </div>
            </p-card>
          </div>

          <p-card styleClass="premium-card bg-surface manish-border-1 surface-border h-full">
            <div class="flex-between mb-3 border-bottom pb-2">
              <h3 class="m-0 text-primary-color font-heading text-lg"><i class="pi pi-bell text-warning mr-2"></i> Approaching Next</h3>
            </div>
            @if (upcomingHolidays().length > 0) {
              <div class="flex-col gap-3">
                @for (uh of upcomingHolidays(); track uh._id) {
                  <div class="flex-align gap-3 p-2 bg-primary-light border-radius-md">
                    <div class="date-badge flex-col text-center border-right pr-3 pl-2">
                      <span class="text-xs font-bold text-secondary uppercase">{{ uh.date | date:'MMM' }}</span>
                      <span class="text-xl font-bold text-primary leading-none">{{ uh.date | date:'dd' }}</span>
                    </div>
                    <div class="flex-col">
                      <span class="font-bold text-primary-color">{{ uh.name }}</span>
                      <span class="text-xs text-secondary">{{ uh.holidayType | titlecase }} • {{ uh.date | date:'EEEE' }}</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center text-secondary py-4 text-sm">No holidays coming up in the near future.</div>
            }
          </p-card>
        </div>

        <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.2s">
          <p-table 
            #dt
            [value]="holidays()" 
            [paginator]="true" 
            [rows]="15" 
            [globalFilterFields]="['name', 'holidayType']"
            responsiveLayout="scroll"
            styleClass="premium-table border-round-xl manish-border-1 surface-border">
            
            <ng-template pTemplate="caption">
              <div class="flex-between p-3 bg-surface border-bottom">
                <div class="flex-align gap-3">
                  <h3 class="m-0 font-heading text-primary-color"><i class="pi pi-list mr-2"></i> {{ selectedYear }} Register</h3>
                  <p-button icon="pi pi-download" label="Export" size="small" [outlined]="true" severity="secondary" (onClick)="onExport()"></p-button>
                </div>
                <p-iconField iconPosition="left">
                  <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                  <input type="text" pInputText placeholder="Search holidays..." (input)="dt.filterGlobal($any($event.target).value, 'contains')" class="premium-search-input" />
                </p-iconField>
              </div>
            </ng-template>

            <ng-template pTemplate="header">
              <tr>
                <th>Date & Day</th>
                <th>Observance Details</th>
                <th>Type</th>
                <th>Applicability</th>
                <th class="text-right">Actions</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-holiday>
              <tr class="table-row-hover" [ngClass]="{'opacity-60': !holiday.isActive}">
                <td>
                  <div class="flex-col gap-1">
                    <span class="font-bold text-primary-color">{{ holiday.date | date:'dd MMM yyyy' }}</span>
                    <span class="text-xs text-secondary font-mono">{{ holiday.date | date:'EEEE' }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex-col gap-1">
                    <span class="font-bold text-primary-color">{{ holiday.name }}</span>
                    <span *ngIf="holiday.isOptional" class="badge-mono-sm w-max bg-warning-light text-warning border-warning">Restricted / Optional</span>
                  </div>
                </td>
                <td>
                  <p-tag [severity]="getTypeSeverity(holiday.holidayType)" [value]="holiday.holidayType | uppercase"></p-tag>
                </td>
                <td>
                  <div class="flex-col gap-1 text-sm font-medium">
                    <span class="flex-align gap-2 text-secondary"><i class="pi pi-map-marker text-tertiary"></i> {{ holiday.branchId ? 'Specific Branch' : 'All Branches' }}</span>
                    <span class="flex-align gap-2 text-secondary" *ngIf="!holiday.applicableTo?.allEmployees"><i class="pi pi-users text-tertiary"></i> Specific Groups</span>
                  </div>
                </td>
                <td class="text-right">
                  <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="info" pTooltip="Edit" (onClick)="onEdit(holiday._id)"></p-button>
                  <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" pTooltip="Delete" (onClick)="onDelete(holiday)"></p-button>
                </td>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="emptymessage">
              <tr><td colspan="5" class="text-center py-6 text-secondary">No holidays defined for {{ selectedYear }}. Use 'Copy Previous Year' or add a new one.</td></tr>
            </ng-template>
          </p-table>
        </p-card>
      }
    </div>

    <p-dialog header="Clone Holiday Calendar" [(visible)]="displayCopyDialog" [modal]="true" [style]="{width: '400px'}" styleClass="premium-dialog">
      <p class="text-sm text-secondary mb-4">Quickly populate the new year by copying existing holidays. You can edit specific dates after cloning.</p>
      
      <div class="flex-col gap-4">
        <div class="input-group">
          <label class="info-label">Source Year (Copy From)</label>
          <p-select [(ngModel)]="copyFromYear" [options]="years" appendTo="body" styleClass="w-full premium-select" [filter]="true" filterBy="label"></p-select>

        </div>
        <div class="input-group">
          <label class="info-label">Target Year (Copy To)</label>
          <p-select [(ngModel)]="copyToYear" [options]="years" appendTo="body" styleClass="w-full premium-select" [filter]="true" filterBy="label"></p-select>

        </div>
        <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayCopyDialog = false"></p-button>
          <p-button label="Clone Calendar" icon="pi pi-copy" severity="primary" [loading]="isCopying()" [disabled]="copyFromYear === copyToYear" (onClick)="submitCopyYear()"></p-button>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
    .grid-layout-top { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
    
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    
    .w-full { width: 100%; }
    .w-max { width: max-content; }
    .h-full { height: 100%; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-4 { margin-top: var(--spacing-xl); }
    .mr-2 { margin-right: var(--spacing-sm); }
    .pr-3 { padding-right: var(--spacing-md); }
    .pl-2 { padding-left: var(--spacing-sm); }
    .pb-2 { padding-bottom: var(--spacing-sm); }
    .pt-4 { padding-top: var(--spacing-xl); }
    .p-2 { padding: var(--spacing-sm); }
    .p-3 { padding: var(--spacing-lg); }
    .py-4 { padding-top: var(--spacing-xl); padding-bottom: var(--spacing-xl); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-4xl { font-size: 2.5rem; }
    .leading-none { line-height: 1; }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-warning { color: var(--color-warning); }
    .text-white { color: white; }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-mono { font-family: var(--font-mono); }
    .font-heading { font-family: var(--font-heading); }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.05em; }
    .opacity-60 { opacity: 0.6; }

    .bg-surface { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .bg-warning-light { background: #fff7ed; }
    .border-warning { border-color: var(--color-warning); }
    
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-right { border-right: 1px solid var(--border-primary); }
    .manish-border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-left-primary { border-left: 4px solid var(--color-primary) !important; }
    .border-left-warning { border-left: 4px solid var(--color-warning) !important; }

    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    
    .badge-mono-sm { font-family: var(--font-mono); font-size: 10px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }

    /* Cards */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .premium-card { border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); }
    ::ng-deep .premium-card .p-card-body { padding: var(--spacing-xl); height: 100%; display: flex; flex-direction: column; justify-content: center;}
    ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; display: block;}

    /* Table */
    ::ng-deep .premium-search-input { background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; border-radius: var(--ui-border-radius-md) !important; width: 250px; }
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

    /* Dialogs */
    .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    ::ng-deep .premium-select .p-select { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); }
    ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
    ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
      .grid-layout-top { grid-template-columns: 1fr; }
    }
  `]
})
export class HolidayHubComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  isLoading = signal(true);

  currentYear = new Date().getFullYear();
  years = [
    { label: (this.currentYear - 1).toString(), value: this.currentYear - 1 },
    { label: this.currentYear.toString(), value: this.currentYear },
    { label: (this.currentYear + 1).toString(), value: this.currentYear + 1 }
  ];
  selectedYear = this.currentYear;

  holidays = signal<any[]>([]);
  upcomingHolidays = signal<any[]>([]);
  stats = signal<any>(null);

  // Copy Dialog
  displayCopyDialog = false;
  isCopying = signal(false);
  copyFromYear = this.currentYear - 1;
  copyToYear = this.currentYear;

  ngOnInit() {
    this.loadYearData();
  }

  loadYearData() {
    this.isLoading.set(true);

    forkJoin({
      yearList: this.hrmsService.getHolidaysByYear(this.selectedYear).pipe(catchError(() => of({ data: { holidays: [] } }))),
      upcoming: this.hrmsService.getUpcomingHolidays(3).pipe(catchError(() => of({ data: { holidays: [] } }))),
      statsData: this.hrmsService.getHolidayStats(this.selectedYear).pipe(catchError(() => of({ data: null })))
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ yearList, upcoming, statsData }) => {
      this.holidays.set(yearList?.data?.holidays || []);
      this.upcomingHolidays.set(upcoming?.data?.holidays || []);
      this.stats.set(statsData?.data || null);
    });
  }

  onAdd() {
    this.router.navigate(['hrms/holidays/new']);
  }

  onEdit(id: string) {
    this.router.navigate(['/holidays/edit', id]);
  }

  onDelete(holiday: any) {
    this.confirmationService.confirm({
      message: `Delete the holiday <b>${holiday.name}</b>? This will affect attendance processing for that date.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hrmsService.deleteHoliday(holiday._id).subscribe({
          next: (res: any) => {
            this.messageService.showSuccess(res.message)
            this.loadYearData();
          }
        });
      }
    });
  }

  submitCopyYear() {
    this.isCopying.set(true);
    this.hrmsService.copyHolidaysFromYear(this.copyFromYear, this.copyToYear).pipe(
      finalize(() => {
        this.isCopying.set(false);
        this.displayCopyDialog = false;
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      })
    ).subscribe((res: any) => {
      if (res) {
        this.messageService.showSuccess(res.message)
        this.selectedYear = this.copyToYear;
        this.loadYearData();
      }
    });
  }

  onExport() {
    this.hrmsService.exportHolidayCalendar(this.selectedYear, undefined, 'calendar').subscribe({
      next: (res: any) => this.messageService.showSuccess(res.message)
    });
  }

  countOptional() {
    return this.holidays().filter(h => h.isOptional || h.holidayType === 'restricted').length;
  }

  getTypeSeverity(type: string): any {
    switch (type?.toLowerCase()) {
      case 'national': return 'success';
      case 'festival': return 'info';
      case 'restricted': return 'warning';
      case 'company': return 'primary';
      default: return 'secondary';
    }
  }
}