// src/app/shared/ui/layout/page-header.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type PageHeaderDensity = 'compact' | 'normal' | 'comfortable';
export type PageHeaderVariant = 'solid' | 'transparent';
export type PageHeaderShadow = 'none' | 'sm' | 'md' | 'lg';

/**
 * Component: app-page-header
 * Purpose: Primary page header with title/subtitle, left/right content
 * projection slots, and an optional built-in toolbar row.
 *
 * Note: for new usage, prefer composing app-page-toolbar as a sibling
 * below this component rather than this header's [toolbar] slot — see
 * app-page-toolbar's doc comment. The built-in slot remains supported
 * for existing consumers and is styled to match app-page-toolbar's
 * padding scale for visual consistency between the two.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
  template: `
    <header
      class="app-page-header"
      [class.app-page-header--solid]="variant() === 'solid'"
      [class.app-page-header--transparent]="variant() === 'transparent'"
      [class.app-page-header--bordered]="border() && variant() === 'solid'"
      [class.app-page-header--shadow-sm]="shadow() === 'sm' && variant() === 'solid'"
      [class.app-page-header--shadow-md]="shadow() === 'md' && variant() === 'solid'"
      [class.app-page-header--shadow-lg]="shadow() === 'lg' && variant() === 'solid'">
      <div
        class="app-page-header__row"
        [class.app-page-header__row--compact]="density() === 'compact'"
        [class.app-page-header__row--normal]="density() === 'normal'"
        [class.app-page-header__row--comfortable]="density() === 'comfortable'">
        <!-- LEFT -->
        <div class="app-page-header__left">
          <ng-content select="[header-left]"></ng-content>
          <div class="app-page-header__heading">
            @if (title()) {
              <h1
                class="app-page-header__title"
                [class.app-page-header__title--compact]="density() === 'compact'"
                [class.app-page-header__title--normal]="density() === 'normal'"
                [class.app-page-header__title--comfortable]="density() === 'comfortable'">
                {{ title() }}
              </h1>
            }
            @if (subtitle()) {
              <p class="app-page-header__subtitle">{{ subtitle() }}</p>
            }
          </div>
        </div>
        <!-- RIGHT -->
        <div class="app-page-header__right">
          <ng-content></ng-content>
          <ng-content select="[header-right]"></ng-content>
        </div>
      </div>
      <!-- Toolbar -->
      @if (showToolbar()) {
        <div class="app-page-header__toolbar">
          <div class="app-page-header__toolbar-inner">
            <ng-content select="[toolbar]"></ng-content>
          </div>
        </div>
      }
    </header>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    :host.app-page-header-host--sticky {
      position: sticky;
      /* No dedicated --layout-sticky-offset token exists yet; falls back
         to the previous hardcoded 64px if the consuming app doesn't
         define one. Set --layout-sticky-offset on a parent (e.g. body,
         or the shell that owns the top nav) so this stays correct if
         that nav's height ever changes, instead of hardcoding it here. */
      top: var(--layout-sticky-offset, 64px);
      z-index: var(--z-sticky);
      backdrop-filter: blur(12px);
    }

    .app-page-header {
      width: 100%;
      transition: var(--transition-base);
    }

    .app-page-header--solid {
      border-radius: var(--ui-border-radius-lg);
      background: var(--bg-primary);
    }

    .app-page-header--transparent {
      background: transparent;
    }

    .app-page-header--bordered {
      border: var(--ui-border-width) solid var(--border-secondary);
    }

    .app-page-header--shadow-sm { box-shadow: var(--shadow-sm); }
    .app-page-header--shadow-md { box-shadow: var(--shadow-md); }
    .app-page-header--shadow-lg { box-shadow: var(--shadow-lg); }

    .app-page-header__row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2xl);
    }

    .app-page-header__row--compact {
      padding: var(--spacing-lg) var(--spacing-3xl);
    }

    .app-page-header__row--normal {
      padding: var(--spacing-xl) var(--spacing-4xl);
    }

    .app-page-header__row--comfortable {
      padding: var(--spacing-2xl) var(--spacing-5xl);
    }

    .app-page-header__left {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      flex: 1;
      min-width: 0;
    }

    .app-page-header__heading {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }

    .app-page-header__title {
      margin: 0;
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.01em;
      color: var(--text-primary);
      line-height: var(--line-height-tight);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Closest fluid-scale equivalents to the original 18/22/26px.
       Comfortable's 26px sits between --font-size-4xl (top ~28px) and
       --font-size-5xl (bottom ~28px) with no exact match; mapped to
       --font-size-5xl as the nearer token rather than a hardcoded value. */
    .app-page-header__title--compact    { font-size: var(--font-size-3xl); }
    .app-page-header__title--normal     { font-size: var(--font-size-4xl); }
    .app-page-header__title--comfortable{ font-size: var(--font-size-5xl); }

    .app-page-header__subtitle {
      margin: 0;
      margin-top: var(--spacing-xs);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
      color: var(--text-secondary);
    }

    .app-page-header__right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: var(--spacing-xl);
    }

    .app-page-header__toolbar {
      border-top: var(--ui-border-width) solid var(--border-secondary);
    }

    /* Matches app-page-toolbar's padded state so the two toolbar patterns
       look identical regardless of which one a consumer reaches for. */
    .app-page-header__toolbar-inner {
      padding: var(--spacing-lg) var(--spacing-3xl);
    }
  `],
})
export class PageHeaderComponent {
  title = input<string>();
  subtitle = input<string>();
  density = input<PageHeaderDensity>('compact');
  variant = input<PageHeaderVariant>('solid');
  sticky = input<boolean>(false);
  border = input<boolean>(true);
  shadow = input<PageHeaderShadow>('none');
  showToolbar = input<boolean>(false);

  protected hostClasses = computed(() => {
    return this.sticky()
      ? 'app-page-header-host app-page-header-host--sticky'
      : 'app-page-header-host';
  });
}

// import {
//   ChangeDetectionStrategy,
//   Component,
//   computed,
//   input
// } from '@angular/core';

// @Component({
//   selector: 'app-page-header',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,

//   host: {
//     '[class]': 'hostClasses()'
//   },

//   template: `
// <header
//   class="w-full transition-all duration-200"

