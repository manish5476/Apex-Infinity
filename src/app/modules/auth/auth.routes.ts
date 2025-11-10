import { Routes } from "@angular/router";
import { Login } from "./components/login/login";
import { Signup } from "./components/signup/signup";
import { CreateOrganization } from "../organization/components/create-organization/create-organization";

export const AUTH_ROUTES: Routes = [
  { path: 'org', component: CreateOrganization },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
];
