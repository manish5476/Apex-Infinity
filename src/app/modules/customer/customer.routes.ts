import { Routes } from "@angular/router";
import { CreateOrganization } from "../organization/components/create-organization/create-organization";
import { CustomerForm } from "./components/customer-form/customer-form";

export const CUSTOMER_ROUTES: Routes = [
  { path: 'create', component: CustomerForm },
  
];
