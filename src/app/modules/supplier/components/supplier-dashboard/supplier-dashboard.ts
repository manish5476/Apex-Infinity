import { ChangeDetectorRef, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { TransactionService } from '../../../transactions/transaction.service';
import { SupplierService } from '../../services/supplier-service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { LoadingComponent } from '@shared/ui/feedback/loading/loading.component';
import { StatusBadgeComponent } from '@shared/ui/feedback/status-badge/status-badge.component';
import { EmptyStateComponent } from '@shared/ui/feedback/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/ui/feedback/error-state/error-state.component';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, LoadingComponent, StatusBadgeComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './supplier-dashboard.html',
  styleUrl: './supplier-dashboard.scss',
})
export class SupplierDashboardComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);

  private cdr = inject(ChangeDetectorRef);
  private supplierService = inject(SupplierService);
  private transactionService = inject(TransactionService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);

  // State
  data = signal<any>(null);
  isError = signal<boolean>(false);
  loading = signal<boolean>(true);

  // Tab State
  activeTab = signal<'purchases' | 'payments'>('purchases');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const id = this.config.data?.supplierId || this.config.data?.productId;

    if (!id) {
      this.isError.set(true);
      this.loading.set(false);
      this.messageService.showError('Invalid configuration: Supplier ID is missing.');
      return;
    }

    this.loading.set(true);
    this.isError.set(false);

    this.supplierService.getSupplierDashboard(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.data?.data || res?.data) {
          const s = res.data.data || res.data;
          this.data.set(s);
        } else {
          this.isError.set(true);
          this.messageService.showError('Failed to load dashboard: Data is unavailable.');
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        this.isError.set(true);
        this.loading.set(false);
        this.messageService.showError('Error loading supplier dashboard.');
        console.error(err);
      }
    });
  }

  getSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'partial': return 'warn';
      case 'unpaid': return 'danger';
      default: return 'info';
    }
  }

  getInitials(name: string): string {
    if (!name) return 'SP';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  closeDialog() {
    this.ref.close();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}