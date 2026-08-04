// src/app/shared/ui/drawer/drawer.component.ts
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';

export type DrawerPosition = 'right' | 'left' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Component: app-drawer
 * Purpose: Enterprise slide-out sidebar for record inspect views, contextual
 * sub-tasks, and quick multi-field creation forms. Fully token-driven.
 */
@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [DrawerModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-drawer
      [(visible)]="visible"
      [position]="position()"
      [style]="panelDimension()"
      [showCloseIcon]="false"
      [dismissible]="dismissableMask()"
      [blockScroll]="true"
      (onHide)="handleCancel()"
      styleClass="app-drawer-panel">

      <!-- Drawer Header & Navigation -->
      <ng-template pTemplate="header">
        <div class="app-drawer__header">
          <div class="app-drawer__heading">
            <h3 class="app-drawer__title">{{ title() }}</h3>
            @if (subtitle()) {
              <p class="app-drawer__subtitle">{{ subtitle() }}</p>
            }
          </div>

          <div class="app-drawer__header-actions">
            <ng-content select="[header-actions]"></ng-content>
            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              size="small"
              (onClick)="handleCancel()">
            </p-button>
          </div>
        </div>
      </ng-template>

      <!-- Scrollable Container Body -->
      <div class="app-drawer__body">
        <ng-content></ng-content>
      </div>

      <!-- Drawer Sticky Action Footer -->
      @if (showFooter()) {
        <ng-template pTemplate="footer">
          <div class="app-drawer__footer">
            <div class="app-drawer__footer-actions">
              <ng-content select="[footer-actions]"></ng-content>
            </div>

            <div class="app-drawer__footer-buttons">
              <p-button
                [label]="cancelLabel()"
                severity="secondary"
                [outlined]="true"
                size="small"
                [disabled]="loading()"
                (onClick)="handleCancel()">
              </p-button>

              <p-button
                [label]="submitLabel()"
                [severity]="submitSeverity()"
                size="small"
                [loading]="loading()"
                (onClick)="submit.emit()">
              </p-button>
            </div>
          </div>
        </ng-template>
      }
    </p-drawer>
  `,
  styles: [`
    /* ==========================================================================
       PANEL CHROME
       p-drawer renders its panel into a CDK overlay outside this component's
       DOM subtree, so panel-level rules must be global. ::ng-deep + default
       encapsulation is used rather than ViewEncapsulation.None so any future
       :host-level rules stay scoped.
       ========================================================================== */

    :host {
      display: contents;
    }

    ::ng-deep .app-drawer-panel {
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      box-shadow: var(--elevation-3);
      /* PrimeNG applies radius only to the two edges facing away from the
         viewport edge the drawer slides from; base radius token still
         governs the corner treatment where supported. */
      border-radius: var(--ui-border-radius-lg);
    }

    ::ng-deep .app-drawer-panel .p-drawer-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      padding: 0 var(--spacing-2xl);
      background: var(--bg-primary);
    }

    ::ng-deep .app-drawer-panel .p-drawer-header {
      padding: var(--spacing-2xl) var(--spacing-2xl) 0;
      background: var(--bg-primary);
    }

    /* ==========================================================================
       HEADER
       ========================================================================== */

    ::ng-deep .app-drawer__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: var(--spacing-xl);
      padding-bottom: var(--spacing-md);
      border-bottom: var(--ui-border-width) solid var(--border-primary);
    }

    ::ng-deep .app-drawer__heading {
      display: flex;
      flex-direction: column;
      /* 2px is below the --spacing-xs floor on the fluid scale; kept as a
         literal micro-gap between title/subtitle rather than rounding up
         to --spacing-xs and loosening the header's vertical rhythm. */
      gap: 2px;
      min-width: 0;
    }

    ::ng-deep .app-drawer__title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    ::ng-deep .app-drawer__subtitle {
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    ::ng-deep .app-drawer__header-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-shrink: 0;
    }

    /* ==========================================================================
       BODY
       ========================================================================== */

    ::ng-deep .app-drawer__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: var(--spacing-xl) var(--spacing-xs) var(--spacing-xl) 0;
      color: var(--text-primary);
      scrollbar-width: thin;
      scrollbar-color: var(--scroll-thumb) var(--scroll-track);
    }

    ::ng-deep .app-drawer__body::-webkit-scrollbar {
      width: 6px;
    }

    ::ng-deep .app-drawer__body::-webkit-scrollbar-track {
      background: var(--scroll-track);
    }

    ::ng-deep .app-drawer__body::-webkit-scrollbar-thumb {
      background: var(--scroll-thumb);
      border-radius: var(--ui-border-radius-pill);
    }

    /* ==========================================================================
       FOOTER
       ========================================================================== */

    ::ng-deep .app-drawer__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: var(--spacing-md) var(--spacing-2xl) var(--spacing-2xl);
      background: var(--bg-primary);
      border-top: var(--ui-border-width) solid var(--border-primary);
    }

    ::ng-deep .app-drawer__footer-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    ::ng-deep .app-drawer__footer-buttons {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
  `]
})
export class DrawerComponent {
  visible = model<boolean>(false);

  title = input.required<string>();
  subtitle = input<string>('');
  position = input<DrawerPosition>('right');
  size = input<DrawerSize>('md');
  loading = input<boolean>(false);
  submitLabel = input<string>('Save Changes');
  cancelLabel = input<string>('Cancel');
  submitSeverity = input<'primary' | 'secondary' | 'success' | 'danger' | 'warn' | 'info'>('primary');
  showFooter = input<boolean>(true);
  dismissableMask = input<boolean>(true);

  submit = output<void>();
  cancel = output<void>();

  private sizeScale: Record<DrawerSize, string> = {
    sm: '23.75rem',  // 380px
    md: '33.75rem',  // 540px
    lg: '47.5rem',   // 760px
    xl: '60rem',     // 960px
    full: '100%',
  };

  /**
   * Left/right drawers size along width; top/bottom drawers size along
   * height. Applying `size` to the wrong axis was a bug in the original —
   * a top/bottom drawer with size="lg" was getting a 760px WIDTH instead
   * of a 760px HEIGHT, leaving it pinned as a narrow strip.
   */
  protected panelDimension = computed(() => {
    const dimension = this.sizeScale[this.size()];
    const isHorizontal = this.position() === 'left' || this.position() === 'right';
    return isHorizontal ? { width: dimension } : { height: dimension };
  });

  protected handleCancel(): void {
    this.visible.set(false);
    this.cancel.emit();
  }
}
// // src/app/shared/ui/drawer/drawer.component.ts
// import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
// import { ButtonModule } from 'primeng/button';
// import { DrawerModule } from 'primeng/drawer';
// export type DrawerPosition = 'right' | 'left' | 'top' | 'bottom';
// export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// /**
//  * Component: app-drawer
//  * Purpose: Enterprise slide-out sidebar for record inspect views, contextual sub-tasks, and quick multi-field creation forms.
//  */
// @Component({
//     selector: 'app-drawer',
//     standalone: true,
//     imports: [DrawerModule, ButtonModule],
//     changeDetection: ChangeDetectionStrategy.OnPush,
//     template: `
//     <p-drawer
//       [(visible)]="visible"
//       [position]="position()"
//       [style]="{ width: drawerWidth() }"
//       [showCloseIcon]="false"
//       [dismissible]="dismissableMask()"
//       [blockScroll]="true"
//       (onHide)="handleCancel()"
//       styleClass="app-enterprise-drawer">
      
//       <!-- Drawer Header & Navigation -->
//       <ng-template pTemplate="header">
//         <div class="flex items-center justify-between w-full pb-[var(--spacing-md)] border-b border-[var(--border-primary)]">
//           <div class="flex flex-col gap-0.5">
//             <h3 class="text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] m-0">
//               {{ title() }}
//             </h3>
//             @if (subtitle()) {
//               <p class="text-[length:var(--font-size-xs)] text-[var(--text-secondary)] m-0">
//                 {{ subtitle() }}
//               </p>
//             }
//           </div>

//           <div class="flex items-center gap-[var(--spacing-sm)]">
//             <ng-content select="[header-actions]"></ng-content>
//             <p-button
//               icon="pi pi-times"
//               [rounded]="true"
//               [text]="true"
//               severity="secondary"
//               size="small"
//               (onClick)="handleCancel()">
//             </p-button>
//           </div>
//         </div>
//       </ng-template>

//       <!-- Scrollable Container Body -->
//       <div class="flex-1 overflow-y-auto py-[var(--spacing-xl)] pr-[var(--spacing-xs)] text-[var(--text-primary)]">
//         <ng-content></ng-content>
//       </div>

//       <!-- Drawer Sticky Action Footer -->
//       @if (showFooter()) {
//         <ng-template pTemplate="footer">
//           <div class="flex items-center justify-between w-full pt-[var(--spacing-md)] border-t border-[var(--border-primary)] bg-[var(--bg-primary)]">
//             <div class="flex items-center gap-[var(--spacing-sm)]">
//               <ng-content select="[footer-actions]"></ng-content>
//             </div>

//             <div class="flex items-center gap-[var(--spacing-sm)]">
//               <p-button
//                 [label]="cancelLabel()"
//                 severity="secondary"
//                 [outlined]="true"
//                 size="small"
//                 [disabled]="loading()"
//                 (onClick)="handleCancel()">
//               </p-button>

//               <p-button
//                 [label]="submitLabel()"
//                 [severity]="submitSeverity()"
//                 size="small"
//                 [loading]="loading()"
//                 (onClick)="submit.emit()">
//               </p-button>
//             </div>
//           </div>
//         </ng-template>
//       }
//     </p-drawer>
//   `
// })
// export class DrawerComponent {
//     visible = model<boolean>(false);

//     title = input.required<string>();
//     subtitle = input<string>('');
//     position = input<DrawerPosition>('right');
//     size = input<DrawerSize>('md');
//     loading = input<boolean>(false);
//     submitLabel = input<string>('Save Changes');
//     cancelLabel = input<string>('Cancel');
//     submitSeverity = input<'primary' | 'secondary' | 'success' | 'danger' | 'warn' | 'info'>('primary');
//     showFooter = input<boolean>(true);
//     dismissableMask = input<boolean>(true);

//     submit = output<void>();
//     cancel = output<void>();

//     protected drawerWidth = computed(() => {
//         switch (this.size()) {
//             case 'sm': return '380px';
//             case 'md': return '540px';
//             case 'lg': return '760px';
//             case 'xl': return '960px';
//             case 'full': return '100vw';
//             default: return '540px';
//         }
//     });

//     protected handleCancel(): void {
//         this.visible.set(false);
//         this.cancel.emit();
//     }
// }

