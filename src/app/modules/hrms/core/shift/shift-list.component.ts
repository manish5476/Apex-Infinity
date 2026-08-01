import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';
import { SearchFilterComponent } from "@shared/ui/filters/search-filter.component";
import { SelectFilterComponent } from "@shared/ui/filters/select-filter.component";

@Component({
  selector: 'app-shift-list',
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
    SearchFilterComponent,
    SelectFilterComponent,
    PageContentComponent
],
  template: `
    <app-page>
      <app-page-header
        title="Shift Management"
        subtitle="View, filter, and manage organizational shift configurations">
        <div header-right class="flex items-center gap-3">
          <app-search-filter
            [value]="shiftFilter().search"
            (valueChange)="onSearchChange($event)"
            placeholder="Search shifts...">
          </app-search-filter>

          <app-select-filter
            [options]="typeOptions"
            [value]="shiftFilter().shiftType"
            (valueChange)="updateFilter('shiftType', $event)"
            placeholder="Type">
          </app-select-filter>

          <app-select-filter
            [options]="statusOptions"
            [value]="shiftFilter().isActive"
            (valueChange)="updateFilter('isActive', $event)"
            placeholder="Status">
          </app-select-filter>

          <p-button icon="pi pi-times" [text]="true" severity="secondary"
            pTooltip="Reset" (onClick)="resetFilters()">
          </p-button>

          <div class="w-px h-8 bg-[var(--border-primary)] mx-1"></div>

          <span class="total-badge">{{ totalCount() }} Shifts</span>
          <p-button label="Add Shift" icon="pi pi-plus" (onClick)="createNew()"></p-button>
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
export class ShiftListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);
  private readonly searchSubject = new Subject<string>();

  private currentPage = 1;
  private readonly pageSize = 50;

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);
  readonly totalCount = signal(0);

  readonly shiftFilter = signal({
    search: '',
    shiftType: null as string | null,
    isActive: null as boolean | null,
  });

  readonly typeOptions = [
    { label: 'Fixed', value: 'fixed' },
    { label: 'Rotating', value: 'rotating' },
    { label: 'Flexible', value: 'flexi' },
    { label: 'Split', value: 'split' },
    { label: 'Night', value: 'night' },
  ];
  readonly statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  readonly columns: GridColumn[] = [
    { field: 'name', header: 'Shift Name', minWidth: '220px', sortable: true },
    { field: 'code', header: 'Code', width: '120px', formatter: (v: any) => v || '—' },
    {
      field: 'startTime', header: 'Timing', width: '160px',
      formatter: (_v: any, row: any) => row ? `${row.startTime} → ${row.endTime}` : '—',
    },
    { field: 'shiftType', header: 'Type', width: '120px', type: 'badge' },
    {
      field: 'isNightShift', header: 'Night', width: '90px',
      formatter: (v: any) => v ? 'Yes' : 'No',
    },
    {
      field: 'isActive', header: 'Status', width: '110px', type: 'badge',
      formatter: (v: any) => v ? 'Active' : 'Inactive',
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view', icon: 'pi pi-eye', tooltip: 'Details', variant: 'primary',
      callback: (row) => this.router.navigate(['/hrms/shifts/details', row._id]),
    },
    {
      id: 'edit', icon: 'pi pi-pencil', tooltip: 'Edit', variant: 'ghost',
      callback: (row) => this.router.navigate(['/hrms/shifts/edit', row._id]),
    },
    {
      id: 'delete', icon: 'pi pi-trash', tooltip: 'Delete', variant: 'danger',
      callback: (row) => {
        if (window.confirm(`Delete shift "${row.name}"?`)) this.deleteShift(row._id);
      },
    },
  ];

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(term => {
      this.shiftFilter.update(f => ({ ...f, search: term }));
      this.getData(true);
    });
    this.getData(true);
  }

  onSearchChange(value: string): void {
    this.shiftFilter.update(f => ({ ...f, search: value }));
    this.searchSubject.next(value);
  }

  updateFilter(key: 'shiftType' | 'isActive', value: any): void {
    this.shiftFilter.update(f => ({ ...f, [key]: value }));
    this.getData(true);
  }

  resetFilters(): void {
    this.shiftFilter.set({ search: '', shiftType: null, isActive: null });
    this.getData(true);
  }

  createNew(): void { this.router.navigate(['/hrms/shifts/new']); }

  getData(isReset = false): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    if (isReset) { this.currentPage = 1; this.data.set([]); this.totalCount.set(0); }

    const raw = { ...this.shiftFilter(), page: this.currentPage, limit: this.pageSize };
    const params = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null && v !== ''));

    this.hrmsService.getShifts(params).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res: any) => {
        const newData = res.data?.shifts ?? res.data?.data ?? res.data ?? [];
        this.totalCount.set(res.pagination?.totalResults ?? res.total ?? newData.length);
        this.data.update(prev => isReset ? newData : [...prev, ...newData]);
        if (newData.length > 0) this.currentPage++;
      },
      error: (err: any) => this.messageService.handleHttpError(err),
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'cellClicked') this.router.navigate(['/hrms/shifts/details', event.row._id]);
    if (event.type === 'reachedBottom' && this.data().length < this.totalCount()) this.getData(false);
  }

  private deleteShift(id: string): void {
    this.hrmsService.deleteShift(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.messageService.showSuccess('Shift removed successfully'); this.getData(true); },
      error: (err: any) => this.messageService.handleHttpError(err),
    });
  }
}
