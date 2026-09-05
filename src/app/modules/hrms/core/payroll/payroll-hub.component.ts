import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { TabBarComponent, TabItem } from '@shared/ui/tabs/tab-bar.component';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { SelectFilterComponent, SelectFilterOption } from '@shared/ui/filters/select-filter.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService, Payslip, SalaryStructure } from '../../hrms.service';

@Component({
  selector: 'app-payroll-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TooltipModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    TabBarComponent,
    SelectFilterComponent,
  ],
  template: `
    <app-page>
      <app-page-header
        title="Payroll & Compensation Hub"
        subtitle="Execute automated payroll calculations, review attendance adjustments, and process payslips">
        <div header-right class="flex items-center gap-3">
          @if (activeTab() === 'payslips') {
            <app-select-filter
              [options]="monthFilterOptions"
              [value]="selectedMonth()"
              (valueChange)="onMonthChange($event)"
              placeholder="Month">
            </app-select-filter>

            <app-select-filter
              [options]="yearFilterOptions"
              [value]="selectedYear()"
              (valueChange)="onYearChange($event)"
              placeholder="Year">
            </app-select-filter>

            <p-button
              label="Run Monthly Payroll"
              icon="pi pi-cog"
              (onClick)="openRunPayrollDialog()">
            </p-button>
          } @else {
            <p-button
              label="Create Salary Template"
              icon="pi pi-plus"
              (onClick)="openCreateStructureDialog()">
            </p-button>
          }
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <div class="flex flex-col gap-4 h-full">
          <app-tab-bar
            [tabs]="hubTabs"
            [(activeTabId)]="activeTab"
            (activeTabIdChange)="onTabChange()">
          </app-tab-bar>

          <!-- Payslips Tab -->
          @if (activeTab() === 'payslips') {
            <div class="flex flex-col flex-1 min-h-0 gap-4">
              <!-- Summary Metrics Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)] font-medium">Total Payslips</span>
                  <span class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ totalPayslips() }}</span>
                </div>
                <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)] font-medium">Total Gross Payout</span>
                  <span class="text-xl font-bold text-emerald-600 mt-1">₹{{ totalGrossPayout() | number:'1.0-0' }}</span>
                </div>
                <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)] font-medium">Total Deductions</span>
                  <span class="text-xl font-bold text-rose-600 mt-1">₹{{ totalDeductions() | number:'1.0-0' }}</span>
                </div>
                <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)] font-medium">Net Payroll Disbursed</span>
                  <span class="text-xl font-bold text-[var(--primary-color)] mt-1">₹{{ totalNetPayout() | number:'1.0-0' }}</span>
                </div>
              </div>

              <div class="flex-1 min-h-0">
                <app-data-grid
                  [columns]="payslipColumns"
                  [data]="payslips()"
                  [loading]="isLoading()"
                  [rowActions]="payslipRowActions"
                  (gridEvent)="onGridEvent($event)">
                </app-data-grid>
              </div>
            </div>
          }

          <!-- Salary Structures Tab -->
          @if (activeTab() === 'structures') {
            <div class="flex-1 min-h-0">
              <app-data-grid
                [columns]="structureColumns"
                [data]="structures()"
                [loading]="isLoading()"
                [rowActions]="structureRowActions"
                (gridEvent)="onGridEvent($event)">
              </app-data-grid>
            </div>
          }
        </div>
      </app-page-content>
    </app-page>

    <!-- Run Monthly Payroll Modal -->
    <p-dialog
      header="Run Monthly Payroll Engine"
      [(visible)]="showRunDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <p class="text-sm text-[var(--text-secondary)] m-0">
          This engine calculates worked days, overtime, unpaid leave deductions, and builds verified payslips for all active employees.
        </p>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Month</label>
            <p-select
              [options]="monthOptions"
              [(ngModel)]="runPayload.month"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Year</label>
            <p-select
              [options]="yearOptions"
              [(ngModel)]="runPayload.year"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full" />
          </div>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showRunDialog.set(false)"></p-button>
          <p-button label="Start Payroll Run" icon="pi pi-play" [loading]="isProcessing()" (onClick)="executePayrollRun()"></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Payslip Viewer Modal -->
    <p-dialog
      [header]="selectedPayslip()?.payslipNumber || 'Payslip Details'"
      [(visible)]="showPayslipDialog"
      [modal]="true"
      [style]="{ width: '640px' }"
      [draggable]="false"
      [resizable]="false">
      @if (selectedPayslip(); as p) {
        <div class="flex flex-col gap-5 py-2">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
            <div>
              <h3 class="text-base font-bold text-[var(--text-primary)] m-0">{{ p.user?.name || 'Employee' }}</h3>
              <p class="text-xs text-[var(--text-secondary)] m-0 mt-0.5 font-mono">Period: {{ p.month }}/{{ p.year }}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {{ p.status }}
            </span>
          </div>

          <!-- Attendance Snapshot -->
          <div class="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div>
              <span class="text-[11px] text-[var(--text-secondary)] block">Paid Days</span>
              <span class="text-sm font-bold text-[var(--text-primary)]">{{ p.attendanceSnapshot.paidDays }}</span>
            </div>
            <div>
              <span class="text-[11px] text-[var(--text-secondary)] block">Present</span>
              <span class="text-sm font-bold text-[var(--text-primary)]">{{ p.attendanceSnapshot.presentDays }}</span>
            </div>
            <div>
              <span class="text-[11px] text-[var(--text-secondary)] block">Unpaid</span>
              <span class="text-sm font-bold text-rose-600">{{ p.attendanceSnapshot.unpaidLeaveDays }}</span>
            </div>
            <div>
              <span class="text-[11px] text-[var(--text-secondary)] block">Late Count</span>
              <span class="text-sm font-bold text-amber-600">{{ p.attendanceSnapshot.lateCount }}</span>
            </div>
          </div>

          <!-- Earnings vs Deductions Breakup -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 rounded-xl border border-[var(--border-primary)] flex flex-col gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">Earnings</span>
              @for (item of p.earnings; track item.code) {
                <div class="flex justify-between text-xs py-1 border-b border-[var(--border-secondary)]">
                  <span class="text-[var(--text-secondary)]">{{ item.name }}</span>
                  <span class="font-semibold text-[var(--text-primary)]">₹{{ item.amount | number:'1.0-0' }}</span>
                </div>
              }
              <div class="flex justify-between text-xs font-bold pt-2 mt-auto">
                <span>Gross Pay</span>
                <span class="text-emerald-600">₹{{ p.grossPay | number:'1.0-0' }}</span>
              </div>
            </div>

            <div class="p-3 rounded-xl border border-[var(--border-primary)] flex flex-col gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-rose-600">Deductions</span>
              @for (item of p.deductions; track item.code) {
                <div class="flex justify-between text-xs py-1 border-b border-[var(--border-secondary)]">
                  <span class="text-[var(--text-secondary)]">{{ item.name }}</span>
                  <span class="font-semibold text-rose-600">₹{{ item.amount | number:'1.0-0' }}</span>
                </div>
              }
              @if (!p.deductions || p.deductions.length === 0) {
                <span class="text-xs text-[var(--text-muted)] italic">No statutory deductions</span>
              }
              <div class="flex justify-between text-xs font-bold pt-2 mt-auto">
                <span>Total Deductions</span>
                <span class="text-rose-600">₹{{ p.deductionTotal | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <!-- Net Payout Footer -->
          <div class="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Net Disbursed Take-Home</span>
            <span class="text-2xl font-black text-emerald-600">₹{{ p.netPay | number:'1.0-0' }}</span>
          </div>
        </div>
      }

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          @if (selectedPayslip()?.status === 'draft') {
            <p-button label="Approve Payslip" icon="pi pi-check" severity="success" (onClick)="approveCurrentPayslip()"></p-button>
          }
          <p-button label="Close" [text]="true" severity="secondary" (onClick)="showPayslipDialog.set(false)"></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
    }
  `],
})
export class PayrollHubComponent implements OnInit {
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeTab = signal('payslips');
  readonly isLoading = signal(false);
  readonly isProcessing = signal(false);

