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

  createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
    const group: any = {};
    Object.keys(schemaDef).forEach(k => {
      group[k] = [data[k] ?? schemaDef[k].default ?? ''];
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

// import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
// import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// // PrimeNG
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TextareaModule } from 'primeng/textarea';
// import { ColorPickerModule } from 'primeng/colorpicker';
// import { ButtonModule } from 'primeng/button';
// import { TabsModule } from 'primeng/tabs';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { SelectModule } from 'primeng/select';
// import { AccordionModule } from 'primeng/accordion';
// import { TooltipModule } from 'primeng/tooltip';

// @Component({
//   selector: 'app-config-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     DragDropModule,
//     InputTextModule,
//     InputNumberModule,
//     SelectModule,
//     TextareaModule,
//     ColorPickerModule,
//     ButtonModule,
//     TabsModule,
//     ToggleSwitchModule,
//     AccordionModule,
//     TooltipModule
//   ],
//   templateUrl: './config-form.component.html',
//   styleUrls: ['./config-form.component.scss'],
//   encapsulation: ViewEncapsulation.None
// })
// export class ConfigFormComponent implements OnChanges {
//   @Input() config: any = {};
//   @Input() schema: any = {};
//   @Output() configChange = new EventEmitter<any>();

//   form: FormGroup;
//   fb = inject(FormBuilder);

//   tabs = {
//     content: [] as any[],
//     settings: [] as any[],
//     style: [] as any[]
//   };

//   booleanGroup: any[] = [];

//   constructor() { this.form = this.fb.group({}); }

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['schema']) {
//       this.buildForm();
//     } else if (changes['config'] && this.form) {
//       this.form.patchValue(this.config, { emitEvent: false });
//     }
//   }


//   expandedControls = new Map<AbstractControl, boolean>();

//   toggleExpanded(control: AbstractControl) {
//     const currentState = this.expandedControls.get(control) || false;
//     this.expandedControls.set(control, !currentState);
//   }

//   isExpanded(control: AbstractControl): boolean {
//     return this.expandedControls.get(control) || false;
//   }

//   // Optional: Auto-expand new items when added
//   addArrayItem(field: any) {
//     const arr = this.getFormArray(field.key);
//     const newGroup = this.createArrayGroup(field.schema) as any;
//     arr.push(newGroup);
    
//     // Auto-expand the new item
//     this.expandedControls.set(newGroup, true); 
    
//     this.form.updateValueAndValidity();
//   }

//   buildForm() {
//     this.form = this.fb.group({});
//     this.resetBuckets();

//     if (!this.schema) return;

//     Object.keys(this.schema).forEach(key => {
//       const def = this.schema[key];
//       const initialValue = this.config[key] ?? def.default ?? null;

//       // 1. Control Creation
//       if (def.type === 'array') {
//         // Explicitly type the array as holding 'any' to allow FormGroups later
//         const arr = this.fb.array<any>([]); 
        
//         if (Array.isArray(initialValue)) {
//           initialValue.forEach((itemVal: any) => {
//             // Push as 'any' to avoid strict FormGroup vs FormControl mismatch
//             arr.push(this.createArrayGroup(def.schema, itemVal) as any);
//           });
//         }
//         this.form.addControl(key, arr);
//       } else {
//         const validators = this.getValidators(def);
//         this.form.addControl(key, new FormControl(initialValue, validators));
//       }

//       // 2. Classification Logic
//       const field = { key, ...def, label: this.formatLabel(key) };

//       if (def.type === 'array') {
//         this.tabs.content.push(field);
//       } else if (this.isStyleField(key, def)) {
//         this.tabs.style.push(field);
//       } else if (def.type === 'boolean') {
//         this.booleanGroup.push(field);
//       } else if (this.isSettingField(key, def)) {
//         this.tabs.settings.push(field);
//       } else {
//         this.tabs.content.push(field);
//       }
//     });

//     this.form.valueChanges.subscribe(val => {
//       if (this.form.valid) this.configChange.emit(val);
//     });
//   }

//   // --- Array Logic (Drag & Drop + CRUD) ---

//   createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
//     const group: any = {};
//     Object.keys(schemaDef).forEach(k => {
//       group[k] = [data[k] ?? schemaDef[k].default ?? ''];
//     });
//     return this.fb.group(group);
//   }

//   // HELPER FIX: Cast to FormArray<any> to prevent the error
//   getFormArray(key: string): FormArray<any> { 
//     return this.form.get(key) as FormArray<any>; 
//   }

//   // addArrayItem(field: any) {
//   //   const arr = this.getFormArray(field.key);
//   //   // Cast the new group to 'any' to satisfy the strict Array type
//   //   arr.push(this.createArrayGroup(field.schema) as any);
//   //   this.form.updateValueAndValidity();
//   // }

//   removeArrayItem(key: string, index: number, event: Event) {
//     event.stopPropagation();
//     this.getFormArray(key).removeAt(index);
//   }

//   drop(event: CdkDragDrop<string[]>, formArrayName: string) {
//     const dir = this.getFormArray(formArrayName);
//     const from = event.previousIndex;
//     const to = event.currentIndex;

//     // Move logic
//     const control = dir.at(from);
//     dir.removeAt(from);
//     dir.insert(to, control);

//     this.form.updateValueAndValidity();
//   }

//   // Helper: Try to find a "Title" for the collapsed accordion header
//   getItemTitle(control: AbstractControl, schema: any): string {
//     const val = control.value;
//     if (!val) return 'Item';
    
//     // Try to find common title keys
//     if (val.title) return val.title;
//     if (val.text) return val.text;
//     if (val.label) return val.label;
//     if (val.name) return val.name;

//     // Fallback: Find first string property
//     const firstString = Object.keys(val).find(k => typeof val[k] === 'string' && val[k].length > 0);
//     return firstString ? val[firstString] : 'Item';
//   }

//   // --- Helpers ---
//   resetBuckets() {
//     this.tabs = { content: [], settings: [], style: [] };
//     this.booleanGroup = [];
//   }

//   getValidators(def: any) {
//     const validators = [];
//     if (def.required) validators.push(Validators.required);
//     if (def.min !== undefined) validators.push(Validators.min(def.min));
//     if (def.max !== undefined) validators.push(Validators.max(def.max));
//     if (def.maxLength) validators.push(Validators.maxLength(def.maxLength));
//     return validators;
//   }

//   isStyleField(key: string, def: any): boolean {
//     const k = key.toLowerCase();
//     return k.includes('color') || k.includes('background') || k.includes('gap') || k.includes('padding') || k.includes('margin') || def.format === 'color';
//   }

//   isSettingField(key: string, def: any): boolean {
//     if (def.type === 'number') return true;
//     if (def.enum && !['alignment', 'textAlign'].includes(key)) return true;
//     return false;
//   }

//   formatLabel(key: string): string {
//     return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
//   }

//   getEnumOptions(def: any) {
//     if (!def.enum) return [];
//     return def.enum.map((opt: string) => ({ label: opt.toString().replace(/_/g, ' ').toUpperCase(), value: opt }));
//   }

//   getArraySchema(field: any) {
//     return Object.keys(field.schema).map(k => ({ key: k, label: this.formatLabel(k), ...field.schema[k] }));
//   }
// }

// // import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
// // import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// // // PrimeNG
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { TextareaModule } from 'primeng/textarea';
// // import { ColorPickerModule } from 'primeng/colorpicker';
// // import { ButtonModule } from 'primeng/button';
// // import { TabsModule } from 'primeng/tabs';
// // import { ToggleSwitchModule } from 'primeng/toggleswitch';
// // import { SelectModule } from 'primeng/select';
// // import { AccordionModule } from 'primeng/accordion';
// // import { TooltipModule } from 'primeng/tooltip';

// // @Component({
// //   selector: 'app-config-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     DragDropModule,
// //     InputTextModule,
// //     InputNumberModule,
// //     SelectModule,
// //     TextareaModule,
// //     ColorPickerModule,
// //     ButtonModule,
// //     TabsModule,
// //     ToggleSwitchModule,
// //     AccordionModule,
// //     TooltipModule
// //   ],
// //   templateUrl: './config-form.component.html',
// //   styleUrls: ['./config-form.component.scss'], // Ensure you have this file
// //   encapsulation: ViewEncapsulation.None // Allow styling PrimeNG internals
// // })
// // export class ConfigFormComponent implements OnChanges {
// //   @Input() config: any = {};
// //   @Input() schema: any = {};
// //   @Output() configChange = new EventEmitter<any>();

// //   form: FormGroup;
// //   fb = inject(FormBuilder);

// //   // UX Buckets
// //   tabs = {
// //     content: [] as any[],
// //     settings: [] as any[],
// //     style: [] as any[]
// //   };

// //   // Group toggles together for a cleaner UI
// //   booleanGroup: any[] = [];

// //   constructor() { this.form = this.fb.group({}); }

// //   ngOnChanges(changes: SimpleChanges) {
// //     if (changes['schema']) {
// //       this.buildForm();
// //     } else if (changes['config'] && this.form) {
// //       this.form.patchValue(this.config, { emitEvent: false });
// //     }
// //   }

// //   buildForm() {
// //     this.form = this.fb.group({});
// //     this.resetBuckets();

// //     if (!this.schema) return;

// //     Object.keys(this.schema).forEach(key => {
// //       const def = this.schema[key];
// //       const initialValue = this.config[key] ?? def.default ?? null;
      
// //       // 1. Control Creation
// //       if (def.type === 'array') {
// //         const arr = this.fb.array([]);
// //         if (Array.isArray(initialValue)) {
// //           initialValue.forEach((itemVal: any) => {
// //             arr.push(this.createArrayGroup(def.schema, itemVal));
// //           });
// //         }
// //         this.form.addControl(key, arr);
// //       } else {
// //         const validators = this.getValidators(def);
// //         this.form.addControl(key, new FormControl(initialValue, validators));
// //       }

// //       // 2. Classification Logic
// //       const field = { key, ...def, label: this.formatLabel(key) };
      
// //       if (def.type === 'array') {
// //         this.tabs.content.push(field); // Arrays usually go in Content
// //       } else if (this.isStyleField(key, def)) {
// //         this.tabs.style.push(field);
// //       } else if (def.type === 'boolean') {
// //         this.booleanGroup.push(field); // Collect booleans separately
// //       } else if (this.isSettingField(key, def)) {
// //         this.tabs.settings.push(field);
// //       } else {
// //         this.tabs.content.push(field);
// //       }
// //     });

// //     // Add boolean group to Settings tab if not empty
// //     if(this.booleanGroup.length > 0) {
// //       // We don't push to tabs.settings here, we render booleanGroup explicitly in template
// //     }

// //     this.form.valueChanges.subscribe(val => {
// //       if (this.form.valid) this.configChange.emit(val);
// //     });
// //   }

// //   // --- Array Logic (Drag & Drop + CRUD) ---

// //   createArrayGroup(schemaDef: any, data: any = {}) {
// //     const group: any = {};
// //     Object.keys(schemaDef).forEach(k => {
// //       group[k] = [data[k] ?? schemaDef[k].default ?? ''];
// //     });
// //     return this.fb.group(group);
// //   }

// //   getFormArray(key: string): FormArray { return this.form.get(key) as FormArray; }

// //   addArrayItem(field: any) {
// //     const arr = this.getFormArray(field.key);
// //     arr.push(this.createArrayGroup(field.schema));
// //     this.form.updateValueAndValidity();
// //     // Auto-open logic could go here
// //   }

// //   removeArrayItem(key: string, index: number, event: Event) {
// //     event.stopPropagation();
// //     this.getFormArray(key).removeAt(index);
// //   }

// //   // Handle Drag & Drop Reordering
// //   drop(event: CdkDragDrop<string[]>, formArrayName: string) {
// //     const dir = this.getFormArray(formArrayName);
// //     const from = event.previousIndex;
// //     const to = event.currentIndex;
    
// //     // Move inside FormArray
// //     const control = dir.at(from);
// //     dir.removeAt(from);
// //     dir.insert(to, control);
    
// //     this.form.updateValueAndValidity(); // Trigger update
// //   }

// //   // Helper: Try to find a "Title" for the collapsed accordion header
// //   getItemTitle(control: any, schema: any): string {
// //     const val = control.value;
// //     // Try to find common title keys
// //     if (val.title) return val.title;
// //     if (val.text) return val.text;
// //     if (val.label) return val.label;
// //     if (val.name) return val.name;
    
// //     // Fallback: Find first string property
// //     const firstString = Object.keys(val).find(k => typeof val[k] === 'string' && val[k].length > 0);
// //     return firstString ? val[firstString] : 'Item';
// //   }

// //   // --- Helpers ---
// //   resetBuckets() {
// //     this.tabs = { content: [], settings: [], style: [] };
// //     this.booleanGroup = [];
// //   }

// //   getValidators(def: any) {
// //     const validators = [];
// //     if (def.required) validators.push(Validators.required);
// //     if (def.min !== undefined) validators.push(Validators.min(def.min));
// //     if (def.max !== undefined) validators.push(Validators.max(def.max));
// //     if (def.maxLength) validators.push(Validators.maxLength(def.maxLength));
// //     return validators;
// //   }

// //   isStyleField(key: string, def: any): boolean {
// //     const k = key.toLowerCase();
// //     return k.includes('color') || k.includes('background') || k.includes('gap') || k.includes('padding') || k.includes('margin') || def.format === 'color';
// //   }

// //   isSettingField(key: string, def: any): boolean {
// //     if (def.type === 'number') return true;
// //     if (def.enum && !['alignment', 'textAlign'].includes(key)) return true;
// //     return false;
// //   }

// //   formatLabel(key: string): string {
// //     return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
// //   }

// //   getEnumOptions(def: any) {
// //     if (!def.enum) return [];
// //     return def.enum.map((opt: string) => ({ label: opt.toString().replace(/_/g, ' ').toUpperCase(), value: opt }));
// //   }

// //   getArraySchema(field: any) {
// //     return Object.keys(field.schema).map(k => ({ key: k, label: this.formatLabel(k), ...field.schema[k] }));
// //   }
// // }

// // import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';

// // // PrimeNG Imports
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { TextareaModule } from 'primeng/textarea';
// // import { ColorPickerModule } from 'primeng/colorpicker';
// // import { ButtonModule } from 'primeng/button';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { TabsModule } from 'primeng/tabs';
// // import { ToggleSwitchModule } from 'primeng/toggleswitch';
// // import { SelectModule } from 'primeng/select';

// // @Component({
// //   selector: 'app-config-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     InputTextModule,
// //     InputNumberModule,
// //     SelectModule,
// //     TextareaModule,
// //     ColorPickerModule,
// //     ButtonModule,
// //     TooltipModule,
// //     TabsModule,
// //     ToggleSwitchModule
// //   ],
// //   template: `
// //     <form [formGroup]="form" class="config-form">
      
// //       <p-tabs value="0" class="custom-tabs">
// //         <p-tablist>
// //             <p-tab value="0">Content</p-tab>
// //             <p-tab value="1">Settings</p-tab>
// //             <p-tab value="2">Style</p-tab>
// //         </p-tablist>

// //         <p-tabpanels class="custom-scrollbar">
          
// //           <p-tabpanel value="0">
// //             <div class="panel-inner">
              
// //               @if (hasField('ruleType') || hasField('sourceType')) {
// //                 <div class="data-source-card">
// //                   <label class="label-heading highlight">Data Source</label>
                  
// //                   <p-select 
// //                     formControlName="sourceType" 
// //                     [options]="sourceTypeOptions" 
// //                     optionLabel="label" 
// //                     optionValue="value" 
// //                     appendTo="body">
// //                   </p-select>

// //                   @if (form.get('sourceType')?.value === 'rule') {
// //                     <div class="sub-field">
// //                       <label class="mini-label">Smart Rule</label>
// //                       <p-select 
// //                         formControlName="ruleType" 
// //                         [options]="ruleTypeOptions" 
// //                         optionLabel="label" 
// //                         optionValue="value"
// //                         appendTo="body">
// //                       </p-select>
// //                     </div>
// //                   }

// //                   @if (['brand', 'category'].includes(form.get('sourceType')?.value)) {
// //                     <div class="sub-field">
// //                       <label class="mini-label">
// //                         Enter {{ form.get('sourceType')?.value | titlecase }} Name
// //                       </label>
// //                       <input pInputText formControlName="sourceValue" 
// //                              [placeholder]="'e.g. ' + (form.get('sourceType')?.value === 'brand' ? 'Samsung' : 'Laptops')" />
// //                     </div>
// //                   }
// //                 </div>
// //               }

// //               @for (field of contentFields; track field.key) {
// //                 <div class="field-container">
// //                   <label class="label-heading">{{ field.label }}</label>
// //                   @if (field.key === 'subtitle' || field.key === 'description') {
// //                     <textarea pInputTextarea [formControlName]="field.key" rows="3" class="compact-textarea"></textarea>
// //                   } @else {
// //                     <input pInputText [formControlName]="field.key" />
// //                   }
// //                 </div>
// //               }

// //               @for (field of arrayFields; track field.key) {
// //                 <div class="array-section">
// //                   <div class="array-header">
// //                     <label class="label-heading">{{ field.label }}</label>
// //                     <span class="count-badge">{{ getFormArray(field.key).length }} items</span>
// //                   </div>

// //                   <div class="array-list" [formArrayName]="field.key">
// //                     @for (item of getFormArray(field.key).controls; track item; let i = $index) {
// //                       <div [formGroupName]="i" class="array-card">
// //                         <button type="button" (click)="removeArrayItem(field.key, i)" class="remove-btn">
// //                           <i class="pi pi-times"></i>
// //                         </button>

// //                         <div class="array-grid">
// //                           @for (subField of getArraySchema(field.key); track subField.key) {
// //                             <div class="sub-field">
// //                               <label class="mini-label">{{ subField.label }}</label>
// //                               @if (subField.enum) {
// //                                 <p-select [formControlName]="subField.key" [options]="getOptions(subField.enum)" 
// //                                             optionLabel="label" optionValue="value" appendTo="body"></p-select>
// //                               } @else {
// //                                 <input pInputText [formControlName]="subField.key" [placeholder]="subField.label">
// //                               }
// //                             </div>
// //                           }
// //                         </div>
// //                       </div>
// //                     }
// //                   </div>

// //                   <p-button label="Add Item" icon="pi pi-plus" 
// //                           styleClass="p-button-outlined p-button-sm add-btn" 
// //                           (click)="addArrayItem(field.key)">
// //                   </p-button>
// //                 </div>
// //               }
// //             </div>
// //           </p-tabpanel>

// //           <p-tabpanel value="1">
// //             <div class="panel-inner">
// //               <div class="number-grid" *ngIf="numberFields.length > 0">
// //                 @for (field of numberFields; track field.key) {
// //                   <div class="field-container">
// //                     <label class="label-heading">{{ field.label }}</label>
// //                     <p-inputNumber [formControlName]="field.key" [min]="0" [showButtons]="true" styleClass="w-full"></p-inputNumber>
// //                   </div>
// //                 }
// //               </div>

// //               @for (field of enumFields; track field.key) {
// //                 <div class="field-container">
// //                   <label class="label-heading">{{ field.label }}</label>
// //                   @if (field.key === 'textAlign' || field.key === 'alignment') {
// //                     <div class="alignment-picker">
// //                       @for (opt of alignOptions; track opt.value) {
// //                         <button type="button" (click)="form.get(field.key)?.setValue(opt.value)"
// //                                 [class.active]="form.get(field.key)?.value === opt.value">
// //                           <i [class]="'pi ' + opt.icon"></i>
// //                         </button>
// //                       }
// //                     </div>
// //                   } @else {
// //                     <p-select [options]="getOptions(field.enum)" optionLabel="label" optionValue="value" 
// //                                 [formControlName]="field.key" appendTo="body"></p-select>
// //                   }
// //                 </div>
// //               }

// //               @if (booleanFields.length > 0) {
// //                 <div class="boolean-group">
// //                   @for (field of booleanFields; track field.key) {
// //                     <div class="toggle-row" (click)="toggleSwitch(field.key)">
// //                       <label class="toggle-label">{{ field.label }}</label>
// //                       <p-toggleswitch [formControlName]="field.key"></p-toggleswitch>
// //                     </div>
// //                   }
// //                 </div>
// //               }
// //             </div>
// //           </p-tabpanel>

// //           <p-tabpanel value="2">
// //             <div class="panel-inner">
// //               @for (field of colorFields; track field.key) {
// //                 <div class="color-row">
// //                   <label class="toggle-label">{{ field.label }}</label>
// //                   <div class="color-picker-box">
// //                     <span class="mono-text">{{ form.get(field.key)?.value || 'N/A' }}</span>
// //                     <p-colorPicker [formControlName]="field.key" appendTo="body"></p-colorPicker>
// //                   </div>
// //                 </div>
// //               }

// //               @if (hasField('backgroundImage')) {
// //                 <div class="field-container mt-lg">
// //                   <label class="label-heading">Background Image</label>
// //                   <input pInputText formControlName="backgroundImage" placeholder="URL..." />
// //                   @if (form.get('backgroundImage')?.value) {
// //                     <div class="image-preview" [style.background-image]="'url(' + form.get('backgroundImage')?.value + ')'"></div>
// //                   }
// //                 </div>
// //               }
// //             </div>
// //           </p-tabpanel>
// //         </p-tabpanels>
// //       </p-tabs>
// //     </form>
// //   `,
// //   styles: [`
// //     :host { display: block; height: 100%; font-family: var(--font-body); }

// //     .config-form { 
// //       height: 100%; 
// //       background: white; 
// //       display: flex; 
// //       flex-direction: column; 
// //     }

// //     /* Token-based Panel Styling */
// //     .panel-inner { 
// //       padding: var(--spacing-xl); 
// //       display: flex; 
// //       flex-direction: column; 
// //       gap: var(--spacing-xl); 
// //     }

// //     .label-heading {
// //       font-family: var(--font-heading);
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-bold);
// //       color: #94a3b8; /* Slate 400 */
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //       display: block;
// //       margin-bottom: var(--spacing-sm);
// //     }
    
