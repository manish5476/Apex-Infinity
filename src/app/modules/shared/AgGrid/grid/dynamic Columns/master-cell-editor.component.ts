import {
  Component,
  ViewEncapsulation,
  ElementRef,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  output,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';

// PrimeNG v18 imports
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import {
  CellConfig,
  CellInteractionEvent,
  CellInteractionType,
  MasterCellParams,
  SelectOption,
} from '../grid.types';

/* ==========================================================================
   MASTER CELL COMPONENT

   Single component that handles BOTH view and edit modes internally.
   No component swapping — zero flicker, zero focus loss.

   Controlled by:
   - `isEditing` signal from parent (row-level edit)
   - `cellConfig.alwaysEditable` (column-level always-on edit)
   - `cellConfig.readOnly` (never editable even in edit mode)

   Events:
   - `cellInteraction` output fires a typed CellInteractionEvent for:
       click | focus | blur | change | enter | escape | linkClick
   ========================================================================== */
@Component({
  selector: 'app-master-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
    TagModule,
    TooltipModule,
    CurrencyPipe,
    DatePipe,
  ],
  template: `
    <div
      class="mcell-root"
      [class.is-editing]="showEditor"
      [class.is-readonly]="config.readOnly"
      (click)="onViewClick($event)"
    >

      <!-- ════════════════════════════════════════════════
           EDITOR MODE
           Shown when: (row is editing OR alwaysEditable) AND NOT readOnly
      ════════════════════════════════════════════════ -->
      @if (showEditor) {

        @switch (config.type) {

          <!-- TEXT -->
          @case ('text') {
            <input
              pInputText
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || ''"
              autocomplete="off"
              #focusTarget
            />
          }

          <!-- EMAIL -->
          @case ('email') {
            <input
              pInputText
              type="email"
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || 'email@example.com'"
              autocomplete="off"
              #focusTarget
            />
          }

          <!-- PHONE -->
          @case ('phone') {
            <input
              pInputText
              type="tel"
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || '+91 00000 00000'"
              autocomplete="off"
              #focusTarget
            />
          }

          <!-- URL -->
          @case ('url') {
            <input
              pInputText
              type="url"
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || 'https://'"
              autocomplete="off"
              #focusTarget
            />
          }

          <!-- NUMBER -->
          @case ('number') {
            <p-inputNumber
              class="mc-input-number"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              mode="decimal"
              [minFractionDigits]="config.minFractionDigits ?? 0"
              [maxFractionDigits]="config.maxFractionDigits ?? 2"
              [min]="config.min ?? null"
              [max]="config.max ?? null"
              [useGrouping]="true"
              [placeholder]="config.placeholder || ''"
              (onFocus)="onEditorFocus($event)"
              (onBlur)="onBlur($event)"
              (onKeyDown)="onKeydown($event)"
              #focusTarget
            />
          }

          <!-- CURRENCY -->
          @case ('currency') {
            <p-inputNumber
              class="mc-input-number"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              mode="currency"
              [currency]="config.currencyCode ?? 'INR'"
              [locale]="config.currencyLocale ?? 'en-IN'"
              [minFractionDigits]="config.minFractionDigits ?? 2"
              [min]="config.min ?? null"
              [max]="config.max ?? null"
              [placeholder]="config.placeholder || ''"
              (onFocus)="onEditorFocus($event)"
              (onBlur)="onBlur($event)"
              (onKeyDown)="onKeydown($event)"
              #focusTarget
            />
          }

          <!-- DATE -->
          @case ('date') {
            <p-datepicker
              class="mc-datepicker"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              appendTo="body"
              [dateFormat]="config.datePickerFormat ?? 'dd/mm/yy'"
              [showTime]="config.showTime ?? false"
              [showButtonBar]="true"
              [placeholder]="config.placeholder || 'Select date'"
              [panelStyleClass]="'mc-calendar-panel'"
              (onFocus)="onEditorFocus($event)"
              (onBlur)="onBlur($event)"
              (onSelect)="onDraftChange($event)"
              #focusTarget
            />
          }

          <!-- SELECT -->
          @case ('select') {
            <p-select
              class="mc-select"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              [options]="config.options ?? []"
              [optionLabel]="config.optionLabel ?? 'label'"
              [optionValue]="config.optionValue ?? 'value'"
              appendTo="body"
              [filter]="(config.options?.length ?? 0) > 7"
              [showClear]="true"
              [placeholder]="config.placeholder || 'Select…'"
              [panelStyleClass]="'mc-dropdown-panel'"
              (onFocus)="onEditorFocus($event)"
              (onBlur)="onBlur($event)"
              #focusTarget
            />
          }

          <!-- BOOLEAN / CHECKBOX -->
          @case ('boolean') {
            <div
              class="mc-checkbox-wrap"
              (focusin)="onEditorFocus($event)"
              (focusout)="onBlur($event)"
            >
              <p-checkbox
                [ngModel]="draftValue"
                (ngModelChange)="onDraftChange($event)"
                [binary]="true"
                #focusTarget
              />
            </div>
          }

          <!-- TEXTAREA -->
          @case ('textarea') {
            <textarea
              pTextarea
              class="mc-textarea"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [rows]="config.rows ?? 2"
              [placeholder]="config.placeholder || ''"
              autoResize="true"
              #focusTarget
            ></textarea>
          }

          <!-- FALLBACK -->
          @default {
            <input
              pInputText
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || ''"
              autocomplete="off"
              #focusTarget
            />
          }
        }
      }

      <!-- ════════════════════════════════════════════════
           VIEW MODE (READ ONLY RENDERER)
           Shown when: not editing, OR readOnly=true
      ════════════════════════════════════════════════ -->
      @if (!showEditor) {

        <div class="mcell-viewer">
          @switch (config.type) {

            @case ('boolean') {
              <i class="pi mcell-bool-icon"
                 [class.pi-check-circle]="value"
                 [class.is-true]="value"
                 [class.pi-times-circle]="!value"
                 [class.is-false]="!value">
              </i>
            }

            @case ('date') {
              <span class="mcell-date">
                <i class="pi pi-calendar mcell-meta-icon"></i>
                {{ value | date:(config.dateFormat ?? 'dd MMM yyyy') }}
              </span>
            }

            @case ('currency') {
              <span class="mcell-currency" [class.is-negative]="value < 0">
                {{ value | currency:(config.currencyCode ?? 'INR'):'symbol':'1.2-2':(config.currencyLocale ?? 'en-IN') }}
              </span>
            }

            @case ('number') {
              <span class="mcell-number">
                {{ value | number:getNumberFormat() }}
              </span>
            }

            @case ('badge') {
              @if (value != null) {
                <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
                  {{ value }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            @case ('select') {
              <span class="mcell-select-val">
                {{ getSelectLabel(value) }}
              </span>
            }

            @case ('color') {
              <div class="mcell-color">
                <span class="mcell-color-swatch" [style.background]="value"></span>
                <span class="mcell-color-label">{{ value }}</span>
              </div>
            }

            @case ('email') {
              @if (value) {
                <a class="mcell-link"
                   [href]="'mailto:' + value"
                   (click)="onLinkClick($event, value)"
                   pTooltip="Send email"
                   tooltipPosition="top">
                  <i class="pi pi-envelope mcell-meta-icon"></i>{{ value }}
                </a>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            @case ('phone') {
              @if (value) {
                <a class="mcell-link"
                   [href]="'tel:' + value"
                   (click)="onLinkClick($event, value)">
                  <i class="pi pi-phone mcell-meta-icon"></i>{{ value }}
                </a>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            @case ('url') {
              @if (value) {
                <a class="mcell-link mcell-url"
                   [href]="value"
                   target="_blank"
                   rel="noopener"
                   (click)="onLinkClick($event, value)"
                   pTooltip="Open link"
                   tooltipPosition="top">
                  <i class="pi pi-external-link mcell-meta-icon"></i>
                  {{ value | slice:0:30 }}{{ value?.length > 30 ? '…' : '' }}
                </a>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            @case ('progress') {
              <div class="mcell-progress-wrap">
                <div class="mcell-progress-track">
                  <div class="mcell-progress-fill"
                       [style.width.%]="getProgressPct()">
                  </div>
                </div>
                @if (config.showValue !== false) {
                  <span class="mcell-progress-label">{{ getProgressPct() }}%</span>
                }
              </div>
            }

            @case ('avatar') {
              <div class="mcell-avatar">
                @if (value && isImageUrl(value)) {
                  <img [src]="value" [alt]="getAvatarInitials()" loading="lazy" />
                } @else {
                  <span class="mcell-avatar-initials">{{ getAvatarInitials() }}</span>
                }
              </div>
            }

            @case ('tags') {
              <div class="mcell-tags">
                @for (tag of asTags(value); track tag) {
                  <span class="mcell-tag">{{ tag }}</span>
                }
              </div>
            }

            @case ('textarea') {
              <span class="mcell-multiline" [title]="value">{{ value ?? '—' }}</span>
            }

            @default {
              <span class="mcell-text" [title]="value">{{ value ?? '—' }}</span>
            }
          }
        </div>
      }

    </div>
  `,
  styles: [`
    /* ════════════════════════════════════════════════════
       MASTER CELL — ALL VARS ARE THEME TOKENS
    ════════════════════════════════════════════════════ */

    app-master-cell { display: flex; align-items: stretch; width: 100%; height: 100%; }

    .mcell-root {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    /* ── VIEWER ────────────────────────────────────────── */
    .mcell-viewer {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 6px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 13px;
      color: var(--theme-text-primary);
      gap: 4px;
    }

    .mcell-text, .mcell-number, .mcell-date,
    .mcell-select-val, .mcell-multiline {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      color: var(--theme-text-primary);
    }

    .mcell-multiline {
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .mcell-meta-icon {
      font-size: 0.7rem;
      color: var(--theme-text-tertiary);
      flex-shrink: 0;
    }

    .mcell-empty {
      color: var(--theme-text-tertiary);
      font-style: italic;
      font-size: 12px;
    }

    /* Currency */
    .mcell-currency {
      font-family: var(--font-mono, monospace);
      font-weight: 600;
      font-size: 13px;
      color: var(--theme-text-primary);
      letter-spacing: -0.3px;
      &.is-negative { color: var(--color-error, #ef4444); }
    }

    /* Number */
    .mcell-number {
      font-family: var(--font-mono, monospace);
      font-size: 13px;
    }

    /* Boolean */
    .mcell-bool-icon {
      font-size: 15px;
      &.is-true { color: var(--color-success, #22c55e); }
      &.is-false { color: var(--theme-text-tertiary); }
    }

    /* Badge */
    .mcell-badge {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid transparent;
      background: var(--theme-bg-ternary);
      color: var(--theme-text-secondary);
      border-color: var(--theme-border-primary);

      &[data-sev="success"] {
        background: rgba(34,197,94,0.10);
        color: var(--color-success, #22c55e);
        border-color: rgba(34,197,94,0.2);
      }
      &[data-sev="warning"] {
        background: rgba(245,158,11,0.10);
        color: var(--color-warning, #f59e0b);
        border-color: rgba(245,158,11,0.2);
      }
      &[data-sev="danger"] {
        background: rgba(239,68,68,0.10);
        color: var(--color-error, #ef4444);
        border-color: rgba(239,68,68,0.2);
      }
      &[data-sev="info"] {
        background: rgba(var(--accent-primary-rgb), 0.10);
        color: var(--theme-accent-primary);
        border-color: rgba(var(--accent-primary-rgb), 0.2);
      }
    }

    /* Color swatch */
    .mcell-color { display: flex; align-items: center; gap: 6px; }
    .mcell-color-swatch {
      width: 14px; height: 14px;
      border-radius: 3px;
      border: 1px solid var(--theme-border-secondary);
      flex-shrink: 0;
    }
    .mcell-color-label {
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      color: var(--theme-text-secondary);
    }

    /* Links */
    .mcell-link {
      display: flex; align-items: center; gap: 4px;
      color: var(--theme-accent-primary);
      text-decoration: none;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      &:hover { text-decoration: underline; }
    }

    /* Progress */
    .mcell-progress-wrap { display: flex; align-items: center; gap: 6px; width: 100%; }
    .mcell-progress-track {
      flex: 1; height: 5px;
      background: var(--theme-bg-ternary);
      border-radius: 99px; overflow: hidden;
    }
    .mcell-progress-fill {
      height: 100%;
      background: var(--theme-accent-primary);
      border-radius: 99px;
      transition: width 0.3s ease;
    }
    .mcell-progress-label {
      font-size: 11px; font-weight: 700;
      color: var(--theme-text-secondary);
      flex-shrink: 0; min-width: 28px;
      text-align: right;
    }

    /* Avatar */
    .mcell-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      overflow: hidden;
      background: rgba(var(--accent-primary-rgb), 0.12);
      border: 1px solid var(--theme-border-primary);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .mcell-avatar-initials {
      font-size: 11px; font-weight: 700;
      color: var(--theme-accent-primary);
      text-transform: uppercase;
    }

    /* Tags */
    .mcell-tags {
      display: flex; align-items: center; gap: 4px;
      overflow: hidden; flex-wrap: nowrap;
    }
    .mcell-tag {
      display: inline-block;
      font-size: 0.65rem; font-weight: 600;
      padding: 1px 6px; border-radius: 3px;
      background: var(--theme-bg-ternary);
      color: var(--theme-text-secondary);
      border: 1px solid var(--theme-border-primary);
      white-space: nowrap;
    }

    /* ── EDITOR BASE ───────────────────────────────────── */
    .mc-input {
      width: 100%;
      height: 30px;
      padding: 0 8px;
      font-family: var(--font-body);
      font-size: 13px;
      color: var(--theme-text-primary);
      background: var(--theme-bg-primary);
      border: 1px solid var(--theme-border-secondary);
      border-radius: var(--ui-border-radius, 5px);
      outline: none;
      transition: border-color 0.12s, box-shadow 0.12s;
      box-sizing: border-box;

      &:focus {
        border-color: var(--theme-accent-primary);
        box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
      }
      &::placeholder { color: var(--theme-text-tertiary); }
    }

    .mc-textarea {
      @extend .mc-input;
      height: auto;
      min-height: 30px;
      padding: 4px 8px;
      resize: none;
    }

    .mc-input-number {
      width: 100%;
      .p-inputnumber-input { @extend .mc-input; text-align: right; }
    }

    .mc-select {
      width: 100%;
      height: 30px;
      .p-select-label {
        font-family: var(--font-body);
        font-size: 13px;
        color: var(--theme-text-primary);
        padding: 4px 8px;
      }
      &.p-focus {
        border-color: var(--theme-accent-primary);
        box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
      }
    }

    .mc-datepicker {
      width: 100%;
      .p-datepicker-input { @extend .mc-input; }
      .p-datepicker-trigger { display: none; }
    }

    .mc-checkbox-wrap {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 100%;
    }

    /* ── STATE INDICATORS ──────────────────────────────── */
    .mcell-root.is-editing {
      background: rgba(var(--accent-primary-rgb), 0.03);
    }

    .mcell-root.is-readonly {
      .mcell-viewer { opacity: 0.6; cursor: not-allowed; }
    }
  `],
})
export class MasterCellComponent implements ICellRendererAngularComp, OnDestroy {

