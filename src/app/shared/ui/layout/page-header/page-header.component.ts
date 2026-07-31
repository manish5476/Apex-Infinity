import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()'
  },
  template: `
    <header
      class="w-full bg-[var(--bg-primary)] transition-all duration-200"
      [class.border-b]="border()"
      [class.border-[var(--border-secondary)]]="border()"
      [class.shadow-[var(--shadow-xs)]]="shadow() === 'sm'"
      [class.shadow-[var(--shadow-md)]]="shadow() === 'md'">

      <!-- Main Header -->
      <div
        class="flex flex-row items-center justify-between gap-[var(--spacing-md)]"
        [class.px-[var(--spacing-xl)]]="density() === 'compact'"
        [class.py-[var(--spacing-md)]]="density() === 'compact'"
        [class.px-[var(--spacing-3xl)]]="density() === 'normal'"
        [class.py-[var(--spacing-2xl)]]="density() === 'normal'"
        [class.px-[var(--spacing-4xl)]]="density() === 'comfortable'"
        [class.py-[var(--spacing-3xl)]]="density() === 'comfortable'">

        <!-- LEFT: Custom Projection or Standard Title -->
        <div class="min-w-0 flex-1 flex flex-col justify-center">
          <ng-content select="[header-left]"></ng-content>

          @if (title()) {
            <h1 class="text-[var(--text-primary)] font-[var(--font-weight-bold)] tracking-tight leading-tight m-0"
                [class.text-[length:var(--font-size-lg)]]="density() === 'compact'"
                [class.text-[length:var(--font-size-2xl)]]="density() === 'normal'"
                [class.text-[length:var(--font-size-3xl)]]="density() === 'comfortable'">
              {{ title() }}
            </h1>
          }

          @if (subtitle()) {
            <p class="mt-1 text-[length:var(--font-size-sm)] text-[var(--text-secondary)] m-0">
              {{ subtitle() }}
            </p>
          }
        </div>

        <!-- RIGHT: Actions & Buttons -->
        <div class="flex flex-wrap items-center justify-end gap-[var(--spacing-md)]">
          <ng-content></ng-content>
          <ng-content select="[header-right]"></ng-content>
        </div>
      </div>

      <!-- Toolbar (Secondary Row) -->
      @if (showToolbar()) {
        <div class="border-t border-[var(--border-secondary)]">
          <div class="px-[var(--spacing-3xl)] py-[var(--spacing-md)]">
            <ng-content select="[toolbar]"></ng-content>
          </div>
        </div>
      }
    </header>
  `
})
export class PageHeaderComponent {
  title = input<string>();
  subtitle = input<string>();

  density = input<'compact' | 'normal' | 'comfortable'>('normal');
  sticky = input<boolean>(true);
  border = input<boolean>(true);
  shadow = input<'none' | 'sm' | 'md'>('sm');
  showToolbar = input<boolean>(false);

  protected hostClasses = computed(() => {
    return [
      'block',
      'w-full',
      this.sticky() ? 'sticky top-0 z-[var(--z-sticky)]' : ''
    ].filter(Boolean).join(' ');
  });
}

