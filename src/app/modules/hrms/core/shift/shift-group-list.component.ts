import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-shift-group-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
  ],
  template: `
    <app-page>
      <app-page-header
        title="Shift Groups"
        subtitle="Configure rotation rules and shift assignment groups">
        <div header-right class="flex items-center gap-3">
          <p-button
            icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary"
            [loading]="isLoading()" (onClick)="getData(true)">
          </p-button>
          <p-button label="Create Group" icon="pi pi-plus" (onClick)="createNew()"></p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <div class="filter-toolbar">
          <div class="filter-toolbar__search">
            <input type="text" pInputText
              [(ngModel)]="filter.search"
              (keydown.enter)="applyFilters()"
              (blur)="applyFilters()"
              placeholder="Name or Code..." />
          </div>
          <div class="filter-toolbar__filters">
            <p-select [options]="rotationOptions" [(ngModel)]="filter.rotationType"
              [showClear]="true" placeholder="Rotation" (onChange)="applyFilters()">
            </p-select>
            <p-select [options]="statusOptions" [(ngModel)]="filter.isActive"
              [showClear]="true" placeholder="Status" (onChange)="applyFilters()">
            </p-select>
            <p-button icon="pi pi-times" [text]="true" severity="secondary"
              pTooltip="Reset" (onClick)="resetFilters()">
            </p-button>
          </div>
        </div>

        <app-data-grid
          [columns]="columns"
          [data]="data()"
          [loading]="isLoading()"
          [rowActions]="rowActions"
          (gridEvent)="eventFromGrid($event)">
        </app-data-grid>
      </app-page-content>
    </app-page>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; height: 100%; }
    .filter-toolbar { display: flex; align-items: center; gap: var(--spacing-md); flex-wrap: wrap; margin-bottom: var(--spacing-md); }
    .filter-toolbar__search { min-width: 200px; max-width: 300px; flex: 1; }
    .filter-toolbar__filters { display: flex; align-items: center; gap: var(--spacing-md); flex-wrap: wrap; flex: 1; }
  `]
})
export class ShiftGroupListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);

  private currentPage = 1;
  private totalCount = 0;
  private readonly pageSize = 50;

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);

  filter: { search: string; rotationType: string | null; isActive: boolean | null } = {
    search: '', rotationType: null, isActive: null,
  };

  readonly rotationOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' },
  ];
  readonly statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  readonly columns: GridColumn[] = [
    { field: 'name', header: 'Group Name', minWidth: '220px', sortable: true },
    { field: 'code', header: 'Code', width: '120px', formatter: (v: any) => v || '—' },
    { field: 'rotationType', header: 'Rotation', width: '140px', type: 'badge' },
    {
      field: 'shifts', header: 'Shifts', width: '90px', align: 'right',
      formatter: (_v: any, row: any) => String(row?.shifts?.length ?? 0),
    },
    {
      field: 'applicableDepartments', header: 'Depts', width: '90px', align: 'right',
      formatter: (_v: any, row: any) => String(row?.applicableDepartments?.length ?? 0),
    },
    {
      field: 'applicableDesignations', header: 'Desigs', width: '90px', align: 'right',
      formatter: (_v: any, row: any) => String(row?.applicableDesignations?.length ?? 0),
    },
    {
      field: 'isActive', header: 'Status', width: '110px', type: 'badge',
      formatter: (v: any) => v ? 'Active' : 'Inactive',
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'edit', icon: 'pi pi-pencil', tooltip: 'Edit', variant: 'ghost',
      callback: (row) => this.router.navigate(['/hrms/shift-groups/edit', row._id]),
    },
    {
      id: 'delete', icon: 'pi pi-trash', tooltip: 'Delete', variant: 'danger',
      callback: (row) => {
        if (window.confirm(`Delete shift group "${row.name}"?`)) this.deleteGroup(row._id);
      },
    },
  ];

  ngOnInit(): void { this.getData(true); }
  applyFilters(): void { this.getData(true); }
  resetFilters(): void { this.filter = { search: '', rotationType: null, isActive: null }; this.getData(true); }
  createNew(): void { this.router.navigate(['/hrms/shift-groups/create']); }

  getData(isReset = false): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    if (isReset) { this.currentPage = 1; this.data.set([]); this.totalCount = 0; }

    const params = Object.fromEntries(
      Object.entries({ ...this.filter, page: this.currentPage, limit: this.pageSize })
        .filter(([, v]) => v !== null && v !== '')
    );

    this.hrmsService.getShiftGroups(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const newData = res.data?.shiftGroups ?? res.data?.data ?? [];
        this.totalCount = res.pagination?.totalResults ?? this.totalCount;
        this.data.update(prev => isReset ? newData : [...prev, ...newData]);
        if (newData.length > 0) this.currentPage++;
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.messageService.handleHttpError(err);
      },
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'reachedBottom' && this.data().length < this.totalCount) this.getData(false);
  }

  private deleteGroup(id: string): void {
    this.hrmsService.deleteShiftGroup(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.messageService.showSuccess('Shift group removed'); this.getData(true); },
      error: (err: any) => this.messageService.handleHttpError(err),
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