  private readonly el = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);

  /* ── OUTPUT ────────────────────────────────────────────
     Single typed event bus for every cell interaction.
     Wire it up in the parent via cellRendererParams passing
     a callback, or read it through context.componentParent.
  ──────────────────────────────────────────────────────── */
  readonly cellInteraction = output<CellInteractionEvent>();

  /* ── LIVE STATE ────────────────────────────────────── */
  params!: any;
  config: CellConfig = { type: 'text' };
  value: any;          // Committed value (what renderer shows)
  draftValue: any;     // Live edit value (what editor binds to)

  /** True when this cell should show its editor */
  get showEditor(): boolean {
    if (this.config.readOnly) return false;
    if (this.config.alwaysEditable) return true;
    return this.isRowEditing();
  }

  private isRowEditing(): boolean {
    try {
      const parent = this.params?.context?.componentParent;
      return parent?.editingIds?.()?.has(this.params.node.id) ?? false;
    } catch {
      return false;
    }
  }

  /* ── AG GRID LIFECYCLE ─────────────────────────────── */
  agInit(params: any): void {
    this.params = params;
    this.config = params.cellConfig || { type: 'text' };
    this.value = params.value;
    this.draftValue = params.value;
  }

  refresh(params: any): boolean {
    this.params = params;
    this.config = params.cellConfig || { type: 'text' };
    this.value = params.value;

    if (!this.isRowEditing() && !this.config.alwaysEditable) {
      this.draftValue = params.value;
    }

    this.cdr.markForCheck();
    return true;
  }

  afterGuiAttached(): void {
    if (this.showEditor) {
      this.focusEditor();
    }
  }

  ngOnDestroy(): void {}

  /* ── EDITOR EVENTS ─────────────────────────────────── */

  onDraftChange(val: any): void {
    this.draftValue = val;

    // Push to parent draft map
    const parent = this.params?.context?.componentParent;
    const id = this.params?.node?.id;
    const field = this.params?.colDef?.field;
    if (parent && id && field) {
      parent.updateDraft(id, field, val);
    }

    this.emit('change', null);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.config.enterToSave === true) {
        event.preventDefault();
        event.stopPropagation();
        this.emit('enter', event);
        const parent = this.params?.context?.componentParent;
        if (parent) parent.handleRowAction('save', this.params.data);
      }
      // else: fall through — just emit enter for awareness
      else {
        this.emit('enter', event);
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.emit('escape', event);
      const parent = this.params?.context?.componentParent;
      if (parent) parent.handleRowAction('cancel', this.params.data);
    }
  }

  onEditorFocus(event: Event | null | undefined): void {
    this.emit('focus', event ?? null);
  }

  onBlur(event: Event | null | undefined): void {
    this.emit('blur', event ?? null);

    // Auto-save on blur for alwaysEditable + enterToSave cells
    if (this.config.alwaysEditable && this.config.enterToSave) {
      const parent = this.params?.context?.componentParent;
      if (parent) parent.handleRowAction('save', this.params.data);
    }
  }

  /** Click on the view-mode cell (not a link) */
  onViewClick(event: MouseEvent): void {
    // Only emit for view mode — editor clicks fire focus/blur/change instead
    if (!this.showEditor) {
      this.emit('click', event);
    }
  }

  /** Click on email / phone / url anchor tag */
  onLinkClick(event: MouseEvent, _value: any): void {
    event.stopPropagation();
    this.emit('linkClick', event);
  }

  /* ── AUTO-FOCUS ────────────────────────────────────── */
  private focusEditor(): void {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = this.el.nativeElement as HTMLElement;
        const target =
          el.querySelector<HTMLElement>('input, textarea') ??
          el.querySelector<HTMLElement>('.p-select, .p-checkbox-box, [tabindex]:not([tabindex="-1"])');

        if (target) {
          target.focus();
          if (
            target instanceof HTMLInputElement &&
            (target.type === 'text' || target.type === 'number' || target.type === 'email')
          ) {
            target.select();
          }
        }
      }, 40);
    });
  }

  /* ── EMIT HELPER ───────────────────────────────────── */
  /**
   * Builds and emits a CellInteractionEvent.
   * Respects config.emitEvents (default: true).
   * Also bubbles through context.componentParent.onCellInteraction()
   * if the parent exposes that method — so the grid can aggregate all events.
   */
  private emit(type: CellInteractionType, nativeEvent: Event | null): void {
    if (this.config.emitEvents === false) return;

    const event: CellInteractionEvent = {
      interactionType: type,
      cellType: this.config.type,
      value: this.value,
      draftValue: this.draftValue,
      field: this.params?.colDef?.field ?? '',
      rowId: this.params?.node?.id ?? '',
      rowData: this.params?.data ?? null,
      nativeEvent: nativeEvent,
    };

    // 1. Component-level output (for anyone using the component standalone)
    this.cellInteraction.emit(event);

    // 2. Bubble to parent grid via context so AppSharedGrid can re-emit if needed
    const parent = this.params?.context?.componentParent;
    if (parent && typeof parent.onCellInteraction === 'function') {
      parent.onCellInteraction(event);
    }
  }

  /* ── VIEW HELPERS ──────────────────────────────────── */

  getSelectLabel(value: any): string {
    if (!this.config.options) return value ?? '—';
    const opt = this.config.options.find(
      o => o[(this.config.optionValue ?? 'value') as keyof SelectOption] === value
    );
    return opt?.label ?? value ?? '—';
  }

  getBadgeSeverity(value: any): string {
    if (this.config.badgeMap) {
      const sev = this.config.badgeMap[String(value)];
      if (sev) return sev;
    }
    const v = String(value ?? '').toLowerCase();
    if (/active|paid|approved|completed|success/.test(v)) return 'success';
    if (/pending|processing|draft|partial/.test(v)) return 'warning';
    if (/rejected|cancelled|overdue|inactive|failed|deleted/.test(v)) return 'danger';
    if (/info|new|open/.test(v)) return 'info';
    return 'secondary';
  }

  getNumberFormat(): string {
    const min = this.config.minFractionDigits ?? 0;
    const max = this.config.maxFractionDigits ?? 2;
    return `1.${min}-${max}`;
  }

  getProgressPct(): number {
    const max = this.config.max ?? 100;
    return Math.min(100, Math.round(((this.value ?? 0) / max) * 100));
  }

  getAvatarInitials(): string {
    const field = this.config.labelField;
    const src = field ? this.params?.data?.[field] : this.params?.data?.name;
    if (!src) return '?';
    return src.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  }

  isImageUrl(val: any): boolean {
    return typeof val === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(val);
  }

  asTags(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    return String(val).split(',').map(s => s.trim()).filter(Boolean);
  }
}


