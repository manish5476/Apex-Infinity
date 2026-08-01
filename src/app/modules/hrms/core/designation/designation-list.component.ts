import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, take } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-designation-list',
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
        title="Designations"
        subtitle="Manage job titles, levels, and organizational grades">
        <div header-right class="flex items-center gap-3">
          <span class="total-badge">{{ totalCount() }} Records</span>
          <p-button
            label="Add Designation"
            icon="pi pi-plus"
            (onClick)="createNew()">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <!-- Filter Toolbar -->
        <div class="filter-toolbar">
          <div class="filter-toolbar__search">
            <input
              type="text"
              pInputText
              [ngModel]="filters().search"
              (ngModelChange)="updateSearch($event)"
              placeholder="Title or Code..." />
          </div>
          <div class="filter-toolbar__filters">
            <p-select
              [options]="gradeOptions"
              [ngModel]="filters().grade"
              (ngModelChange)="updateGrade($event)"
              [showClear]="true"
              placeholder="Grade">
            </p-select>
            <p-select
              [options]="statusOptions"
              [ngModel]="filters().isActive"
              (ngModelChange)="updateStatus($event)"
              [showClear]="true"
              placeholder="Status">
            </p-select>
            <p-button
              icon="pi pi-times"
              [text]="true"
              severity="secondary"
              pTooltip="Reset"
              (onClick)="resetFilters()">
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
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
    }

    .total-badge {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--text-secondary);
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius);
    }

    .filter-toolbar {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
      margin-bottom: var(--spacing-md);

      &__search {
        min-width: 220px;
        max-width: 320px;
        flex: 1;
      }

      &__filters {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        flex-wrap: wrap;
        flex: 1;
      }
    }
  `]
})
export class DesignationListComponent implements OnInit {
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);

  readonly data = signal<any[]>([]);
  readonly totalCount = signal(0);
  readonly isLoading = signal(false);
  private currentPage = 1;
  private readonly pageSize = 50;

  readonly filters = signal({
    search: '',
    grade: null as string | null,
    isActive: null as boolean | null,
  });

  readonly gradeOptions = [
    { label: 'Grade A', value: 'A' }, { label: 'Grade B', value: 'B' },
    { label: 'Grade C', value: 'C' }, { label: 'Grade D', value: 'D' },
    { label: 'Grade E', value: 'E' }, { label: 'Grade F', value: 'F' },
  ];

  readonly statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  readonly columns: GridColumn[] = [
    {
      field: 'title',
      header: 'Title',
      minWidth: '250px',
      sortable: true,
    },
    {
      field: 'code',
      header: 'Code',
      width: '120px',
      formatter: (val: any) => val || '—',
    },
    {
      field: 'grade',
      header: 'Grade',
      width: '100px',
      type: 'badge',
    },
    {
      field: 'isActive',
      header: 'Status',
      width: '120px',
      type: 'badge',
      formatter: (val: any) => (val ? 'Active' : 'Inactive'),
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      tooltip: 'View Details',
      variant: 'primary',
      callback: (row) => this.router.navigate(['/hrms/designation/details', row._id]),
    },
    {
      id: 'edit',
      icon: 'pi pi-pencil',
      tooltip: 'Edit',
      variant: 'ghost',
      callback: (row) => this.router.navigate(['/hrms/designation/edit', row._id]),
    },
    {
      id: 'delete',
      icon: 'pi pi-trash',
      tooltip: 'Delete',
      variant: 'danger',
      callback: (row) => {
        if (confirm(`Delete ${row.title}?`)) this.deleteDesignation(row._id);
      },
    },
  ];

  ngOnInit(): void {
    this.loadData(true);
  }

  updateSearch(val: string): void {
    this.filters.update(f => ({ ...f, search: val }));
    this.currentPage = 1;
    this.loadData(true);
  }

  updateGrade(val: string | null): void {
    this.filters.update(f => ({ ...f, grade: val }));
    this.currentPage = 1;
    this.loadData(true);
  }

  updateStatus(val: boolean | null): void {
    this.filters.update(f => ({ ...f, isActive: val }));
    this.currentPage = 1;
    this.loadData(true);
  }

  resetFilters(): void {
    this.filters.set({ search: '', grade: null, isActive: null });
    this.currentPage = 1;
    this.loadData(true);
  }

  createNew(): void {
    this.router.navigate(['/hrms/designation/new']);
  }

  loadData(isReset = true): void {
    this.isLoading.set(true);
    const rawParams = {
      ...this.filters(),
      page: this.currentPage,
      limit: this.pageSize,
    };
    const params = Object.fromEntries(
      Object.entries(rawParams).filter(([, v]) => v !== null && v !== '')
    );

    this.hrmsService.getDesignations(params).pipe(
      finalize(() => this.isLoading.set(false)),
      catchError(err => {
        this.messageService.handleHttpError(err);
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const newData = res.data?.designations ?? res.data?.data ?? [];
        this.totalCount.set(res.pagination?.totalResults ?? res.total ?? newData.length);
        this.data.set(isReset ? newData : [...this.data(), ...newData]);
      }
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'cellClicked') {
      this.router.navigate(['/hrms/designation/details', event.row._id]);
    }
    if (event.type === 'reachedBottom' && this.data().length < this.totalCount()) {
      this.currentPage++;
      this.loadData(false);
    }
  }

  private deleteDesignation(id: string): void {
    this.hrmsService.deleteDesignation(id).pipe(take(1)).subscribe({
      next: () => { this.messageService.showSuccess('Deleted'); this.loadData(true); },
      error: (err: any) => this.messageService.handleHttpError(err),
    });
  }
}