import { Routes } from '@angular/router';

// Return Components
import { PurchaseReturnListComponent } from './purchase-return-list/purchase-return-list.component'; // The History List
import { PurchaseReturnDetailsComponent } from './purchase-return-details/purchase-return-details.component'; // The Read-Only View
import { PurchaseDetailsComponent } from './purchase-details/purchase-details';
import { PurchaseReturnComponent } from './purchase-return/purchase-return';
import { PurchaseFormComponent } from './purchase-form/purchase-form';
import { PurchaseListComponent } from './purchase-list/purchase-list';

export const PURCHASE_ROUTES: Routes = [
  // =========================================================
  // 1. MAIN LIST
  // =========================================================
  {
    path: '',
    component: PurchaseListComponent,
    title: 'Purchase Orders'
  },

  // =========================================================
  // 2. STATIC ROUTES (MUST COME BEFORE :id)
  // =========================================================
  {
    path: 'create',
    component: PurchaseFormComponent,
    title: 'Create Purchase'
  },
  
  // NEW: History of all Returns (Debit Notes)
  // Matches: /purchase/returns
  {
    path: 'returns',
    component: PurchaseReturnListComponent,
    title: 'Purchase Returns History'
  },

  // NEW: Read-Only View of a specific Debit Note
  // Matches: /purchase/returns/65a... (ID of the Return doc)
  // Note: This must be separate from 'return/:id' to avoid confusion
  {
    path: 'returns/:id',
    component: PurchaseReturnDetailsComponent,
    title: 'Debit Note Details'
  },

  // =========================================================
  // 3. ACTION ROUTES
  // =========================================================
  
  // Action: Create a Return FOR a specific Purchase
  // Matches: /purchase/return/65a... (ID of the Purchase doc)
  {
    path: 'return/:id',
    component: PurchaseReturnComponent,
    title: 'Create Purchase Return' 
  },

  // =========================================================
  // 4. DYNAMIC ID ROUTES (CATCH-ALL)
  // =========================================================
  
  // View Purchase Details
  {
    path: ':id',
    component: PurchaseDetailsComponent,
    title: 'Purchase Details'
  },
  
  // Edit Purchase
  {
    path: ':id/edit',
    component: PurchaseFormComponent,
    title: 'Edit Purchase'
  }
];

// import { Routes } from '@angular/router';
// import { PurchaseDetailsComponent } from './purchase-details/purchase-details';
// import { PurchaseFormComponent } from './purchase-form/purchase-form';
// import { PurchaseListComponent } from './purchase-list/purchase-list';
// import { PurchaseReturnComponent } from './purchase-return/purchase-return';

// export const PURCHASE_ROUTES: Routes = [
//   {
//     path: '',
//     component: PurchaseListComponent,
//     title: 'Purchase Orders'
//   },
//   {
//     path: 'create',
//     component: PurchaseFormComponent,
//     title: 'Create Purchase'
//   },
//   // ✅ FIX: Specific static paths must come BEFORE variable paths like :id
//   {
//     path: 'return/:id',
//     component: PurchaseReturnComponent,
//     title: 'Create Purchase Return' 
//   },
//   {
//     path: ':id',
//     component: PurchaseDetailsComponent,
//     title: 'Purchase Details'
//   },
//   {
//     path: ':id/edit',
//     component: PurchaseFormComponent,
//     title: 'Edit Purchase'
//   }
// ];
