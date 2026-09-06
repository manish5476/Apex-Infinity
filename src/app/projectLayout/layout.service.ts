import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

/**
 * LayoutService — Single source of truth for all sidebar + layout UI state.
 *
 * Centralises every piece of state that was previously scattered
 * (direct localStorage calls in components, ad-hoc signals, etc.).
 *
 * Consumers inject this service; they never touch localStorage directly.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ── Sidebar display states ──────────────────────────────────────────────────

  /** Whether the sidebar is pinned (always visible, flush to shell). */
  readonly isPinned = signal<boolean>(
    this.isBrowser && localStorage.getItem('sidebarPinned') === 'true'
  );

  /**
   * Whether the sidebar is in icon-only "mini" mode (60px wide).
   * Distinct from collapsed/expanded — mini mode keeps the sidebar
   * visible but collapses labels and section headers.
   */
  readonly isMiniMode = signal<boolean>(
    this.isBrowser && localStorage.getItem('sidebarMini') === 'true'
  );

  /** Whether the sidebar panel is hovered (triggers hover-reveal on desktop). */
  readonly isHovered = signal<boolean>(false);

  /** Whether the mobile drawer overlay is open. */
  readonly isMobileMenuOpen = signal<boolean>(false);

  // ── Responsive breakpoints ──────────────────────────────────────────────────

  readonly screenWidth = signal<number>(
    this.isBrowser ? window.innerWidth : 1200
  );

  readonly isMobile  = computed(() => this.screenWidth() < 768);
  readonly isTablet  = computed(() => this.screenWidth() >= 768 && this.screenWidth() < 1024);
  readonly isDesktop = computed(() => this.screenWidth() >= 1024);

  // ── Derived sidebar visibility ──────────────────────────────────────────────

  /**
   * True when the sidebar should show its full-width panel.
   * On mobile/tablet this is driven by the drawer toggle;
   * on desktop by pin or hover.
   */
  readonly isExpanded = computed(() => {
    if (this.isMobile() || this.isTablet()) return this.isMobileMenuOpen();
    return this.isPinned() || this.isHovered();
  });

  /** Inverse of isExpanded — sidebar is hidden or in peek mode. */
  readonly isCollapsed = computed(() => !this.isExpanded());

  // ── Persistence ─────────────────────────────────────────────────────────────

  constructor() {
    if (this.isBrowser) {
      window.addEventListener('resize', () => {
        this.screenWidth.set(window.innerWidth);
      });
    }

    // One effect owns all sidebar localStorage writes.
    effect(() => {
      if (!this.isBrowser) return;
      localStorage.setItem('sidebarPinned', String(this.isPinned()));
      localStorage.setItem('sidebarMini',   String(this.isMiniMode()));
    });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  toggleSidebar(): void {
    if (this.isMobile() || this.isTablet()) {
      this.toggleMobile();
    } else {
      this.togglePin();
    }
  }

  togglePin():      void { this.isPinned.update(v => !v); }
  toggleMiniMode(): void { this.isMiniMode.update(v => !v); }
  toggleMobile():   void { this.isMobileMenuOpen.update(v => !v); }
  closeMobile():    void { this.isMobileMenuOpen.set(false); }
}
