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
import { Subject, finalize, takeUntil } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { MasterDropdownComponent } from '../../../../shared/components/masterFilterDropdown/master-dropdown.component';

import { AppMessageService } from '../../../../../core/services/message.service';
import { HRMSService } from '../../../hrms.service';
import { SearchFilterComponent } from "@shared/ui/filters/search-filter.component";
import { SelectFilterComponent } from "@shared/ui/filters/select-filter.component";

@Component({
  selector: 'app-department-list',
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
    MasterDropdownComponent,
    SearchFilterComponent,
    SelectFilterComponent
],
  template: `
    <app-page>
      <app-page-header
        title="Departments"
        subtitle="Manage organizational structure, branches, and leadership">
        <div header-right class="flex items-center gap-3">
          <app-search-filter
            [value]="deptFilter().search"
            (valueChange)="updateSearch($event)"
            placeholder="Search department or code...">
          </app-search-filter>

          <app-master-dropdown 
            endpoint="branches" 
            [ngModel]="deptFilter().branchId" 
            (ngModelChange)="updateBranch($event)" 
            placeholder="All Branches">
          </app-master-dropdown>

          <app-select-filter
            [options]="statusOptions"
            [value]="deptFilter().isActive"
            (valueChange)="updateStatus($event)"
            placeholder="Status">
          </app-select-filter>

          <p-button icon="pi pi-times" [text]="true" severity="secondary"
            pTooltip="Reset Filters" (onClick)="resetFilters()">
          </p-button>

          <div class="w-px h-8 bg-[var(--border-primary)] mx-1"></div>

          <span class="total-badge">{{ totalCount() }} Records</span>
          <p-button label="Add Department" icon="pi pi-plus" (onClick)="createNew()"></p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
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
    .total-badge { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--text-secondary); background: var(--bg-secondary); border: 1px solid var(--border-primary); padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--ui-border-radius); }
  `]
})
export class DepartmentListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);

  private currentPage = 1;
  private readonly pageSize = 50;

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);
  readonly totalCount = signal(0);

  readonly deptFilter = signal({
    search: '',
    branchId: null as string | null,
    isActive: null as boolean | null,
  });

  readonly statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  readonly columns: GridColumn[] = [
    { field: 'name', header: 'Department', minWidth: '220px', sortable: true },
    { field: 'code', header: 'Code', width: '130px', formatter: (v: any) => v || 'N/A' },
    {
      field: 'branchId.name', header: 'Branch', width: '180px',
      formatter: (_v: any, row: any) => row?.branchId?.name || 'Head Office',
    },
    {
      field: 'headOfDepartment.name', header: 'Head of Dept', width: '200px',
      formatter: (_v: any, row: any) => row?.headOfDepartment?.name || 'Unassigned',
    },
    {
      field: 'isActive', header: 'Status', width: '120px', type: 'badge',
      formatter: (v: any) => v ? 'Active' : 'Inactive',
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view', icon: 'pi pi-eye', tooltip: 'View Details', variant: 'primary',
      callback: (row) => this.router.navigate(['/hrms/department/details', row._id]),
    },
    {
      id: 'edit', icon: 'pi pi-pencil', tooltip: 'Edit', variant: 'ghost',
      callback: (row) => this.router.navigate(['/hrms/department/edit', row._id]),
    },
  ];

  ngOnInit(): void {
    this.getData(true);
  }

  updateSearch(val: string): void {
    this.deptFilter.update(f => ({ ...f, search: val }));
    this.getData(true);
  }

  updateBranch(val: string | null): void {
    this.deptFilter.update(f => ({ ...f, branchId: val }));
    this.getData(true);
  }

  updateStatus(val: boolean | null): void {
    this.deptFilter.update(f => ({ ...f, isActive: val }));
    this.getData(true);
  }

  resetFilters(): void {
    this.deptFilter.set({ search: '', branchId: null, isActive: null });
    this.getData(true);
  }

  createNew(): void {
    this.router.navigate(['/hrms/department/new']);
  }

  getData(isReset = false): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    if (isReset) {
      this.currentPage = 1;
      this.data.set([]);
    }

    const raw = { ...this.deptFilter(), page: this.currentPage, limit: this.pageSize };
    const params = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null && v !== ''));

    this.hrmsService.getDepartments(params).pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        const newData = Array.isArray(res.data) ? res.data : (res.data?.departments ?? res.data?.data ?? []);
        this.totalCount.set(res.pagination?.totalResults ?? res.total ?? (Array.isArray(res.data) ? res.data.length : 0));
        this.data.update(prev => isReset ? newData : [...prev, ...newData]);
        if (newData.length > 0) this.currentPage++;
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'cellClicked') {
      this.router.navigate(['/hrms/department/details', event.row._id]);
    } else if (event.type === 'reachedBottom') {
      if (this.data().length < this.totalCount()) {
        this.getData(false);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
