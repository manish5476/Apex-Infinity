import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-config-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    ColorPickerModule,
    ButtonModule,
    TabsModule,
    ToggleSwitchModule,
    TooltipModule
  ],
  templateUrl: './config-form.component.html',
  styleUrls: ['./config-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfigFormComponent implements OnChanges {
  @Input() config: any = {};
  @Input() schema: any = {};
  @Output() configChange = new EventEmitter<any>();

  form: FormGroup;
  fb = inject(FormBuilder);

  // UX Buckets
  tabs = {
    content: [] as any[],
    settings: [] as any[],
    style: [] as any[]
  };

  // Group toggles together
  booleanGroup: any[] = [];

  // Track expanded state for array items (survives drag & drop)
  expandedControls = new Map<AbstractControl, boolean>();

  constructor() { this.form = this.fb.group({}); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['schema']) {
      this.buildForm();
    } else if (changes['config'] && this.form) {
      this.form.patchValue(this.config, { emitEvent: false });
    }
  }

  buildForm() {
    this.form = this.fb.group({});
    this.resetBuckets();

    if (!this.schema) return;

    Object.keys(this.schema).forEach(key => {
      const def = this.schema[key];
      const initialValue = this.config[key] ?? def.default ?? null;

      // 1. Control Creation
      if (def.type === 'array') {
        // Cast to 'any' to bypass strict FormGroup check
        const arr = this.fb.array<any>([]); 
        if (Array.isArray(initialValue)) {
          initialValue.forEach((itemVal: any) => {
            arr.push(this.createArrayGroup(def.schema, itemVal) as any);
          });
        }
        this.form.addControl(key, arr);
      } else {
        const validators = this.getValidators(def);
        this.form.addControl(key, new FormControl(initialValue, validators));
      }

      // 2. Classification Logic
      const field = { key, ...def, label: this.formatLabel(key) };

      if (def.type === 'array') {
        this.tabs.content.push(field);
      } else if (this.isStyleField(key, def)) {
        this.tabs.style.push(field);
      } else if (def.type === 'boolean') {
        this.booleanGroup.push(field);
      } else if (this.isSettingField(key, def)) {
        this.tabs.settings.push(field);
      } else {
        this.tabs.content.push(field);
      }
    });

    this.form.valueChanges.subscribe(val => {
      if (this.form.valid) this.configChange.emit(val);
    });
  }

  // --- Array Logic ---

  // createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
  //   const group: any = {};
  //   Object.keys(schemaDef).forEach(k => {
  //     group[k] = [data[k] ?? schemaDef[k].default ?? ''];
  //   });
  //   return this.fb.group(group);
  // }
// In config-form.component.ts

createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
    const group: any = {};
    Object.keys(schemaDef).forEach(k => {
      const fieldDef = schemaDef[k];
      
      // 1. Determine Default Value (Handle booleans/numbers correctly)
      let defaultValue = fieldDef.default ?? '';
      if (fieldDef.type === 'boolean') defaultValue = fieldDef.default ?? false;
      if (fieldDef.type === 'number') defaultValue = fieldDef.default ?? null;

      // 2. Get Value (Data > Default)
      const val = data[k] !== undefined ? data[k] : defaultValue;

      // 3. ✅ FIX: Apply Validators to Array fields
      // The original code was missing this: this.getValidators(fieldDef)
      group[k] = [val, this.getValidators(fieldDef)]; 
    });
    return this.fb.group(group);
  }

  getFormArray(key: string): FormArray<any> { 
    return this.form.get(key) as FormArray<any>; 
  }

  addArrayItem(field: any) {
    const arr = this.getFormArray(field.key);
    const newGroup = this.createArrayGroup(field.schema) as any;
    arr.push(newGroup);
    
    // Auto-expand new item
    this.expandedControls.set(newGroup, true);
    
    this.form.updateValueAndValidity();
  }

  removeArrayItem(key: string, index: number, event: Event) {
    event.stopPropagation();
    this.getFormArray(key).removeAt(index);
  }

  drop(event: CdkDragDrop<string[]>, formArrayName: string) {
    const dir = this.getFormArray(formArrayName);
    const from = event.previousIndex;
    const to = event.currentIndex;

    const control = dir.at(from);
    dir.removeAt(from);
    dir.insert(to, control);

    this.form.updateValueAndValidity();
  }

  // --- State Management ---

  toggleExpanded(control: AbstractControl) {
    const currentState = this.expandedControls.get(control) || false;
    this.expandedControls.set(control, !currentState);
  }

  isExpanded(control: AbstractControl): boolean {
    return this.expandedControls.get(control) || false;
  }

  getItemTitle(control: AbstractControl, schema: any): string {
    const val = control.value;
    if (!val) return 'Item';
    if (val.title) return val.title;
    if (val.text) return val.text;
    if (val.label) return val.label;
    if (val.name) return val.name;
    const firstString = Object.keys(val).find(k => typeof val[k] === 'string' && val[k].length > 0);
    return firstString ? val[firstString] : 'Item';
  }

  // --- Helpers ---
  resetBuckets() {
    this.tabs = { content: [], settings: [], style: [] };
    this.booleanGroup = [];
  }

  getValidators(def: any) {
    const validators = [];
    if (def.required) validators.push(Validators.required);
    if (def.min !== undefined) validators.push(Validators.min(def.min));
    if (def.max !== undefined) validators.push(Validators.max(def.max));
    if (def.maxLength) validators.push(Validators.maxLength(def.maxLength));
    return validators;
  }

  isStyleField(key: string, def: any): boolean {
    const k = key.toLowerCase();
    return k.includes('color') || k.includes('background') || k.includes('gap') || k.includes('padding') || k.includes('margin') || def.format === 'color';
  }

  isSettingField(key: string, def: any): boolean {
    if (def.type === 'number') return true;
    if (def.enum && !['alignment', 'textAlign'].includes(key)) return true;
    return false;
  }

  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  getEnumOptions(def: any) {
    if (!def.enum) return [];
    return def.enum.map((opt: string) => ({ label: opt.toString().replace(/_/g, ' ').toUpperCase(), value: opt }));
  }

  getArraySchema(field: any) {
    return Object.keys(field.schema).map(k => ({ key: k, label: this.formatLabel(k), ...field.schema[k] }));
  }
}