// //     .label-heading.highlight { color: #3b82f6; }
// //     .mini-label { font-size: var(--font-size-xs); color: #64748b; font-weight: var(--font-weight-medium); }
// //     .mono-text { font-family: var(--font-mono); font-size: var(--font-size-xs); color: #94a3b8; }

// //     /* Inputs & Containers */
// //     .field-container { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    
// //     .data-source-card {
// //       padding: var(--spacing-xl);
// //       background: #f8fafc;
// //       border: var(--ui-border-width) solid #e2e8f0;
// //       border-radius: var(--ui-border-radius-lg);
// //       display: flex;
// //       flex-direction: column;
// //       gap: var(--spacing-md);
// //     }

// //     .sub-field { display: flex; flex-direction: column; gap: var(--spacing-xs); margin-top: var(--spacing-xs); }

// //     .array-card {
// //       padding: var(--spacing-lg);
// //       background: white;
// //       border: var(--ui-border-width) solid #e2e8f0;
// //       border-radius: var(--ui-border-radius);
// //       box-shadow: var(--shadow-sm);
// //       position: relative;
// //       margin-bottom: var(--spacing-md);
// //     }

// //     .remove-btn {
// //       position: absolute;
// //       top: var(--spacing-sm);
// //       right: var(--spacing-sm);
// //       background: transparent;
// //       border: none;
// //       color: #cbd5e1;
// //       cursor: pointer;
// //       transition: var(--transition-fast);
// //     }
// //     .remove-btn:hover { color: #ef4444; }

