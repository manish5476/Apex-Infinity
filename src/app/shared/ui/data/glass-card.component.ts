// src/app/shared/ui/data/glass-card.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
    selector: 'app-glass-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'block w-full h-full'
    },
    template: `
    <div [class]="cardClasses()">
      <!-- Ambient Glow Backdrop -->
      @if (glow()) {
        <div class="absolute -top-12 -right-12 w-32 h-32 bg-[var(--accent-primary)] opacity-20 blur-2xl pointer-events-none rounded-full"></div>
      }

      @if (title()) {
        <div class="px-[var(--spacing-2xl)] py-[var(--spacing-xl)] border-b border-[var(--glass-border-c)] flex justify-between items-center relative z-10">
          <h4 class="text-[length:var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] m-0">
            {{ title() }}
          </h4>
          <ng-content select="[card-actions]"></ng-content>
        </div>
      }

      <div class="relative z-10 h-full" [class.p-[var(--spacing-2xl)]]="padded()">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class GlassCardComponent {
    title = input<string>();
    padded = input<boolean>(true);
    glow = input<boolean>(true);
    interactive = input<boolean>(true);

    protected cardClasses = computed(() => {
        const base = `relative overflow-hidden rounded-[var(--ui-border-radius-lg)] 
                  bg-[var(--glass-bg-c,#ffffff10)] backdrop-blur-[12px] 
                  border border-[var(--glass-border-c,rgba(255,255,255,0.15))] 
                  shadow-[var(--glass-shadow-c)] transition-[var(--transition-base)] h-full`;

        const hover = this.interactive()
            ? 'hover:-translate-y-1 hover:border-[var(--accent-primary)] hover:shadow-[var(--elevation-3)]'
            : '';

        return `${base} ${hover}`;
    });
}