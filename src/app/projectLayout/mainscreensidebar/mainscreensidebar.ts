import { Component, inject, HostBinding, OnInit, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { LayoutService } from '../layout.service';
import { AuthService } from './../../modules/auth/services/auth-service';
import { PermissionService } from '@core/auth/services/permission.service';
import { SIDEBAR_MENU, MenuItem } from './menu-items.constants';
import { filter } from 'rxjs/operators';
import { Dialog } from "primeng/dialog";

interface FlatMenuItem {
  label: string;
  routerLink: string[];
  icon: string;
  breadcrumb: string;
}

@Component({
  selector: 'app-mainscreen-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, Dialog],
  templateUrl: './mainscreensidebar.html',
  styleUrl: './mainscreensidebar.scss'
})
export class Mainscreensidebar implements OnInit {
  layout = inject(LayoutService);
  authService = inject(AuthService);
  permService = inject(PermissionService);
  router = inject(Router);

  menuItems: MenuItem[] = [];
  expandedState: Record<string, boolean> = {};

  constructor() {
    // Re-evaluate sidebar menu entirely when user's permissions change
    effect(() => {
      // Just accessing the signal registers the dependency
      this.permService.permissions();
      this.filterMenu();
      this.buildSearchIndex();
      this.checkActiveRoutes();
    });
  }

  private filterMenu() {
    const filterRecursive = (items: MenuItem[]): MenuItem[] => {
      return items.filter(item => {
        // Drop node if user fails the permission check
        if (item.permissions && !this.permService.check(item.permissions)) {
          return false;
        }
        
        // If it's a parent with children, filter its children
        if (item.items) {
          item.items = filterRecursive(item.items);
          // If all children were pruned and it's strictly a category node without a route, drop the parent
          if (item.items.length === 0 && !item.routerLink) {
             return false;
          }
        }
        return true;
      });
    };
    
    // Deep clone raw constants so filtering doesn't mutate original objects
    const clonedMenu = JSON.parse(JSON.stringify(SIDEBAR_MENU));
    this.menuItems = filterRecursive(clonedMenu);
  }

  // --- SEARCH STATE ---
  isSearchVisible = false;
  searchQuery = '';
  searchIndex: FlatMenuItem[] = [];
  filteredResults: FlatMenuItem[] = [];
  focusedIndex = 0;

  @ViewChild('searchInput') searchInput!: ElementRef;

  // --- HOST BINDINGS ---
  @HostBinding('class.mobile-host')
  get isMobile() { return this.layout.isMobile(); }

  @HostBinding('class.mobile-open')
  get isMobileOpen() { return this.layout.isMobileMenuOpen(); }

  @HostBinding('class.pinned')
  get isPinned() { return this.layout.isPinned(); }

  // ✅ NEW: Allows the host to expand fully when search is open so the modal isn't clipped
  @HostBinding('class.search-mode')
  get isSearchActive() { return this.isSearchVisible; }

  // --- KEYBOARD LISTENERS ---
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }

    if (this.isSearchVisible) {
      if (event.key === 'Escape') {
        this.closeSearch();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex + 1) % (this.filteredResults.length || 1);
        this.scrollToFocused();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex - 1 + this.filteredResults.length) % (this.filteredResults.length || 1);
        this.scrollToFocused();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.filteredResults.length > 0) {
          this.navigateToResult(this.filteredResults[this.focusedIndex]);
        }
      }
    }
  }

  ngOnInit() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.checkActiveRoutes();
    });
  }

  // --- SEARCH LOGIC ---

  buildSearchIndex() {
    this.searchIndex = []; // RESET index so duplicate search records aren't generated when Effect runs
    const flatten = (items: MenuItem[], parentLabel = ''): void => {
      for (const item of items) {
        const currentBreadcrumb = parentLabel ? `${parentLabel} > ${item.label}` : item.label;
        if (item.routerLink) {
          this.searchIndex.push({
            label: item.label,
            routerLink: item.routerLink,
            icon: item.icon,
            breadcrumb: parentLabel
          });
        }
        if (item.items) {
          flatten(item.items, currentBreadcrumb);
        }
      }
    };
    flatten(this.menuItems);
  }

  openSearch() {
    this.isSearchVisible = true;
    this.searchQuery = '';
    this.filteredResults = this.searchIndex;
    this.focusedIndex = 0;
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }

  closeSearch() {
    this.isSearchVisible = false;
  }

  onSearchInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.searchQuery = query;
    this.focusedIndex = 0;

    if (!query) {
      this.filteredResults = this.searchIndex;
      return;
    }

    this.filteredResults = this.searchIndex.filter(item =>
      item.label.toLowerCase().includes(query) ||
      (item.breadcrumb && item.breadcrumb.toLowerCase().includes(query))
    );
  }

  navigateToResult(item: FlatMenuItem) {
    if (!item) return;
    this.router.navigate(item.routerLink);
    this.closeSearch();
    if (this.layout.isMobile()) this.layout.closeMobile();
  }

  scrollToFocused() {
    const element = document.getElementById(`result-${this.focusedIndex}`);
    element?.scrollIntoView({ block: 'nearest' });
  }

  // --- MENU ACTIONS ---

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