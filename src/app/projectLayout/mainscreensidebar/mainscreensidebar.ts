import { AuthService } from './../../modules/auth/services/auth-service';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { LayoutService } from '../layout.service';
import { SIDEBAR_MENU, MenuItem } from './menu-items.constants';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-mainscreen-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mainscreensidebar.html',
  styleUrl: './mainscreensidebar.scss'
})
export class Mainscreensidebar implements OnInit {
  layout = inject(LayoutService);
  AuthService = inject(AuthService);
  private router = inject(Router);
  
  menuItems: MenuItem[] = SIDEBAR_MENU;
  expandedState: Record<string, boolean> = {};

  ngOnInit() {
    this.checkActiveRoutes();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.checkActiveRoutes();
    });
  }

  toggleItem(item: MenuItem) {
    if (this.layout.isCollapsed()) this.layout.isHovered.set(true);
    this.expandedState[item.label] = !this.expandedState[item.label];
  }

  isActive(item: MenuItem): boolean {
    if (item.routerLink && this.router.isActive(this.router.createUrlTree(item.routerLink), { 
      paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored'
    })) return true;
    return !!item.items?.some(child => this.isActive(child));
  }

  private checkActiveRoutes() {
    const expandRecursive = (items: MenuItem[]) => {
      items.forEach(item => {
        if (item.items && this.isActive(item)) {
          this.expandedState[item.label] = true;
          expandRecursive(item.items);
        }
      });
    };
    expandRecursive(this.menuItems);
  }

  logout() {
this.AuthService.logout()  }
}