// import {
//   Component,
//   ViewEncapsulation,
//   ElementRef,
//   OnDestroy,
//   ChangeDetectionStrategy,
//   ChangeDetectorRef,
//   inject,
// } from '@angular/core';
// import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ICellRendererAngularComp } from 'ag-grid-angular';

// // PrimeNG v18 imports
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TextareaModule } from 'primeng/textarea';
// import { SelectModule } from 'primeng/select';
// import { DatePickerModule } from 'primeng/datepicker';
// import { CheckboxModule } from 'primeng/checkbox';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';

// import { CellConfig, MasterCellParams, SelectOption } from '../grid.types';

// /* ==========================================================================
//    MASTER CELL COMPONENT
   
//    Single component that handles BOTH view and edit modes internally.
//    No component swapping — zero flicker, zero focus loss.

//    Controlled by:
//    - `isEditing` signal from parent (row-level edit)
//    - `cellConfig.alwaysEditable` (column-level always-on edit)
//    - `cellConfig.readOnly` (never editable even in edit mode)
//    ========================================================================== */
// @Component({
//   selector: 'app-master-cell',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   encapsulation: ViewEncapsulation.None,
//   imports: [
//     CommonModule,
//     FormsModule,
//     InputTextModule,
//     InputNumberModule,
//     TextareaModule,
//     SelectModule,
//     DatePickerModule,
//     CheckboxModule,
//     TagModule,
//     TooltipModule,
//     CurrencyPipe,
//     DatePipe,
//   ],
//   template: `
//     <div class="mcell-root" [class.is-editing]="showEditor" [class.is-readonly]="config.readOnly">