// //     .array-grid {
// //       display: grid;
// //       grid-template-columns: 1fr 1fr;
// //       gap: var(--spacing-md);
// //     }

// //     .boolean-group {
// //       background: #f8fafc;
// //       border-radius: var(--ui-border-radius-lg);
// //       padding: var(--spacing-lg);
// //       border: var(--ui-border-width) solid #f1f5f9;
// //     }

// //     .toggle-row {
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       padding: var(--spacing-sm) 0;
// //       cursor: pointer;
// //     }

// //     .toggle-label { font-size: var(--font-size-base); color: #334155; }

// //     .alignment-picker {
// //       display: flex;
// //       border: var(--ui-border-width) solid #e2e8f0;
// //       border-radius: var(--ui-border-radius);
// //       overflow: hidden;
// //     }

// //     .alignment-picker button {
// //       flex: 1;
// //       padding: var(--spacing-md);
// //       background: white;
// //       border: none;
// //       border-right: var(--ui-border-width) solid #f1f5f9;
// //       cursor: pointer;
// //     }

// //     .alignment-picker button.active { background: #eff6ff; color: #3b82f6; }

// //     .color-row {
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       padding: var(--spacing-lg);
// //       border: var(--ui-border-width) solid #e2e8f0;
// //       border-radius: var(--ui-border-radius-lg);
// //     }

