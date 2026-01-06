import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-shared-grid-action-button',
  standalone: true,
  // 1. Use ButtonModule to ensure <p-button> works
  imports: [CommonModule, ButtonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shared-grid-action-button.html',
  styleUrl: './app-shared-grid-action-button.scss',
})
export class AppSharedGridActionButton implements ICellRendererAngularComp {
  
  private cdr = inject(ChangeDetectorRef);
  params: any;
  editing = false;

  agInit(params: any): void {
    this.params = params;
    this.updateState();
    // 2. CRITICAL: Force view update immediately upon creation
    this.cdr.detectChanges();
  }

  refresh(params: any): boolean {
    this.params = params;
    this.updateState();
    // 3. CRITICAL: Force view update if the component is reused
    this.cdr.detectChanges();
    return true; 
  }

  private updateState() {
    // 4. Debug: Check console to see if true/false is actually switching
    // console.log('Action Button State Check:', this.params.context.isRowEditing(this.params.data));
    this.editing = this.params.context.isRowEditing(this.params.data);
  }

  emit(action: string) {
    this.params.context.onAction(action, this.params.data);
  }
}

// import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
// import { ICellRendererAngularComp } from 'ag-grid-angular';
// // Use the PrimeNG button import or your directive approach
// import { ButtonModule } from 'primeng/button'; 
// import { TooltipModule } from 'primeng/tooltip';

// @Component({
//   selector: 'app-shared-grid-action-button',
//   standalone: true,
//   imports: [ButtonModule, TooltipModule], // Add imports here
//   changeDetection: ChangeDetectionStrategy.OnPush, // Best practice for performance
//   templateUrl: './app-shared-grid-action-button.html',
//   styleUrl: './app-shared-grid-action-button.scss',
// })
// export class AppSharedGridActionButton implements ICellRendererAngularComp {
  
//   // 1. Inject ChangeDetectorRef
//   private cdr = inject(ChangeDetectorRef);

//   params: any;
//   editing = false;

//   agInit(params: any): void {
//     this.params = params;
//     this.updateState();
//   }

//   refresh(params: any): boolean {
//     this.params = params;
//     this.updateState();
    
//     // 2. FORCE the update. This makes it instant.
//     this.cdr.detectChanges(); 
    
//     // 3. Return true so AG Grid recycles this component (High Performance)
//     return true; 
//   }

//   // Helper to centralize logic
//   private updateState() {
//     // Check if THIS specific row is in editing mode based on your grid context logic
//     this.editing = this.params.context.isRowEditing(this.params.data);
//   }

//   emit(action: string) {
//     // Stop bubbling so clicking the button doesn't select the row (if you have row selection on)
//     this.params.context.onAction(action, this.params.data);
//   }
// }


// // import { Component, ChangeDetectorRef, inject } from '@angular/core'; // 1. Import ChangeDetectorRef
// // import { ICellRendererAngularComp } from 'ag-grid-angular';
// // import { Button } from 'primeng/button';

// // @Component({
// //   selector: 'app-shared-grid-action-button',
// //   imports: [Button],
// //   templateUrl: './app-shared-grid-action-button.html',
// //   styleUrl: './app-shared-grid-action-button.scss',
// // })
// // export class AppSharedGridActionButton implements ICellRendererAngularComp {
  
// //   // 2. Inject ChangeDetectorRef
// //   private cdr = inject(ChangeDetectorRef); 
  
// //   private params!: any;
// //   editing = false;

// //   agInit(params: any): void {
// //     this.params = params;
// //     this.editing = params.context.isRowEditing(params.data);
// //   }

// //   refresh(params: any): boolean {
// //     this.params = params;
// //     // Update the state
// //     this.editing = params.context.isRowEditing(params.data);
    
// //     // 3. FORCE Angular to check the view and update the DOM
// //     this.cdr.detectChanges(); 
    
// //     return true;
// //   }

// //   emit(action: string) {
// //     // Stop propagation to prevent row selection conflicts if any
// //     this.params.context.onAction(action, this.params.data);
// //   }
// // }
// // // import { Component } from '@angular/core';
// // // import { ICellRendererAngularComp } from 'ag-grid-angular';
// // // import { ButtonModule, Button } from 'primeng/button';

// // // @Component({
// // //   selector: 'app-shared-grid-action-button',
// // //   imports: [Button],
// // //   templateUrl: './app-shared-grid-action-button.html',
// // //   styleUrl: './app-shared-grid-action-button.scss',
// // // })
// // // export class AppSharedGridActionButton implements ICellRendererAngularComp {

// // //   private params!: any;
// // //   editing = false;

// // //   agInit(params: any): void {
// // //     this.params = params;
// // //     this.editing = params.context.isRowEditing(params.data);
// // //   }

// // //   refresh(params: any): boolean {
// // //     this.params = params;
// // //     this.editing = params.context.isRowEditing(params.data);
// // //     return true;
// // //   }

  
// // //   emit(action: string) {
// // //     this.params.context.onAction(action, this.params.data);
// // //   }
// // // }