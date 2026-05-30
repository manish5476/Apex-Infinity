import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DynamicFormEngineService } from './dynamic-form-engine.service';
import { DynamicFieldDefinition } from './section-schema.types';
import { FONT_FAMILY_OPTIONS } from '../../storefront-public/dynamic-page/section-config.utils';

@Component({
  selector: 'app-dynamic-field-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    BadgeModule,
    ButtonModule,
    CheckboxModule,
    ColorPickerModule,
    DatePickerModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TextareaModule,
    forwardRef(() => DynamicFieldRendererComponent)
  ],
  template: `
    @if (field && parentGroup) {
      @if (field.type === 'object') {
        <div class="group-box">
          <div class="group-box-header">
            <i class="pi pi-folder text-[9px] text-surface-400"></i>
            <span class="group-label">{{ field.label }}</span>
          </div>
          <div class="flex flex-col gap-4 p-3" [formGroup]="asFormGroup(parentGroup.get(field.key))">
            @for (sub of childFields(field); track sub.key) {
              <app-dynamic-field-renderer
                [field]="sub"
                [parentGroup]="asFormGroup(parentGroup.get(field.key))"
                [masters]="masters"
                [expandedControls]="expandedControls"
                (arrayMutation)="arrayMutation.emit()">
              </app-dynamic-field-renderer>
            }
          </div>
        </div>
      } @else if (field.type === 'array') {
        <div class="group-box p-0 overflow-hidden">
          <div class="flex items-center justify-between px-3 py-2 bg-surface-50 border-b border-surface-100">
            <div class="flex items-center gap-2">
              <i class="pi pi-list text-[9px] text-surface-400"></i>
              <span class="text-[10px] font-black uppercase text-surface-500 tracking-widest">{{ field.label }}</span>
            </div>
            <p-badge [value]="getFormArray(field.key).length.toString()" severity="secondary" styleClass="text-[9px]"></p-badge>
          </div>

          <div cdkDropList (cdkDropListDropped)="drop($event, field.key)" class="p-2 flex flex-col gap-1.5">
            @for (ctrl of getFormArray(field.key).controls; track ctrl; let i = $index) {
              <div cdkDrag class="array-card" [class.is-expanded]="expandedControls.get(ctrl)">
                <div class="flex items-center px-2 py-1.5 cursor-pointer gap-2 hover:bg-surface-50 rounded" (click)="toggleExpanded(ctrl)">
                  <div class="drag-handle shrink-0" cdkDragHandle (click)="$event.stopPropagation()">
                    <i class="pi pi-bars text-[9px] text-surface-300"></i>
                  </div>
                  <span class="flex-1 text-xs font-bold text-surface-700 truncate">
                    {{ getItemTitle(ctrl) || ('Item ' + (i + 1)) }}
                  </span>
                  <i class="pi text-[9px] text-surface-400 transition-transform"
                    [class.pi-chevron-down]="!expandedControls.get(ctrl)"
                    [class.pi-chevron-up]="expandedControls.get(ctrl)"></i>
                  <button type="button" (click)="removeArrayItem(field.key, i); $event.stopPropagation()" class="btn-remove shrink-0">
                    <i class="pi pi-trash text-[9px]"></i>
                  </button>
                </div>

                @if (expandedControls.get(ctrl)) {
                  <div class="px-3 pb-3 pt-1 border-t border-surface-100 flex flex-col gap-4 bg-white rounded-b" [formGroup]="asFormGroup(ctrl)">
                    @for (sub of childFields(field); track sub.key) {
                      <app-dynamic-field-renderer
                        [field]="sub"
                        [parentGroup]="asFormGroup(ctrl)"
                        [masters]="masters"
                        [expandedControls]="expandedControls"
                        (arrayMutation)="arrayMutation.emit()">
                      </app-dynamic-field-renderer>
                    }
                  </div>
                }
              </div>
            }

            @if (getFormArray(field.key).length === 0) {
              <div class="py-4 text-center text-surface-300">
                <p class="text-xs">No items yet</p>
              </div>
            }
          </div>

          <button pButton type="button"
            class="p-button-text p-button-sm w-full rounded-none border-t border-surface-100 !text-primary-600 !text-xs !font-bold"
            icon="pi pi-plus" label="Add Item" (click)="addArrayItem(field)">
          </button>
        </div>
      } @else {
        <div class="field-wrapper" [formGroup]="parentGroup">
          @if (field.type !== 'boolean') {
            <label class="field-label">
              {{ field.label }}
              @if (field.required) { <span class="text-red-400 ml-0.5">*</span> }
            </label>
          }

          <div class="p-fluid">
            @if (field.type === 'reference-multi') {
              <p-multiselect [options]="options" [formControlName]="field.key" optionLabel="label"
                optionValue="value" display="chip" placeholder="Select..." appendTo="body" [filter]="true" [showClear]="true">
              </p-multiselect>
            } @else if (field.type === 'font') {
              <p-inputgroup>
                <p-inputgroup-addon>
                  <i class="pi pi-font"></i>
                </p-inputgroup-addon>
                <input pInputText [formControlName]="field.key" [attr.list]="fontListId(field)" placeholder="Select or type a font family" />
              </p-inputgroup>
              <datalist [id]="fontListId(field)">
                @for (option of fontOptions(field); track option) {
                  <option [value]="option"></option>
                }
              </datalist>
            } @else if (field.enum || field.type === 'reference') {
              <p-select [options]="options" [formControlName]="field.key" optionLabel="label" optionValue="value"
                placeholder="Select..." appendTo="body" [filter]="true" filterBy="label" [showClear]="!field.required">
              </p-select>
            } @else if (field.type === 'color') {
              <p-inputgroup>
                <p-inputgroup-addon [style.background]="parentGroup.get(field.key)?.value || 'var(--bg-primary)'" class="!w-10">
                  <p-colorpicker [formControlName]="field.key" appendTo="body"></p-colorpicker>
                </p-inputgroup-addon>
                <input type="text" pInputText [formControlName]="field.key" placeholder="#000000" />
              </p-inputgroup>
            } @else if (field.type === 'image') {
              <div class="flex flex-col gap-2">
                <input pInputText [formControlName]="field.key" placeholder="https://..." />
                @if (parentGroup.get(field.key)?.value) {
                  <div class="preview-thumb">
                    <img [src]="parentGroup.get(field.key)?.value" alt="Preview" loading="lazy" />
                  </div>
                }
              </div>
            } @else if (field.type === 'icon') {
              <p-inputgroup>
                <p-inputgroup-addon>
                  <i class="pi" [ngClass]="parentGroup.get(field.key)?.value || 'pi-image'"></i>
                </p-inputgroup-addon>
                <input pInputText [formControlName]="field.key" placeholder="pi pi-star" />
              </p-inputgroup>
            } @else if (field.type === 'datetime' || field.type === 'date') {
              <p-datepicker [formControlName]="field.key" [showTime]="field.type === 'datetime'" [showIcon]="true"
                appendTo="body" hourFormat="12" [showButtonBar]="true">
              </p-datepicker>
            } @else if (field.type === 'boolean') {
              <div class="toggle-card" (click)="parentGroup.get(field.key)?.setValue(!parentGroup.get(field.key)?.value)">
                <p-checkbox [formControlName]="field.key" [binary]="true" (click)="$event.stopPropagation()"></p-checkbox>
                <span class="toggle-title">{{ field.label }}</span>
              </div>
            } @else if (field.type === 'textarea' || field.type === 'richtext') {
              <textarea pTextarea [formControlName]="field.key" [rows]="4" [autoResize]="true" [placeholder]="'Enter ' + field.label"></textarea>
            } @else if (field.type === 'number') {
              <p-inputnumber [formControlName]="field.key" [showButtons]="true" [min]="field.min" [max]="field.max"
                [step]="field.step || 1" [minFractionDigits]="field.step && field.step < 1 ? 2 : 0"
                buttonLayout="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                [placeholder]="field.label">
              </p-inputnumber>
            } @else {
              <input pInputText [formControlName]="field.key" [placeholder]="'Enter ' + field.label" />
            }
          </div>

          @if (field.description) {
            <small class="field-help">{{ field.description }}</small>
          }

          @if (parentGroup.get(field.key)?.invalid && parentGroup.get(field.key)?.touched) {
            <small class="field-error">
              @if (parentGroup.get(field.key)?.errors?.['required']) { Required }
              @else if (parentGroup.get(field.key)?.errors?.['min']) { Value too low }
              @else if (parentGroup.get(field.key)?.errors?.['max']) { Value too high }
              @else if (parentGroup.get(field.key)?.errors?.['maxlength']) { Too long }
              @else if (parentGroup.get(field.key)?.errors?.['maxItems']) { Too many items }
              @else { Invalid value }
            </small>
          }
        </div>
      }
    }
  `
})
export class DynamicFieldRendererComponent implements OnChanges {
  @Input({ required: true }) field!: DynamicFieldDefinition;
  @Input({ required: true }) parentGroup!: FormGroup;
  @Input() masters: any = { categories: [], brands: [], tags: [], products: [] };
  @Input() expandedControls = new Map<AbstractControl, boolean>();
  @Output() arrayMutation = new EventEmitter<void>();

