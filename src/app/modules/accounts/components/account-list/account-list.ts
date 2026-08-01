import { AppMessageService } from './../../../../core/services/message.service';
import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { DecimalPipe, CurrencyPipe } from '@angular/common';

// Services
import { AccountService } from '../../accounts';
import { MessageService } from 'primeng/api';

// Shared Components
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageComponent } from '@shared/ui/layout/page/page.component';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [DataGridComponent, PageComponent, PageHeaderComponent, PageContentComponent],
  providers: [MessageService, DecimalPipe, CurrencyPipe],
  templateUrl: './account-list.html',
  styleUrls: ['./account-list.scss'],
})
export class AccountListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // ── DI ──────────────────────────────────────────────────────────────────
  private accountService = inject(AccountService);
  private messageService = inject(AppMessageService);
  private cdr = inject(ChangeDetectorRef);
  private decimalPipe = inject(DecimalPipe);

  // ── Grid State ───────────────────────────────────────────────────────────
  data: any[] = [];
  column: GridColumn[] = [];
  isLoading = false;

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.column = this.buildColumns();
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Data
  // ─────────────────────────────────────────────────────────────────────────
  loadAccounts(): void {
    this.isLoading = true;
    this.accountService
      .getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.data = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.isLoading = false;
          this.messageService.handleHttpError(err);
          this.cdr.markForCheck();
        },
      });
  }

  handleGridEvent(_event: any) { }

  // ─────────────────────────────────────────────────────────────────────────
  // Column Definitions
  // ─────────────────────────────────────────────────────────────────────────
  private buildColumns(): GridColumn[] {
    return [
      {
        field: 'code',
        header: 'Code',
        width: '100px',
        sortable: true,
        filterable: true,
        pinned: 'left',
        formatter: (val: any) => val || '—'
      },
      {
        field: 'name',
        header: 'Account Name',
        type: 'user',
        width: '1fr',
        minWidth: '220px',
        sortable: true,
        filterable: true
      },
      {
        field: 'type',
        header: 'Type',
        type: 'badge',
        width: '130px',
        sortable: true,
        filterable: true
      },
      {
        field: 'parent',
        header: 'Parent',
        width: '150px',
        sortable: false,
        formatter: (val: any, row: any) => row.parent?.name || 'Root account'
      },
      {
        field: 'debitTotal',
        header: 'Debit',
        type: 'currency',
        currencyCode: 'INR',
        width: '148px',
        sortable: true,
        align: 'right'
      },
      {
        field: 'creditTotal',
        header: 'Credit',
        type: 'currency',
        currencyCode: 'INR',
        width: '148px',
        sortable: true,
        align: 'right'
      },
      {
        field: 'balance',
        header: 'Balance',
        type: 'currency',
        currencyCode: 'INR',
        width: '160px',
        sortable: true,
        align: 'right'
      },
      {
        field: 'cachedBalance',
        header: 'Cached Balance',
        type: 'currency',
        currencyCode: 'INR',
        width: '160px',
        sortable: true,
        align: 'right'
      }
    ];
  }
}