//       <!-- ════════════════════════════════════════════════
//            EDITOR MODE
//            Shown when: (row is editing OR alwaysEditable) AND NOT readOnly
//       ════════════════════════════════════════════════ -->
//       @if (showEditor) {

//         @switch (config.type) {

//           <!-- TEXT / EMAIL / PHONE / URL -->
//           @case ('text') {
//             <input
//               pInputText
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               (blur)="onBlur()"
//               [placeholder]="config['placeholder'] || ''"
//               autocomplete="off"
//               #focusTarget
//             />
//           }

//           @case ('email') {
//             <input
//               pInputText
//               type="email"
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               [placeholder]="'email@example.com'"
//               autocomplete="off"
//               #focusTarget
//             />
//           }

//           @case ('phone') {
//             <input
//               pInputText
//               type="tel"
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               [placeholder]="'+91 00000 00000'"
//               autocomplete="off"
//               #focusTarget
//             />
//           }

//           @case ('url') {
//             <input
//               pInputText
//               type="url"
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               [placeholder]="'https://'"
//               autocomplete="off"
//               #focusTarget
//             />
//           }

//           <!-- NUMBER -->
//           @case ('number') {
//             <p-inputNumber
//               class="mc-input-number"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               mode="decimal"
//               [minFractionDigits]="config.minFractionDigits ?? 0"
//               [maxFractionDigits]="config.maxFractionDigits ?? 2"
//               [min]="config.min ?? null"
//               [max]="config.max ?? null"
//               [useGrouping]="true"
//               (onKeyDown)="onKeydown($event['originalEvent'])"
//               #focusTarget
//             />
//           }

//           <!-- CURRENCY -->
//           @case ('currency') {
//             <p-inputNumber
//               class="mc-input-number"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               mode="currency"
//               [currency]="config.currencyCode ?? 'INR'"
//               [locale]="config.currencyLocale ?? 'en-IN'"
//               [minFractionDigits]="config.minFractionDigits ?? 2"
//               [min]="config.min ?? null"
//               [max]="config.max ?? null"
//               (onKeyDown)="onKeydown($event.originalEvent)"
//               #focusTarget
//             />
//           }

//           <!-- DATE -->
//           @case ('date') {
//             <p-datepicker
//               class="mc-datepicker"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               appendTo="body"
//               [dateFormat]="config.datePickerFormat ?? 'dd/mm/yy'"
//               [showTime]="config.showTime ?? false"
//               [showButtonBar]="true"
//               [panelStyleClass]="'mc-calendar-panel'"
//               #focusTarget
//             />
//           }

//           <!-- SELECT / DROPDOWN -->
//           @case ('select') {
//             <p-select
//               class="mc-select"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               [options]="config.options ?? []"
//               [optionLabel]="config.optionLabel ?? 'label'"
//               [optionValue]="config.optionValue ?? 'value'"
//               appendTo="body"
//               [filter]="(config.options?.length ?? 0) > 7"
//               [showClear]="true"
//               [panelStyleClass]="'mc-dropdown-panel'"
//               #focusTarget
//             />
//           }

//           <!-- BOOLEAN / CHECKBOX -->
//           @case ('boolean') {
//             <div class="mc-checkbox-wrap">
//               <p-checkbox
//                 [ngModel]="draftValue"
//                 (ngModelChange)="onDraftChange($event)"
//                 [binary]="true"
//                 #focusTarget
//               />
//             </div>
//           }

