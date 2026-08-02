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

@Component({
  selector: 'app-sidebar-nav-item',
  standalone: true,
  imports: [RouterModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ── Level 1 item ─────────────────────────────────────────────────────── -->
    <div class="relative mb-1">

      @if (isLeaf()) {
        <!-- LEAF: <a> for navigation -->
        <a
          [routerLink]="item().routerLink"
          routerLinkActive="l1-active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="group relative flex items-center gap-3.5 w-full h-[44px] px-4 rounded-[20px]
                 text-[14.5px] font-[var(--font-weight-medium)]
                 text-[var(--text-primary)] no-underline cursor-pointer
                 transition-all duration-300 ease-out
                 hover:bg-black/5 dark:hover:bg-white/5
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
          [class.mini-layout]="isMini()"
          [pTooltip]="isMini() ? item().label : ''"
          tooltipPosition="right"
          [attr.aria-label]="item().label"
          (click)="onMobileClose()"
        >
          <i [class]="item().icon"
             class="text-[1.15rem] flex-shrink-0 w-5 flex justify-center transition-colors duration-300"
             aria-hidden="true"></i>
             
          @if (!isMini()) {
            <span class="flex-1 truncate leading-snug tracking-tight">{{ item().label }}</span>
            @if (item().badge) {
              <span class="min-w-[22px] h-[22px] flex items-center justify-center rounded-full 
                           bg-[var(--text-primary)] text-[var(--bg-primary)] 
                           text-[10px] font-bold px-1.5 shadow-sm transition-colors duration-300">
                {{ item().badge }}
              </span>
            }
          }
        </a>
      } @else {
        <!-- ACCORDION PARENT: <button> for toggle action -->
        <button
          type="button"
          class="group relative flex items-center gap-3.5 w-full h-[44px] px-4 rounded-[20px]
                 text-[14.5px] font-[var(--font-weight-medium)]
                 text-[var(--text-primary)] cursor-pointer
                 transition-all duration-300 ease-out
                 hover:bg-black/5 dark:hover:bg-white/5
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
          [class.l1-parent-expanded]="!isMini() && isExpanded()"
          [class.mini-layout]="isMini()"
          [pTooltip]="isMini() ? item().label : ''"
          tooltipPosition="right"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-label]="item().label + ' submenu'"
          (click)="handleParentClick()"
        >
          <i [class]="item().icon"
             class="text-[1.15rem] flex-shrink-0 w-5 flex justify-center transition-colors duration-300"
             aria-hidden="true"></i>
             
          @if (!isMini()) {
            <span class="flex-1 truncate leading-snug tracking-tight text-left">{{ item().label }}</span>
            
            @if (item().badge) {
              <span class="min-w-[22px] h-[22px] flex items-center justify-center rounded-full 
                           bg-[var(--text-primary)] text-[var(--bg-primary)] 
                           text-[10px] font-bold px-1.5 shadow-sm mr-1 transition-colors duration-300">
                {{ item().badge }}
              </span>
            }
            
            <i class="pi text-[11px] flex-shrink-0 transition-transform duration-300 ease-out"
               [class.pi-plus]="!isExpanded()" [class.pi-minus]="isExpanded()"
               aria-hidden="true"></i>
          }
        </button>

        <!-- ── Level 2 accordion (File Tree Structure) ──────────────────────── -->
        @if (!isMini()) {
          <div class="nav-accordion overflow-hidden transition-all duration-300 ease-in-out"
               [class.max-h-0]="!isExpanded()"
               [class.max-h-[800px]]="isExpanded()">
            
            <!-- Structural Vertical Line -->
            <div class="ml-[26px] mt-2 pl-5 pb-2 border-l border-[var(--border-secondary)] relative" role="group">

              @for (child of item().items; track child.label) {
                @if (!child.items?.length) {
                  <!-- LV2 LEAF -->
                  <div class="relative l2-wrapper mb-1">
                    <!-- Structural Horizontal Branch -->
                    <div class="absolute left-[-20px] top-1/2 w-[14px] h-[1px] bg-[var(--border-secondary)] z-0"></div>
                    
                    <a
                      [routerLink]="child.routerLink"
                      routerLinkActive="l2-active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      class="relative z-10 group flex items-center gap-3 w-full h-[40px] px-3.5 rounded-[16px]
                             text-[13.5px] font-[var(--font-weight-medium)]
                             text-[var(--text-secondary)] no-underline cursor-pointer
                             transition-all duration-200 ease-out
                             hover:bg-black/5 dark:hover:bg-white/5
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                      (click)="onMobileClose()"
                    >
                      @if (child.icon) {
                        <i [class]="child.icon" class="text-[1.1rem] flex-shrink-0 transition-colors"></i>
                      }
                      <span class="flex-1 truncate tracking-tight">{{ child.label }}</span>
                      
                      @if (child.badge) {
                        <i class="pi pi-thumbtack text-[11px] text-[var(--text-muted)]"></i> <!-- E.g. pinned icon -->
                      }
                    </a>
                  </div>
                } @else {
                  <!-- LV2 ACCORDION PARENT -->
                  <div class="relative l2-wrapper mb-1">
                    <!-- Structural Horizontal Branch -->
                    <div class="absolute left-[-20px] top-1/2 w-[14px] h-[1px] bg-[var(--border-secondary)] z-0"></div>
                    
                    <button
                      type="button"
                      class="relative z-10 group flex items-center gap-3 w-full h-[40px] px-3.5 rounded-[16px]
                             text-[13.5px] font-[var(--font-weight-medium)]
                             text-[var(--text-secondary)] cursor-pointer
                             transition-all duration-200 ease-out
                             hover:bg-black/5 dark:hover:bg-white/5
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                      [class.font-semibold]="activeParentLabels().has(child.label)"
                      [class.text-[var(--text-primary)]]="activeParentLabels().has(child.label)"
                      [attr.aria-expanded]="expandedKeys().has(child.label)"
                      [attr.aria-label]="child.label + ' submenu'"
                      (click)="toggle.emit(child.label)"
                    >
                      @if (child.icon) {
                        <i [class]="child.icon" class="text-[1.1rem] flex-shrink-0 transition-colors" [class.text-[var(--text-primary)]]="activeParentLabels().has(child.label)"></i>
                      }
                      <span class="flex-1 truncate tracking-tight text-left">{{ child.label }}</span>
                      <i class="pi text-[10px] flex-shrink-0 text-[var(--text-muted)]
                        transition-transform duration-200 ease-out"
                         [class.pi-plus]="!expandedKeys().has(child.label)"
                         [class.pi-minus]="expandedKeys().has(child.label)"
                         aria-hidden="true"></i>
                    </button>

                    <!-- ── Level 3 accordion ──────────────────────────────────── -->
                    <div class="overflow-hidden transition-all duration-300 ease-in-out w-full"
                         [class.max-h-0]="!expandedKeys().has(child.label)"
                         [class.max-h-[500px]]="expandedKeys().has(child.label)">
                      <div class="ml-[18px] mt-1 pl-4 pb-1 border-l border-[var(--border-secondary)] relative"
                           role="group"
                           [attr.aria-label]="child.label + ' items'">

                        @for (deep of child.items; track deep.label) {
                          <div class="relative l3-wrapper mb-1">
                            <!-- Structural Horizontal Branch -->
                            <div class="absolute left-[-16px] top-1/2 w-[10px] h-[1px] bg-[var(--border-secondary)] z-0"></div>
                            <a
                              [routerLink]="deep.routerLink"
                              routerLinkActive="l3-active"
                              [routerLinkActiveOptions]="{ exact: true }"
                              class="relative z-10 group flex items-center gap-2 w-full h-[36px] px-3 rounded-[14px]
                                     text-[13px] font-[var(--font-weight-normal)]
                                     text-[var(--text-secondary)] no-underline cursor-pointer
                                     transition-all duration-200 ease-out
                                     hover:bg-black/5 dark:hover:bg-white/5
                                     focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
                              [attr.aria-label]="deep.label"
                              (click)="onMobileClose()"
                            >
                              @if (deep.icon) {
                                <i [class]="deep.icon" class="text-[1rem] flex-shrink-0 transition-colors"></i>
                              }
                              <span class="flex-1 truncate leading-snug">{{ deep.label }}</span>
                            </a>
                          </div>
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
       HIGH CONTRAST ACTIVE STATES (Matches "Threads" visual)
       ========================================================= */
       
    /* 1. Expanded Level 1 Parent (Dark Inverted Pill) */
    .l1-parent-expanded {
      background-color: var(--text-primary) !important; 
      color: var(--bg-primary) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .l1-parent-expanded i { color: var(--bg-primary) !important; }
    
    /* Reverse the badge colors inside an inverted active item */
    .l1-parent-expanded span.bg-\\[var\\(--text-primary\\)\\] {
      background-color: var(--bg-primary) !important;
      color: var(--text-primary) !important;
    }

    /* 2. Active Level 1 Leaf (Dark Inverted Pill) - Standard Mode */
    :not(.mini-layout).l1-active {
      background-color: var(--text-primary) !important;
      color: var(--bg-primary) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    :not(.mini-layout).l1-active i { color: var(--bg-primary) !important; }

    /* 3. Active Level 1 Leaf (White Elevated Pill) - Mini Mode */
    /* In the image's left panel, mini active items are white pills with dark icons */
    .mini-layout.l1-active {
      background-color: var(--bg-primary) !important;
      color: var(--text-primary) !important;
      box-shadow: var(--shadow-md);
    }
    .mini-layout.l1-active i { color: var(--text-primary) !important; }

    /* 4. Active Level 2 Child (White Elevated Pill) */
    /* E.g., "Enlarz System" */
    .l2-active {
      background-color: var(--bg-primary) !important;
      color: var(--text-primary) !important;
      box-shadow: var(--shadow-sm);
    }
    .l2-active i { color: var(--text-primary) !important; }

    /* 5. Active Level 3 Child */
    .l3-active {
      background-color: var(--bg-primary) !important;
      color: var(--text-primary) !important;
      font-weight: var(--font-weight-semibold) !important;
      box-shadow: var(--shadow-sm);
    }
    .l3-active i { color: var(--text-primary) !important; }
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