// //     .image-preview {
// //       height: 100px;
// //       margin-top: var(--spacing-md);
// //       border-radius: var(--ui-border-radius);
// //       background-size: cover;
// //       background-position: center;
// //       border: var(--ui-border-width) solid #e2e8f0;
// //       box-shadow: var(--shadow-xs);
// //     }

// //     /* PrimeNG Modular Overrides */
// //     :host ::ng-deep {
// //       .p-tablist-tab-list { border-bottom: 1px solid #f1f5f9; }
// //       .p-tab { 
// //         padding: var(--spacing-xl); 
// //         font-size: var(--font-size-sm); 
// //         font-weight: var(--font-weight-semibold); 
// //       }
// //       .p-tabpanels { padding: 0; }
// //       .p-inputtext, .p-select { width: 100%; font-size: var(--font-size-base); }
// //     }
// //   `]
// // })
// // export class ConfigFormComponent implements OnChanges {
// //   // ... Logic remains consistent with your previous version ...
// //   @Input() config: any = {};
// //   @Input() schema: any = {}; 
// //   @Output() configChange = new EventEmitter<any>();

// //   form: FormGroup;
// //   fb = inject(FormBuilder);

// //   contentFields: any[] = [];
// //   numberFields: any[] = [];
// //   booleanFields: any[] = [];
// //   enumFields: any[] = [];
// //   colorFields: any[] = [];
// //   arrayFields: any[] = [];