//           <!-- TEXTAREA -->
//           @case ('textarea') {
//             <textarea
//               pTextarea
//               class="mc-textarea"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               [rows]="config.rows ?? 2"
//               autoResize="true"
//               #focusTarget
//             ></textarea>
//           }

//           <!-- FALLBACK: text -->
//           @default {
//             <input
//               pInputText
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               autocomplete="off"
//               #focusTarget
//             />
//           }
//         }
//       }

//       <!-- ════════════════════════════════════════════════
//            VIEW MODE (READ ONLY RENDERER)
//            Shown when: not editing, OR readOnly=true
//       ════════════════════════════════════════════════ -->
//       @if (!showEditor) {

//         <div class="mcell-viewer">
//           @switch (config.type) {

//             @case ('boolean') {
//               <i class="pi mcell-bool-icon"
//                  [class.pi-check-circle]="value"
//                  [class.is-true]="value"
//                  [class.pi-times-circle]="!value"
//                  [class.is-false]="!value">
//               </i>
//             }

//             @case ('date') {
//               <span class="mcell-date">
//                 <i class="pi pi-calendar mcell-meta-icon"></i>
//                 {{ value | date:(config.dateFormat ?? 'dd MMM yyyy') }}
//               </span>
//             }

//             @case ('currency') {
//               <span class="mcell-currency" [class.is-negative]="value < 0">
//                 {{ value | currency:(config.currencyCode ?? 'INR'):'symbol':'1.2-2':(config.currencyLocale ?? 'en-IN') }}
//               </span>
//             }

//             @case ('number') {
//               <span class="mcell-number">
//                 {{ value | number:getNumberFormat() }}
//               </span>
//             }

//             @case ('badge') {
//               @if (value != null) {
//                 <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
//                   {{ value }}
//                 </span>
//               } @else {
//                 <span class="mcell-empty">—</span>
//               }
//             }

//             @case ('select') {
//               <span class="mcell-select-val">
//                 {{ getSelectLabel(value) }}
//               </span>
//             }

//             @case ('color') {
//               <div class="mcell-color">
//                 <span class="mcell-color-swatch" [style.background]="value"></span>
//                 <span class="mcell-color-label">{{ value }}</span>
//               </div>
//             }

//             @case ('email') {
//               @if (value) {
//                 <a class="mcell-link" [href]="'mailto:' + value"
//                    (click)="$event.stopPropagation()"
//                    pTooltip="Send email" tooltipPosition="top">
//                   <i class="pi pi-envelope mcell-meta-icon"></i>{{ value }}
//                 </a>
//               } @else {
//                 <span class="mcell-empty">—</span>
//               }
//             }

//             @case ('phone') {
//               @if (value) {
//                 <a class="mcell-link" [href]="'tel:' + value"
//                    (click)="$event.stopPropagation()">
//                   <i class="pi pi-phone mcell-meta-icon"></i>{{ value }}
//                 </a>
//               } @else {
//                 <span class="mcell-empty">—</span>
//               }
//             }

//             @case ('url') {
//               @if (value) {
//                 <a class="mcell-link mcell-url" [href]="value" target="_blank" rel="noopener"
//                    (click)="$event.stopPropagation()"
//                    pTooltip="Open link" tooltipPosition="top">
//                   <i class="pi pi-external-link mcell-meta-icon"></i>
//                   {{ value | slice:0:30 }}{{ value?.length > 30 ? '…' : '' }}
//                 </a>
//               } @else {
//                 <span class="mcell-empty">—</span>
//               }
//             }

//             @case ('progress') {
//               <div class="mcell-progress-wrap">
//                 <div class="mcell-progress-track">
//                   <div class="mcell-progress-fill"
//                        [style.width.%]="getProgressPct()">
//                   </div>
//                 </div>
//                 @if (config.showValue !== false) {
//                   <span class="mcell-progress-label">{{ getProgressPct() }}%</span>
//                 }
//               </div>
//             }

//             @case ('avatar') {
//               <div class="mcell-avatar">
//                 @if (value && isImageUrl(value)) {
//                   <img [src]="value" [alt]="getAvatarInitials()" loading="lazy" />
//                 } @else {
//                   <span class="mcell-avatar-initials">{{ getAvatarInitials() }}</span>
//                 }
//               </div>
//             }

//             @case ('tags') {
//               <div class="mcell-tags">
//                 @for (tag of asTags(value); track tag) {
//                   <span class="mcell-tag">{{ tag }}</span>
//                 }
//               </div>
//             }

//             @case ('textarea') {
//               <span class="mcell-multiline" [title]="value">{{ value ?? '—' }}</span>
//             }

//             @default {
//               <span class="mcell-text" [title]="value">{{ value ?? '—' }}</span>
//             }
//           }
//         </div>
//       }

//     </div>
//   `,
//   styles: [`
//     /* ════════════════════════════════════════════════════
//        MASTER CELL — ALL VARS ARE THEME TOKENS
//     ════════════════════════════════════════════════════ */

//     app-master-cell { display: flex; align-items: stretch; width: 100%; height: 100%; }

//     .mcell-root {
//       display: flex;
//       align-items: center;
//       width: 100%;
//       height: 100%;
//       overflow: hidden;
//     }

//     /* ── VIEWER ────────────────────────────────────────── */
//     .mcell-viewer {
//       display: flex;
//       align-items: center;
//       width: 100%;
//       height: 100%;
//       padding: 0 6px;
//       overflow: hidden;
//       white-space: nowrap;
//       text-overflow: ellipsis;
//       font-size: 13px;
//       color: var(--theme-text-primary);
//       gap: 4px;
//     }

//     .mcell-text, .mcell-number, .mcell-date,
//     .mcell-select-val, .mcell-multiline {
//       overflow: hidden;
//       text-overflow: ellipsis;
//       white-space: nowrap;
//       font-size: 13px;
//       color: var(--theme-text-primary);
//     }

//     .mcell-multiline {
//       white-space: normal;
//       display: -webkit-box;
//       -webkit-line-clamp: 2;
//       -webkit-box-orient: vertical;
//     }

//     .mcell-meta-icon {
//       font-size: 0.7rem;
//       color: var(--theme-text-tertiary);
//       flex-shrink: 0;
//     }

//     .mcell-empty {
//       color: var(--theme-text-tertiary);
//       font-style: italic;
//       font-size: 12px;
//     }

//     /* Currency */
//     .mcell-currency {
//       font-family: var(--font-mono, monospace);
//       font-weight: 600;
//       font-size: 13px;
//       color: var(--theme-text-primary);
//       letter-spacing: -0.3px;
//       &.is-negative { color: var(--color-error, #ef4444); }
//     }

//     /* Number */
//     .mcell-number {
//       font-family: var(--font-mono, monospace);
//       font-size: 13px;
//     }

//     /* Boolean */
//     .mcell-bool-icon {
//       font-size: 15px;
//       &.is-true { color: var(--color-success, #22c55e); }
//       &.is-false { color: var(--theme-text-tertiary); }
//     }