  readonly payslips = signal<Payslip[]>([]);
  readonly structures = signal<SalaryStructure[]>([]);
  readonly totalCount = signal(0);

  readonly selectedPayslip = signal<Payslip | null>(null);
  readonly showRunDialog = signal(false);
  readonly showPayslipDialog = signal(false);

  readonly now = new Date();
  readonly selectedMonth = signal<number>(this.now.getMonth() + 1);
  readonly selectedYear = signal<number>(this.now.getFullYear());

  readonly totalPayslips = computed(() => this.payslips().length);
  readonly totalGrossPayout = computed(() => this.payslips().reduce((sum, p) => sum + (p.grossPay || 0), 0));
  readonly totalDeductions = computed(() => this.payslips().reduce((sum, p) => sum + (p.deductionTotal || 0), 0));
  readonly totalNetPayout = computed(() => this.payslips().reduce((sum, p) => sum + (p.netPay || 0), 0));

  readonly hubTabs: TabItem[] = [
    { id: 'payslips', label: 'Monthly Runs & Payslips', icon: 'pi pi-file' },
    { id: 'structures', label: 'Salary Structures', icon: 'pi pi-sliders-h' },
  ];

  readonly monthOptions = [
    { label: 'January', value: 1 }, { label: 'February', value: 2 }, { label: 'March', value: 3 },
    { label: 'April', value: 4 }, { label: 'May', value: 5 }, { label: 'June', value: 6 },
    { label: 'July', value: 7 }, { label: 'August', value: 8 }, { label: 'September', value: 9 },
    { label: 'October', value: 10 }, { label: 'November', value: 11 }, { label: 'December', value: 12 },
  ];