// //   sourceTypeOptions = [
// //     { label: '⚡ Smart Rule', value: 'rule' },
// //     { label: '🏷️ Brand', value: 'brand' },
// //     { label: '📂 Category', value: 'category' }
// //   ];

// //   ruleTypeOptions = [
// //     { label: '🔥 Best Sellers', value: 'best_sellers' },
// //     { label: '✨ New Arrivals', value: 'new_arrivals' },
// //     { label: '📈 Trending', value: 'trending' }
// //   ];

// //   alignOptions = [
// //     { label: 'Left', value: 'left', icon: 'pi-align-left' },
// //     { label: 'Center', value: 'center', icon: 'pi-align-center' },
// //     { label: 'Right', value: 'right', icon: 'pi-align-right' }
// //   ];

// //   constructor() { this.form = this.fb.group({}); }

// //   ngOnChanges(changes: SimpleChanges) {
// //     if (changes['schema'] || changes['config']) {
// //       if (this.schema && (changes['schema'] || !this.form.controls['title'])) {
// //         this.rebuildForm();
// //       } else if (this.config) {
// //         this.form.patchValue(this.config, { emitEvent: false });
// //       }
// //     }
// //   }

// //   rebuildForm() {
// //     this.contentFields = [];
// //     this.numberFields = [];
// //     this.booleanFields = [];
// //     this.enumFields = [];
// //     this.colorFields = [];
// //     this.arrayFields = [];

