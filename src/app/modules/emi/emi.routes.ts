import { Routes } from '@angular/router';
import { EmiDetailsComponent } from './components/emi-details/emi-details';
import { EmiFormComponent } from './components/emi-form/emi-form';
import { EmiList } from './components/emi-list/emi-list';

// These routes will be lazy-loaded under a '/emi' path
export const EMI_ROUTES: Routes = [
  {
    path: '',
    component: EmiList,
  },
  {
    path: 'create',
    component: EmiFormComponent,
  },
  {
    path: ':id',
    component: EmiDetailsComponent,
  },
  {
    path: ':id/edit',
    component: EmiFormComponent,
  },
];