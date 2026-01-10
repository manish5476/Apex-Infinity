import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { LayoutService } from '../layout.service';
import { SIDEBAR_MENU, COMPACT_MENU, MODULE_GROUPED_MENU, MenuItem, getAllRoutes } from './menu-items.constants';

@Component({
  selector: 'app-mainscreen-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mainscreensidebar.html',
  styleUrls: ['./mainscreensidebar.scss']
})
export class MainscreenSidebar implements OnInit, AfterViewInit, OnDestroy {
  layout = inject(LayoutService);
  private router = inject(Router);
  
  @ViewChild('menuList') menuList!: ElementRef<HTMLElement>;

  // Choose which menu structure to use
  menuItems: MenuItem[] = COMPACT_MENU; // Using compact version similar to old style
  
  expandedItems: Record<string, boolean> = {};
  focusedIndex = -1;
  activeRoute = '';
  private routerSubscription!: Subscription;
  
  // Track recently accessed items
  recentItems: { label: string, routerLink: string[] }[] = [];
  
  // Optional: User role/permission based filtering
  userPermissions = {
    canViewAdmin: true,
    canViewFinance: true,
    canViewHR: true,
    // Add more permissions as needed
  };

  ngOnInit() {
    this.activeRoute = this.router.url;
    this.autoExpandActiveRoute();
    this.loadRecentItems();
    
    // Watch for route changes to update active state
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeRoute = event.url;
        this.updateRecentItems(event.url);
        this.autoExpandActiveRoute();
      });
  }

  ngAfterViewInit() {
    // Initial scroll to active link
    setTimeout(() => {
      this.scrollToActiveItem();
    }, 100);
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    this.saveRecentItems();
  }

  /* --- MENU EXPANSION --- */
  toggleMenuItem(label: string) {
    if (!this.layout.isExpanded()) {
      this.layout.isHovered.set(true); // Expand sidebar if user clicks while collapsed
    }
    this.expandedItems[label] = !this.expandedItems[label];
    
    // Collapse other menus if needed (optional single-expand behavior)
    if (this.layout.config().sidebarSingleExpand) {
      Object.keys(this.expandedItems).forEach(key => {
        if (key !== label) {
          this.expandedItems[key] = false;
        }
      });
    }
  }

  isItemExpanded(item: MenuItem): boolean {
    return !!this.expandedItems[item.label];
  }

  getSubmenuHeight(item: MenuItem): string {
    if (!item.items || !this.expandedItems[item.label] || !this.layout.isExpanded()) {
      return '0px';
    }
    // Calculate height based on number of items
    const itemHeight = 40; // px per item
    return `${item.items.length * itemHeight}px`;
  }

  /* --- ACTIVE STATE DETECTION --- */
  isParentActive(item: MenuItem): boolean {
    if (!item.items) return false;
    
    return item.items.some(sub => 
      sub.routerLink && this.isActiveRoute(sub.routerLink)
    );
  }

  isActiveRoute(routerLink: string[] | undefined): boolean {
    if (!routerLink || routerLink.length === 0) return false;
    
    const routePath = routerLink[0];
    return this.activeRoute.startsWith(routePath);
  }

  private autoExpandActiveRoute() {
    // First, collapse all if single expand mode
    if (this.layout.config().sidebarSingleExpand) {
      Object.keys(this.expandedItems).forEach(key => {
        this.expandedItems[key] = false;
      });
    }
    
    // Expand the active parent
    this.menuItems.forEach(item => {
      if (item.items && this.isParentActive(item)) {
        this.expandedItems[item.label] = true;
      }
    });
  }

  /* --- RECENT ITEMS TRACKING --- */
  private loadRecentItems() {
    const saved = localStorage.getItem('sidebar_recent_items');
    if (saved) {
      try {
        this.recentItems = JSON.parse(saved).slice(0, 5); // Max 5 recent items
      } catch {
        this.recentItems = [];
      }
    }
  }

  private saveRecentItems() {
    localStorage.setItem('sidebar_recent_items', JSON.stringify(this.recentItems));
  }

  private updateRecentItems(url: string) {
    const allRoutes = getAllRoutes();
    const route = allRoutes.find(r => 
      r.path && r.path[0] && url.startsWith(r.path[0])
    );
    
    if (route) {
      // Remove if already exists
      this.recentItems = this.recentItems.filter(item => 
        !item.routerLink.some(path => route.path.includes(path))
      );
      
      // Add to beginning
      this.recentItems.unshift({
        label: route.label,
        routerLink: route.path
      });
      
      // Keep only last 5 items
      if (this.recentItems.length > 5) {
        this.recentItems.pop();
      }
    }
  }

  /* --- ACCESSIBILITY / KEYBOARD NAVIGATION --- */
  onKeyNavigate(event: KeyboardEvent) {
    const items = Array.from(this.menuList.nativeElement.querySelectorAll('.menu-title, .submenu-item a')) as HTMLElement[];
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex + 1) % items.length;
        items[this.focusedIndex]?.focus();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex - 1 + items.length) % items.length;
        items[this.focusedIndex]?.focus();
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.focusedIndex !== -1) {
          items[this.focusedIndex]?.click();
        }
        break;
        
      case 'Escape':
        if (this.layout.isExpanded()) {
          this.layout.toggleSidebar();
        }
        break;
    }
  }

  onMenuItemFocus(index: number) {
    this.focusedIndex = index;
  }

  /* --- SCROLL TO ACTIVE ITEM --- */
  private scrollToActiveItem() {
    if (!this.menuList?.nativeElement) return;
    
    const activeElement = this.menuList.nativeElement.querySelector('.active-link');
    if (activeElement) {
      activeElement.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      });
    }
  }

  /* --- UTILITY FUNCTIONS --- */
  hasSubmenu(item: MenuItem): boolean {
    return !!(item.items && item.items.length > 0);
  }

  shouldShowItem(item: MenuItem): boolean {
    // Add permission-based filtering here
    if (item.label === 'Administration' && !this.userPermissions.canViewAdmin) {
      return false;
    }
    if (item.label === 'Financials' && !this.userPermissions.canViewFinance) {
      return false;
    }
    // Add more permission checks as needed
    return true;
  }

  /* --- LOGOUT --- */
  logout() {
    console.log('Logging out...');
    // Add your logout logic here
  }

  /* --- MENU SWITCHING (Optional) --- */
  switchMenuStyle(style: 'compact' | 'grouped' | 'detailed') {
    switch (style) {
      case 'compact':
        this.menuItems = COMPACT_MENU;
        break;
      case 'grouped':
        this.menuItems = MODULE_GROUPED_MENU;
        break;
      case 'detailed':
        this.menuItems = SIDEBAR_MENU;
        break;
    }
    this.expandedItems = {};
    this.autoExpandActiveRoute();
    
    setTimeout(() => {
      this.scrollToActiveItem();
    }, 100);
  }
}
// import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { LayoutService } from '../layout.service';
// import { SIDEBAR_MENU, MenuItem } from './menu-items.constants';

