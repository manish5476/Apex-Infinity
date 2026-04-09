/**
 * ============================================================
 * ERP Directives Collection — Angular 21 Standalone
 * ============================================================
 * Covers: Permissions, Auto-focus, Click Outside, Debounce,
 *         Input Restrictions, Tooltips, Drag & Drop,
 *         Infinite Scroll, Copy, Highlight, Lazy Image.
 * ============================================================
 */

import {
  Directive, Input, Output, EventEmitter, ElementRef, HostListener,
  OnInit, OnDestroy, Renderer2, inject, effect, signal, NgModule
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { CommonMethodService } from '@core/utils/common-method.service';
import { PermissionService } from '@core/auth';

// ─────────────────────────────────────────────────────────────
// 1. HAS PERMISSION DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Hides element if user lacks permission.
 * Usage: <button *hasPermission="'invoice.create'">Add Invoice</button>
 *        <div *hasPermission="['hr.read', 'hr.write']">...</div>
 */
@Directive({ selector: '[hasPermission]', standalone: true })
export class HasPermissionDirective implements OnInit {
  @Input() hasPermission!: string | string[];
  @Input() hasPermissionMode: 'any' | 'all' = 'any';

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly cms = inject(CommonMethodService);
  private readonly permission = inject(PermissionService);

  ngOnInit(): void {
    const perms = Array.isArray(this.hasPermission) ? this.hasPermission : [this.hasPermission];
    const granted = this.hasPermissionMode === 'all'
      ? this.permission.hasAllPermissions(perms)
      : this.permission.hasAnyPermission(perms);
    if (!granted) this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
  }
}

// ─────────────────────────────────────────────────────────────
// 2. AUTOFOCUS DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: <input erpAutofocus />
 *        <input [erpAutofocus]="isModalOpen" />
 */
@Directive({ selector: '[erpAutofocus]', standalone: true })
export class AutofocusDirective implements OnInit {
  @Input() erpAutofocus: boolean | '' = true;
  private readonly el = inject(ElementRef);

  ngOnInit(): void {
    const shouldFocus = this.erpAutofocus === '' || this.erpAutofocus === true;
    if (shouldFocus) setTimeout(() => this.el.nativeElement.focus(), 50);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. CLICK OUTSIDE DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: <div (clickOutside)="closeDropdown()">...</div>
 */
@Directive({ selector: '[clickOutside]', standalone: true })
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();
  private readonly el = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  onClick(target: EventTarget | null): void {
    if (target && !this.el.nativeElement.contains(target as Node)) {
      this.clickOutside.emit();
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 4. DEBOUNCE CLICK DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Prevents double-clicks / rapid submissions.
 * Usage: <button (debounceClick)="save()" [debounceTime]="800">Save</button>
 */
@Directive({ selector: '[debounceClick]', standalone: true })
export class DebounceClickDirective implements OnInit, OnDestroy {
  @Input() debounceTime = 500;
  @Output() debounceClick = new EventEmitter<MouseEvent>();

  private readonly clicks$ = new Subject<MouseEvent>();
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.clicks$.pipe(
      debounceTime(this.debounceTime),
      takeUntil(this.destroy$)
    ).subscribe(e => this.debounceClick.emit(e));
  }

  @HostListener('click', ['$event'])
  onHostClick(e: MouseEvent): void { this.clicks$.next(e); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}

// ─────────────────────────────────────────────────────────────
// 5. NUMBERS ONLY DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: <input numbersOnly />
 *        <input numbersOnly [allowDecimal]="true" />
 *        <input numbersOnly [allowNegative]="true" />
 */
@Directive({ selector: '[numbersOnly]', standalone: true })
export class NumbersOnlyDirective {
  @Input() allowDecimal = false;
  @Input() allowNegative = false;

  @HostListener('keypress', ['$event'])
  onKeyPress(e: KeyboardEvent): boolean {
    const char = e.key;
    if (char === '-' && this.allowNegative && (e.target as HTMLInputElement).selectionStart === 0) return true;
    if (char === '.' && this.allowDecimal && !(e.target as HTMLInputElement).value.includes('.')) return true;
    return /^[0-9]$/.test(char);
  }

  @HostListener('paste', ['$event'])
  onPaste(e: ClipboardEvent): void {
    const pasted = e.clipboardData?.getData('text') ?? '';
    const pattern = this.allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
    if (!pattern.test(pasted)) e.preventDefault();
  }
}

// ─────────────────────────────────────────────────────────────
// 6. ALPHA ONLY DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: <input alphaOnly />
 *        <input alphaOnly [allowSpaces]="true" />
 */
@Directive({ selector: '[alphaOnly]', standalone: true })
export class AlphaOnlyDirective {
  @Input() allowSpaces = true;

  @HostListener('keypress', ['$event'])
  onKeyPress(e: KeyboardEvent): boolean {
    const pattern = this.allowSpaces ? /^[a-zA-Z ]$/ : /^[a-zA-Z]$/;
    return pattern.test(e.key);
  }
}

// ─────────────────────────────────────────────────────────────
// 7. UPPERCASE INPUT DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Transforms input to uppercase as user types.
 * Usage: <input uppercaseInput />   (PAN, IFSC, GST fields)
 */
@Directive({ selector: '[uppercaseInput]', standalone: true })
export class UppercaseInputDirective {
  private readonly el = inject(ElementRef);

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement as HTMLInputElement;
    const pos = input.selectionStart;
    input.value = input.value.toUpperCase();
    input.setSelectionRange(pos, pos);
  }
}

// ─────────────────────────────────────────────────────────────
// 8. MAX LENGTH WITH COUNTER DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Shows character count below input/textarea.
 * Usage: <textarea [charCounter]="200"></textarea>
 */
@Directive({ selector: '[charCounter]', standalone: true })
export class CharCounterDirective implements OnInit, OnDestroy {
  @Input() charCounter = 100;

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private counter!: HTMLElement;

  ngOnInit(): void {
    this.counter = this.renderer.createElement('small');
    this.renderer.addClass(this.counter, 'char-counter');
    this.el.nativeElement.maxLength = this.charCounter;
    this._updateCounter();
    this.renderer.insertBefore(
      this.el.nativeElement.parentNode,
      this.counter,
      this.el.nativeElement.nextSibling
    );
  }

  @HostListener('input')
  onInput(): void { this._updateCounter(); }

  private _updateCounter(): void {
    const len = (this.el.nativeElement as HTMLInputElement).value.length;
    const remaining = this.charCounter - len;
    this.counter.textContent = `${len}/${this.charCounter}`;
    this.counter.style.color = remaining < 10 ? '#ef4444' : '#6b7280';
  }

  ngOnDestroy(): void { this.counter?.remove(); }
}

// ─────────────────────────────────────────────────────────────
// 9. TOOLTIP DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: <span [erpTooltip]="'Click to copy GST number'">GST</span>
 *        <span [erpTooltip]="'Delete record'" tooltipPlacement="bottom">🗑</span>
 */
@Directive({ selector: '[erpTooltip]', standalone: true })
export class TooltipDirective implements OnDestroy {
  @Input() erpTooltip = '';
  @Input() tooltipPlacement: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() tooltipDelay = 200;

  private tip: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @HostListener('mouseenter')
  onEnter(): void {
    this.timer = setTimeout(() => this._show(), this.tooltipDelay);
  }

  @HostListener('mouseleave')
  onLeave(): void {
    if (this.timer) clearTimeout(this.timer);
    this._hide();
  }

  private _show(): void {
    this.tip = this.renderer.createElement('div');
    this.renderer.addClass(this.tip, 'erp-tooltip');
    this.renderer.addClass(this.tip, `erp-tooltip--${this.tooltipPlacement}`);
    this.renderer.setProperty(this.tip, 'textContent', this.erpTooltip);
    this.renderer.appendChild(document.body, this.tip);
    const rect = this.el.nativeElement.getBoundingClientRect();
    const tipEl = this.tip!;
    tipEl.style.position = 'fixed';
    tipEl.style.zIndex = '9999';
    const pos = { top: 0, left: 0 };
    const gap = 8;
    switch (this.tooltipPlacement) {
      case 'top': pos.top = rect.top - tipEl.offsetHeight - gap; pos.left = rect.left + rect.width / 2; break;
      case 'bottom': pos.top = rect.bottom + gap; pos.left = rect.left + rect.width / 2; break;
      case 'left': pos.top = rect.top + rect.height / 2; pos.left = rect.left - tipEl.offsetWidth - gap; break;
      case 'right': pos.top = rect.top + rect.height / 2; pos.left = rect.right + gap; break;
    }
    tipEl.style.top = `${pos.top}px`;
    tipEl.style.left = `${pos.left}px`;
  }

  private _hide(): void {
    if (this.tip) { this.renderer.removeChild(document.body, this.tip); this.tip = null; }
  }

  ngOnDestroy(): void { this._hide(); }
}

// ─────────────────────────────────────────────────────────────
// 10. COPY TO CLIPBOARD DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: <span [copyClipboard]="invoiceNumber">{{ invoiceNumber }}</span>
 */
@Directive({ selector: '[copyClipboard]', standalone: true })
export class CopyClipboardDirective {
  @Input() copyClipboard = '';
  @Output() copied = new EventEmitter<string>();
  private readonly cms = inject(CommonMethodService);

  @HostListener('click')
  async onClick(): Promise<void> {
    if (!this.copyClipboard) return;
    await this.cms.copyToClipboard(this.copyClipboard);
    this.copied.emit(this.copyClipboard);
  }
}

// ─────────────────────────────────────────────────────────────
// 11. INFINITE SCROLL DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Usage: <div infiniteScroll (loadMore)="loadNextPage()" [threshold]="150">...</div>
 */
@Directive({ selector: '[infiniteScroll]', standalone: true })
export class InfiniteScrollDirective implements OnDestroy {
  @Input() threshold = 100;
  @Output() loadMore = new EventEmitter<void>();

  private observer: IntersectionObserver;
  private readonly el = inject(ElementRef);

  constructor() {
    this.observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting) this.loadMore.emit();
      },
      { rootMargin: `${this.threshold}px` }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void { this.observer.disconnect(); }
}

// ─────────────────────────────────────────────────────────────
// 12. LAZY IMAGE DIRECTIVE
// ─────────────────────────────────────────────────────────────

/**
 * Lazy-loads images using IntersectionObserver.
 * Usage: <img [lazySrc]="imageUrl" [lazyPlaceholder]="'assets/placeholder.svg'" />
 */
@Directive({ selector: '[lazySrc]', standalone: true })
export class LazyImageDirective implements OnDestroy {
  @Input() lazySrc = '';
  @Input() lazyPlaceholder = '';

  private observer: IntersectionObserver;
  private readonly el = inject(ElementRef);

  constructor() {
    if (this.lazyPlaceholder) this.el.nativeElement.src = this.lazyPlaceholder;
    this.observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        this.el.nativeElement.src = this.lazySrc;
        this.observer.disconnect();
      }
    });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void { this.observer.disconnect(); }
}

// ─────────────────────────────────────────────────────────────
// 13. DRAG SCROLL DIRECTIVE (horizontal scroll via drag)
// ─────────────────────────────────────────────────────────────

/**
 * Makes a container horizontally draggable (table overflow scroll).
 * Usage: <div dragScroll class="table-wrapper">...</div>
 */
@Directive({ selector: '[dragScroll]', standalone: true })
export class DragScrollDirective {
  private isDragging = false;
  private startX = 0;
  private scrollLeft = 0;
  private readonly el = inject(ElementRef);

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.startX = e.pageX - this.el.nativeElement.offsetLeft;
    this.scrollLeft = this.el.nativeElement.scrollLeft;
    this.el.nativeElement.style.cursor = 'grabbing';
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
    this.el.nativeElement.style.cursor = 'grab';
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    e.preventDefault();
    const x = e.pageX - this.el.nativeElement.offsetLeft;
    this.el.nativeElement.scrollLeft = this.scrollLeft - (x - this.startX) * 1.5;
  }
}