  private readonly engine = inject(DynamicFormEngineService);

  options: Array<{ label: string; value: unknown }> = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field'] || changes['masters']) {
      if (this.field && (this.field.enum || this.field.type?.includes('reference'))) {
        this.options = this.generateOptions();
      }
    }
  }

  getFormArray(key: string): FormArray {
    return this.parentGroup.get(key) as FormArray;
  }

  childFields(field: DynamicFieldDefinition): DynamicFieldDefinition[] {
    return this.engine.childFields(field);
  }

  addArrayItem(field: DynamicFieldDefinition): void {
    const ctrl = this.engine.createArrayItem(field);
    this.getFormArray(field.key).push(ctrl);
    this.expandedControls.set(ctrl, true);
    this.arrayMutation.emit();
  }

  removeArrayItem(key: string, index: number): void {
    this.getFormArray(key).removeAt(index);
    this.arrayMutation.emit();
  }

  drop(event: CdkDragDrop<unknown[]>, key: string): void {
    const array = this.getFormArray(key);
    moveItemInArray(array.controls, event.previousIndex, event.currentIndex);
    array.updateValueAndValidity();
    this.arrayMutation.emit();
  }

  toggleExpanded(control: AbstractControl): void {
    this.expandedControls.set(control, !this.expandedControls.get(control));
  }

  getItemTitle(control: AbstractControl): string {
    const value = control.value;
    if (typeof value === 'string') return value;
    return value?.text ?? value?.title ?? value?.name ?? value?.label ?? value?.question ?? 'Item';
  }

  generateOptions(): Array<{ label: string; value: unknown }> {
    if (this.field.enum) {
      return this.field.enum.map(value => ({
        label: typeof value === 'string' ? this.formatLabel(value) : String(value),
        value
      }));
    }

    if (this.field.type?.includes('reference')) {
      const ref = (this.field.ref ?? '').toLowerCase();
      const key = (this.field.key ?? '').toLowerCase();
      let source: unknown[] = [];

      if (ref === 'product' || key.includes('product')) source = this.masters?.products ?? [];
      else if (ref === 'brand' || key.includes('brand')) source = this.masters?.brands ?? [];
      else if (ref === 'master' || ref === 'category' || key.includes('category')) source = this.masters?.categories ?? [];
      else if (ref === 'tag' || key.includes('tag')) source = this.masters?.tags ?? [];

      return source.map((item: any) => typeof item === 'string'
        ? { label: item, value: item }
        : { label: item.name ?? item.title ?? item.label ?? 'Unknown', value: item._id ?? item.id ?? item.value });
    }

    return [];
  }

  fontOptions(field: DynamicFieldDefinition): string[] {
    const schemaOptions = Array.isArray(field.enum)
      ? field.enum.filter((value): value is string => typeof value === 'string')
      : [];
    return Array.from(new Set([...schemaOptions, ...FONT_FAMILY_OPTIONS]));
  }

  fontListId(field: DynamicFieldDefinition): string {
    return `font-options-${field.key.replace(/[^a-z0-9_-]/gi, '-')}`;
  }

  asFormGroup(control: AbstractControl | null): FormGroup {
    return control as FormGroup;
  }

  private formatLabel(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

