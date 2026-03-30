import { Routes } from '@angular/router';

// Return Components
import { PurchaseReturnListComponent } from './purchase-return-list/purchase-return-list.component'; // The History List
import { PurchaseReturnDetailsComponent } from './purchase-return-details/purchase-return-details.component'; // The Read-Only View
import { PurchaseDetailsComponent } from './purchase-details/purchase-details';
import { PurchaseReturnComponent } from './purchase-return/purchase-return';
import { PurchaseFormComponent } from './purchase-form/purchase-form';
import { PurchaseListComponent } from './purchase-list/purchase-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

export const PURCHASE_ROUTES: Routes = [
  // =========================================================
  // 1. MAIN LIST
  // =========================================================
  {
    path: '',
    component: PurchaseListComponent,
    title: 'Purchase Orders',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PURCHASE.READ] }
  },

  // =========================================================
  // 2. STATIC ROUTES (MUST COME BEFORE :id)
  // =========================================================
  {
    path: 'create',
    component: PurchaseFormComponent,
    title: 'Create Purchase',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PURCHASE.CREATE] }
  },

  // NEW: History of all Returns (Debit Notes)
  // Matches: /purchase/returns
  {
    path: 'returns',
    component: PurchaseReturnListComponent,
    title: 'Purchase Returns History',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PURCHASE.RETURN] }
  },

  // NEW: Read-Only View of a specific Debit Note
  // Matches: /purchase/returns/65a... (ID of the Return doc)
  // Note: This must be separate from 'return/:id' to avoid confusion
  {
    path: 'returns/:id',
    component: PurchaseReturnDetailsComponent,
    title: 'Debit Note Details',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PURCHASE.RETURN] }
  },

  // =========================================================
  // 3. ACTION ROUTES
  // =========================================================

  // Action: Create a Return FOR a specific Purchase
  // Matches: /purchase/return/65a... (ID of the Purchase doc)
  {
    path: 'return/:id',
    component: PurchaseReturnComponent,
    title: 'Create Purchase Return',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PURCHASE.RETURN] }
  },

  // =========================================================
  // 4. DYNAMIC ID ROUTES (CATCH-ALL)
  // =========================================================

  // View Purchase Details
  {
    path: ':id',
    component: PurchaseDetailsComponent,
    title: 'Purchase Details',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PURCHASE.READ] }
  },

  // Edit Purchase
  {
    path: ':id/edit',
    component: PurchaseFormComponent,
    title: 'Edit Purchase',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PURCHASE.UPDATE] }
  }
];
