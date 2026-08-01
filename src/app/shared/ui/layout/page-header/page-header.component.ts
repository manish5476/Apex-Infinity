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

    class="flex flex-wrap items-center justify-between gap-5"
    [class.px-5]="density() === 'compact'"
    [class.py-3]="density() === 'compact'"
    [class.px-7]="density() === 'normal'"
    [class.py-5]="density() === 'normal'"
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

        [class.text-xl]="density() === 'compact'"
        [class.text-2xl]="density() === 'normal'"
        [class.text-3xl]="density() === 'comfortable'">

        {{title()}}

      </h1>

      }

      @if(subtitle()){

      <p

        class="m-0
               mt-1
               text-[13px]
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
             gap-3
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

      // Much smaller default spacing
      'mx-6',

      'mt-3',

      'mb-4',

      this.sticky()
        ? 'sticky top-[64px] z-[var(--z-sticky)] backdrop-blur-md'
        : ''

    ]
      .filter(Boolean)
      .join(' ');

  });

}