// ─────────────────────────────────────────────────────────────
// 14. HIGHLIGHT DIRECTIVE (for search results)
// ─────────────────────────────────────────────────────────────

/**
 * Usage: <td [highlight]="searchTerm">{{ item.name }}</td>
 */
@Directive({ selector: '[highlight]', standalone: true })
export class HighlightDirective implements OnInit {
  @Input() highlight = '';
  private readonly el = inject(ElementRef);

  ngOnInit(): void { this._apply(); }

  @HostListener('input')
  onInput(): void { this._apply(); }

  private _apply(): void {
    const text = this.el.nativeElement.textContent ?? '';
    if (!this.highlight) { this.el.nativeElement.innerHTML = text; return; }
    const escaped = this.highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.el.nativeElement.innerHTML = text.replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<mark style="background:#fef08a;padding:0 2px;border-radius:2px">$1</mark>'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 15. RIPPLE EFFECT DIRECTIVE (Material-like)
// ─────────────────────────────────────────────────────────────

/**
 * Usage: <button erpRipple>Click Me</button>
 */
@Directive({ selector: '[erpRipple]', standalone: true })
export class RippleDirective {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  constructor() {
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');
  }

  @HostListener('click', ['$event'])
  onClick(e: MouseEvent): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = this.renderer.createElement('span') as HTMLElement;
    Object.assign(ripple.style, {
      width: `${size}px`, height: `${size}px`,
      left: `${e.clientX - rect.left - size / 2}px`,
      top: `${e.clientY - rect.top - size / 2}px`,
      position: 'absolute', borderRadius: '50%',
      background: 'rgba(255,255,255,0.3)', transform: 'scale(0)',
      animation: 'erp-ripple 0.6s linear', pointerEvents: 'none',
    });
    this.renderer.appendChild(this.el.nativeElement, ripple);
    setTimeout(() => ripple.remove(), 700);
  }
}

// ─────────────────────────────────────────────────────────────
// MODULE BARREL EXPORT
// ─────────────────────────────────────────────────────────────

export const ERP_DIRECTIVES = [
  HasPermissionDirective, AutofocusDirective, ClickOutsideDirective,
  DebounceClickDirective, NumbersOnlyDirective, AlphaOnlyDirective,
  UppercaseInputDirective, CharCounterDirective, TooltipDirective,
  CopyClipboardDirective, InfiniteScrollDirective, LazyImageDirective,
  DragScrollDirective, HighlightDirective, RippleDirective,
] as const;

@NgModule({
  imports: [CommonModule, ...ERP_DIRECTIVES],
  exports: [...ERP_DIRECTIVES],
})
export class ErpDirectivesModule { }