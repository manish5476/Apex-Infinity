import { Component, inject, HostBinding, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { LayoutService } from '../layout.service';
import { AuthService } from './../../modules/auth/services/auth-service';
import { SIDEBAR_MENU, MenuItem } from './menu-items.constants';
import { filter } from 'rxjs/operators';

// Interface for the search results
interface FlatMenuItem {
  label: string;
  routerLink: string[];
  icon: string;
  breadcrumb: string; // e.g. "Sales > Invoices > Create"
}

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

  // --- SEARCH STATE ---
  isSearchVisible = false;
  searchQuery = '';
  searchIndex: FlatMenuItem[] = [];
  filteredResults: FlatMenuItem[] = [];
  focusedIndex = 0; // For arrow key navigation

  @ViewChild('searchInput') searchInput!: ElementRef;

  // --- HOST BINDINGS ---
  @HostBinding('class.mobile-host') 
  get isMobile() { return this.layout.isMobile(); }

  @HostBinding('class.mobile-open') 
  get isMobileOpen() { return this.layout.isMobileMenuOpen(); }

  @HostBinding('class.pinned') 
  get isPinned() { return this.layout.isPinned(); }

  // --- KEYBOARD LISTENERS (Ctrl+K, Esc, Arrows) ---
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Open: Ctrl+K or Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }

    // Only handle these if search is open
    if (this.isSearchVisible) {
      if (event.key === 'Escape') {
        this.closeSearch();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex + 1) % this.filteredResults.length;
        this.scrollToFocused();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex - 1 + this.filteredResults.length) % this.filteredResults.length;
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
    this.buildSearchIndex(); // Build the flat list on init
    this.checkActiveRoutes();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.checkActiveRoutes();
    });
  }

  // --- SEARCH LOGIC ---

  buildSearchIndex() {
    const flatten = (items: MenuItem[], parentLabel = ''): void => {
      for (const item of items) {
        const currentBreadcrumb = parentLabel ? `${parentLabel} > ${item.label}` : item.label;
        
        // If it's a leaf node (has a link), add to index
        if (item.routerLink) {
          this.searchIndex.push({
            label: item.label,
            routerLink: item.routerLink,
            icon: item.icon,
            breadcrumb: parentLabel // We store the parent path separately for display
          });
        }

        // Recurse if it has children
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
    this.filteredResults = this.searchIndex; // Show all initially, or empty if you prefer
    this.focusedIndex = 0;
    setTimeout(() => this.searchInput.nativeElement.focus(), 50); // Focus input
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
      item.breadcrumb.toLowerCase().includes(query)
    );
  }

  navigateToResult(item: FlatMenuItem) {
    this.router.navigate(item.routerLink);
    this.closeSearch();
    if (this.layout.isMobile()) this.layout.closeMobile();
  }

  // Helper to keep selected item in view
  scrollToFocused() {
    const list = document.querySelector('.search-results-list');
    const element = document.getElementById(`result-${this.focusedIndex}`);
    if (list && element) {
      element.scrollIntoView({ block: 'nearest' });
    }
  }

  // --- EXISTING ACTIONS ---

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

  // --- EXISTING HELPERS ---

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