//   [class.rounded-2xl]="variant() === 'solid'"
//   [class.bg-[var(--bg-primary)]]="variant() === 'solid'"
//   [class.bg-transparent]="variant() === 'transparent'"

//   [class.border]="border() && variant() === 'solid'"
//   [class.border-[var(--border-secondary)]]="border() && variant() === 'solid'"

//   [class.shadow-[var(--shadow-sm)]]="shadow() === 'sm' && variant() === 'solid'"
//   [class.shadow-[var(--shadow-md)]]="shadow() === 'md' && variant() === 'solid'"
//   [class.shadow-lg]="shadow() === 'lg' && variant() === 'solid'">

//   <div

//     class="flex flex-wrap items-center justify-between gap-6"
//     [class.px-6]="density() === 'compact'"
//     [class.py-3]="density() === 'compact'"
//     [class.px-8]="density() === 'normal'"
//     [class.py-4]="density() === 'normal'"
//     [class.px-10]="density() === 'comfortable'"
//     [class.py-6]="density() === 'comfortable'">

//     <!-- LEFT -->

//     <div class="flex-1 min-w-0 flex items-center gap-4">

//       <ng-content select="[header-left]"></ng-content>

//       <div class="flex flex-col justify-center">

//         @if(title()){

//         <h1

//           class="m-0
//                  font-bold
//                  tracking-tight
//                  text-[var(--text-primary)]
//                  leading-tight"

//           [class.text-[18px]]="density() === 'compact'"
//           [class.text-[22px]]="density() === 'normal'"
//           [class.text-[26px]]="density() === 'comfortable'">

//           {{title()}}

//         </h1>

//         }

//         @if(subtitle()){

//         <p

//           class="m-0
//                  mt-1
//                  text-sm
//                  leading-5
//                  text-[var(--text-secondary)]">

//           {{subtitle()}}

//         </p>

//         }

//       </div>
//     </div>

//     <!-- RIGHT -->

//     <div
//       class="flex
//              items-center
//              justify-end
//              gap-4
//              flex-wrap">

//       <ng-content></ng-content>

//       <ng-content select="[header-right]"></ng-content>

//     </div>

//   </div>

//   <!-- Toolbar -->

//   @if(showToolbar()){

//   <div class="border-t border-[var(--border-secondary)]">

//     <div class="px-5 py-3">

//       <ng-content select="[toolbar]"></ng-content>

//     </div>

//   </div>

//   }

// </header>
// `
// })
// export class PageHeaderComponent {

//   title = input<string>();

//   subtitle = input<string>();

//   // Compact is now default
//   density = input<'compact' | 'normal' | 'comfortable'>('compact');

//   variant = input<'solid' | 'transparent'>('solid');

//   sticky = input<boolean>(false);

//   border = input<boolean>(true);

//   shadow = input<'none' | 'sm' | 'md' | 'lg'>('none');

//   showToolbar = input<boolean>(false);

//   protected hostClasses = computed(() => {

//     return [

//       'block',

//       'w-full',

//       // Unified spacing tokens
//       '',

//       this.sticky()
//         ? 'sticky top-[64px] z-[var(--z-sticky)] backdrop-blur-md'
//         : ''

//     ]
//       .filter(Boolean)
//       .join(' ');

//   });

// }
