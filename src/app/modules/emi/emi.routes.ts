import { Routes } from '@angular/router';
import { EmiDetailsComponent } from './components/emi-details/emi-details';
import { EmiFormComponent } from './components/emi-form/emi-form';
import { EmiList } from './components/emi-list/emi-list';
import { EmiLedger } from './components/emi-ledger/emi-ledger';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { TabRouterGuard } from '../../Tabbing';

// These routes will be lazy-loaded under a '/emi' path
export const EMI_ROUTES: Routes = [
  {
    path: '',
    component: EmiList,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'EMI Management', tabIcon: 'pi pi-calendar-clock', permissions: [PERMISSIONS.EMI.READ] }
  },
  {
    path: 'ledger',
    component: EmiLedger,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'EMI Ledger', tabIcon: 'pi pi-book', permissions: [PERMISSIONS.EMI.READ] }
  },
  {
    path: 'create',
    component: EmiFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'New EMI Plan', tabIcon: 'pi pi-plus', permissions: [PERMISSIONS.EMI.CREATE] }
  },
  {
    path: ':id',
    component: EmiDetailsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'EMI Details', tabIcon: 'pi pi-file', permissions: [PERMISSIONS.EMI.READ] }
  },
  {
    path: ':id/edit',
    component: EmiFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Modify EMI', tabIcon: 'pi pi-pencil', permissions: [PERMISSIONS.EMI.MANAGE] }
  },
];