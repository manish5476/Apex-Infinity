import { Routes } from '@angular/router';
import { AccountTreeComponent } from './components/accounts-tree/accounts-tree';
import { AccountListComponent } from './components/account-list/account-list';

export const ACCOUNT_ROUTES:  Routes = [
  { path: '', component: AccountListComponent },
  { path: 'tree', component: AccountTreeComponent }
];