// //     const keys = new Set([...Object.keys(this.schema || {}), ...Object.keys(this.config || {})]);
// //     const group: any = {};

// //     keys.forEach(key => {
// //       if (['ruleType', 'sourceType', 'sourceValue', 'backgroundImage'].includes(key)) {
// //         group[key] = [this.config[key] ?? this.schema?.[key]?.default ?? null];
// //         return;
// //       }
// //       const def = this.schema?.[key] || {};
// //       const type = def.type || typeof this.config[key];
// //       const field = { key, label: this.formatLabel(key), ...def };

// //       if (type === 'array') {
// //         this.arrayFields.push(field);
// //         const itemSchema = def.schema || {};
// //         const initialData = this.config[key] || [];
// //         group[key] = this.fb.array(initialData.map((item: any) => this.createArrayGroup(itemSchema, item)));
// //       } else {
// //         group[key] = [this.config[key] ?? def.default ?? null];
// //         if (type === 'boolean') this.booleanFields.push(field);
// //         else if (type === 'number') this.numberFields.push(field);
// //         else if (def.enum) this.enumFields.push(field);
// //         else if (key.toLowerCase().includes('color')) this.colorFields.push(field);
// //         else this.contentFields.push(field);
// //       }
// //     });

// //     this.form = this.fb.group(group);
// //     this.form.valueChanges.subscribe(val => { if(this.form.valid) this.configChange.emit(val); });
// //   }

// //   getFormArray(key: string): FormArray { return this.form.get(key) as FormArray; }
// //   getArraySchema(key: string): any[] {
// //     const schemaDef = this.schema[key]?.schema || {};
// //     return Object.keys(schemaDef).map(k => ({ key: k, label: this.formatLabel(k), ...schemaDef[k] }));
// //   }
// //   createArrayGroup(schemaDef: any, data: any = {}) {
// //     const group: any = {};
// //     Object.keys(schemaDef).forEach(k => group[k] = [data[k] ?? schemaDef[k].default ?? '']);
// //     return this.fb.group(group);
// //   }
// //   addArrayItem(key: string) { this.getFormArray(key).push(this.createArrayGroup(this.schema[key]?.schema || {})); }
// //   removeArrayItem(key: string, index: number) { this.getFormArray(key).removeAt(index); }
// //   hasField(key: string): boolean { return this.form.contains(key); }
// //   formatLabel(key: string): string { return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(); }
// //   getOptions(enumArr: string[]) { return enumArr.map(opt => ({ label: this.formatLabel(opt), value: opt })); }
// //   toggleSwitch(key: string) { this.form.get(key)?.setValue(!this.form.get(key)?.value); }
// // }
