import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { BadgeModule } from 'primeng/badge';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-config-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DragDropModule, 
    InputTextModule, InputNumberModule, SelectModule, MultiSelectModule,
    TextareaModule, ColorPickerModule, ButtonModule, TabsModule, TooltipModule,
    ToggleSwitchModule, CheckboxModule, InputGroupAddonModule, 
    DatePickerModule, InputGroupModule, BadgeModule
  ],
  templateUrl: './config-form.component.html',
  styleUrls: ['./config-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfigFormComponent implements OnChanges  {
  @Input() config: any = {};
  @Input() schema: any = {};
  /**
   * Expects structured data from MasterListService: 
   * { categories: [], brands: [], products: [], tags: [], ... }
   */
  @Input() masters: any = { categories: [], brands: [], tags: [], products: [] };
  @Output() configChange = new EventEmitter<any>();

  form: FormGroup;
  fb = inject(FormBuilder);
  
  // Track active tab to prevent visibility issues
  activeTab: string = '0';

  tabs = { content: [] as any[], settings: [] as any[], style: [] as any[] };
  booleanGroup: any[] = [];
  expandedControls = new Map<AbstractControl, boolean>();

  constructor() { 
    this.form = this.fb.group({ _initialized: [false] }); 
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['schema'] || (changes['config'] && !this.form.get('_initialized')?.value)) {
      this.buildForm();
    }
  }

  buildForm() {
    const group: any = { _initialized: new FormControl(true) };
    this.tabs = { content: [], settings: [], style: [] };
    this.booleanGroup = [];

    if (!this.schema) return;

    Object.keys(this.schema).forEach(key => {
      const def = this.schema[key];
      const initialValue = this.config?.[key] !== undefined ? this.config[key] : (def.default ?? null);

      if (def.type === 'array') {
        const arr = this.fb.array<AbstractControl>([]);
        if (Array.isArray(initialValue)) {
          initialValue.forEach(v => arr.push(this.createControlForType(def.itemSchema, v)));
        }
        group[key] = arr;
      } 
      else if (def.type === 'object') {
        group[key] = this.createControlForType(def.schema, initialValue);
      }
      else {
        let val = initialValue;
        if ((def.type === 'datetime' || def.type === 'date') && typeof val === 'string') {
          val = new Date(val);
        }
        group[key] = new FormControl(val, this.getValidators(def));
      }

      const field = { key, ...def, label: def.label || this.formatLabel(key) };
      this.classifyField(field);
    });

    this.form = this.fb.group(group);
    
    this.form.valueChanges.subscribe(val => {
      if (this.form.valid) {
        const { _initialized, ...cleanVal } = val;
        this.configChange.emit(cleanVal);
      }
    });
  }

  createControlForType(schemaDef: any, data: any): AbstractControl {
    if (!schemaDef || typeof schemaDef === 'string') {
      return new FormControl(data || '');
    }

    const group: any = {};
    Object.keys(schemaDef).forEach(k => {
      const fieldDef = schemaDef[k];
      let val = data?.[k] !== undefined ? data[k] : (fieldDef.default ?? null);
      if ((fieldDef.type === 'datetime' || fieldDef.type === 'date') && val) {
        val = new Date(val);
      }
      group[k] = new FormControl(val, this.getValidators(fieldDef));
    });
    return this.fb.group(group);
  }

  classifyField(field: any) {
    const k = field.key.toLowerCase();
    const styleKeys = ['color', 'padding', 'margin', 'gap', 'theme', 'align', 'height', 'width', 'opacity'];
    const settingKeys = ['isactive', 'hideon', 'limit', 'ruletype', 'itemsper', 'columns', 'pagination', 'sticky'];

    if (field.type === 'boolean' && field.ui !== 'checkbox') {
      this.booleanGroup.push(field);
    } 
    else if (styleKeys.some(sk => k.includes(sk)) || field.type === 'color') {
      this.tabs.style.push(field);
    } 
    else if (settingKeys.some(sk => k.includes(sk))) {
      this.tabs.settings.push(field);
    } 
    else {
      this.tabs.content.push(field);
    }
  }

  /**
   * Resolves options for Enums and Reference fields.
   * Maps Master data to { label: name, value: _id } as requested.
   */
  getEnumOptions(field: any) {
    if (field.options) return field.options;
    
    // Standard Enum handling
    if (field.enum) {
      return field.enum.map((v: any) => ({ 
        label: typeof v === 'string' ? this.formatLabel(v) : v.toString(), 
        value: v 
      }));
    }

    // Reference Resolution from Masters
    if (field.type?.includes('reference')) {
      const ref = (field.ref || '').toLowerCase();
      const key = (field.key || '').toLowerCase();

      let sourceArray: any[] = [];

      // Determine the correct master list based on ref or field key
      if (ref === 'product' || key.includes('product')) {
        sourceArray = this.masters?.products || [];
      } else if (ref === 'brand' || key.includes('brand')) {
        sourceArray = this.masters?.brands || [];
      } else if (ref === 'master' || ref === 'category' || key.includes('category')) {
        sourceArray = this.masters?.categories || [];
      } else if (ref === 'tag' || key.includes('tag')) {
        sourceArray = this.masters?.tags || [];
      }

      // Map to standardized { label: name, value: _id }
      return sourceArray.map((item: any) => {
        // Handle both object items and primitive string items (like tags)
        if (typeof item === 'string') {
          return { label: item, value: item };
        }
        return {
          label: item.name || item.title || item.label || 'Unknown',
          value: item._id || item.id || item.value
        };
      });
    }
    return [];
  }

  formatLabel(s: string) {
    return s.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  getValidators(def: any) {
    const v = [];
    if (def.required) v.push(Validators.required);
    if (def.min !== undefined) v.push(Validators.min(def.min));
    if (def.max !== undefined) v.push(Validators.max(def.max));
    return v;
  }

  getFormArray(key: string): FormArray { 
    return this.form.get(key) as FormArray; 
  }
  
  getArrayFields(field: any) {
    if (typeof field.itemSchema === 'string' || !field.itemSchema) return [];
    const schema = field.itemSchema.schema || field.itemSchema;
    return Object.keys(schema).map(k => ({ 
      key: k, ...schema[k], label: schema[k].label || this.formatLabel(k) 
    }));
  }

  getObjectFields(field: any) {
    if (!field.schema) return [];
    return Object.keys(field.schema).map(k => ({ 
      key: k, ...field.schema[k], label: field.schema[k].label || this.formatLabel(k) 
    }));
  }

  addArrayItem(field: any) {
    const arr = this.getFormArray(field.key);
    const ctrl = this.createControlForType(field.itemSchema.schema || field.itemSchema, null);
    arr.push(ctrl);
    this.expandedControls.set(ctrl, true);
  }

  removeArrayItem(key: string, i: number) { 
    this.getFormArray(key).removeAt(i); 
  }

  toggleExpanded(c: AbstractControl) { 
    this.expandedControls.set(c, !this.expandedControls.get(c)); 
  }

  getItemTitle(c: AbstractControl) {
    const v = c.value;
    if (typeof v === 'string') return v;
    return v?.text || v?.title || v?.name || v?.label || v?.question || 'New Item';
  }

  drop(event: CdkDragDrop<any[]>, key: string) {
    const arr = this.getFormArray(key);
    moveItemInArray(arr.controls, event.previousIndex, event.currentIndex);
    arr.updateValueAndValidity();
  }
}

