// src/app/features/storefront-admin/pages/config-form/config-form.component.ts
import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges, inject, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, FormArray,
  FormControl, Validators, AbstractControl
} from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { BadgeModule } from 'primeng/badge';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TooltipModule } from 'primeng/tooltip';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NormalisedField {
  key: string;
  type: string;
  label: string;
  required?: boolean;
  default?: any;
  enum?: any[];
  min?: number;
  max?: number;
  maxLength?: number;
  maxItems?: number;
  ref?: string;
  description?: string;
  itemSchema?: Record<string, any>;
  schema?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-config-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DragDropModule,
    InputTextModule, InputNumberModule, SelectModule, MultiSelectModule,
    TextareaModule, ColorPickerModule, ButtonModule, TabsModule,
    CheckboxModule, InputGroupAddonModule, DatePickerModule,
    InputGroupModule, BadgeModule, TooltipModule
  ],
  templateUrl: './config-form.component.html',
  styleUrls: ['./config-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfigFormComponent implements OnChanges, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  @Input() config: Record<string, any> = {};
  @Input() schema: Record<string, any> = {};
  /**
   * Masters data from the store metadata endpoint.
   * Shape: { categories, brands, tags, products }
   */
  @Input() masters: any = { categories: [], brands: [], tags: [], products: [] };
  @Output() configChange = new EventEmitter<Record<string, any>>();

  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({});
  activeTab = '0';

  tabs = { content: [] as NormalisedField[], settings: [] as NormalisedField[], style: [] as NormalisedField[] };
  booleanGroup: NormalisedField[] = [];
  expandedControls = new Map<AbstractControl, boolean>();

  // Track whether schema has been initialised to avoid redundant rebuilds
  private _lastSchemaKey = '';

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    // Rebuild the form only when the SCHEMA changes (i.e. user selected a
    // different section type). Config-only changes (live preview typing) are
    // handled by patching the existing form — no rebuild, no lost focus.
    if (changes['schema']) {
      const newKey = JSON.stringify(Object.keys(this.schema ?? {}));
      if (newKey !== this._lastSchemaKey) {
        this._lastSchemaKey = newKey;
        this.buildForm();
      }
    } else if (changes['config'] && !changes['config'].firstChange) {
      // When the selected section changes (same schema, different data),
      // patch form values so the preview always reflects the correct section.
      try { this.form.patchValue(this.config ?? {}, { emitEvent: false }); } catch { }
    }
  }

  // ── Form builder ──────────────────────────────────────────────────────────

  buildForm(): void {
    const controls: Record<string, AbstractControl> = {};
    this.tabs = { content: [], settings: [], style: [] };
    this.booleanGroup = [];
    this.expandedControls.clear();

    if (!this.schema) {
      this.form = this.fb.group({});
      return;
    }

    for (const [key, def] of Object.entries(this.schema)) {
      const value = this.config?.[key] !== undefined ? this.config[key] : (def.default ?? null);

      if (def.type === 'array') {
        const arr = this.fb.array<AbstractControl>([]);
        if (Array.isArray(value)) {
          value.forEach((v: any) => arr.push(this._createGroup(def.itemSchema, v)));
        }
        controls[key] = arr;
      } else if (def.type === 'object') {
        controls[key] = this._createGroup(def.schema ?? def.itemSchema, value);
      } else {
        let coerced = value;
        if ((def.type === 'datetime' || def.type === 'date') && typeof coerced === 'string') {
          coerced = new Date(coerced);
        }
        controls[key] = new FormControl(coerced, this._validators(def));
      }

      const field: NormalisedField = {
        key,
        ...def,
        label: def.label ?? this._formatLabel(key)
      };
      this._classifyField(field);
    }

    this.form = this.fb.group(controls);

    // Emit on every user change. We strip null/undefined values before emitting
    // so that empty optional fields don't overwrite valid saved data in the
    // builder's section config (e.g. clearing pre-existing items arrays).
    // We do NOT emit an initial value — the builder already has the section
    // config and an early emit would clobber it with form defaults.
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        // Keep arrays (even empty ones) and explicit false/0; only drop null & undefined
        if (v !== null && v !== undefined) clean[k] = v;
      }
      this.configChange.emit(clean);
    });
  }

  // ── Public helpers (used from template) ───────────────────────────────────

  getFormArray(key: string): FormArray {
    return this.form.get(key) as FormArray;
  }

  /**
   * Returns normalised field definitions for array item schemas.
   * ✅ FIX: No longer double-unwraps itemSchema.schema — we handle both
   * { type: 'array', itemSchema: { name: {...}, text: {...} } }     (flat)
   * { type: 'array', itemSchema: { schema: { name: {...} } } }      (wrapped)
   */
  getArrayFields(field: NormalisedField): NormalisedField[] {
    const raw = field.itemSchema;
    if (!raw || typeof raw === 'string') return [];
    // Unwrap one level of .schema if present
    const schema = (raw as any).schema ?? raw;
    return this._schemaToFields(schema);
  }

  getObjectFields(field: NormalisedField): NormalisedField[] {
    // ✅ FIX: use field.schema (object sub-schema), not field.itemSchema
    const raw = field.schema ?? field.itemSchema;
    if (!raw) return [];
    return this._schemaToFields(raw);
  }

  addArrayItem(field: NormalisedField): void {
    const arr = this.getFormArray(field.key);
    const ctrl = this._createGroup(field.itemSchema, null);
    arr.push(ctrl);
    this.expandedControls.set(ctrl, true);
  }

  removeArrayItem(key: string, i: number): void {
    this.getFormArray(key).removeAt(i);
  }

  toggleExpanded(c: AbstractControl): void {
    this.expandedControls.set(c, !this.expandedControls.get(c));
  }

  getItemTitle(c: AbstractControl): string {
    const v = c.value;
    if (typeof v === 'string') return v;
    return v?.text ?? v?.title ?? v?.name ?? v?.label ?? v?.question ?? 'Item';
  }

  drop(event: CdkDragDrop<any[]>, key: string): void {
    const arr = this.getFormArray(key);
    moveItemInArray(arr.controls, event.previousIndex, event.currentIndex);
    arr.updateValueAndValidity();
  }

  /**
   * Resolve options for enum and reference fields.
   * Maps master data to { label, value } pairs.
   */
  getEnumOptions(field: NormalisedField): Array<{ label: string; value: any }> {
    if (field.enum) {
      return field.enum.map(v => ({
        label: typeof v === 'string' ? this._formatLabel(v) : String(v),
        value: v
      }));
    }

    if (field.type?.includes('reference')) {
      const ref = (field.ref ?? '').toLowerCase();
      const key = (field.key ?? '').toLowerCase();
      let source: any[] = [];

      if (ref === 'product' || key.includes('product')) {
        source = this.masters?.products ?? [];
      } else if (ref === 'brand' || key.includes('brand')) {
        source = this.masters?.brands ?? [];
      } else if (ref === 'master' || ref === 'category' || key.includes('category')) {
        source = this.masters?.categories ?? [];
      } else if (ref === 'tag' || key.includes('tag')) {
        source = this.masters?.tags ?? [];
      }

      return source.map((item: any) => {
        if (typeof item === 'string') return { label: item, value: item };
        return {
          label: item.name ?? item.title ?? item.label ?? 'Unknown',
          value: item._id ?? item.id ?? item.value
        };
      });
    }

    return [];
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _createGroup(schemaDef: any, data: any): AbstractControl {
    if (!schemaDef || typeof schemaDef === 'string') {
      return new FormControl(data ?? '');
    }
    // Unwrap .schema wrapper if present
    const schema = (schemaDef as any).schema ?? schemaDef;
    const group: Record<string, AbstractControl> = {};
    for (const [k, def] of Object.entries(schema as Record<string, any>)) {
      let val = data?.[k] !== undefined ? data[k] : (def.default ?? null);
      if ((def.type === 'datetime' || def.type === 'date') && val) {
        val = new Date(val);
      }
      group[k] = new FormControl(val, this._validators(def));
    }
    return this.fb.group(group);
  }

  private _schemaToFields(schema: Record<string, any>): NormalisedField[] {
    return Object.entries(schema).map(([k, def]) => ({
      key: k,
      ...def,
      label: def.label ?? this._formatLabel(k)
    }));
  }

  private _classifyField(field: NormalisedField): void {
    const k = field.key.toLowerCase();
    const styleKeys = ['color', 'padding', 'margin', 'gap', 'theme', 'align', 'height', 'width', 'opacity', 'background'];
    const settingKeys = ['isactive', 'hideon', 'limit', 'ruletype', 'itemsper', 'columns', 'pagination', 'sticky', 'autoplay', 'show'];

    if (field.type === 'boolean') {
      this.booleanGroup.push(field);
    } else if (styleKeys.some(sk => k.includes(sk)) || field.type === 'color') {
      this.tabs.style.push(field);
    } else if (settingKeys.some(sk => k.includes(sk))) {
      this.tabs.settings.push(field);
    } else {
      this.tabs.content.push(field);
    }
  }

  private _validators(def: any) {
    const v = [];
    if (def.required) v.push(Validators.required);
    if (def.min !== undefined) v.push(Validators.min(def.min));
    if (def.max !== undefined) v.push(Validators.max(def.max));
    if (def.maxLength !== undefined) v.push(Validators.maxLength(def.maxLength));
    return v;
  }

  _formatLabel(s: string): string {
    return s
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

