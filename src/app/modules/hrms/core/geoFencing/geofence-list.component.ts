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
  selector: 'app-geofence-list',
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
        title="Geofences"
        subtitle="Manage location-based attendance boundaries">
        <div header-right class="flex items-center gap-3">
          <p-button
            icon="pi pi-refresh"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            [loading]="isLoading()"
            (onClick)="getData()">
          </p-button>
          <p-button label="New Geofence" icon="pi pi-plus" (onClick)="createNew()"></p-button>
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
            <p-select [options]="typeOptions" [(ngModel)]="filter.type"
              [showClear]="true" placeholder="Type" (onChange)="applyFilters()">
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
export class GeofenceListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);

  filter: { search: string; type: string | null; isActive: boolean | null } = {
    search: '', type: null, isActive: null,
  };

  readonly typeOptions = [
    { label: 'Circular', value: 'circle' },
    { label: 'Polygon', value: 'polygon' },
    { label: 'Building', value: 'building' },
  ];
  readonly statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  readonly columns: GridColumn[] = [
    { field: 'name', header: 'Name', minWidth: '220px', sortable: true },
    { field: 'code', header: 'Code', width: '120px', formatter: (v: any) => v || '—' },
    { field: 'type', header: 'Type', width: '120px', type: 'badge' },
    {
      field: 'radius', header: 'Radius', width: '100px', align: 'right',
      formatter: (v: any) => v ? `${v}m` : '—',
    },
    {
      field: 'applicableToAll', header: 'Applies To', width: '160px',
      formatter: (val: any, row: any) =>
        val ? 'All Employees' : `${row?.applicableDepartments?.length ?? 0} Depts`,
    },
    {
      field: 'isActive', header: 'Status', width: '120px', type: 'badge',
      formatter: (v: any) => (v ? 'Active' : 'Inactive'),
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view', icon: 'pi pi-eye', tooltip: 'View', variant: 'primary',
      callback: (row) => this.router.navigate(['/hrms/geofence/details', row._id]),
    },
    {
      id: 'edit', icon: 'pi pi-pencil', tooltip: 'Edit', variant: 'ghost',
      callback: (row) => this.router.navigate(['/hrms/geofence/edit', row._id]),
    },
    {
      id: 'delete', icon: 'pi pi-trash', tooltip: 'Delete', variant: 'danger',
      callback: (row) => this.deleteFence(row._id, row.name),
    },
  ];

  ngOnInit(): void { this.getData(); }
  applyFilters(): void { this.getData(); }
  resetFilters(): void { this.filter = { search: '', type: null, isActive: null }; this.getData(); }
  createNew(): void { this.router.navigate(['/hrms/geofence/new']); }

  getData(): void {
    this.isLoading.set(true);
    this.hrmsService.getGeoFences(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data.set(res.data?.geofences ?? res.data ?? []);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.isLoading.set(false),
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'cellClicked') {
      this.router.navigate(['/hrms/geofence/details', event.row._id]);
    }
  }

  deleteFence(id: string, name: string): void {
    if (confirm(`Delete Geofence ${name}?`)) {
      this.hrmsService.deleteGeoFence(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.messageService.showSuccess('Geofence removed'); this.getData(); },
        error: (err: any) => this.messageService.handleHttpError(err),
      });
    }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
