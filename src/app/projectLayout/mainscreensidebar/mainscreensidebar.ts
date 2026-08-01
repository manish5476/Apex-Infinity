import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { DialogModule } from 'primeng/dialog';

import { LayoutService } from '../layout.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { MenuBuilderService, NavSearchResult } from './menu-builder.service';
import { NavItem } from './navigation-model';

import { SidebarHeaderComponent } from './components/sidebar-header/sidebar-header.component';
import { SidebarNavSectionComponent } from './components/sidebar-nav-section/sidebar-nav-section.component';
import { SidebarProfileComponent } from './components/sidebar-profile/sidebar-profile.component';

@Component({
  selector: 'app-mainscreen-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogModule,
    SidebarHeaderComponent,
    SidebarNavSectionComponent,
    SidebarProfileComponent,
  ],
  templateUrl: './mainscreensidebar.html',
  styleUrl: './mainscreensidebar.scss',
})
export class Mainscreensidebar {
  // ── Services ──────────────────────────────────────────────────────────────
  protected readonly layout = inject(LayoutService);
  protected readonly authService = inject(AuthService);
  protected readonly menuBuilder = inject(MenuBuilderService);
  private readonly router = inject(Router);

  // ── Host class bindings (drives SCSS modifiers) ───────────────────────────
  @HostBinding('class.is-pinned') get _pinned() { return this.layout.isPinned(); }
  @HostBinding('class.is-mini') get _mini() { return this.layout.isMiniMode(); }
  @HostBinding('class.is-mobile') get _mobile() { return this.layout.isMobile(); }
  @HostBinding('class.is-mobile-open') get _mobileOpen() { return this.layout.isMobileMenuOpen(); }

  // ── Current URL as signal (reactive to NavigationEnd events) ─────────────
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // ── Accordion state ────────────────────────────────────────────────────────
  readonly expandedKeys = signal<Set<string>>(new Set<string>());

  // ── Memoized: labels of all parents with an active descendant ────────────
  //
  // Uses currentUrl() to register a reactive dependency on route changes.
  // router.isActive() is a synchronous check against the router's current
  // state — it's safe to call inside computed() because currentUrl() already
  // guarantees a recompute AFTER NavigationEnd (when router state is updated).
  readonly activeParentLabels = computed((): Set<string> => {
    void this.currentUrl(); // reactive dependency on route change

    const active = new Set<string>();
    const traverse = (items: readonly NavItem[], ancestors: string[]): void => {
      for (const item of items) {
        if (item.routerLink) {
          const urlTree = this.router.createUrlTree(item.routerLink as string[]);
          if (this.router.isActive(urlTree, {
            paths: 'subset',
            queryParams: 'ignored',
            fragment: 'ignored',
            matrixParams: 'ignored',
          })) {
            ancestors.forEach(label => active.add(label));
          }
        }
        if (item.items?.length) {
          traverse(item.items, [...ancestors, item.label]);
        }
      }
    };

    this.menuBuilder.navigationGroups().forEach(group => traverse(group.items, []));
    return active;
  });

  constructor() {
    // Auto-expand accordion parents when navigating to a deep route.
    // untracked() prevents expandedKeys writes from triggering this effect again.
    effect(() => {
      const parents = this.activeParentLabels();
      untracked(() => {
        this.expandedKeys.update(keys => {
          const next = new Set(keys);
          parents.forEach(label => next.add(label));
          return next;
        });
      });
    });
  }

  // ── Accordion handler ─────────────────────────────────────────────────────
  handleToggle(label: string): void {
    this.expandedKeys.update(keys => {
      const next = new Set(keys);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  // ── Spotlight search ──────────────────────────────────────────────────────
  isSearchVisible = false;
  searchQuery = '';
  filteredResults: NavSearchResult[] = [];
  focusedIndex = 0;

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
      return;
    }
    if (!this.isSearchVisible) return;

    switch (event.key) {
      case 'Escape':
        this.closeSearch();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (this.filteredResults.length) {
          this.focusedIndex = (this.focusedIndex + 1) % this.filteredResults.length;
          this.scrollFocusedIntoView();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.filteredResults.length) {
          this.focusedIndex =
            (this.focusedIndex - 1 + this.filteredResults.length) % this.filteredResults.length;
          this.scrollFocusedIntoView();
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (this.filteredResults.length) {
          this.navigateToResult(this.filteredResults[this.focusedIndex]);
        }
        break;
    }
  }

  openSearch(): void {
    this.isSearchVisible = true;
    this.searchQuery = '';
    this.filteredResults = [...this.menuBuilder.searchIndex()];
    this.focusedIndex = 0;
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 60);
  }

  closeSearch(): void {
    this.isSearchVisible = false;
    this.searchQuery = '';
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchQuery = query;
    this.focusedIndex = 0;
    const all = this.menuBuilder.searchIndex();
    this.filteredResults = query
      ? all.filter(
        r => r.label.toLowerCase().includes(query) ||
          r.breadcrumb.toLowerCase().includes(query),
      )
      : [...all];
  }

  navigateToResult(result: NavSearchResult): void {
    if (!result) return;
    this.router.navigate(result.routerLink as string[]);
    this.closeSearch();
    if (this.layout.isMobile()) this.layout.closeMobile();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout();
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private scrollFocusedIntoView(): void {
    document
      .getElementById(`sr-${this.focusedIndex}`)
      ?.scrollIntoView({ block: 'nearest' });
  }
}