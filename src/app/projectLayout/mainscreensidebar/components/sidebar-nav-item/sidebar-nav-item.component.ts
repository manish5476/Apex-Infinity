import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutService } from '../../../layout.service';
import { NavItem } from '../../navigation-model';

/**
 * SidebarNavItemComponent
 *
 * Renders a single level-1 navigation item and its complete subtree (lv2, lv3).
 *
 * Semantic rules (per the enterprise standard):
 *   • Leaf items (routerLink, no children) → <a routerLink> — navigation, not action
 *   • Accordion parents (no routerLink, has children) → <button> — action, not navigation
 *
 * Handles up to 3 levels inline (no recursion) for deterministic rendering.
 * Active state is driven by routerLinkActive directive — no JS polling.
 */
@Component({
  selector: 'app-sidebar-nav-item',
  standalone: true,
  imports: [RouterModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ── Level 1 item ─────────────────────────────────────────────────────── -->
    <div class="relative">

      @if (isLeaf()) {
        <!-- LEAF: <a> for navigation -->
        <a
          [routerLink]="item().routerLink"
          routerLinkActive="nav-link--active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="group relative flex items-center gap-2.5 w-full h-[38px] px-3 rounded-[10px]
                 text-[13px] font-[var(--font-weight-medium)]
                 text-[var(--text-secondary)] no-underline cursor-pointer
                 transition-all duration-[180ms] ease-out
                 hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
          [pTooltip]="isMini() ? item().label : ''"
          tooltipPosition="right"
          [attr.aria-label]="item().label"
          (click)="onMobileClose()"
        >
          <i [class]="item().icon"
             class="text-[15px] flex-shrink-0 w-4 flex justify-center
                    text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]
                    transition-colors duration-[180ms]"
             aria-hidden="true"></i>
          @if (!isMini()) {
            <span class="flex-1 truncate leading-snug">{{ item().label }}</span>
            @if (item().badge) {
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-[var(--font-weight-semibold)]
                           bg-[var(--accent-focus)] text-[var(--accent-primary)] leading-none">
                {{ item().badge }}
              </span>
            }
          }
        </a>
      } @else {
        <!-- ACCORDION PARENT: <button> for toggle action -->
        <button
          type="button"
          class="group relative flex items-center gap-2.5 w-full h-[38px] px-3 rounded-[10px]
                 text-[13px] font-[var(--font-weight-medium)]
                 text-[var(--text-secondary)] cursor-pointer
                 transition-all duration-[180ms] ease-out
                 hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
          [class.nav-link--parent-active]="isParentActive()"
          [pTooltip]="isMini() ? item().label : ''"
          tooltipPosition="right"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-label]="item().label + ' submenu'"
          (click)="handleParentClick()"
        >
          <i [class]="item().icon"
             class="text-[15px] flex-shrink-0 w-4 flex justify-center
                    text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]
                    transition-colors duration-[180ms]"
             aria-hidden="true"></i>
          @if (!isMini()) {
            <span class="flex-1 truncate leading-snug text-left">{{ item().label }}</span>
            <i class="pi pi-chevron-down text-[10px] flex-shrink-0 text-[var(--text-muted)]
                      transition-transform duration-[180ms] ease-out"
               [class.rotate-180]="isExpanded()"
               aria-hidden="true"></i>
          }
        </button>

        <!-- ── Level 2 accordion ─────────────────────────────────────────────── -->
        @if (!isMini()) {
          <div class="nav-accordion overflow-hidden transition-all duration-[180ms] ease-out"
               [class.max-h-0]="!isExpanded()"
               [class.max-h-[500px]]="isExpanded()">
            <div class="pl-4 pr-1 py-1 space-y-[2px] relative before:absolute before:left-[19px] before:top-1 before:bottom-1 before:w-[1px] before:bg-[var(--border-primary)]" role="group" [attr.aria-label]="item().label + ' items'">

              @for (child of item().items; track child.label) {

                @if (!child.items?.length) {
                  <!-- LV2 LEAF -->
                  <a
                    [routerLink]="child.routerLink"
                    routerLinkActive="nav-link--active"
                    [routerLinkActiveOptions]="{ exact: true }"
                    class="group relative flex items-center gap-2 w-full h-[34px] px-3 rounded-lg
                           text-[13px] font-[var(--font-weight-normal)]
                           text-[var(--text-secondary)] no-underline cursor-pointer
                           transition-all duration-[180ms] ease-out
                           hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
                    [attr.aria-label]="child.label"
                    (click)="onMobileClose()"
                  >
                    <span class="flex-1 truncate leading-snug">{{ child.label }}</span>
                    @if (child.badge) {
                      <span class="px-1.5 py-0.5 rounded-full text-[10px]
                                   font-[var(--font-weight-semibold)]
                                   bg-[var(--accent-focus)] text-[var(--accent-primary)] leading-none">
                        {{ child.badge }}
                      </span>
                    }
                  </a>
                } @else {
                  <!-- LV2 ACCORDION PARENT -->
                  <button
                    type="button"
                    class="group relative flex items-center gap-2 w-full h-[34px] px-3 rounded-lg
                           text-[13px] font-[var(--font-weight-normal)]
                           text-[var(--text-secondary)] cursor-pointer
                           transition-all duration-[180ms] ease-out
                           hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
                    [class.nav-link--parent-active]="activeParentLabels().has(child.label)"
                    [attr.aria-expanded]="expandedKeys().has(child.label)"
                    [attr.aria-label]="child.label + ' submenu'"
                    (click)="toggle.emit(child.label)"
                  >
                    <span class="flex-1 truncate leading-snug text-left">{{ child.label }}</span>
                    <i class="pi pi-chevron-down text-[9px] flex-shrink-0 text-[var(--text-muted)]
                      transition-transform duration-[180ms] ease-out"
                       [class.rotate-180]="expandedKeys().has(child.label)"
                       aria-hidden="true"></i>
                  </button>

                  <!-- ── Level 3 accordion ──────────────────────────────────── -->
                  <div class="overflow-hidden transition-all duration-[180ms] ease-out"
                       [class.max-h-0]="!expandedKeys().has(child.label)"
                       [class.max-h-[300px]]="expandedKeys().has(child.label)">
                    <div class="pl-4 pr-1 py-1 space-y-[2px] relative before:absolute before:left-[19px] before:top-1 before:bottom-1 before:w-[1px] before:bg-[var(--border-primary)]"
                         role="group"
                         [attr.aria-label]="child.label + ' items'">

                      @for (deep of child.items; track deep.label) {
                        <a
                          [routerLink]="deep.routerLink"
                          routerLinkActive="nav-link--active"
                          [routerLinkActiveOptions]="{ exact: true }"
                          class="group relative flex items-center gap-2 w-full h-[32px] px-3 rounded-lg
                                 text-[12px] font-[var(--font-weight-normal)]
                                 text-[var(--text-tertiary)] no-underline cursor-pointer
                                 transition-all duration-[180ms] ease-out
                                 hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-secondary)]
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
                          [attr.aria-label]="deep.label"
                          (click)="onMobileClose()"
                        >
                          <span class="flex-1 truncate leading-snug">{{ deep.label }}</span>
                        </a>
                      }

                    </div>
                  </div>
                }

              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .nav-link--active {
      background-color: color-mix(in srgb, var(--accent-primary) 8%, var(--component-bg));
      color: var(--text-primary) !important;
      font-weight: var(--font-weight-semibold) !important;
    }
    .nav-link--active i {
      color: var(--accent-primary) !important;
    }
    .nav-link--active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 3px;
      background-color: var(--accent-primary);
      border-radius: 0 2px 2px 0;
    }
    .nav-link--parent-active {
      color: var(--text-primary) !important;
      font-weight: var(--font-weight-semibold) !important;
    }
  `
})
export class SidebarNavItemComponent {
  private readonly layout = inject(LayoutService);

  // ── Inputs ─────────────────────────────────────────────────────────────────
  item = input.required<NavItem>();
  isMini = input<boolean>(false);
  expandedKeys = input<Set<string>>(new Set<string>());
  activeParentLabels = input<Set<string>>(new Set<string>());

  // ── Outputs ────────────────────────────────────────────────────────────────
  /** Emits label of accordion item to toggle (lv1 or lv2). */
  toggle = output<string>();

  // ── Computed state ─────────────────────────────────────────────────────────
  protected isLeaf = computed(() => !this.item().items?.length);
  protected isExpanded = computed(() => this.expandedKeys().has(this.item().label));
  protected isParentActive = computed(() => this.activeParentLabels().has(this.item().label));

  // ── Handlers ───────────────────────────────────────────────────────────────

  protected handleParentClick(): void {
    // In mini mode: exit mini mode first so the user can see the children
    if (this.layout.isMiniMode()) {
      this.layout.toggleMiniMode();
    }
    this.toggle.emit(this.item().label);
  }

  /** Close mobile drawer when navigating via a leaf link. */
  protected onMobileClose(): void {
    if (this.layout.isMobile()) {
      this.layout.closeMobile();
    }
  }
}


