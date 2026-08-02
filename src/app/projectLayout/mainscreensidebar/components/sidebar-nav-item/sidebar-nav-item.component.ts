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


// import {
//   ChangeDetectionStrategy,
//   Component,
//   computed,
//   inject,
//   input,
//   output,
// } from '@angular/core';
// import { RouterModule } from '@angular/router';
// import { TooltipModule } from 'primeng/tooltip';
// import { LayoutService } from '../../../layout.service';
// import { NavItem } from '../../navigation-model';

// /**
//  * SidebarNavItemComponent
//  *
//  * Renders a single level-1 navigation item and its complete subtree (lv2, lv3).
//  *
//  * Semantic rules (per the enterprise standard):
//  *   • Leaf items (routerLink, no children) → <a routerLink> — navigation, not action
//  *   • Accordion parents (no routerLink, has children) → <button> — action, not navigation
//  *
//  * Handles up to 3 levels inline (no recursion) for deterministic rendering.
//  * Active state is driven by routerLinkActive directive — no JS polling.
//  */
// @Component({
//   selector: 'app-sidebar-nav-item',
//   standalone: true,
//   imports: [RouterModule, TooltipModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <!-- ── Level 1 item ─────────────────────────────────────────────────────── -->
//     <div class="relative">

//       @if (isLeaf()) {
//         <!-- LEAF: <a> for navigation -->
//         <a
//           [routerLink]="item().routerLink"
//           routerLinkActive="nav-link--active"
//           [routerLinkActiveOptions]="{ exact: false }"
//           class="group relative flex items-center gap-2.5 w-full h-[36px] px-3 rounded-lg
//                  text-[13px] font-[var(--font-weight-medium)]
//                  text-[var(--text-secondary)] no-underline cursor-pointer
//                  transition-all duration-[180ms] ease-out
//                  hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
//                  focus-visible:outline-none focus-visible:ring-2
//                  focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
//           [pTooltip]="isMini() ? item().label : ''"
//           tooltipPosition="right"
//           [attr.aria-label]="item().label"
//           (click)="onMobileClose()"
//         >
//           <i [class]="item().icon"
//              class="text-[16px] flex-shrink-0 w-4 flex justify-center
//                     text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]
//                     transition-colors duration-[180ms]"
//              aria-hidden="true"></i>
//           @if (!isMini()) {
//             <span class="flex-1 truncate leading-snug">{{ item().label }}</span>
//             @if (item().badge) {
//               <span class="px-1.5 py-0.5 rounded-full text-[10px] font-[var(--font-weight-semibold)]
//                            bg-[var(--accent-focus)] text-[var(--accent-primary)] leading-none">
//                 {{ item().badge }}
//               </span>
//             }
//           }
//         </a>
//       } @else {
//         <!-- ACCORDION PARENT: <button> for toggle action -->
//         <button
//           type="button"
//           class="group relative flex items-center gap-2.5 w-full h-[36px] px-3 rounded-lg
//                  text-[13px] font-[var(--font-weight-medium)]
//                  text-[var(--text-secondary)] cursor-pointer
//                  transition-all duration-[180ms] ease-out
//                  hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
//                  focus-visible:outline-none focus-visible:ring-2
//                  focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
//           [class.nav-link--parent-active]="isParentActive()"
//           [pTooltip]="isMini() ? item().label : ''"
//           tooltipPosition="right"
//           [attr.aria-expanded]="isExpanded()"
//           [attr.aria-label]="item().label + ' submenu'"
//           (click)="handleParentClick()"
//         >
//           <i [class]="item().icon"
//              class="text-[16px] flex-shrink-0 w-4 flex justify-center
//                     text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]
//                     transition-colors duration-[180ms]"
//              aria-hidden="true"></i>
//           @if (!isMini()) {
//             <span class="flex-1 truncate leading-snug text-left">{{ item().label }}</span>
//             <i class="pi text-[10px] flex-shrink-0 text-[var(--text-muted)]
//                       transition-transform duration-[180ms] ease-out"
//                [class.pi-plus]="!isExpanded()" [class.pi-minus]="isExpanded()"
//                aria-hidden="true"></i>
//           }
//         </button>

//         <!-- ── Level 2 accordion ─────────────────────────────────────────────── -->
//         @if (!isMini()) {
//           <div class="nav-accordion overflow-hidden transition-all duration-[180ms] ease-out"
//                [class.max-h-0]="!isExpanded()"
//                [class.max-h-[500px]]="isExpanded()">
//             <div class="ml-[14px] pl-3 pr-1 py-1 space-y-[1px] border-l border-dashed border-[var(--border-secondary)] opacity-80" role="group" [attr.aria-label]="item().label + ' items'">

//               @for (child of item().items; track child.label) {

