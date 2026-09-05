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
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../../layout.service';
import { NavItem } from '../../navigation-model';

@Component({
  selector: 'app-sidebar-nav-item',
  standalone: true,
  imports: [CommonModule, RouterModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ── Level 1 Item ──────────────────────────────────────────────────────── -->
    <div class="relative mb-0.5">
      @if (isLeaf()) {
        <!-- L1 Leaf Link -->
        <a
          [routerLink]="item().routerLink"
          routerLinkActive="nav-item-active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="nav-item-row group relative flex items-center gap-2.5 w-full h-[36px] px-3 rounded-xl
                 text-[12.5px] font-[var(--font-weight-medium)]
                 text-[var(--text-secondary)] no-underline cursor-pointer
                 transition-all duration-200 ease-out
                 hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
                 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)]"
          [class.mini-layout]="isMini()"
          [pTooltip]="isMini() ? item().label : ''"
          tooltipPosition="right"
          [attr.aria-label]="item().label"
          (click)="onMobileClose()"
        >
          <!-- Active Left Vertical Indicator Bar (rendered via CSS or pill) -->
          <span class="active-bar hidden w-[3.5px] h-4 rounded-full bg-[var(--accent-primary)] mr-0.5 shrink-0"></span>

          <i
            [class]="item().icon"
            class="text-[14px] flex-shrink-0 w-4 flex justify-center text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors"
            aria-hidden="true"
          ></i>

          @if (!isMini()) {
            <span class="flex-1 truncate leading-snug tracking-tight font-medium">{{ item().label }}</span>
            @if (item().badge) {
              <span
                class="min-w-[18px] h-[18px] flex items-center justify-center rounded-full
                       bg-[var(--accent-focus)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30
                       text-[9.5px] font-bold px-1.5 shadow-xs transition-colors"
              >
                {{ item().badge }}
              </span>
            }
          }
        </a>
      } @else {
        <!-- L1 Parent Accordion Toggle -->
        <button
          type="button"
          class="nav-item-row group relative flex items-center gap-2.5 w-full h-[36px] px-3 rounded-xl
                 text-[12.5px] font-[var(--font-weight-medium)]
                 text-[var(--text-secondary)] cursor-pointer
                 transition-all duration-200 ease-out
                 hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
                 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)]"
          [class.nav-parent-open]="!isMini() && isExpanded()"
          [class.mini-layout]="isMini()"
          [pTooltip]="isMini() ? item().label : ''"
          tooltipPosition="right"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-label]="item().label + ' submenu'"
          (click)="handleParentClick()"
        >
          <span class="active-bar hidden w-[3.5px] h-4 rounded-full bg-[var(--accent-primary)] mr-0.5 shrink-0"></span>

          <i
            [class]="item().icon"
            class="text-[14px] flex-shrink-0 w-4 flex justify-center text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors"
            aria-hidden="true"
          ></i>

          @if (!isMini()) {
            <span class="flex-1 truncate leading-snug tracking-tight text-left font-medium">
              {{ item().label }}
            </span>

            @if (item().badge) {
              <span
                class="min-w-[18px] h-[18px] flex items-center justify-center rounded-full
                       bg-[var(--accent-focus)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30
                       text-[9.5px] font-bold px-1.5 mr-1 shadow-xs"
              >
                {{ item().badge }}
              </span>
            }

            <i
              class="pi text-[9.5px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] flex-shrink-0 transition-transform duration-200 ease-out"
              [class.pi-chevron-down]="!isExpanded()"
              [class.pi-chevron-up]="isExpanded()"
              aria-hidden="true"
            ></i>
          }
        </button>

        <!-- ── Level 2 Accordion List ────────────────────────────────────── -->
        @if (!isMini()) {
          <div
            class="overflow-hidden transition-all duration-200 ease-in-out pl-2.5"
            [class.max-h-0]="!isExpanded()"
            [class.max-h-[1000px]]="isExpanded()"
          >
            <div class="space-y-[2px] pt-1 pb-1" role="group">
              @for (child of item().items; track child.label) {
                @if (!child.items?.length) {
                  <!-- Level 2 Leaf Link -->
                  <a
                    [routerLink]="child.routerLink"
                    routerLinkActive="nav-item-active"
                    [routerLinkActiveOptions]="{ exact: true }"
                    class="nav-item-row group flex items-center gap-2 w-full h-[32px] pl-5 pr-2.5 rounded-lg
                           text-[11.5px] font-normal
                           text-[var(--text-secondary)] no-underline cursor-pointer
                           transition-all duration-150 ease-out
                           hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]"
                    (click)="onMobileClose()"
                  >
                    <span class="active-bar hidden w-[3px] h-3.5 rounded-full bg-[var(--accent-primary)] mr-0.5 shrink-0"></span>
                    @if (child.icon) {
                      <i [class]="child.icon" class="text-[12px] flex-shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors"></i>
                    }
                    <span class="flex-1 truncate tracking-tight">{{ child.label }}</span>
                  </a>
                } @else {
                  <!-- Level 2 Parent Accordion -->
                  <div class="relative">
                    <button
                      type="button"
                      class="nav-item-row group flex items-center gap-2 w-full h-[32px] pl-5 pr-2.5 rounded-lg
                             text-[11.5px] font-normal
                             text-[var(--text-secondary)] cursor-pointer
                             transition-all duration-150 ease-out
                             hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]"
                      [class.text-[var(--text-primary)]]="activeParentLabels().has(child.label)"
                      [class.font-semibold]="activeParentLabels().has(child.label)"
                      [attr.aria-expanded]="expandedKeys().has(child.label)"
                      (click)="toggle.emit(child.label)"
                    >
                      @if (child.icon) {
                        <i [class]="child.icon" class="text-[12px] flex-shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors"></i>
                      }
                      <span class="flex-1 truncate tracking-tight text-left">{{ child.label }}</span>
                      <i
                        class="pi text-[8.5px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] flex-shrink-0 transition-transform duration-200"
                        [class.pi-chevron-down]="!expandedKeys().has(child.label)"
                        [class.pi-chevron-up]="expandedKeys().has(child.label)"
                      ></i>
                    </button>

                    <!-- Level 3 Accordion Items -->
                    <div
                      class="overflow-hidden transition-all duration-200 ease-in-out pl-3"
                      [class.max-h-0]="!expandedKeys().has(child.label)"
                      [class.max-h-[600px]]="expandedKeys().has(child.label)"
                    >
                      <div class="space-y-[2px] pt-1 pb-1" role="group">
                        @for (deep of child.items; track deep.label) {
                          <a
                            [routerLink]="deep.routerLink"
                            routerLinkActive="nav-item-active"
                            [routerLinkActiveOptions]="{ exact: true }"
                            class="nav-item-row group flex items-center gap-2 w-full h-[28px] pl-5 pr-2 rounded-md
                                   text-[11px] font-normal
                                   text-[var(--text-secondary)] no-underline cursor-pointer
                                   transition-all duration-150 ease-out
                                   hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]"
                            (click)="onMobileClose()"
                          >
                            <span class="active-bar hidden w-[2.5px] h-3 rounded-full bg-[var(--accent-primary)] mr-0.5 shrink-0"></span>
                            @if (deep.icon) {
                              <i [class]="deep.icon" class="text-[11px] flex-shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"></i>
                            }
                            <span class="flex-1 truncate tracking-tight">{{ deep.label }}</span>
                          </a>
                        }
                      </div>
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
    /* =========================================================
       THEME-TOKEN ACCENT PILL ACTIVE STATES
       ========================================================= */

    /* Active Item Highlight */
    .nav-item-active {
      background: var(--accent-focus, color-mix(in srgb, var(--accent-primary) 18%, transparent)) !important;
      color: var(--accent-primary) !important;
      font-weight: 700 !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .nav-item-active i {
      color: var(--accent-primary) !important;
    }

    /* Show Left Accent Bar on Active Item */
    .nav-item-active .active-bar {
      display: inline-block !important;
    }

    /* Active Item in Mini Mode */
    .mini-layout.nav-item-active {
      background: var(--accent-focus, color-mix(in srgb, var(--accent-primary) 18%, transparent)) !important;
      color: var(--accent-primary) !important;
    }

    .mini-layout.nav-item-active i {
      color: var(--accent-primary) !important;
    }

    /* Open parent soft highlight */
    .nav-parent-open {
      color: var(--text-primary) !important;
    }

    .nav-parent-open i {
      color: var(--accent-primary) !important;
    }
  `
})
export class SidebarNavItemComponent {
  private readonly layout = inject(LayoutService);

  item = input.required<NavItem>();
  isMini = input<boolean>(false);
  expandedKeys = input<Set<string>>(new Set<string>());
  activeParentLabels = input<Set<string>>(new Set<string>());
  toggle = output<string>();

  protected isLeaf = computed(() => !this.item().items?.length);
  protected isExpanded = computed(() => this.expandedKeys().has(this.item().label));
  protected isParentActive = computed(() => this.activeParentLabels().has(this.item().label));

  protected handleParentClick(): void {
    if (this.layout.isMiniMode()) {
      this.layout.toggleMiniMode();
    }
    this.toggle.emit(this.item().label);
  }

  protected onMobileClose(): void {
    if (this.layout.isMobile()) {
      this.layout.closeMobile();
    }
  }
}

