// src/app/shared/ui/dialog/dialog.component.ts
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Component: app-dialog
 * Purpose: Enterprise modal wrapper with dynamic sizing, standard header
 * hierarchy, and sticky submit/cancel footers. Fully token-driven —
 * no hardcoded colors, spacing, radius, or shadows.
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [styleClass]="panelClass()"
      [breakpoints]="{ '960px': '95vw', '640px': '100vw' }"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="dismissableMask()"
      [closable]="closable()"
      [blockScroll]="true"
      (onHide)="handleCancel()">

      <!-- Custom Header -->
      <ng-template pTemplate="header">
        <div class="app-dialog__header">
          <div class="app-dialog__heading">
            <h3 class="app-dialog__title">{{ title() }}</h3>
            @if (subtitle()) {
              <p class="app-dialog__subtitle">{{ subtitle() }}</p>
            }
          </div>
          <div class="app-dialog__header-actions">
            <ng-content select="[header-actions]"></ng-content>
          </div>
        </div>
      </ng-template>

      <!-- Main Body Content -->
      <div class="app-dialog__body">
        <ng-content></ng-content>
      </div>

      <!-- Action Footer -->
      @if (showFooter()) {
        <ng-template pTemplate="footer">
          <div class="app-dialog__footer">
            <div class="app-dialog__footer-actions">
              <ng-content select="[footer-actions]"></ng-content>
            </div>

            <div class="app-dialog__footer-buttons">
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
    </p-dialog>
  `,
  styles: [`
    /* ==========================================================================
       PANEL CHROME
       PrimeNG renders the dialog panel into a CDK overlay OUTSIDE this
       component's own DOM subtree (appended to body / ng-template content),
       so these rules must be global rather than view-encapsulated. This
       component does not set ViewEncapsulation.None — Angular still scopes
       :host, but PrimeNG overlay content is unaffected by that scoping,
       which is why plain global class selectors are used below instead of
       relying on component encapsulation.
       ========================================================================== */

    :host {
      display: contents;
    }

    ::ng-deep .app-dialog-panel {
      border-radius: var(--ui-border-radius-lg);
      border: var(--ui-border-width) solid var(--border-primary);
      box-shadow: var(--elevation-3);
      overflow: hidden;
    }

    ::ng-deep .app-dialog-panel .p-dialog-header {
      padding: var(--spacing-2xl);
      border-bottom: var(--ui-border-width) solid var(--border-primary);
      background: var(--bg-primary);
    }

    ::ng-deep .app-dialog-panel .p-dialog-content {
      padding: 0 var(--spacing-2xl);
      background: var(--bg-primary);
    }

    ::ng-deep .app-dialog-panel .p-dialog-footer {
      padding: 0;
      background: var(--bg-primary);
    }

    /* Width scale — no dedicated --overlay-width-* token exists yet in the
       theme file; recommend adding one. Centralized here as a single
       source rather than scattered across component logic. */
    ::ng-deep .app-dialog-panel--sm   { width: 26.25rem;  } /* 420px */
    ::ng-deep .app-dialog-panel--md   { width: 37.5rem;   } /* 600px */
    ::ng-deep .app-dialog-panel--lg   { width: 53.125rem; } /* 850px */
    ::ng-deep .app-dialog-panel--xl   { width: 68.75rem;  } /* 1100px */
    ::ng-deep .app-dialog-panel--full { width: 98vw; }

    @media (max-width: 960px) {
      ::ng-deep .app-dialog-panel--sm,
      ::ng-deep .app-dialog-panel--md,
      ::ng-deep .app-dialog-panel--lg,
      ::ng-deep .app-dialog-panel--xl {
        width: 95vw;
      }
    }

    @media (max-width: 640px) {
      ::ng-deep .app-dialog-panel--sm,
      ::ng-deep .app-dialog-panel--md,
      ::ng-deep .app-dialog-panel--lg,
      ::ng-deep .app-dialog-panel--xl,
      ::ng-deep .app-dialog-panel--full {
        width: 100vw;
      }
    }

    /* ==========================================================================
       HEADER
       ========================================================================== */

    ::ng-deep .app-dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: var(--spacing-xl);
    }

    ::ng-deep .app-dialog__heading {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    ::ng-deep .app-dialog__title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    ::ng-deep .app-dialog__subtitle {
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    ::ng-deep .app-dialog__header-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-shrink: 0;
    }

    /* ==========================================================================
       BODY
       ========================================================================== */

    ::ng-deep .app-dialog__body {
      padding: var(--spacing-xl) 0;
      color: var(--text-primary);
    }

    /* ==========================================================================
       FOOTER
       ========================================================================== */

    ::ng-deep .app-dialog__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: var(--spacing-xl) var(--spacing-2xl);
      background: var(--bg-secondary);
      border-top: var(--ui-border-width) solid var(--border-primary);
    }

    ::ng-deep .app-dialog__footer-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    ::ng-deep .app-dialog__footer-buttons {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
  `]
})
export class DialogComponent {
  visible = model<boolean>(false);
  title = input.required<string>();
  subtitle = input<string>('');
  size = input<DialogSize>('md');
  loading = input<boolean>(false);
  submitLabel = input<string>('Save');
  cancelLabel = input<string>('Cancel');
  submitSeverity = input<'primary' | 'secondary' | 'success' | 'danger' | 'warn' | 'info'>('primary');
  showFooter = input<boolean>(true);
  closable = input<boolean>(true);
  dismissableMask = input<boolean>(false);

  submit = output<void>();
  cancel = output<void>();

  protected panelClass = computed(() => `app-dialog-panel app-dialog-panel--${this.size()}`);

  protected handleCancel(): void {
    this.visible.set(false);
    this.cancel.emit();
  }
}
// // src/app/shared/ui/dialog/dialog.component.ts
// import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
// import { DialogModule } from 'primeng/dialog';
// import { ButtonModule } from 'primeng/button';

// export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// /**
//  * Component: app-dialog
//  * Purpose: Enterprise modal wrapper with dynamic sizing, standard header hierarchy, and sticky submit/cancel footers.
//  */
// @Component({
//     selector: 'app-dialog',
//     standalone: true,
//     imports: [DialogModule, ButtonModule],
//     changeDetection: ChangeDetectionStrategy.OnPush,
//     template: `
//     <p-dialog
//       [(visible)]="visible"
//       [modal]="true"
//       [style]="{ width: dialogWidth() }"
//       [breakpoints]="{ '960px': '95vw', '640px': '100vw' }"
//       [draggable]="false"
//       [resizable]="false"
//       [dismissableMask]="dismissableMask()"
//       [closable]="closable()"
//       [blockScroll]="true"
//       (onHide)="handleCancel()">
      
//       <!-- Custom Header -->
//       <ng-template pTemplate="header">
//         <div class="flex items-center justify-between w-full pr-4">
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
//           </div>
//         </div>
//       </ng-template>

//       <!-- Main Body Content -->
//       <div class="py-[var(--spacing-md)] text-[var(--text-primary)]">
//         <ng-content></ng-content>
//       </div>

//       <!-- Action Footer -->
//       @if (showFooter()) {
//         <ng-template pTemplate="footer">
//           <div class="flex items-center justify-between w-full pt-[var(--spacing-md)] border-t border-[var(--border-primary)]">
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
//     </p-dialog>
//   `
// })
// export class DialogComponent {
//     visible = model<boolean>(false);

//     title = input.required<string>();
//     subtitle = input<string>('');
//     size = input<DialogSize>('md');
//     loading = input<boolean>(false);
//     submitLabel = input<string>('Save');
//     cancelLabel = input<string>('Cancel');
//     submitSeverity = input<'primary' | 'secondary' | 'success' | 'danger' | 'warn' | 'info'>('primary');
//     showFooter = input<boolean>(true);
//     closable = input<boolean>(true);
//     dismissableMask = input<boolean>(false);

//     submit = output<void>();
//     cancel = output<void>();

//     protected dialogWidth = computed(() => {
//         switch (this.size()) {
//             case 'sm': return '420px';
//             case 'md': return '600px';
//             case 'lg': return '850px';
//             case 'xl': return '1100px';
//             case 'full': return '98vw';
//             default: return '600px';
//         }
//     });

//     protected handleCancel(): void {
//         this.visible.set(false);
//         this.cancel.emit();
//     }
// }


