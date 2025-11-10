import { Routes } from '@angular/router';
import { EmiDetailsComponent } from './components/emi-details/emi-details';
import { EmiFormComponent } from './components/emi-form/emi-form';

// These routes will be lazy-loaded under a '/emi' path
export const EMI_ROUTES: Routes = [
  {
    path: 'create/:invoiceId', // User is sent here to create a plan
    component: EmiFormComponent,
  },
  {
    path: 'invoice/:invoiceId', // User is sent here to view the plan
    component: EmiDetailsComponent,
  },
];