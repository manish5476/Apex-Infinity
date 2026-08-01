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
import { DataGridComponent, GridColumn } from '../../../../shared/ui/grid';
import { PageComponent } from '../../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../../shared/ui/layout/page-content/page-content.component';
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
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
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
  currentPage = 1;
  isLoading = false;
  totalCount = 0;
  private pageSize = 50;

  data: any[] = [];
  column: GridColumn[] = [];
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

  onRowClick(row: any) {
    const branchId = row._id;
    if (branchId) {
      this.router.navigate([branchId], { relativeTo: this.route });
    }
  }

  onScrolledToBottom() {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'name',
        header: 'Branch Name',
        width: '1fr',
        minWidth: '200px'
      },
      { field: 'branchCode', header: 'Code', width: '120px' },
      {
        field: 'address',
        header: 'City',
        width: '150px',
        formatter: (val, row) => row.address?.city || '-'
      },
      {
        field: 'phoneNumber',
        header: 'Phone',
        width: '150px'
      },
      {
        header: 'Status',
        field: 'isActive',
        width: '120px',
        type: 'status',
        formatter: (val) => val ? 'active' : 'inactive'
      }
    ];
    this.cdr.detectChanges();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}