// import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
// import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// // PrimeNG Imports
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { TextareaModule } from 'primeng/textarea';
// import { ColorPickerModule } from 'primeng/colorpicker';
// import { ButtonModule } from 'primeng/button';
// import { TabsModule } from 'primeng/tabs';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { CheckboxModule } from 'primeng/checkbox';
// import { DatePickerModule } from 'primeng/datepicker';
// import { InputGroupModule } from 'primeng/inputgroup';
// import { BadgeModule } from 'primeng/badge';
// import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
// import { TooltipModule } from 'primeng/tooltip';

// @Component({
//   selector: 'app-config-form',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, DragDropModule, 
//     InputTextModule, InputNumberModule, SelectModule, MultiSelectModule,
//     TextareaModule, ColorPickerModule, ButtonModule, TabsModule, TooltipModule,
//     ToggleSwitchModule, CheckboxModule, InputGroupAddonModule, 
//     DatePickerModule, InputGroupModule, BadgeModule
//   ],
//   templateUrl: './config-form.component.html',
//   styleUrls: ['./config-form.component.scss'],
//   encapsulation: ViewEncapsulation.None
// })
// export class ConfigFormComponent implements OnChanges  {
//   @Input() config: any = {};
//   @Input() schema: any = {};
//   /**
//    * Expects structured data from MasterListService: 
//    * { categories: [], brands: [], products: [], tags: [], ... }
//    */
//   @Input() masters: any = { categories: [], brands: [], tags: [], products: [] };
//   @Output() configChange = new EventEmitter<any>();