// @Component({
//   selector: 'app-mainscreen-sidebar',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './mainscreensidebar.html',
//   styleUrl: './mainscreensidebar.scss'
// })
// export class Mainscreensidebar implements OnInit, AfterViewInit {
//   layout = inject(LayoutService);
//   private router = inject(Router);
  
//   @ViewChild('menuList') menuList!: ElementRef<HTMLElement>;

//   menuItems: MenuItem[] = SIDEBAR_MENU;
//   expandedItems: Record<string, boolean> = {};
//   focusedIndex = -1;

//   ngOnInit() {
//     this.autoExpandActiveRoute();
//   }

//   ngAfterViewInit() {
//     // Initial scroll to active link
//     setTimeout(() => {
//       const active = this.menuList.nativeElement.querySelector('.active-link');
//       if (active) active.scrollIntoView({ block: 'nearest' });
//     }, 300);
//   }

//   /* --- ACTIONS --- */
//   toggleMenuItem(label: string) {
//     if (!this.layout.isExpanded()) {
//       this.layout.isHovered.set(true); // Expand sidebar if user clicks while collapsed
//     }
//     this.expandedItems[label] = !this.expandedItems[label];
//   }

//   getSubmenuHeight(item: MenuItem): string {
//     if (!item.items || !this.expandedItems[item.label] || !this.layout.isExpanded()) {
//       return '0px';
//     }
//     // Height of each item (34px) * count
//     return `${item.items.length * 34}px`;
//   }

//   isParentActive(item: MenuItem): boolean {
//     return !!item.items?.some(sub => 
//       sub.routerLink && this.router.url.includes(sub.routerLink[0])
//     );
//   }

//   private autoExpandActiveRoute() {
//     this.menuItems.forEach(item => {
//       if (item.items && this.isParentActive(item)) {
//         this.expandedItems[item.label] = true;
//       }
//     });
//   }

//   /* --- ACCESSIBILITY / KEYBOARD --- */
//   onKeyNavigate(event: KeyboardEvent) {
//     const items = Array.from(this.menuList.nativeElement.querySelectorAll('.menu-title')) as HTMLElement[];
    
//     if (event.key === 'ArrowDown') {
//       event.preventDefault();
//       this.focusedIndex = (this.focusedIndex + 1) % items.length;
//       items[this.focusedIndex].focus();
//     } else if (event.key === 'ArrowUp') {
//       event.preventDefault();
//       this.focusedIndex = (this.focusedIndex - 1 + items.length) % items.length;
//       items[this.focusedIndex].focus();
//     } else if (event.key === 'Enter' && this.focusedIndex !== -1) {
//       items[this.focusedIndex].click();
//     }
//   }

//   logout() {
//     console.log('Logging out...');
//   }
// }

