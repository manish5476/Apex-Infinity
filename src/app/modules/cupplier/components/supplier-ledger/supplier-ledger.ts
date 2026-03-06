import { MessageService } from "primeng/api";
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SupplierService } from '../../services/supplier-service';
import { AppMessageService } from "../../../../core/services/message.service";

@Component({
  selector: 'app-supplier-ledger',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TagModule, DividerModule, ProgressSpinnerModule,CurrencyPipe, DatePipe  ],
  templateUrl: './supplier-ledger.html',
  styleUrl: './supplier-ledger.scss',
})
export class SupplierLedger implements OnInit {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private supplierService = inject(SupplierService);
  private messageService = inject(AppMessageService);

  supplierId!: string;
  loading = signal(true);
  dashboardData = signal<any>(null);
  exporting = signal(false);

  ngOnInit() {
    this.supplierId = this.config.data?.supplierId;
    if (this.supplierId) {
      this.loadLedger();
    }
  }

loadLedger() {
    this.loading.set(true);
    
    this.supplierService.getSupplierDashboard(this.supplierId).subscribe({
      next: (res) => {
        this.dashboardData.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        // Replaced the silent failure with your global error handler!
        this.messageService.handleHttpError(err);
        this.loading.set(false);
      }
    });
  }

  exportLedger() {
    this.exporting.set(true);
    
    this.supplierService.downloadSupplierLedger(this.supplierId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ledger_${this.dashboardData()?.profile?.companyName || 'Supplier'}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.exporting.set(false);
        
        // Added a success message so the user gets clear feedback that the download worked
        this.messageService.showSuccess('Ledger exported successfully.');
      },
      error: (err) => {
        // Replaced the silent failure with your global error handler!
        this.messageService.handleHttpError(err);
        this.exporting.set(false);
      }
    });
  }

  close() {
    this.ref.close();
  }
}