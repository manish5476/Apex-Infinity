// src/app/shared/ui/data/card.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

/**
 * Component: app-card
 * Purpose: Universal enterprise data container synced with APEX theme tokens.
 * Slots: [card-actions], Default (Body), [card-footer]
 */
@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full h-full'
  },
  template: `
    <div [class]="cardClasses()">
      
      @if (title() || subtitle()) {
        <div class="px-[var(--spacing-2xl)] py-[var(--spacing-xl)] border-b border-[var(--component-divider)] flex flex-col md:flex-row justify-between items-start md:items-center gap-[var(--spacing-md)] bg-[var(--bg-secondary)]">
          <div class="flex flex-col gap-[var(--spacing-xs)]">
            @if (title()) {
              <h3 class="text-[length:var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] m-0 tracking-tight">
                {{ title() }}
              </h3>
            }
            @if (subtitle()) {
              <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] m-0">
                {{ subtitle() }}
              </p>
            }
          </div>
          <div>
            <ng-content select="[card-actions]"></ng-content>
          </div>
        </div>
      }
      
      <div class="flex-1" [class]="bodyClasses()">
        <ng-content></ng-content>
      </div>
      
      <!-- Footer projection -->
      <ng-content select="[card-footer]"></ng-content>
    </div>
  `
})
export class CardComponent {
  title = input<string>();
  subtitle = input<string>();
  padded = input<boolean>(true);
  padding = input<'sm' | 'md' | 'lg'>('lg');
  shadow = input<'none' | 'sm' | 'md' | 'lg'>('sm');

  protected cardClasses = computed(() => {
    const s = {
      none: '',
      sm: 'shadow-[var(--elevation-1)]',
      md: 'shadow-[var(--elevation-2)]',
      lg: 'shadow-[var(--elevation-3)]'
    }[this.shadow()];

    return `bg-[var(--component-bg)] rounded-[var(--ui-border-radius)] ${s} border border-[var(--component-border)] overflow-hidden flex flex-col h-full transition-[var(--transition-base)] hover:shadow-[var(--elevation-2)]`;
  });

  protected bodyClasses = computed(() => {
    if (!this.padded()) return '';
    const p = {
      sm: 'p-[var(--spacing-lg)]',
      md: 'p-[var(--spacing-xl)]',
      lg: 'p-[var(--spacing-2xl)]'
    }[this.padding()];
    return p;
  });
}