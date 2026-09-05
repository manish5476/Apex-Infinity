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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    TooltipModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
  ],
  template: `
    <app-page>
      <app-page-header
        title="Biometric Machines"
        subtitle="Manage attendance devices, connection status, and sync logs">
        <div header-right class="flex items-center gap-3">
          <p-button
            icon="pi pi-refresh"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            [loading]="isLoading()"
            (onClick)="getData()">
          </p-button>
          <p-button
            label="Add Device"
            icon="pi pi-plus"
            (onClick)="createNew()">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <div class="flex flex-row flex-wrap items-end gap-3 p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl shadow-xs w-full mb-3">
          <div class="flex flex-col gap-1.5 flex-[1.5] min-w-[200px]">
            <label class="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider pl-0.5">Search</label>
            <p-iconField iconPosition="left" class="w-full relative flex items-center">
              <p-inputIcon styleClass="pi pi-search text-[var(--text-tertiary)] text-xs"></p-inputIcon>
              <input type="text" pInputText
                [(ngModel)]="filter.search"
                (keydown.enter)="applyFilters()"
                (blur)="applyFilters()"
                placeholder="Name, Serial or IP..."
                class="w-full h-[38px] text-sm pl-8 pr-3 rounded-lg bg-[var(--bg-primary)] border-[var(--border-secondary)]" />
            </p-iconField>
          </div>

          <div class="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label class="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider pl-0.5">Connection</label>
            <p-select
              [options]="connectionOptions"
              [(ngModel)]="filter.connectionStatus"
              [showClear]="true"
              placeholder="All Connections"
              appendTo="body"
              styleClass="w-full h-[38px] text-sm rounded-lg"
              (onChange)="applyFilters()">
            </p-select>
          </div>

          <div class="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label class="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider pl-0.5">State</label>
            <p-select
              [options]="statusOptions"
              [(ngModel)]="filter.status"
              [showClear]="true"
              placeholder="All States"
              appendTo="body"
              styleClass="w-full h-[38px] text-sm rounded-lg"
              (onChange)="applyFilters()">
            </p-select>
          </div>

          <div class="flex items-center gap-2 pb-0.5 ml-auto">
            <p-button
              icon="pi pi-filter-slash"
              label="Reset"
              [text]="true"
              severity="secondary"
              pTooltip="Reset Filters"
              styleClass="h-[38px] px-3 text-sm rounded-lg"
              (onClick)="resetFilters()">
            </p-button>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-hidden">
          <app-data-grid
            [columns]="columns"
            [data]="data()"
            [loading]="isLoading()"
            [rowActions]="rowActions"
            (gridEvent)="eventFromGrid($event)">
          </app-data-grid>
        </div>
      </app-page-content>
    </app-page>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; height: 100%; }
  `]
})
export class MachineListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);

  filter: { search: string; connectionStatus: string | null; status: string | null } = {
    search: '', connectionStatus: null, status: null,
  };

  readonly connectionOptions = [
    { label: 'Online', value: 'online' },
    { label: 'Offline', value: 'offline' },
    { label: 'Connecting', value: 'connecting' },
  ];
  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Maintenance', value: 'maintenance' },
  ];

  readonly columns: GridColumn[] = [
    { field: 'name', header: 'Name', minWidth: '200px', sortable: true },
    { field: 'serialNumber', header: 'Serial #', width: '140px' },
    {
      field: 'branchId.name', header: 'Branch', width: '150px',
      formatter: (_v: any, row: any) => row?.branchId?.name || '—',
    },
    { field: 'providerType', header: 'Provider', width: '120px', formatter: (v: any) => v || '—' },
    { field: 'ipAddress', header: 'IP Address', width: '140px', formatter: (v: any) => v || '—' },
    { field: 'connectionStatus', header: 'Connection', width: '130px', type: 'badge' },
    { field: 'status', header: 'State', width: '120px', type: 'badge' },
    {
      field: 'lastSyncAt', header: 'Last Sync', width: '150px',
      formatter: (v: any) => v ? new Date(v).toLocaleString() : 'Never',
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view', icon: 'pi pi-eye', tooltip: 'View', variant: 'primary',
      callback: (row) => this.router.navigate(['/hrms/attendance/machines/details', row._id]),
    },
    {
      id: 'edit', icon: 'pi pi-pencil', tooltip: 'Edit', variant: 'ghost',
      callback: (row) => this.router.navigate(['/hrms/attendance/machines/edit', row._id]),
    },
    {
      id: 'delete', icon: 'pi pi-trash', tooltip: 'Delete', variant: 'danger',
      callback: (row) => this.deleteMachine(row._id, row.name),
    },
  ];

  ngOnInit(): void { this.getData(); }
  applyFilters(): void { this.getData(); }
  resetFilters(): void { this.filter = { search: '', connectionStatus: null, status: null }; this.getData(); }
  createNew(): void { this.router.navigate(['/hrms/attendance/machines/new']); }

  getData(): void {
    this.isLoading.set(true);
    this.hrmsService.getMachines(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data.set(res.data?.machines ?? res.data ?? []);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.isLoading.set(false),
    });
  }

  eventFromGrid(event: any): void {
    const id = event?.row?._id;
    if (event.type === 'cellClicked') this.router.navigate(['/hrms/attendance/machines/details', id]);
  }

  deleteMachine(id: string, name: string): void {
    if (confirm(`Delete machine ${name}?`)) {
      this.hrmsService.deleteMachine(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.messageService.showSuccess('Machine removed'); this.getData(); },
        error: (err: any) => this.messageService.handleHttpError(err),
      });
    }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}