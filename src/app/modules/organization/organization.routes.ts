import { Routes } from "@angular/router";
import { CreateOrganizationComponent } from "./components/create-organization/create-organization";
import { AnnouncementList } from "./components/notification-list/notification-list";

export const ORGANIZATION_ROUTES: Routes = [
  { path: '', component: CreateOrganizationComponent },
  { path: 'announcements', component: AnnouncementList },
];
