import { ChangeDetectorRef, Component, OnInit, inject, OnDestroy } from '@angular/core';

import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { AppMessageService } from '../../../../core/services/message.service';
import { BranchService } from '../../services/branch-service';
import { Toast } from "primeng/toast";
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    Toast,
    AgShareGrid,
    HasPermissionDirective
],
  templateUrl: './branch-list.html',
  styleUrl: './branch-list.scss',
})
export class BranchListComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private cdr = inject(ChangeDetectorRef);
  private branchService = inject(BranchService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;

  data: any[] = [];
  column: any = [];
  branchFilter = { name: '' };

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.branchFilter.name = '';
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading && !isReset) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.branchFilter.name.trim()) {
      params.search = this.branchFilter.name.trim();
    }

    this.branchService.getAllBranches(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        // Correctly access nested data from Factory response
        const newData = res.data?.data || [];

        // Correctly handle pagination totals
        this.totalCount = res.pagination.totalResults;

        this.data = isReset ? newData : [...this.data, ...newData];

        if (newData.length > 0) {
          this.currentPage++;
        }

        this.isLoading = false;
        this.cdr.detectChanges(); // Vital for async updates
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.handleHttpError(err);
        this.cdr.detectChanges();
      }
    });
  }

  onScrolledToBottom() {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    console.log(event);
    if (event.type === 'cellClicked' && event.field === 'name') {
      const branchId = event.row._id;
      if (branchId) {
        this.router.navigate([branchId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom();
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'name',
        headerName: 'Branch Name',
        flex: 1,
        minWidth: 200,
        cellStyle: {
          'color': 'var(--accent-primary)',
          'font-weight': '600',
          'cursor': 'pointer'
        }
      },
      { field: 'branchCode', headerName: 'Code', width: 120 },
      {
        headerName: 'City',
        valueGetter: (p: any) => p.data.address?.city || '-'
      },
      {
        field: 'phoneNumber',
        headerName: 'Phone',
        width: 150
      },
      {
        headerName: 'Status',
        field: 'isActive',
        width: 120,
        cellRenderer: (params: any) => {
          const status = params.value ? 'active' : 'inactive';
          const badgeClass = params.value ? 'badge-brand' : 'badge-unit';
          return `
            <div class="badge-wrapper">
              <span class="pill-badge ${badgeClass}">${status}</span>
            </div>`;
        }
      }
    ];
    this.cdr.detectChanges();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}