//     /* Badge */
//     .mcell-badge {
//       display: inline-block;
//       font-size: 0.68rem;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.04em;
//       padding: 2px 8px;
//       border-radius: 4px;
//       border: 1px solid transparent;

//       /* Default neutral */
//       background: var(--theme-bg-ternary);
//       color: var(--theme-text-secondary);
//       border-color: var(--theme-border-primary);

//       &[data-sev="success"] {
//         background: rgba(34,197,94,0.10);
//         color: var(--color-success, #22c55e);
//         border-color: rgba(34,197,94,0.2);
//       }
//       &[data-sev="warning"] {
//         background: rgba(245,158,11,0.10);
//         color: var(--color-warning, #f59e0b);
//         border-color: rgba(245,158,11,0.2);
//       }
//       &[data-sev="danger"] {
//         background: rgba(239,68,68,0.10);
//         color: var(--color-error, #ef4444);
//         border-color: rgba(239,68,68,0.2);
//       }
//       &[data-sev="info"] {
//         background: rgba(var(--accent-primary-rgb), 0.10);
//         color: var(--theme-accent-primary);
//         border-color: rgba(var(--accent-primary-rgb), 0.2);
//       }
//     }

//     /* Color swatch */
//     .mcell-color {
//       display: flex; align-items: center; gap: 6px;
//     }
//     .mcell-color-swatch {
//       width: 14px; height: 14px;
//       border-radius: 3px;
//       border: 1px solid var(--theme-border-secondary);
//       flex-shrink: 0;
//     }
//     .mcell-color-label {
//       font-family: var(--font-mono, monospace);
//       font-size: 12px;
//       color: var(--theme-text-secondary);
//     }

//     /* Links */
//     .mcell-link {
//       display: flex; align-items: center; gap: 4px;
//       color: var(--theme-accent-primary);
//       text-decoration: none;
//       font-size: 13px;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       white-space: nowrap;
//       &:hover { text-decoration: underline; }
//     }

//     /* Progress */
//     .mcell-progress-wrap {
//       display: flex; align-items: center; gap: 6px; width: 100%;
//     }
//     .mcell-progress-track {
//       flex: 1; height: 5px;
//       background: var(--theme-bg-ternary);
//       border-radius: 99px; overflow: hidden;
//     }
//     .mcell-progress-fill {
//       height: 100%;
//       background: var(--theme-accent-primary);
//       border-radius: 99px;
//       transition: width 0.3s ease;
//     }
//     .mcell-progress-label {
//       font-size: 11px; font-weight: 700;
//       color: var(--theme-text-secondary);
//       flex-shrink: 0; min-width: 28px;
//       text-align: right;
//     }

//     /* Avatar */
//     .mcell-avatar {
//       width: 28px; height: 28px;
//       border-radius: 50%;
//       overflow: hidden;
//       background: rgba(var(--accent-primary-rgb), 0.12);
//       border: 1px solid var(--theme-border-primary);
//       display: flex; align-items: center; justify-content: center;
//       flex-shrink: 0;

//       img { width: 100%; height: 100%; object-fit: cover; }
//     }
//     .mcell-avatar-initials {
//       font-size: 11px; font-weight: 700;
//       color: var(--theme-accent-primary);
//       text-transform: uppercase;
//     }

//     /* Tags */
//     .mcell-tags {
//       display: flex; align-items: center; gap: 4px;
//       overflow: hidden; flex-wrap: nowrap;
//     }
//     .mcell-tag {
//       display: inline-block;
//       font-size: 0.65rem; font-weight: 600;
//       padding: 1px 6px; border-radius: 3px;
//       background: var(--theme-bg-ternary);
//       color: var(--theme-text-secondary);
//       border: 1px solid var(--theme-border-primary);
//       white-space: nowrap;
//     }

//     /* ── EDITOR BASE ───────────────────────────────────── */
//     /* All editors share this look */

//     .mc-input {
//       width: 100%;
//       height: 30px;
//       padding: 0 8px;
//       font-family: var(--font-body);
//       font-size: 13px;
//       color: var(--theme-text-primary);
//       background: var(--theme-bg-primary);
//       border: 1px solid var(--theme-border-secondary);
//       border-radius: var(--ui-border-radius, 5px);
//       outline: none;
//       transition: border-color 0.12s, box-shadow 0.12s;
//       box-sizing: border-box;

//       &:focus {
//         border-color: var(--theme-accent-primary);
//         box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
//       }
//       &::placeholder { color: var(--theme-text-tertiary); }
//     }

//     .mc-textarea {
//       @extend .mc-input;
//       height: auto;
//       min-height: 30px;
//       padding: 4px 8px;
//       resize: none;
//     }

//     /* p-inputNumber */
//     .mc-input-number {
//       width: 100%;
//       .p-inputnumber-input { @extend .mc-input; text-align: right; }
//     }

//     /* p-select */
//     .mc-select {
//       width: 100%;
//       height: 30px;

//       .p-select-label {
//         font-family: var(--font-body);
//         font-size: 13px;
//         color: var(--theme-text-primary);
//         padding: 4px 8px;
//       }
//       &.p-focus {
//         border-color: var(--theme-accent-primary);
//         box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
//       }
//     }

//     /* p-datepicker */
//     .mc-datepicker {
//       width: 100%;
//       .p-datepicker-input { @extend .mc-input; }
//       .p-datepicker-trigger { display: none; }
//     }

//     /* p-checkbox */
//     .mc-checkbox-wrap {
//       display: flex; align-items: center; justify-content: center;
//       width: 100%; height: 100%;
//     }

//     /* ── EDITING STATE INDICATOR ───────────────────────── */
//     /* Subtle left-border glow to show cell is active */
//     .mcell-root.is-editing {
//       background: rgba(var(--accent-primary-rgb), 0.03);
//     }

//     /* ReadOnly visual cue */
//     .mcell-root.is-readonly {
//       .mcell-viewer { opacity: 0.6; cursor: not-allowed; }
//     }
//   `],
// })
// export class MasterCellComponent implements ICellRendererAngularComp, OnDestroy {

//   private readonly el = inject(ElementRef);
//   private readonly cdr = inject(ChangeDetectorRef);

//   /* ── LIVE STATE ────────────────────────────────────── */
//   params!: any;
//   config: CellConfig = { type: 'text' };
//   value: any;          // Committed value (what renderer shows)
//   draftValue: any;     // Live edit value (what editor binds to)

//   /** True when this cell should show its editor */
//   get showEditor(): boolean {
//     if (this.config.readOnly) return false;
//     if (this.config.alwaysEditable) return true;
//     return this.isRowEditing();
//   }

