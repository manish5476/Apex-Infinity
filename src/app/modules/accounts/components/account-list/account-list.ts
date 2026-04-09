import { AppMessageService } from './../../../../core/services/message.service';
import { Component, OnInit, inject, signal, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
// Services
import { AccountService } from '../../accounts';
import { MessageService } from 'primeng/api';

// Shared Components
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, AgShareGrid],
  providers: [MessageService, DecimalPipe],
  templateUrl: './account-list.html',
  styleUrls: ['./account-list.scss']
})
export class AccountListComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  // Dependencies
  private accountService = inject(AccountService);
  private messageService = inject(AppMessageService);
  private cdr = inject(ChangeDetectorRef);
  private decimalPipe = inject(DecimalPipe);

  // Grid State
  data: any[] = [];
  column: any[] = [];
  isLoading = false;

  readonly accountActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    viewPermission: PERMISSIONS.ACCOUNT.READ,
  };

  ngOnInit(): void {
    this.setupColumns();
    this.loadAccounts();
  }

  setupColumns(): void {
    this.column = [
      { field: 'code', headerName: 'Code', width: 120, sortable: true, filter: true, pinned: 'left', cellStyle: { 'font-weight': '600', 'color': 'var(--text-primary)' } },
      { field: 'name', headerName: 'Account Name', flex: 1, minWidth: 200, sortable: true, filter: true },
      { field: 'type', headerName: 'Type', width: 150, sortable: true, filter: true, valueFormatter: (p: any) => p.value ? p.value.toUpperCase() : '', cellStyle: { 'text-transform': 'capitalize' } },
      { field: 'debitTotal', headerName: 'Debit', width: 140, type: 'numericColumn', valueFormatter: (p: any) => this.formatCurrency(p.value), cellStyle: { 'color': 'var(--text-secondary)' } },
      { field: 'creditTotal', headerName: 'Credit', width: 140, type: 'numericColumn', valueFormatter: (p: any) => this.formatCurrency(p.value), cellStyle: { 'color': 'var(--text-secondary)' } },
      {
        field: 'balance', headerName: 'Balance', width: 150, type: 'numericColumn', valueFormatter: (p: any) => this.formatCurrency(p.value), cellStyle: (params: any) => {
          const bal = params.value || 0;
          return {
            'font-weight': '700',
            'color': bal < 0 ? '#dc2626' : 'var(--text-primary)'
          };
        }
      }
    ];
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.accountService.getAccounts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load accounts', err);
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      }
    });
  }

  // Helper: Format Currency (₹ 1,234.00)
  private formatCurrency(value: number): string {
    if (value === undefined || value === null) return '-';
    // Using Angular DecimalPipe for consistent formatting
    return this.decimalPipe.transform(value, '1.2-2') || '0.00';
  }

  handleGridEvent(_event: any) {}

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