//                 @if (!child.items?.length) {
//                   <!-- LV2 LEAF -->
//                   <a
//                     [routerLink]="child.routerLink"
//                     routerLinkActive="nav-link--active"
//                     [routerLinkActiveOptions]="{ exact: true }"
//                     class="group relative flex items-center gap-2 w-full h-[32px] px-3 rounded-lg
//                            text-[13px] font-[var(--font-weight-normal)]
//                            text-[var(--text-secondary)] no-underline cursor-pointer
//                            transition-all duration-[180ms] ease-out
//                            hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
//                            focus-visible:outline-none focus-visible:ring-2
//                            focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
//                     [attr.aria-label]="child.label"
//                     (click)="onMobileClose()"
//                   >
//                     <span class="flex-1 truncate leading-snug">{{ child.label }}</span>
//                     @if (child.badge) {
//                       <span class="px-1.5 py-0.5 rounded-full text-[10px]
//                                    font-[var(--font-weight-semibold)]
//                                    bg-[var(--accent-focus)] text-[var(--accent-primary)] leading-none">
//                         {{ child.badge }}
//                       </span>
//                     }
//                   </a>
//                 } @else {
//                   <!-- LV2 ACCORDION PARENT -->
//                   <button
//                     type="button"
//                     class="group relative flex items-center gap-2 w-full h-[32px] px-3 rounded-lg
//                            text-[13px] font-[var(--font-weight-normal)]
//                            text-[var(--text-secondary)] cursor-pointer
//                            transition-all duration-[180ms] ease-out
//                            hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-primary)]
//                            focus-visible:outline-none focus-visible:ring-2
//                            focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
//                     [class.nav-link--parent-active]="activeParentLabels().has(child.label)"
//                     [attr.aria-expanded]="expandedKeys().has(child.label)"
//                     [attr.aria-label]="child.label + ' submenu'"
//                     (click)="toggle.emit(child.label)"
//                   >
//                     <span class="flex-1 truncate leading-snug text-left">{{ child.label }}</span>
//                     <i class="pi text-[9px] flex-shrink-0 text-[var(--text-muted)]
//                       transition-transform duration-[180ms] ease-out"
//                        [class.pi-plus]="!expandedKeys().has(child.label)"
//                        [class.pi-minus]="expandedKeys().has(child.label)"
//                        aria-hidden="true"></i>
//                   </button>

//                   <!-- ── Level 3 accordion ──────────────────────────────────── -->
//                   <div class="overflow-hidden transition-all duration-[180ms] ease-out"
//                        [class.max-h-0]="!expandedKeys().has(child.label)"
//                        [class.max-h-[300px]]="expandedKeys().has(child.label)">
//                     <div class="ml-[14px] pl-3 pr-1 py-1 space-y-[1px] border-l border-dashed border-[var(--border-secondary)] opacity-80"
//                          role="group"
//                          [attr.aria-label]="child.label + ' items'">

//                       @for (deep of child.items; track deep.label) {
//                         <a
//                           [routerLink]="deep.routerLink"
//                           routerLinkActive="nav-link--active"
//                           [routerLinkActiveOptions]="{ exact: true }"
//                           class="group relative flex items-center gap-2 w-full h-[32px] px-3 rounded-lg
//                                  text-[12px] font-[var(--font-weight-normal)]
//                                  text-[var(--text-tertiary)] no-underline cursor-pointer
//                                  transition-all duration-[180ms] ease-out
//                                  hover:bg-[var(--component-bg-hover)] hover:text-[var(--text-secondary)]
//                                  focus-visible:outline-none focus-visible:ring-2
//                                  focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
//                           [attr.aria-label]="deep.label"
//                           (click)="onMobileClose()"
//                         >
//                           <span class="flex-1 truncate leading-snug">{{ deep.label }}</span>
//                         </a>
//                       }

//                     </div>
//                   </div>
//                 }

//               }
//             </div>
//           </div>
//         }
//       }
//     </div>
//   `,
//   styles: `
//     .nav-link--active {
//       background-color: var(--accent-focus);
//       color: var(--text-primary) !important;
//       font-weight: var(--font-weight-semibold) !important;
//     }
//     .nav-link--active i {
//       color: var(--accent-primary) !important;
//     }
//     /* Child active state has a left border instead of standard left indicator */
//     .nav-accordion .nav-link--active {
//       background-color: var(--component-bg-hover);
//       color: var(--text-primary) !important;
//       border-left: 2px solid var(--text-primary);
//       border-radius: 4px 8px 8px 4px;
//     }
//     .nav-accordion .nav-link--active::before {
//       display: none;
//     }
//     /* Parent active state uses the accent left indicator */
//     .nav-link--active::before {
//       content: '';
//       position: absolute;
//       left: 0;
//       top: 6px;
//       bottom: 6px;
//       width: 3px;
//       background-color: var(--accent-primary);
//       border-radius: 0 4px 4px 0;
//     }
//     .nav-link--parent-active {
//       color: var(--text-primary) !important;
//       font-weight: var(--font-weight-semibold) !important;
//     }
//   `
// })
// export class SidebarNavItemComponent {
//   private readonly layout = inject(LayoutService);

//   // ── Inputs ─────────────────────────────────────────────────────────────────
//   item = input.required<NavItem>();
//   isMini = input<boolean>(false);
//   expandedKeys = input<Set<string>>(new Set<string>());
//   activeParentLabels = input<Set<string>>(new Set<string>());

//   // ── Outputs ────────────────────────────────────────────────────────────────
//   /** Emits label of accordion item to toggle (lv1 or lv2). */
//   toggle = output<string>();

//   // ── Computed state ─────────────────────────────────────────────────────────
//   protected isLeaf = computed(() => !this.item().items?.length);
//   protected isExpanded = computed(() => this.expandedKeys().has(this.item().label));
//   protected isParentActive = computed(() => this.activeParentLabels().has(this.item().label));

//   // ── Handlers ───────────────────────────────────────────────────────────────

//   protected handleParentClick(): void {
//     // In mini mode: exit mini mode first so the user can see the children
//     if (this.layout.isMiniMode()) {
//       this.layout.toggleMiniMode();
//     }
//     this.toggle.emit(this.item().label);
//   }

//   /** Close mobile drawer when navigating via a leaf link. */
//   protected onMobileClose(): void {
//     if (this.layout.isMobile()) {
//       this.layout.closeMobile();
//     }
//   }
// }