//   private isRowEditing(): boolean {
//     try {
//       const parent = this.params?.context?.componentParent;
//       return parent?.editingIds?.()?.has(this.params.node.id) ?? false;
//     } catch {
//       return false;
//     }
//   }

//   /* ── AG GRID LIFECYCLE ─────────────────────────────── */
//   agInit(params: any): void {
//     this.params = params;
//     this.config = params.cellConfig || { type: 'text' };
//     this.value = params.value;
//     this.draftValue = params.value;
//   }

//   refresh(params: any): boolean {
//     this.params = params;
//     this.config = params.cellConfig || { type: 'text' };
//     this.value = params.value;

//     // Sync draft only if the row is NOT currently being edited
//     // (don't clobber what the user is typing)
//     if (!this.isRowEditing() && !this.config.alwaysEditable) {
//       this.draftValue = params.value;
//     }

//     this.cdr.markForCheck();
//     return true;
//   }

//   /** Called by AG Grid after component is attached to DOM */
//   afterGuiAttached(): void {
//     if (this.showEditor) {
//       this.focusEditor();
//     }
//   }

//   ngOnDestroy(): void {}

//   /* ── EDITOR EVENTS ─────────────────────────────────── */

//   onDraftChange(val: any): void {
//     this.draftValue = val;
//     const parent = this.params?.context?.componentParent;
//     const id = this.params?.node?.id;
//     const field = this.params?.colDef?.field;
//     if (parent && id && field) {
//       parent.updateDraft(id, field, val);
//     }
//   }

//   onKeydown(event: KeyboardEvent): void {
//     if (event.key === 'Enter') {
//       // Only trigger save if enterToSave is explicitly true
//       if (this.config.enterToSave === true) {
//         event.preventDefault();
//         event.stopPropagation();
//         const parent = this.params?.context?.componentParent;
//         if (parent) {
//           parent.handleRowAction('save', this.params.data);
//         }
//       }
//       // else: Enter does nothing special — just a newline or default behaviour
//     }

//     if (event.key === 'Escape') {
//       event.preventDefault();
//       event.stopPropagation();
//       const parent = this.params?.context?.componentParent;
//       if (parent) {
//         parent.handleRowAction('cancel', this.params.data);
//       }
//     }
//   }

//   onBlur(): void {
//     // Only auto-save on blur for alwaysEditable cells with enterToSave
//     // Otherwise, the toolbar Save button is the commit mechanism
//     if (this.config.alwaysEditable && this.config.enterToSave) {
//       const parent = this.params?.context?.componentParent;
//       if (parent) {
//         parent.handleRowAction('save', this.params.data);
//       }
//     }
//   }

//   /* ── AUTO-FOCUS ────────────────────────────────────── */
//   private focusEditor(): void {
//     requestAnimationFrame(() => {
//       setTimeout(() => {
//         const el = this.el.nativeElement as HTMLElement;
//         const target =
//           el.querySelector<HTMLElement>('input, textarea') ??
//           el.querySelector<HTMLElement>('.p-select, .p-checkbox-box, [tabindex]:not([tabindex="-1"])');

//         if (target) {
//           target.focus();
//           if (target instanceof HTMLInputElement &&
//               (target.type === 'text' || target.type === 'number' || target.type === 'email')) {
//             target.select();
//           }
//         }
//       }, 40);
//     });
//   }

//   /* ── VIEW HELPERS ──────────────────────────────────── */

//   getSelectLabel(value: any): string {
//     if (!this.config.options) return value ?? '—';
//     const opt = this.config.options.find(
//       o => o[(this.config.optionValue ?? 'value') as keyof SelectOption] === value
//     );
//     return opt?.label ?? value ?? '—';
//   }

//   getBadgeSeverity(value: any): string {
//     // Use custom map first
//     if (this.config.badgeMap) {
//       const sev = this.config.badgeMap[String(value)];
//       if (sev) return sev;
//     }
//     // Fallback: keyword matching
//     const v = String(value ?? '').toLowerCase();
//     if (/active|paid|approved|completed|success/.test(v)) return 'success';
//     if (/pending|processing|draft|partial/.test(v)) return 'warning';
//     if (/rejected|cancelled|overdue|inactive|failed|deleted/.test(v)) return 'danger';
//     if (/info|new|open/.test(v)) return 'info';
//     return 'secondary';
//   }

//   getNumberFormat(): string {
//     const min = this.config.minFractionDigits ?? 0;
//     const max = this.config.maxFractionDigits ?? 2;
//     return `1.${min}-${max}`;
//   }

//   getProgressPct(): number {
//     const max = this.config.max ?? 100;
//     return Math.min(100, Math.round(((this.value ?? 0) / max) * 100));
//   }

//   getAvatarInitials(): string {
//     const field = this.config.labelField;
//     const src = field ? this.params?.data?.[field] : this.params?.data?.name;
//     if (!src) return '?';
//     return src.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
//   }

//   isImageUrl(val: any): boolean {
//     return typeof val === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(val);
//   }

//   asTags(val: any): string[] {
//     if (!val) return [];
//     if (Array.isArray(val)) return val.map(String);
//     return String(val).split(',').map(s => s.trim()).filter(Boolean);
//   }
// }




// // import { Component, ViewEncapsulation, ElementRef, OnDestroy } from '@angular/core';
// // import { ICellRendererAngularComp } from 'ag-grid-angular';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';

// // // PrimeNG Modules (v18 Imports)
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { SelectModule } from 'primeng/select';         // v18 Component
// // import { DatePickerModule } from 'primeng/datepicker'; // v18 Component
// // import { CheckboxModule } from 'primeng/checkbox';

// // @Component({
// //   selector: 'app-master-cell-editor',
// //   standalone: true,
// //   encapsulation: ViewEncapsulation.None, 
// //   imports: [
// //     CommonModule, FormsModule,
// //     InputTextModule, InputNumberModule, SelectModule,
// //     DatePickerModule, CheckboxModule
// //   ],
// //   template: `
// //     <div class="master-editor-root">
// //       @switch (config.type) {
        
// //         @case ('number') {
// //           <p-inputNumber 
// //             [ngModel]="value" 
// //             (ngModelChange)="onValueChange($event)"
// //             mode="decimal" 
// //             [minFractionDigits]="config.minFractionDigits ?? 0"
// //             [maxFractionDigits]="config.maxFractionDigits ?? 2"
// //             styleClass="compact-input-number" 
// //             [inputStyleClass]="'compact-input'" />
// //         }

// //         @case ('select') {
// //           <p-select 
// //             [options]="config.options || []"
// //             [ngModel]="value"
// //             (ngModelChange)="onValueChange($event)"
// //             [optionLabel]="config.optionLabel || 'label'"
// //             [optionValue]="config.optionValue || 'value'"
// //             appendTo="body"
// //             styleClass="compact-select"
// //             [panelStyleClass]="'compact-dropdown-panel'" />
// //         }

