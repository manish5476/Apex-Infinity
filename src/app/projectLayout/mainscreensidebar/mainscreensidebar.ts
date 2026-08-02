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

import { HotkeyService } from '../../core/services/hotkey.service';

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
  private readonly hotkeyService = inject(HotkeyService);

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
  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    // Only intercept events if needed (left empty since shortcut was removed)
  }

  openSearch(): void {
    this.hotkeyService.toggleCommandPalette();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout();
  }
}