// import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ICellRendererAngularComp } from 'ag-grid-angular';

// // Import your EXISTING components
// import { MasterCellEditorComponent } from './master-cell-editor.component';
// import { MasterCellRendererComponent } from './master-cell-renderer.component';

// @Component({
//   selector: 'app-smart-wrapper',
//   standalone: true,
//   imports: [CommonModule, MasterCellEditorComponent, MasterCellRendererComponent],
//   template: `
//     <div class="w-full h-full">
//       @if (isEditing()) {
//         <app-master-cell-editor 
//           [cellParams]="params">
//         </app-master-cell-editor>
//       } @else {
//         <app-master-cell-renderer 
//           [cellParams]="params">
//         </app-master-cell-renderer>
//       }
//     </div>
//   `,
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class SmartWrapperComponent implements ICellRendererAngularComp {
  
//   params: any;
//   isEditing = signal(false);

//   agInit(params: any): void {
//     this.updateState(params);
//   }

//   refresh(params: any): boolean {
//     this.updateState(params);
//     return true;
//   }

//   private updateState(params: any) {
//     this.params = params;
    
//     // Check global "Bulk Edit" state
//     const editingIds = params.context.editingIds as Set<string>;
//     const rowId = params.data._id || params.data.id;
    
//     this.isEditing.set(editingIds?.has(rowId) ?? false);
//   }
// }