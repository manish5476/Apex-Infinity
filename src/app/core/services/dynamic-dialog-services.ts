import { Injectable, inject } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

// Note & Analytics Components
import { NoteExportDialogComponent } from '../../modules/notes/note-export.dialog';
import { NoteLinkDialogComponent } from '../../modules/notes/note-link.dialog';
import { AnalyticsDashboardComponent } from '../../modules/notes/analytics/analytics-dashboard.component';

// Supplier Components
import { SupplierKyc } from '../../modules/cupplier/components/supplier-kyc/supplier-kyc';
import { SupplierLedger } from '../../modules/cupplier/components/supplier-ledger/supplier-ledger';
import { SupplierDashboardComponent } from '../../modules/cupplier/components/supplier-dashboard/supplier-dashboard';

// Product Components
import { ProductHistoryComponent } from '../../modules/product/components/product-history/product-history';
import { StockAdjustmentComponent } from '../../modules/product/components/stock-adjustment/stock-adjustment';
import { StockTransferComponent } from '../../modules/product/components/stoct-transfer/stoct-transfer';
import { UserExportDialogComponent } from '../../modules/user/user-export/user-export-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DynamicDialogServices {
  private dialogService = inject(DialogService);

  // Default config for consistent UI across the app
  // We use showHeader: false by default for cleaner "glass" look on smaller modals
  private get defaultConfig() {
    return {
      width: '400px',
      styleClass: 'pro-dialog glass-panel',
      contentStyle: { overflow: 'visible', padding: '0' },
      baseZIndex: 10000,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      showHeader: false,
    };
  }

  // ==========================================
  // NOTE & DATA DIALOGS
  // ==========================================

  openNoteExport(): DynamicDialogRef | null {
    return this.dialogService.open(NoteExportDialogComponent, {
      ...this.defaultConfig,
      header: 'Export Data',
      showHeader: true, // Enable header for this utility
      width: '500px',
      data: {}
    });
  }

  openNoteLinkDialog(sourceNoteId: string): DynamicDialogRef | null {
    return this.dialogService.open(NoteLinkDialogComponent, {
      ...this.defaultConfig,
      width: '600px',
      height: 'auto',
      header: 'Link Note',
      showHeader: true,
      contentStyle: { overflow: 'visible', padding: '1.5rem' },
      data: { sourceNoteId }
    });
  }

  /**
   * Opens the Analytics Dashboard in a high-fidelity modal
   * Configured for 85% width / 80% height with maximize capabilities
   */
  openAnalyticsDialog(): DynamicDialogRef | null {
    return this.dialogService.open(AnalyticsDashboardComponent, {
      header: 'Workspace Analytics', // Native header for window controls
      width: '85%',
      height: '80%',
      styleClass: 'analytics-dialog glass-panel', // Ensure glass-panel class is applied for backdrop/blur
      contentStyle: {
        overflow: 'hidden',  // Hide dialog scroll, let component handle internal scrolling
        padding: '0',        // Full bleed content
        'border-bottom-left-radius': '12px',
        'border-bottom-right-radius': '12px'
      },
      maximizable: true,     // Allow users to go full screen
      baseZIndex: 10000,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      data: {}
    });
  }

  // ==========================================
  // SUPPLIER DIALOGS
  // ==========================================

  openSupplierLedger(supplierId: string): DynamicDialogRef | null {
    return this.dialogService.open(SupplierLedger, {
      header: 'Supplier Ledger & Statement',
      width: '85vw',
      styleClass: 'enterprise-dialog',
      contentStyle: { overflow: 'auto', padding: '1.5rem' },
      baseZIndex: 10000,
      maximizable: true,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      data: { supplierId }
    });
  }

  openSupplierKyc(supplierId: string): DynamicDialogRef | null {
    return this.dialogService.open(SupplierKyc, {
      header: 'KYC & Compliance Documents',
      width: '60vw',
      styleClass: 'enterprise-dialog',
      contentStyle: { overflow: 'auto', padding: '1.5rem' },
      baseZIndex: 10000,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      data: { supplierId }
    });
  }

  openSupplierDashboard(product: any): DynamicDialogRef | null {
    return this.dialogService.open(SupplierDashboardComponent, {
      header: `Supplier Dashboard: ${product.name}`,
      width: '90vw',
      height: '90vh',
      styleClass: 'enterprise-dialog',
      contentStyle: { overflow: 'auto', padding: '1.5rem' },
      baseZIndex: 10000,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      data: { productId: product._id }
    });
  }

  // ==========================================
  // PRODUCT & INVENTORY DIALOGS
  // ==========================================

  openProductHistory(product: any): DynamicDialogRef | null {
    return this.dialogService.open(ProductHistoryComponent, {
      header: `Product History: ${product.name}`,
      width: '80vw',
      styleClass: 'enterprise-dialog',
      contentStyle: { overflow: 'visible', padding: '1.5rem' },
      baseZIndex: 10000,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      data: { productId: product._id }
    });
  }

  openStockAdjustment(product: any): DynamicDialogRef | null {
    return this.dialogService.open(StockAdjustmentComponent, {
      header: `Adjust Stock: ${product.name}`,
      width: '80vw',
      styleClass: 'enterprise-dialog',
      contentStyle: { overflow: 'visible', padding: '1.5rem' },
      baseZIndex: 10000,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      data: { id: product._id }
    });
  }

  openStockTransfer(product: any): DynamicDialogRef | null {
    return this.dialogService.open(StockTransferComponent, {
      header: `Transfer Stock: ${product.name}`,
      width: '80vw',
      styleClass: 'enterprise-dialog',
      contentStyle: { overflow: 'visible', padding: '1.5rem' },
      baseZIndex: 10000,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      data: { id: product._id }
    });
  }

  // ==========================================
  // USER DIALOGS
  // ==========================================

  openUserExport(): DynamicDialogRef | null {
    return this.dialogService.open(UserExportDialogComponent, {
      ...this.defaultConfig,
      header: 'Export User Data',
      showHeader: true,
      width: '500px',
      data: {}
    });
  }
}