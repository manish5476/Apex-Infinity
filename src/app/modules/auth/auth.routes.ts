import { Routes } from "@angular/router";
import { Login } from "./components/login/login";
import { Signup } from "./components/signup/signup";
import { CreateOrganization } from "../organization/components/create-organization/create-organization";

export const AUTH_ROUTES: Routes = [
  { path: 'org', component: CreateOrganization },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  // { path: 'reset-password/:token', component: ResetPasswordComponent },
  // { path: 'forgot-password', component: ForgotPasswordComponent },
  // { path: 'update-password', component: UpdatePasswordComponent },
  // { path: 'profile', component: UserProfileComponent },
  // { path: '', redirectTo: 'login', pathMatch: 'full' },
];