// //         @case ('boolean') {
// //            <div class="checkbox-wrapper">
// //              <p-checkbox 
// //                [ngModel]="value" 
// //                (ngModelChange)="onValueChange($event)" 
// //                [binary]="true"
// //                styleClass="compact-checkbox" />
// //            </div>
// //         }

// //         @case ('date') {
// //           <p-datepicker 
// //             [ngModel]="value" 
// //             (ngModelChange)="onValueChange($event)"
// //             appendTo="body"
// //             dateFormat="dd/mm/yy" 
// //             styleClass="compact-datepicker"
// //             [inputStyleClass]="'compact-input'"
// //             [panelStyleClass]="'compact-datepicker-panel'" />
// //         }

// //         @default {
// //           <input pInputText 
// //             [ngModel]="value" 
// //             (ngModelChange)="onValueChange($event)"
// //             class="compact-input"
// //             (keydown.enter)="onEnter()" />
// //         }
// //       }
// //     </div>
// //   `,
// //   styles: [`
// //     /* ==========================================================================
// //        COMPONENT ROOT
// //        ========================================================================== */
// //     .master-editor-root {
// //       width: 100%;
// //       height: 100%;
// //       display: flex;
// //       align-items: center;
// //       padding: 0 1px;
// //     }

// //     /* ==========================================================================
// //        SHARED INPUT STYLES
// //        ========================================================================== */
// //     .compact-input {
// //       width: 100%;
// //       height: var(--row-height, 32px);
// //       font-family: var(--font-body);
// //       font-size: var(--font-size-base); 
// //       color: var(--text-primary);
// //       background: var(--bg-primary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius);
// //       padding: 4px 8px;
// //       transition: var(--transition-colors), var(--transition-shadow);

// //       &:enabled:hover {
// //         border-color: var(--border-secondary);
// //       }

// //       &:enabled:focus {
// //         border-color: var(--accent-primary);
// //         box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
// //         outline: none;
// //       }
// //     }

// //     /* ==========================================================================
// //        PRIME NG OVERRIDES
// //        ========================================================================== */
// //     .compact-input-number {
// //       width: 100%;
// //       height: 100%;
// //       .p-inputnumber-input {
// //         @extend .compact-input;
// //         text-align: right;
// //       }
// //     }

// //     .compact-select {
// //       width: 100%;
// //       height: var(--row-height, 32px);
// //       background: var(--bg-primary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius);
// //       display: flex;
// //       align-items: center;

// //       /* Target internal elements of p-select */
// //       .p-select-label, .p-placeholder {
// //         font-family: var(--font-body);
// //         font-size: var(--font-size-base);
// //         color: var(--text-primary);
// //         padding: 4px 8px;
// //       }

// //       &.p-focus {
// //         border-color: var(--accent-primary);
// //         box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
// //       }
// //     }

// //     .compact-datepicker {
// //       width: 100%;
// //       height: 100%;
// //       .p-datepicker-trigger {
// //           display: none;
// //       }
// //     }

// //     .checkbox-wrapper {
// //       width: 100%;
// //       height: 100%;
// //       display: flex;
// //       align-items: center;
// //       justify-content: center;
// //     }
    
// //     .compact-checkbox {
// //       .p-checkbox-box {
// //         width: 18px; 
// //         height: 18px;
// //         border-radius: var(--ui-border-radius-sm);
// //         border: 1px solid var(--border-secondary);
// //         background: var(--bg-primary);
        
// //         &.p-highlight {
// //           background: var(--accent-primary);
// //           border-color: var(--accent-primary);
// //         }
// //       }
// //     }
// //   `]
// // })
// // export class MasterCellEditorComponent implements ICellRendererAngularComp, OnDestroy {
// //   params: any;
// //   config: any;
// //   value: any;
// //   private eGridCell!: HTMLElement;
// //   private onFocusListener: (event: FocusEvent) => void;

// //   constructor(private elementRef: ElementRef) {
// //     // Bind listener context
// //     this.onFocusListener = (event: FocusEvent) => this.handleCellFocus(event);
// //   }

// //   agInit(params: any): void {
// //     this.params = params;
// //     this.config = params.cellConfig || {}; 
// //     this.value = params.value; 
    
// //     // Capture the parent Grid Cell (div.ag-cell)
// //     this.eGridCell = params.eGridCell;
// //     if (this.eGridCell) {
// //         this.eGridCell.addEventListener('focus', this.onFocusListener);
// //     }
// //   }

// //   ngOnDestroy() {
// //     if (this.eGridCell) {
// //         this.eGridCell.removeEventListener('focus', this.onFocusListener);
// //     }
// //   }

// //   refresh(params: any): boolean {
// //     this.params = params;
// //     this.value = params.value; 
// //     return true;
// //   }

// //   /**
// //    * ✅ AUTO-FOCUS LOGIC
// //    * Called by AG Grid immediately after the component is attached to the DOM.
// //    */
// //   afterGuiAttached() {
// //     this.focusInternalElement();
// //   }

// //   focusIn(): boolean {
// //     this.focusInternalElement();
// //     return true;
// //   }

// //   handleCellFocus(event: FocusEvent) {
// //     const isChildFocused = this.elementRef.nativeElement.contains(document.activeElement);
// //     if (!isChildFocused) {
// //         this.focusInternalElement();
// //     }
// //   }

// //   private focusInternalElement() {
// //     // requestAnimationFrame ensures we wait for the browser paint cycle
// //     requestAnimationFrame(() => {
// //       setTimeout(() => {
// //         const element = this.elementRef.nativeElement;
        
// //         // 1. Try Standard Inputs & Textareas (Text, Number, Date)
// //         let target = element.querySelector('input, textarea');
        
// //         // 2. Try PrimeNG v18 Focusable Elements (Select, Checkbox)
// //         // Note: [tabindex] catches the focusable div inside p-select
// //         if (!target) {
// //           target = element.querySelector('.p-select, .p-checkbox-box, [tabindex]:not([tabindex="-1"])');
// //         }

// //         if (target instanceof HTMLElement) {
// //           target.focus();
// //           // Select text for quick overwriting (only for text inputs)
// //           if (target instanceof HTMLInputElement && (target.type === 'text' || target.type === 'number')) {
// //              target.select();
// //           }
// //         }
// //       }, 50); // Small delay for PrimeNG initialization
// //     });
// //   }

// //   onValueChange(val: any) {
// //     this.value = val;
    
// //     const parent = this.params.context.componentParent;
// //     const rowId = this.params.node.id;
// //     const field = this.params.colDef.field;

// //     if (parent && rowId && field) {
// //       parent.updateDraft(rowId, field, val);
// //     }
// //   }

// //   onEnter() {
// //     const parent = this.params.context.componentParent;
// //     if (parent) {
// //         parent.handleRowAction('save', this.params.data);
// //     }
// //   }
// // }
