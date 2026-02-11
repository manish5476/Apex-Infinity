import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog'; // 🟢 Added for Dialogs

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { TransactionService } from '../../../transactions/transaction.service';
import { SupplierService } from '../../services/supplier-service';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, ProgressSpinnerModule],
  templateUrl: './supplier-dashboard.html',
  styleUrl: './supplier-dashboard.scss',
})
export class SupplierDashboardComponent implements OnInit {
  // 🟢 Replaced ActivatedRoute with DynamicDialog tools
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  
  private cdr = inject(ChangeDetectorRef);
  private supplierService = inject(SupplierService);
  private transactionService = inject(TransactionService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  public common = inject(CommonMethodService);

  // State
  data = signal<any>(null);
  isError = signal<boolean>(false);
  loading = signal<boolean>(true);

  // Tab State
  activeTab = signal<'purchases' | 'payments'>('purchases');

  ngOnInit(): void {
    // 🟢 Get ID from the Dialog Config (Handling both naming conventions just in case)
    const id = this.config.data?.supplierId || this.config.data?.productId;
    
    if (!id) {
      this.isError.set(true);
      this.loading.set(false);
      return;
    }

    this.supplierService.getSupplierDashboard(id).subscribe({
      next: (res: any) => {
        if (res?.data?.data || res?.data) {
          const s = res.data.data || res.data;
          this.data.set(s);
        } else {
          this.isError.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.isError.set(true);
        this.loading.set(false);
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
}