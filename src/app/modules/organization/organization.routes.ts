import { Routes } from "@angular/router";
import { CreateOrganization } from "../organization/components/create-organization/create-organization";

export const ORGANIZATION_ROUTES: Routes = [
  { path: '', component: CreateOrganization },
  { path: 'login', component: CreateOrganization },
];
