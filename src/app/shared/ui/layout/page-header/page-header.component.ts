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
      class="transition-all duration-200 w-full"
      [class.rounded-2xl]="variant() === 'solid'"
      [class.bg-[var(--bg-primary)]]="variant() === 'solid'"
      [class.bg-transparent]="variant() === 'transparent'"
      [class.border]="border() && variant() === 'solid'"
      [class.border-[var(--border-secondary)]]="border() && variant() === 'solid'"
      [class.shadow-[var(--shadow-sm)]]="shadow() === 'sm' && variant() === 'solid'"
      [class.shadow-[var(--shadow-md)]]="shadow() === 'md' && variant() === 'solid'"
      [class.shadow-lg]="shadow() === 'lg' && variant() === 'solid'">

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
                [class.text-lg]="density() === 'compact'"
                [class.text-xl]="density() === 'normal'"
                [class.text-2xl]="density() === 'comfortable'">
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
  variant = input<'solid' | 'transparent'>('solid');
  sticky = input<boolean>(true);
  border = input<boolean>(true);
  shadow = input<'none' | 'sm' | 'md' | 'lg'>('sm');
  showToolbar = input<boolean>(false);

  protected hostClasses = computed(() => {
    return [
      'block',
      'w-full',
      'mx-6 mt-6 mb-4',
      this.sticky() ? 'sticky top-0 z-[var(--z-sticky)]' : ''
    ].filter(Boolean).join(' ');
  });
}

