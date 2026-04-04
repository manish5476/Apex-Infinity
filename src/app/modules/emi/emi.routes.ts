import { Routes } from '@angular/router';
import { EmiDetailsComponent } from './components/emi-details/emi-details';
import { EmiFormComponent } from './components/emi-form/emi-form';
import { EmiList } from './components/emi-list/emi-list';
import { EmiLedger } from './components/emi-ledger/emi-ledger';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

// These routes will be lazy-loaded under a '/emi' path
export const EMI_ROUTES: Routes = [
  {
    path: '',
    component: EmiList,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.EMI.READ] }
  },
  {
    path: 'ledger',
    component: EmiLedger,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.EMI.READ] }
  },
  {
    path: 'create',
    component: EmiFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.EMI.CREATE] }
  },
  {
    path: ':id',
    component: EmiDetailsComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.EMI.READ] }
  },
  {
    path: ':id/edit',
    component: EmiFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.EMI.MANAGE] }
  },
];