// src/app/shared/ui/feedback/state-message.component.ts
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { ButtonModule } from 'primeng/button';

export type StateVariant = 'empty' | 'error' | 'success';

interface StateConfig {
    icon: string;
    iconBg: string;
    iconColor: string;
    border: string;
    bg: string;
    title: string;
    description: string;
    buttonSeverity: 'primary' | 'danger' | 'success';
}

const CONFIG: Record<StateVariant, StateConfig> = {
    empty: {
        icon: 'pi pi-folder-open',
        iconBg: 'bg-[var(--bg-ternary)]', iconColor: 'text-[var(--text-secondary)]',
        border: 'border-[var(--border-secondary)]', bg: 'bg-[var(--bg-secondary)]',
        title: 'No records found', description: 'There is no data available to display at this time.',
        buttonSeverity: 'primary',
    },
    error: {
        icon: 'pi pi-exclamation-triangle',
        iconBg: 'bg-[var(--color-error-light)]', iconColor: 'text-[var(--color-error)]',
        border: 'border-[var(--color-error-border)]', bg: 'bg-[var(--color-error-bg)]',
        title: 'Something went wrong', description: 'An unexpected error occurred while loading this data.',
        buttonSeverity: 'danger',
    },
    success: {
        icon: 'pi pi-check-circle',
        iconBg: 'bg-[var(--color-success-light)]', iconColor: 'text-[var(--color-success)]',
        border: 'border-[var(--color-success-border)]', bg: 'bg-[var(--color-success-bg)]',
        title: 'All done', description: 'The action completed successfully.',
        buttonSeverity: 'success',
    },
};

/**
 * Component: app-state-message
 * Purpose: Single feedback surface for empty / error / success states.
 * Replaces app-empty-state and app-error-state (~65 duplicated lines removed).
 */
@Component({
    selector: 'app-state-message',
    standalone: true,
    imports: [ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block w-full' },
    template: `
    <div
      class="flex flex-col items-center justify-center p-[var(--spacing-5xl)] text-center w-full rounded-[var(--ui-border-radius-lg)] border border-dashed"
      [class]="cfg().bg + ' ' + cfg().border">
      <div
        class="w-16 h-16 rounded-[var(--ui-border-radius-pill)] flex items-center justify-center mb-[var(--spacing-xl)]"
        [class]="cfg().iconBg + ' ' + cfg().iconColor">
        <i [class]="(icon() ?? cfg().icon) + ' text-[length:var(--font-size-3xl)]'"></i>
      </div>
      <h3 class="text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-[var(--spacing-xs)] tracking-tight">
        {{ title() ?? cfg().title }}
      </h3>
      <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] max-w-sm mb-[var(--spacing-3xl)]">
        {{ description() ?? cfg().description }}
      </p>
      @if (actionLabel()) {
        <p-button
          [label]="actionLabel()!"
          [icon]="actionIcon() || undefined"
          [severity]="cfg().buttonSeverity"
          size="small"
          (onClick)="action.emit()">
        </p-button>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class StateMessageComponent {
    variant = input<StateVariant>('empty');
    title = input<string>();
    description = input<string>();
    actionLabel = input<string>();
    actionIcon = input<string>();
    icon = input<string>();

    action = output<void>();

    protected cfg = computed(() => CONFIG[this.variant()]);
}