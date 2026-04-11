import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, forkJoin, of, Subject } from 'rxjs';

// Services
// import { HRMSService } from '../../../hrms.service';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Modules
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
// import { DropdownModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { HRMSService } from '../../hrms.service';
import { SelectModule } from 'primeng/select';
import { AppMessageService } from '@core/services/message.service';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-leave-balance-admin',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TabsModule,
    TableModule,
    CardModule,
    FormsModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    AvatarModule,
    TooltipModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    ChartModule,
    ProgressBarModule
],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      
      <header class="dashboard-header slide-down mb-5">
        <div class="header-left">
          <div class="icon-brand bg-primary text-white"><i class="pi pi-wallet"></i></div>
          <div class="header-titles">
            <h1 class="page-title">Leave Balances & Audits</h1>
            <p class="page-subtitle">Manage allocations, track transactions, and execute financial year rollovers.</p>
          </div>
        </div>
        <div class="header-right flex-align gap-3">
          <p-select [options]="financialYears" [(ngModel)]="selectedFy" (onChange)="loadData()" [filter]="true" filterBy="label" styleClass="premium-select w-10rem"></p-select>
          <p-button label="Bulk Initialize Year" icon="pi pi-sync" styleClass="p-button-primary shadow-sm" (onClick)="showBulkInitDialog()"></p-button>
        </div>
      </header>

      @if (isLoading()) {
        <p-card styleClass="premium-card glass-card"><p-skeleton width="100%" height="500px" borderRadius="12px"></p-skeleton></p-card>
      } @else {
        
        <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
          <p-tabs value="0">
            <p-tablist styleClass="hub-tablist">
              <p-tab value="0"><div class="tab-label"><i class="pi pi-users"></i> Employee Directory</div></p-tab>
              <p-tab value="1"><div class="tab-label"><i class="pi pi-chart-line"></i> Utilization Trends</div></p-tab>
            </p-tablist>

            <p-tabpanels styleClass="hub-tabpanels p-0">
              
              <p-tabpanel value="0">
                <div class="panel-inner p-4">
                  <p-table 
                    #dt
                    [value]="balances()" 
                    [paginator]="true" 
                    [rows]="10" 
                    [globalFilterFields]="['user.name', 'user.employeeProfile.employeeId']"
                    responsiveLayout="scroll"
                    styleClass="premium-table border-round-xl manish-border-1 surface-border">
                    
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Employee Information</th>
                        <th class="text-center">Casual Leave (CL)</th>
                        <th class="text-center">Sick Leave (SL)</th>
                        <th class="text-center">Earned Leave (EL)</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-bal>
                      <tr class="table-row-hover">
                        <td>
                          <div class="flex-align gap-3">
                            <p-avatar [label]="getInitials(bal.user?.name)" shape="circle" size="large" [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)'}"></p-avatar>
                            <div class="flex-col gap-1">
                              <span class="font-bold text-primary-color">{{ bal.user?.name || 'Unknown' }}</span>
                              <span class="badge-mono-sm w-max">{{ bal.financialYear }}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td>
                          <div class="flex-col align-center w-full px-3">
                            <div class="flex-between w-full text-sm mb-1">
                              <span class="font-bold">{{ (bal.casualLeave?.total || 0) - (bal.casualLeave?.used || 0) }} left</span>
                              <span class="text-secondary">{{ bal.casualLeave?.total || 0 }} total</span>
                            </div>
                            <p-progressBar [value]="getPercentage(bal.casualLeave?.used, bal.casualLeave?.total)" [showValue]="false" styleClass="h-2 w-full"></p-progressBar>
                          </div>
                        </td>

                        <td>
                          <div class="flex-col align-center w-full px-3">
                            <div class="flex-between w-full text-sm mb-1">
                              <span class="font-bold">{{ (bal.sickLeave?.total || 0) - (bal.sickLeave?.used || 0) }} left</span>
                              <span class="text-secondary">{{ bal.sickLeave?.total || 0 }} total</span>
                            </div>
                            <p-progressBar [value]="getPercentage(bal.sickLeave?.used, bal.sickLeave?.total)" [showValue]="false" styleClass="h-2 w-full bg-error-light" [color]="'var(--color-error)'"></p-progressBar>
                          </div>
                        </td>

                        <td>
                          <div class="flex-col align-center w-full px-3">
                            <div class="flex-between w-full text-sm mb-1">
                              <span class="font-bold">{{ (bal.earnedLeave?.total || 0) - (bal.earnedLeave?.used || 0) }} left</span>
                              <span class="text-secondary">{{ bal.earnedLeave?.total || 0 }} total</span>
                            </div>
                            <p-progressBar [value]="getPercentage(bal.earnedLeave?.used, bal.earnedLeave?.total)" [showValue]="false" styleClass="h-2 w-full bg-warning-light" [color]="'var(--color-warning)'"></p-progressBar>
                          </div>
                        </td>

                        <td class="text-right">
                          <p-button icon="pi pi-sliders-h" [text]="true" [rounded]="true" severity="secondary" pTooltip="Adjust Balance" (onClick)="showAdjustDialog(bal)"></p-button>
                          <p-button icon="pi pi-history" [text]="true" [rounded]="true" severity="secondary" pTooltip="Transaction Log"></p-button>
                        </td>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="5" class="text-center py-6 text-secondary">No leave balances found for the selected financial year.</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                <div class="panel-inner p-4 bg-surface h-full">
                  <div class="grid-2">
                    <p-card styleClass="h-full manish-border-1 surface-border shadow-none">
                      <h4 class="font-heading m-0 mb-4 text-primary-color">Year-over-Year Utilization Trends</h4>
                      <p-chart type="bar" [data]="trendsChartData" [options]="chartOptions" height="300px"></p-chart>
                    </p-card>

                    <p-card styleClass="h-full manish-border-1 surface-border shadow-none">
                       <h4 class="font-heading m-0 mb-4 text-primary-color">Department Liability Report</h4>
                       <p class="text-sm text-secondary mb-4">Current unutilized leave balances across departments representing financial liability.</p>
                       
                       <ul class="liability-list">
                         <li class="flex-between py-3 border-bottom">
                           <span class="font-bold text-secondary">Engineering</span>
                           <span class="font-bold text-error">1,240 Days</span>
                         </li>
                         <li class="flex-between py-3 border-bottom">
                           <span class="font-bold text-secondary">Sales</span>
                           <span class="font-bold text-warning">850 Days</span>
                         </li>
                         <li class="flex-between py-3">
                           <span class="font-bold text-secondary">Human Resources</span>
                           <span class="font-bold text-primary">320 Days</span>
                         </li>
                       </ul>
                    </p-card>
                  </div>
                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </p-card>
      }
    </div>

    <p-dialog header="Bulk Initialize Financial Year" [(visible)]="displayBulkDialog" [modal]="true" [style]="{width: '450px'}" styleClass="premium-dialog">
      <p class="text-sm text-secondary mb-4">Initialize leave balances for all active employees for the upcoming financial year. This process will apply default organizational leave policies.</p>
      
      <form [formGroup]="bulkInitForm" class="flex-col gap-4">
        <div class="input-group">
          <label class="info-label">Target Financial Year <span class="text-error">*</span></label>
          <input pInputText formControlName="financialYear" placeholder="e.g. 2025-2026" class="w-full premium-input" />
        </div>
        
        <div class="flex-align gap-2 bg-primary-light p-3 border-radius-md mt-2">
          <p-checkbox formControlName="carryForward" [binary]="true" inputId="cf"></p-checkbox>
          <label for="cf" class="text-sm font-bold text-primary-color cursor-pointer m-0">Execute Carry Forward Rules</label>
        </div>
        <p class="text-xs text-tertiary m-0 px-1">If checked, remaining eligible balances from the previous year will be moved to the new year based on group policies.</p>

        <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayBulkDialog = false"></p-button>
          <p-button label="Initialize Balances" icon="pi pi-sync" type="submit" [loading]="isProcessing()" [disabled]="bulkInitForm.invalid" styleClass="p-button-primary" (onClick)="submitBulkInit()"></p-button>
        </div>
      </form>
    </p-dialog>

    <p-dialog header="Adjust Leave Balance" [(visible)]="displayAdjustDialog" [modal]="true" [style]="{width: '450px'}" styleClass="premium-dialog">
      <div class="mb-4 bg-surface p-3 border-radius-md flex-align gap-3">
        <p-avatar [label]="getInitials(selectedBalance?.user?.name)" shape="circle" styleClass="bg-primary text-white"></p-avatar>
        <div class="flex-col">
          <span class="font-bold">{{ selectedBalance?.user?.name }}</span>
          <span class="text-xs text-secondary">FY: {{ selectedBalance?.financialYear }}</span>
        </div>
      </div>

      <form [formGroup]="adjustForm" class="flex-col gap-4">
        <div class="grid-2 gap-4">
          <div class="input-group">
            <label class="info-label">Leave Type <span class="text-error">*</span></label>
            <p-select formControlName="leaveType" [options]="leaveTypes" [filter]="true" filterBy="label" placeholder="Select" styleClass="w-full premium-select" appendTo="body"></p-select>
          </div>
          <div class="input-group">
            <label class="info-label">Action <span class="text-error">*</span></label>
            <p-select formControlName="actionType" [options]="actionTypes" [filter]="true" filterBy="label" placeholder="Select" styleClass="w-full premium-select" appendTo="body"></p-select>
          </div>
        </div>

        <div class="input-group">
          <label class="info-label">Days / Amount <span class="text-error">*</span></label>
          <p-inputNumber formControlName="amount" [min]="0.5" [step]="0.5" [showButtons]="true" styleClass="w-full premium-input"></p-inputNumber>
        </div>

        <div class="input-group">
          <label class="info-label">Adjustment Reason <span class="text-error">*</span></label>
          <input pInputText formControlName="reason" placeholder="e.g. Compensatory off granted" class="w-full premium-input" />
        </div>

        <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayAdjustDialog = false"></p-button>
          <p-button label="Confirm Adjustment" icon="pi pi-check" type="submit" [loading]="isProcessing()" [disabled]="adjustForm.invalid" styleClass="p-button-primary" (onClick)="submitAdjustment()"></p-button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    /* --------------------------------------------------------------------------
       GLOBAL & VARIABLES
       -------------------------------------------------------------------------- */
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }

    /* Utility */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    .align-center { align-items: center; }
    
    .w-full { width: 100%; }
    .w-max { width: max-content; }
    .w-10rem { width: 10rem; }
    .h-full { height: 100%; }
    .h-2 { height: 0.5rem; }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mb-1 { margin-bottom: var(--spacing-xs); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-4 { margin-top: var(--spacing-xl); }
    
    .p-0 { padding: 0 !important; }
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .px-1 { padding-left: var(--spacing-xs); padding-right: var(--spacing-xs); }
    .px-3 { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }
    .py-3 { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    .pt-4 { padding-top: var(--spacing-xl); }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary { background: var(--color-primary); color: white; }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .manish-border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-round-xl { border-radius: var(--radius-2xl); }
    .overflow-hidden { overflow: hidden; }
    .shadow-none { box-shadow: none !important; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-error { color: var(--color-error); }
    .text-warning { color: var(--color-warning); }
    .text-white { color: white; }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-heading { font-family: var(--font-heading); }
    .cursor-pointer { cursor: pointer; }

    /* --------------------------------------------------------------------------
       HEADER & TABS
       -------------------------------------------------------------------------- */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
    .header-titles { display: flex; flex-direction: column; gap: 4px; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }

    ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }
    .tab-label { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-md); }

    /* --------------------------------------------------------------------------
       TABLE & PROGRESS BARS
       -------------------------------------------------------------------------- */
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--color-primary-bg) !important; }

    .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }

    /* Custom Progress Bar Overrides */
    ::ng-deep .p-progressbar { background: rgba(0,0,0,0.06) !important; border-radius: 4px; overflow: hidden; }
    ::ng-deep .p-progressbar .p-progressbar-value { background: var(--color-primary); border-radius: 4px; }
    
    ::ng-deep .bg-error-light .p-progressbar-value { background: var(--color-error) !important; }
    ::ng-deep .bg-warning-light .p-progressbar-value { background: var(--color-warning) !important; }

    /* --------------------------------------------------------------------------
       FORMS & DIALOGS
       -------------------------------------------------------------------------- */
    .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }

    ::ng-deep .premium-input, ::ng-deep .premium-select .p-select, ::ng-deep .premium-input .p-inputnumber-input { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-body); }
    ::ng-deep .premium-input:focus, ::ng-deep .premium-select .p-select.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
    ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }

    .liability-list { list-style: none; padding: 0; margin: 0; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
      .header-right { margin-top: var(--spacing-md); }
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
    }
  `]
})
export class LeaveBalanceAdminComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  isLoading = signal(true);
  balances = signal<any[]>([]);

  // Header Filtering
  financialYears = [{ label: '2023-2024', value: '2023-2024' }, { label: '2024-2025', value: '2024-2025' }];
  selectedFy = '2024-2025';

  // Analytics
  trendsChartData: any;
  chartOptions: any;

  // Dialogs
  displayBulkDialog = false;
  bulkInitForm!: FormGroup;

  displayAdjustDialog = false;
  adjustForm!: FormGroup;
  selectedBalance: any = null;
  isProcessing = signal(false);

  leaveTypes = [
    { label: 'Casual Leave (CL)', value: 'casualLeave' },
    { label: 'Sick Leave (SL)', value: 'sickLeave' },
    { label: 'Earned Leave (EL)', value: 'earnedLeave' }
  ];

  actionTypes = [
    { label: 'Credit (Add)', value: 'credit' },
    { label: 'Debit (Deduct)', value: 'debit' }
  ];

  ngOnInit() {
    this.initForms();
    this.initChart();
    this.loadData();
  }

  private initForms() {
    this.bulkInitForm = this.fb.group({
      financialYear: ['2025-2026', Validators.required],
      carryForward: [true]
    });

    this.adjustForm = this.fb.group({
      leaveType: [null, Validators.required],
      actionType: ['credit', Validators.required],
      amount: [1, [Validators.required, Validators.min(0.5)]],
      reason: ['', Validators.required]
    });
  }

  loadData() {
    this.isLoading.set(true);

    forkJoin({
      bals: this.hrmsService.getAllLeaveBalances({ financialYear: this.selectedFy }).pipe(
        catchError(() => of({ data: { leaveBalances: [] } }))
      ),
      trends: this.hrmsService.getUtilizationTrends(3).pipe(
        catchError(() => of(null))
      )
    }).pipe(
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe(({ bals }) => {
      this.balances.set(bals?.data?.leaveBalances || []);
    });
  }

  // --- Bulk Init Flow ---
  showBulkInitDialog() {
    this.bulkInitForm.reset({ financialYear: '2025-2026', carryForward: true });
    this.displayBulkDialog = true;
  }

  submitBulkInit() {
    if (this.bulkInitForm.invalid) return;
    this.isProcessing.set(true);

    const val = this.bulkInitForm.value;
    this.hrmsService.bulkInitializeLeaveBalances(val.financialYear, val.carryForward).pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => {
        this.isProcessing.set(false);
        this.displayBulkDialog = false;
      }), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res) {
        this.messageService.showSuccess(res.message)
        this.selectedFy = val.financialYear;
        // Optionally add new year to select array here
        this.loadData();
      }
    });
  }

  // --- Adjustment Flow ---
  showAdjustDialog(balance: any) {
    this.selectedBalance = balance;
    this.adjustForm.reset({ actionType: 'credit', amount: 1 });
    this.displayAdjustDialog = true;
  }

  submitAdjustment() {
    if (this.adjustForm.invalid || !this.selectedBalance) return;

    this.isProcessing.set(true);
    const formVal = this.adjustForm.value;

    // In a real app, you might have specific endpoints like /credit or /debit
    // or you pass a signed +/- amount to updateLeaveBalance
    const payload = {
      action: formVal.actionType,
      leaveType: formVal.leaveType,
      amount: formVal.amount,
      reason: formVal.reason
    };

    this.hrmsService.updateLeaveBalance(this.selectedBalance._id, payload).pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => {
        this.isProcessing.set(false);
        this.displayAdjustDialog = false;
      }), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res) {
        this.messageService.showSuccess(res.message)
        this.loadData();
      }
    });
  }

  // --- Helpers ---
  getPercentage(used: number = 0, total: number = 0): number {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  private initChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-primary') || '#333';
    const textColorSecondary = documentStyle.getPropertyValue('--text-secondary') || '#666';
    const surfaceBorder = documentStyle.getPropertyValue('--border-primary') || '#ddd';

    this.trendsChartData = {
      labels: ['2022-23', '2023-24', '2024-25'],
      datasets: [
        { label: 'Total Allocated', backgroundColor: '#e2e8f0', data: [5200, 5600, 6000] },
        { label: 'Total Utilized', backgroundColor: '#3b82f6', data: [3800, 4100, 4500] }
      ]
    };

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } },
        y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } }
      }
    };
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}