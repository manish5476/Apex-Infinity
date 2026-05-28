import { Routes } from '@angular/router';
import { TabRouterGuard } from '../../Tabbing';

export const LOGISTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/logistics-command-center/logistics-command-center.component')
        .then(m => m.LogisticsCommandCenterComponent),
    canActivate: [TabRouterGuard],
    title: 'Logistics Command Center',
    data: { tabLabel: 'Logistics', tabIcon: 'pi pi-send' }
  }
];
