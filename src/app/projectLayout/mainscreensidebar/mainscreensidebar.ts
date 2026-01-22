import { Component, inject, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { LayoutService } from '../layout.service';
import { AuthService } from './../../modules/auth/services/auth-service';
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
  authService = inject(AuthService);
  router = inject(Router);
  
  menuItems = SIDEBAR_MENU;
  expandedState: Record<string, boolean> = {};

  // --- HOST BINDINGS ---
  @HostBinding('class.mobile-host') 
  get isMobile() { return this.layout.isMobile(); }

  @HostBinding('class.mobile-open') 
  get isMobileOpen() { return this.layout.isMobileMenuOpen(); }

  @HostBinding('class.pinned') 
  get isPinned() { return this.layout.isPinned(); }

  ngOnInit() {
    this.checkActiveRoutes();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.checkActiveRoutes();
    });
  }

  // --- ACTIONS ---
  
  togglePin() {
    this.layout.togglePin();
  }

  handleItemClick(item: MenuItem) {
    if (item.items) {
      this.expandedState[item.label] = !this.expandedState[item.label];
    } else {
      if (item.routerLink) this.router.navigate(item.routerLink);
      if (this.layout.isMobile()) this.layout.closeMobile();
    }
  }

  // --- HELPERS ---

  hasActiveChild(item: MenuItem): boolean {
    if (item.routerLink && this.router.isActive(this.router.createUrlTree(item.routerLink), { 
      paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' 
    })) return true;
    return !!item.items?.some(child => this.hasActiveChild(child));
  }

  isActiveLink(item: MenuItem): boolean {
    return !!item.routerLink && this.router.isActive(this.router.createUrlTree(item.routerLink), {
      paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored'
    });
  }

  private checkActiveRoutes() {
    const expandRecursive = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.items && this.hasActiveChild(item)) {
          this.expandedState[item.label] = true;
          expandRecursive(item.items);
        }
      }
    };
    expandRecursive(this.menuItems);
  }

  logout() {
    this.authService.logout();
  }
}

// import { Component, inject, HostBinding, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router, NavigationEnd } from '@angular/router';
// import { LayoutService } from '../layout.service';
// import { AuthService } from './../../modules/auth/services/auth-service';
// import { SIDEBAR_MENU, MenuItem } from './menu-items.constants';
// import { filter } from 'rxjs/operators';

// @Component({
//   selector: 'app-mainscreen-sidebar',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './mainscreensidebar.html',
//   styleUrl: './mainscreensidebar.scss'
// })
// export class Mainscreensidebar implements OnInit {
//   layout = inject(LayoutService);
//   authService = inject(AuthService);
//   router = inject(Router);
  
//   menuItems = SIDEBAR_MENU;
//   expandedState: Record<string, boolean> = {};

//   // --- HOST BINDINGS (Visual States) ---
//   @HostBinding('class.mobile-host') 
//   get isMobile() { return this.layout.isMobile(); }

//   @HostBinding('class.mobile-open') 
//   get isMobileOpen() { return this.layout.isMobileMenuOpen(); }

//   @HostBinding('class.pinned') 
//   get isPinned() { return this.layout.isPinned(); }

//   ngOnInit() {
//     // Initial check
//     this.checkActiveRoutes();
    
//     // Check on route changes
//     this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
//       this.checkActiveRoutes();
//     });
//   }

//   // --- RECURSIVE EXPANSION LOGIC ---
//   private checkActiveRoutes() {
//     const expandRecursive = (items: MenuItem[]) => {
//       for (const item of items) {
//         if (item.items) {
//           // Check if any child is active
//           if (this.hasActiveChild(item)) {
//             this.expandedState[item.label] = true;
//             expandRecursive(item.items); // Go deeper
//           }
//         }
//       }
//     };
//     expandRecursive(this.menuItems);
//   }

//   // Helper to check if a parent should be active/expanded
//   hasActiveChild(item: MenuItem): boolean {
//     if (item.routerLink && this.router.isActive(this.router.createUrlTree(item.routerLink), { 
//       paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' 
//     })) return true;
    
//     return !!item.items?.some(child => this.hasActiveChild(child));
//   }

//   isActiveLink(item: MenuItem): boolean {
//     return !!item.routerLink && this.router.isActive(this.router.createUrlTree(item.routerLink), {
//       paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored'
//     });
//   }

//   // --- CLICK HANDLERS ---
//   handleItemClick(item: MenuItem) {
//     if (item.items) {
//       // Toggle Submenu
//       this.expandedState[item.label] = !this.expandedState[item.label];
//     } else {
//       // It's a link
//       if (item.routerLink) this.router.navigate(item.routerLink);
//       if (this.layout.isMobile()) this.layout.closeMobile();
//     }
//   }

//   logout() {
//     this.authService.logout();
//   }
// }
