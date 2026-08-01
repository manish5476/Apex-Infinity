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
  class="w-full transition-all duration-200"

  [class.rounded-2xl]="variant() === 'solid'"
  [class.bg-[var(--bg-primary)]]="variant() === 'solid'"
  [class.bg-transparent]="variant() === 'transparent'"

  [class.border]="border() && variant() === 'solid'"
  [class.border-[var(--border-secondary)]]="border() && variant() === 'solid'"

  [class.shadow-[var(--shadow-sm)]]="shadow() === 'sm' && variant() === 'solid'"
  [class.shadow-[var(--shadow-md)]]="shadow() === 'md' && variant() === 'solid'"
  [class.shadow-lg]="shadow() === 'lg' && variant() === 'solid'">

  <div

    class="flex flex-wrap items-center justify-between gap-6"
    [class.px-6]="density() === 'compact'"
    [class.py-3]="density() === 'compact'"
    [class.px-8]="density() === 'normal'"
    [class.py-4]="density() === 'normal'"
    [class.px-10]="density() === 'comfortable'"
    [class.py-6]="density() === 'comfortable'">

    <!-- LEFT -->

    <div class="flex-1 min-w-0 flex flex-col justify-center">

      <ng-content select="[header-left]"></ng-content>

      @if(title()){

      <h1

        class="m-0
               font-bold
               tracking-tight
               text-[var(--text-primary)]
               leading-tight"

        [class.text-[32px]]="density() === 'compact'"
        [class.text-[36px]]="density() === 'normal'"
        [class.text-[40px]]="density() === 'comfortable'">

        {{title()}}

      </h1>

      }

      @if(subtitle()){

      <p

        class="m-0
               mt-1
               text-sm
               leading-5
               text-[var(--text-secondary)]">

        {{subtitle()}}

      </p>

      }

    </div>

    <!-- RIGHT -->

    <div
      class="flex
             items-center
             justify-end
             gap-4
             flex-wrap">

      <ng-content></ng-content>

      <ng-content select="[header-right]"></ng-content>

    </div>

  </div>

  <!-- Toolbar -->

  @if(showToolbar()){

  <div class="border-t border-[var(--border-secondary)]">

    <div class="px-5 py-3">

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

  // Compact is now default
  density = input<'compact' | 'normal' | 'comfortable'>('compact');

  variant = input<'solid' | 'transparent'>('solid');

  sticky = input<boolean>(false);

  border = input<boolean>(true);

  shadow = input<'none' | 'sm' | 'md' | 'lg'>('none');

  showToolbar = input<boolean>(false);

  protected hostClasses = computed(() => {

    return [

      'block',

      'w-full',

      // Unified spacing tokens
      'mb-6',

      this.sticky()
        ? 'sticky top-[64px] z-[var(--z-sticky)] backdrop-blur-md'
        : ''

    ]
      .filter(Boolean)
      .join(' ');

  });

}