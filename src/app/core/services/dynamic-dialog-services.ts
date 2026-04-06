import { Injectable, inject } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';

// Note & Analytics Components
import { NoteExportDialogComponent } from '../../modules/notes/note-export.dialog';
import { NoteLinkDialogComponent } from '../../modules/notes/note-link.dialog';
import { AnalyticsDashboardComponent } from '../../modules/notes/analytics/analytics-dashboard.component';

// Supplier Components
import { SupplierKyc } from '../../modules/supplier/components/supplier-kyc/supplier-kyc';
import { SupplierLedger } from '../../modules/supplier/components/supplier-ledger/supplier-ledger';
import { SupplierDashboardComponent } from '../../modules/supplier/components/supplier-dashboard/supplier-dashboard';

// Product Components
import { ProductHistoryComponent } from '../../modules/product/components/product-history/product-history';
import { StockAdjustmentComponent } from '../../modules/product/components/stock-adjustment/stock-adjustment';
import { StockTransferComponent } from '../../modules/product/components/stoct-transfer/stoct-transfer';

// User Components
import { UserStatusDialogComponent } from '../../modules/user/user-status-dialog/user-status-dialog.component';
import { UserExportDialogComponent } from '../../modules/user/user-export/user-export-dialog.component';
import { UserPermissionDialogComponent } from '../../modules/user/user-permission-dialog/user-permission-dialog.component';
import { User } from '../../modules/user/user-management.service';

// Customer & Shared
import { BulkCustomerComponent } from '../../modules/customer/components/bulk-customer/bulk-customer.component';
import { CustomerDetails } from '../../modules/customer/components/customer-details/customer-details';
import { ImageUploaderComponent } from '../../modules/shared/components/image-uploader.component';

@Injectable({
  providedIn: 'root',
})
export class DynamicDialogServices {
  private dialogService = inject(DialogService);

  /** * Default Base Config 
   * Applies the 'app-dialog' class which hooks into our custom theme CSS
   */
  private get baseConfig() {
    return {
      styleClass: 'app-dialog', // Global custom theme class
      baseZIndex: 10000,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      maskStyleClass: 'app-dialog-mask', // For backdrop blur
      contentStyle: { padding: 'var(--spacing-2xl)', overflow: 'visible' },
    };
  }

  /**
   * Enterprise Config (For large data grids, charts, history)
   */
  private get enterpriseConfig() {
    return {
      ...this.baseConfig,
      width: '85vw',
      styleClass: 'app-dialog enterprise-dialog',
      maximizable: true,
      contentStyle: { padding: 'var(--spacing-2xl)', overflow: 'auto' },
    };
  }

  // ==========================================
  // NOTE & DATA DIALOGS
  // ==========================================

  openNoteExport(): DynamicDialogRef | null {
    return this.dialogService.open(NoteExportDialogComponent, {
      ...this.baseConfig,
      header: 'Export Data',
      width: '500px',
    });
  }

  openNoteLinkDialog(sourceNoteId: string): DynamicDialogRef | null {
    return this.dialogService.open(NoteLinkDialogComponent, {
      ...this.baseConfig,
      header: 'Link Note',
      width: '600px',
      data: { sourceNoteId }
    });
  }

  openAnalyticsDialog(): DynamicDialogRef | null {
    return this.dialogService.open(AnalyticsDashboardComponent, {
      ...this.enterpriseConfig,
      header: 'Workspace Analytics',
      height: '80vh',
      contentStyle: { padding: '0', overflow: 'hidden' } // Full bleed for charts
    });
  }

  // ==========================================
  // SUPPLIER DIALOGS
  // ==========================================

  openSupplierLedger(supplierId: string): DynamicDialogRef | null {
    return this.dialogService.open(SupplierLedger, {
      ...this.enterpriseConfig,
      header: 'Supplier Ledger & Statement',
      data: { supplierId }
    });
  }

  openSupplierKyc(supplierId: string): DynamicDialogRef | null {
    return this.dialogService.open(SupplierKyc, {
      ...this.baseConfig,
      header: 'KYC & Compliance Documents',
      width: '60vw',
      data: { supplierId }
    });
  }

  openSupplierDashboard(product: any): DynamicDialogRef | null {
    return this.dialogService.open(SupplierDashboardComponent, {
      ...this.enterpriseConfig,
      header: `Supplier Dashboard: ${product.name}`,
      height: '90vh',
      data: { productId: product._id }
    });
  }

  // ==========================================
  // PRODUCT & INVENTORY DIALOGS
  // ==========================================

  openProductHistory(product: any): DynamicDialogRef | null {
    return this.dialogService.open(ProductHistoryComponent, {
      ...this.enterpriseConfig,
      header: `Product History: ${product.name}`,
      data: { productId: product._id }
    });
  }

  openStockAdjustment(product: any): DynamicDialogRef | null {
    return this.dialogService.open(StockAdjustmentComponent, {
      ...this.baseConfig,
      header: `Adjust Stock: ${product.name}`,
      width: '800px',
      data: { id: product._id }
    });
  }

  openStockTransfer(product: any): DynamicDialogRef | null {
    return this.dialogService.open(StockTransferComponent, {
      ...this.baseConfig,
      header: `Transfer Stock: ${product.name}`,
      width: '800px',
      data: { id: product._id }
    });
  }

  // ==========================================
  // USER DIALOGS
  // ==========================================

  openUserExport(): DynamicDialogRef | null {
    return this.dialogService.open(UserExportDialogComponent, {
      ...this.baseConfig,
      header: 'Export User Data',
      width: '500px',
    });
  }

  openUserPermissions(user: User): DynamicDialogRef | null {
    return this.dialogService.open(UserPermissionDialogComponent, {
      ...this.baseConfig,
      header: `Manage Overrides: ${user.name}`,
      width: '800px',
      data: { user }
    });
  }

  openUserStatus(user: User): DynamicDialogRef | null {
    return this.dialogService.open(UserStatusDialogComponent, {
      ...this.baseConfig,
      header: `Account Status: ${user.name}`,
      width: '450px',
      data: { user }
    });
  }

  // ==========================================
  // CUSTOMER DIALOGS
  // ==========================================

  openBulkCustomer(): DynamicDialogRef | null {
    return this.dialogService.open(BulkCustomerComponent, {
      ...this.enterpriseConfig,
      header: 'Bulk Customer Import',
      width: '90vw',
      height: '85vh',
      data: { isDialog: true }
    });
  }

  openCustomerDetails(customerId: string): DynamicDialogRef | null {
    return this.dialogService.open(CustomerDetails, {
      ...this.enterpriseConfig,
      header: 'Customer Details Profile',
      data: { id: customerId }
    });
  }


  // ==========================================
  // SHARED / MULTIPURPOSE DIALOGS
  // ==========================================

  /**
   * Universal Image Upload Dialog
   * Can be used for Customers, Products, Profiles, etc.
   * @param config - Configuration including title, description, and the upload function
   */
  openImageUpload(config: {
    header?: string;
    description?: string;
    maxSize?: number;
    accept?: string;
    uploadFn?: (file: File) => Observable<any>;
  }): DynamicDialogRef | null {
    return this.dialogService.open(ImageUploaderComponent, {
      ...this.baseConfig,
      header: config.header || 'Upload Image',
      width: '450px',
      data: { 
        ...config,
        isDialog: true 
      }
    });
  }
}