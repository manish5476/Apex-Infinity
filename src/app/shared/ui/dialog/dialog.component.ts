// src/app/shared/ui/dialog/dialog.component.ts
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Component: app-dialog
 * Purpose: Enterprise modal wrapper with dynamic sizing, standard header hierarchy, and sticky submit/cancel footers.
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
      [style]="{ width: dialogWidth() }"
      [breakpoints]="{ '960px': '95vw', '640px': '100vw' }"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="dismissableMask()"
      [closable]="closable()"
      [blockScroll]="true"
      (onHide)="handleCancel()">
      
      <!-- Custom Header -->
      <ng-template pTemplate="header">
        <div class="flex items-center justify-between w-full pr-4">
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
          </div>
        </div>
      </ng-template>

      <!-- Main Body Content -->
      <div class="py-[var(--spacing-md)] text-[var(--text-primary)]">
        <ng-content></ng-content>
      </div>

      <!-- Action Footer -->
      @if (showFooter()) {
        <ng-template pTemplate="footer">
          <div class="flex items-center justify-between w-full pt-[var(--spacing-md)] border-t border-[var(--border-primary)]">
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
    </p-dialog>
  `
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

    protected dialogWidth = computed(() => {
        switch (this.size()) {
            case 'sm': return '420px';
            case 'md': return '600px';
            case 'lg': return '850px';
            case 'xl': return '1100px';
            case 'full': return '98vw';
            default: return '600px';
        }
    });

    protected handleCancel(): void {
        this.visible.set(false);
        this.cancel.emit();
    }
}


