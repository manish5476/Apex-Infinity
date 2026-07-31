// src/app/shared/ui/drawer/drawer.component.ts
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
export type DrawerPosition = 'right' | 'left' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Component: app-drawer
 * Purpose: Enterprise slide-out sidebar for record inspect views, contextual sub-tasks, and quick multi-field creation forms.
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
      [style]="{ width: drawerWidth() }"
      [showCloseIcon]="false"
      [dismissible]="dismissableMask()"
      [blockScroll]="true"
      (onHide)="handleCancel()"
      styleClass="app-enterprise-drawer">
      
      <!-- Drawer Header & Navigation -->
      <ng-template pTemplate="header">
        <div class="flex items-center justify-between w-full pb-[var(--spacing-md)] border-b border-[var(--border-primary)]">
          <div class="flex flex-col gap-0.5">
            <h3 class="text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] m-0">
              {{ title() }}
            </h3>
            @if (subtitle()) {
              <p class="text-[length:var(--font-size-xs)] text-[var(--text-secondary)] m-0">
                {{ subtitle() }}
              </p>
            }
          </div>

          <div class="flex items-center gap-[var(--spacing-sm)]">
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
      <div class="flex-1 overflow-y-auto py-[var(--spacing-xl)] pr-[var(--spacing-xs)] text-[var(--text-primary)]">
        <ng-content></ng-content>
      </div>

      <!-- Drawer Sticky Action Footer -->
      @if (showFooter()) {
        <ng-template pTemplate="footer">
          <div class="flex items-center justify-between w-full pt-[var(--spacing-md)] border-t border-[var(--border-primary)] bg-[var(--bg-primary)]">
            <div class="flex items-center gap-[var(--spacing-sm)]">
              <ng-content select="[footer-actions]"></ng-content>
            </div>

            <div class="flex items-center gap-[var(--spacing-sm)]">
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
  `
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

    protected drawerWidth = computed(() => {
        switch (this.size()) {
            case 'sm': return '380px';
            case 'md': return '540px';
            case 'lg': return '760px';
            case 'xl': return '960px';
            case 'full': return '100vw';
            default: return '540px';
        }
    });

    protected handleCancel(): void {
        this.visible.set(false);
        this.cancel.emit();
    }
}

