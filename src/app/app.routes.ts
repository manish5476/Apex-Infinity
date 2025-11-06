// import { AdminDashboardComponent } from './admins/components/admin-dashboard/admin-dashboard.component';
import { Routes } from '@angular/router';
// import { NotFoundComponent } from './shared/Components/notfound/notfound.component';
// import { AuthGuard } from './core/guards/authguard.guard';
// import { MainLayoutComponent } from './layouts/mainlayout/mainlayout.component';
// import { MainDashboardComponent } from './layouts/main-dashboard/main-dashboard.component';
// import { AuthResolver } from './core/auth.resolver';
import { MainScreen } from './projectLayout/main-screen/main-screen';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: MainScreen,
    // canActivate: [AuthGuard],
    // resolve: { isAuthenticated: AuthResolver },
    // children: [
    //   { path: '', component: AdminDashboardComponent }, // default (can keep or change)
    //   { path: 'dashboard', component: AdminDashboardComponent },
    //   { path: 'home', component: HomePageComponent }, // 👈 add this
    //   {
    //     path: 'admin',
    //     loadChildren: () =>
    //       import('./Modules/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    //   },
    //   {
    //     path: 'payment',
    //     loadChildren: () =>
    //       import('./Modules/payment/payment.routes').then(
    //         (m) => m.PAYMENT_ROUTES,
    //       ),
    //   },
    //   {
    //     path: 'customers',
    //     loadChildren: () =>
    //       import('./Modules/customer/customer.routes').then(
    //         (m) => m.CUSTOMER_ROUTES,
    //       ),
    //   },
    //   {
    //     path: 'sellers',
    //     loadChildren: () =>
    //       import('./Modules/seller/seller.routes').then((m) => m.SELLER_ROUTES),
    //   },
    //   {
    //     path: 'invoices',
    //     loadChildren: () =>
    //       import('./Modules/billing/billing.routes').then(
    //         (m) => m.BILLING_ROUTES,
    //       ),
    //   },
    //   {
    //     path: 'products',
    //     loadChildren: () =>
    //       import('./Modules/product/product.routes').then(
    //         (m) => m.PRODUCT_ROUTES,
    //       ),
    //   },
    //   {
    //     path: 'master',
    //     loadChildren: () =>
    //       import('./Modules/MasterList/master.routes').then(
    //         (m) => m.MASTER_ROUTES,
    //       ),
    //   },
    //   {
    //     path: 'personalInfo',
    //     loadChildren: () =>
    //       import('./Modules/PersonalInfo/personalinfo.routes').then(
    //         (m) => m.PERSONAL_INFO,
    //       ),
    //   },
    //   {
    //     path: 'Emi',
    //     loadChildren: () =>
    //       import('./Modules/EMI/emi.routes').then(
    //         (m) => m.EMI_ROUTES,
    //       ),
    //   },
    //   { path: '**', component: NotFoundComponent },
    // ],
  },
];