  readonly yearOptions = [
    { label: '2025', value: 2025 },
    { label: '2026', value: 2026 },
    { label: '2027', value: 2027 },
  ];

  readonly monthFilterOptions: SelectFilterOption[] = this.monthOptions;
  readonly yearFilterOptions: SelectFilterOption[] = this.yearOptions;

  runPayload = {
    month: this.now.getMonth() + 1,
    year: this.now.getFullYear(),
  };

  readonly payslipColumns: GridColumn[] = [
    {
      field: 'payslipNumber',
      header: 'Payslip ID',
      minWidth: '150px',
      sortable: true,
      formatter: (v: string) => `<span class="font-mono font-semibold text-[var(--primary-color)] text-xs">${v || '—'}</span>`,
    },
    {
      field: 'user',
      header: 'Employee',
      minWidth: '200px',
      formatter: (_v: any, row: Payslip) => {
        const name = row.user?.name || (row.employeeId as any)?.displayName || 'Employee';
        const empCode = (row.employeeId as any)?.employeeId || '';
        return `
          <div class="flex flex-col">
            <span class="font-semibold text-xs text-[var(--text-primary)]">${name}</span>
            <span class="text-[11px] font-mono text-[var(--text-secondary)]">${empCode}</span>
          </div>
        `;
      },
    },
    {
      field: 'month',
      header: 'Period',
      width: '110px',
      formatter: (_v: any, row: Payslip) => `<span class="font-mono text-xs">${row.month}/${row.year}</span>`,
    },
    {
      field: 'grossPay',
      header: 'Gross Pay',
      width: '130px',
      formatter: (v: number) => `<span class="font-semibold text-xs text-emerald-600">₹${(v || 0).toLocaleString()}</span>`,
    },
    {
      field: 'deductionTotal',
      header: 'Deductions',
      width: '120px',
      formatter: (v: number) => `<span class="font-medium text-xs text-rose-600">₹${(v || 0).toLocaleString()}</span>`,
    },
    {
      field: 'netPay',
      header: 'Net Pay',
      width: '130px',
      formatter: (v: number) => `<span class="font-bold text-xs text-[var(--text-primary)]">₹${(v || 0).toLocaleString()}</span>`,
    },
    {
      field: 'status',
      header: 'Status',
      width: '120px',
      type: 'badge',
      formatter: (v: string) => v ? v.toUpperCase() : 'DRAFT',
    },
  ];