//   form: FormGroup;
//   fb = inject(FormBuilder);
  
//   tabs = { content: [] as any[], settings: [] as any[], style: [] as any[] };
//   booleanGroup: any[] = [];
//   expandedControls = new Map<AbstractControl, boolean>();

//   constructor() { 
//     this.form = this.fb.group({ _initialized: [false] }); 
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['schema'] || (changes['config'] && !this.form.get('_initialized')?.value)) {
//       this.buildForm();
//     }
//   }

//   buildForm() {
//     const group: any = { _initialized: new FormControl(true) };
//     this.tabs = { content: [], settings: [], style: [] };
//     this.booleanGroup = [];

//     if (!this.schema) return;

//     Object.keys(this.schema).forEach(key => {
//       const def = this.schema[key];
//       const initialValue = this.config?.[key] !== undefined ? this.config[key] : (def.default ?? null);

//       if (def.type === 'array') {
//         const arr = this.fb.array<AbstractControl>([]);
//         if (Array.isArray(initialValue)) {
//           initialValue.forEach(v => arr.push(this.createControlForType(def.itemSchema, v)));
//         }
//         group[key] = arr;
//       } 
//       else if (def.type === 'object') {
//         group[key] = this.createControlForType(def.schema, initialValue);
//       }
//       else {
//         let val = initialValue;
//         if ((def.type === 'datetime' || def.type === 'date') && typeof val === 'string') {
//           val = new Date(val);
//         }
//         group[key] = new FormControl(val, this.getValidators(def));
//       }

//       const field = { key, ...def, label: def.label || this.formatLabel(key) };
//       this.classifyField(field);
//     });

//     this.form = this.fb.group(group);
    
//     this.form.valueChanges.subscribe(val => {
//       if (this.form.valid) {
//         const { _initialized, ...cleanVal } = val;
//         this.configChange.emit(cleanVal);
//       }
//     });
//   }

//   createControlForType(schemaDef: any, data: any): AbstractControl {
//     if (!schemaDef || typeof schemaDef === 'string') {
//       return new FormControl(data || '');
//     }

//     const group: any = {};
//     Object.keys(schemaDef).forEach(k => {
//       const fieldDef = schemaDef[k];
//       let val = data?.[k] !== undefined ? data[k] : (fieldDef.default ?? null);
//       if ((fieldDef.type === 'datetime' || fieldDef.type === 'date') && val) {
//         val = new Date(val);
//       }
//       group[k] = new FormControl(val, this.getValidators(fieldDef));
//     });
//     return this.fb.group(group);
//   }

//   classifyField(field: any) {
//     const k = field.key.toLowerCase();
//     const styleKeys = ['color', 'padding', 'margin', 'gap', 'theme', 'align', 'height', 'width', 'opacity'];
//     const settingKeys = ['isactive', 'hideon', 'limit', 'ruletype', 'itemsper', 'columns', 'pagination', 'sticky'];

//     if (field.type === 'boolean' && field.ui !== 'checkbox') {
//       this.booleanGroup.push(field);
//     } 
//     else if (styleKeys.some(sk => k.includes(sk)) || field.type === 'color') {
//       this.tabs.style.push(field);
//     } 
//     else if (settingKeys.some(sk => k.includes(sk))) {
//       this.tabs.settings.push(field);
//     } 
//     else {
//       this.tabs.content.push(field);
//     }
//   }

//   /**
//    * Resolves options for Enums and Reference fields.
//    * Maps Master data to { label: name, value: _id } as requested.
//    */
//   getEnumOptions(field: any) {
//     if (field.options) return field.options;
    
//     // Standard Enum handling
//     if (field.enum) {
//       return field.enum.map((v: any) => ({ 
//         label: typeof v === 'string' ? this.formatLabel(v) : v.toString(), 
//         value: v 
//       }));
//     }

//     // Reference Resolution from Masters
//     if (field.type?.includes('reference')) {
//       const ref = (field.ref || '').toLowerCase();
//       const key = (field.key || '').toLowerCase();

//       let sourceArray: any[] = [];

//       // Determine the correct master list based on ref or field key
//       if (ref === 'product' || key.includes('product')) {
//         sourceArray = this.masters?.products || [];
//       } else if (ref === 'brand' || key.includes('brand')) {
//         sourceArray = this.masters?.brands || [];
//       } else if (ref === 'master' || ref === 'category' || key.includes('category')) {
//         sourceArray = this.masters?.categories || [];
//       } else if (ref === 'tag' || key.includes('tag')) {
//         sourceArray = this.masters?.tags || [];
//       }

//       // Map to standardized { label: name, value: _id }
//       return sourceArray.map((item: any) => {
//         // Handle both object items and primitive string items (like tags)
//         if (typeof item === 'string') {
//           return { label: item, value: item };
//         }
//         return {
//           label: item.name || item.title || item.label || 'Unknown',
//           value: item._id || item.id || item.value
//         };
//       });
//     }
//     return [];
//   }

//   formatLabel(s: string) {
//     return s.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
//   }

//   getValidators(def: any) {
//     const v = [];
//     if (def.required) v.push(Validators.required);
//     if (def.min !== undefined) v.push(Validators.min(def.min));
//     if (def.max !== undefined) v.push(Validators.max(def.max));
//     return v;
//   }

//   getFormArray(key: string): FormArray { 
//     return this.form.get(key) as FormArray; 
//   }
  
//   getArrayFields(field: any) {
//     if (typeof field.itemSchema === 'string' || !field.itemSchema) return [];
//     const schema = field.itemSchema.schema || field.itemSchema;
//     return Object.keys(schema).map(k => ({ 
//       key: k, ...schema[k], label: schema[k].label || this.formatLabel(k) 
//     }));
//   }

//   getObjectFields(field: any) {
//     if (!field.schema) return [];
//     return Object.keys(field.schema).map(k => ({ 
//       key: k, ...field.schema[k], label: field.schema[k].label || this.formatLabel(k) 
//     }));
//   }

//   addArrayItem(field: any) {
//     const arr = this.getFormArray(field.key);
//     const ctrl = this.createControlForType(field.itemSchema.schema || field.itemSchema, null);
//     arr.push(ctrl);
//     this.expandedControls.set(ctrl, true);
//   }

//   removeArrayItem(key: string, i: number) { 
//     this.getFormArray(key).removeAt(i); 
//   }

//   toggleExpanded(c: AbstractControl) { 
//     this.expandedControls.set(c, !this.expandedControls.get(c)); 
//   }

//   getItemTitle(c: AbstractControl) {
//     const v = c.value;
//     if (typeof v === 'string') return v;
//     return v?.text || v?.title || v?.name || v?.label || v?.question || 'New Item';
//   }

//   drop(event: CdkDragDrop<any[]>, key: string) {
//     const arr = this.getFormArray(key);
//     moveItemInArray(arr.controls, event.previousIndex, event.currentIndex);
//     arr.updateValueAndValidity();
//   }
// }