  readonly payslipRowActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      tooltip: 'View Payslip Breakdown',
      variant: 'primary',
      callback: (row: Payslip) => this.viewPayslip(row),
    },
    {
      id: 'approve',
      icon: 'pi pi-check',
      tooltip: 'Approve for Disbursement',
      variant: 'ghost',
      callback: (row: Payslip) => this.updateStatus(row._id, 'approved'),
    },
    {
      id: 'pay',
      icon: 'pi pi-wallet',
      tooltip: 'Mark as Paid',
      variant: 'ghost',
      callback: (row: Payslip) => this.updateStatus(row._id, 'paid'),
    },
  ];

  readonly structureColumns: GridColumn[] = [
    {
      field: 'title',
      header: 'Template Title',
      minWidth: '220px',
      sortable: true,
      formatter: (v: string, row: SalaryStructure) => `
        <div class="flex flex-col">
          <span class="font-semibold text-xs text-[var(--text-primary)]">${v}</span>
          <span class="text-[11px] font-mono text-[var(--text-secondary)]">${row.structureCode || ''}</span>
        </div>
      `,
    },
    {
      field: 'currency',
      header: 'Currency',
      width: '100px',
    },
    {
      field: 'payFrequency',
      header: 'Frequency',
      width: '120px',
      type: 'badge',
      formatter: (v: string) => (v || 'monthly').toUpperCase(),
    },
    {
      field: 'grossMonthly',
      header: 'Gross Monthly',
      width: '140px',
      formatter: (v: number) => `<span class="font-semibold text-xs text-emerald-600">₹${(v || 0).toLocaleString()}</span>`,
    },
    {
      field: 'fixedDeductionsMonthly',
      header: 'Fixed Deductions',
      width: '140px',
      formatter: (v: number) => `<span class="font-medium text-xs text-rose-600">₹${(v || 0).toLocaleString()}</span>`,
    },
    {
      field: 'status',
      header: 'Status',
      width: '120px',
      type: 'badge',
      formatter: (v: string) => (v || 'draft').toUpperCase(),
    },
  ];

  readonly structureRowActions: GridRowAction[] = [
    {
      id: 'activate',
      icon: 'pi pi-check-circle',
      tooltip: 'Activate Template',
      variant: 'primary',
      callback: (row: SalaryStructure) => this.activateStructure(row._id),
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  onTabChange(): void {
    this.loadData();
  }

  onMonthChange(month: number): void {
    this.selectedMonth.set(month);
    this.loadPayslips();
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loadPayslips();
  }

  loadData(): void {
    if (this.activeTab() === 'payslips') {
      this.loadPayslips();
    } else {
      this.loadStructures();
    }
  }

  private loadPayslips(): void {
    this.isLoading.set(true);
    this.hrmsService.getPayslips({
      month: this.selectedMonth(),
      year: this.selectedYear(),
    }).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        const list = res.data?.payslips || (Array.isArray(res.data) ? res.data : []);
        this.payslips.set(list);
        this.totalCount.set(res.pagination?.totalResults ?? list.length);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  private loadStructures(): void {
    this.isLoading.set(true);
    this.hrmsService.getSalaryStructures().pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        const list = res.data?.salaryStructures || (Array.isArray(res.data) ? res.data : []);
        this.structures.set(list);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openRunPayrollDialog(): void {
    this.runPayload = {
      month: this.selectedMonth(),
      year: this.selectedYear(),
    };
    this.showRunDialog.set(true);
  }

  executePayrollRun(): void {
    this.isProcessing.set(true);
    this.hrmsService.runMonthlyPayroll(this.runPayload).pipe(
      finalize(() => this.isProcessing.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.showRunDialog.set(false);
        this.messageService.showSuccess(`Payroll run completed! Processed ${res.data?.processedCount || 0} payslips.`);
        this.loadPayslips();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  viewPayslip(p: Payslip): void {
    this.selectedPayslip.set(p);
    this.showPayslipDialog.set(true);
  }

  approveCurrentPayslip(): void {
    const p = this.selectedPayslip();
    if (!p) return;
    this.updateStatus(p._id, 'approved');
    this.showPayslipDialog.set(false);
  }

  updateStatus(id: string, status: string): void {
    this.hrmsService.updatePayslipStatus(id, { status, paymentMode: 'bank_transfer' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess(`Payslip updated to ${status}.`);
        this.loadPayslips();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  activateStructure(id: string): void {
    this.hrmsService.updateSalaryStructure(id, { status: 'active' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Salary structure activated.');
        this.loadStructures();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openCreateStructureDialog(): void {
    // Template creation default
    this.hrmsService.createSalaryStructure({
      title: 'Standard Executive Grade',
      currency: 'INR',
      payFrequency: 'monthly',
      effectiveFrom: new Date(),
      status: 'active',
      components: [
        { name: 'Basic Pay', code: 'BASIC', category: 'earning', calculationType: 'fixed', amount: 35000, taxable: true },
        { name: 'House Rent Allowance (HRA)', code: 'HRA', category: 'earning', calculationType: 'fixed', amount: 15000, taxable: true },
        { name: 'Special Allowance', code: 'SPECIAL', category: 'earning', calculationType: 'fixed', amount: 10000, taxable: true },
        { name: 'Provident Fund (PF)', code: 'PF', category: 'deduction', calculationType: 'fixed', amount: 1800, affectsPF: true },
        { name: 'Professional Tax', code: 'PT', category: 'deduction', calculationType: 'fixed', amount: 200 },
      ],
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.showSuccess('Created standard executive salary structure.');
        this.loadStructures();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  onGridEvent(_event: any): void {}
}
