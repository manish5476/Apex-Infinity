import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-grid-toggle-renderer',
  standalone: true,
  imports: [FormsModule, ToggleSwitchModule],
  template: `
    <div class="flex align-center justify-center w-full h-full p-1">
      <p-toggleswitch 
        [(ngModel)]="value" 
        [disabled]="disabled"
        (onChange)="onToggle($event)"
        class="direct-grid-toggle">
      </p-toggleswitch>
    </div>
  `,
  styles: [`
    :host { 
        display: block; 
        height: 100%; 
        width: 100%; 
    }
    .flex { display: flex; }
    .align-center { align-items: center; }
    .justify-center { justify-content: center; }
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .p-1 { padding: 0.25rem; }
    
    ::ng-deep .direct-grid-toggle.p-toggleswitch {
        transform: scale(0.85);
        transition: var(--transition-base, all 0.2s);
        
        &:hover:not(.p-disabled) {
            filter: brightness(1.1);
        }
    }
  `]
})
export class GridToggleRendererComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  value: boolean = false;
  
  // Hardcoded to false so it is always editable
  disabled: boolean = false;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.value = params.value;
    
    // All permission and disabled checks have been removed. 
    // The toggle is now always active.
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.value = params.value;
    return true;
  }

  onToggle(event: any) {
    const parent = this.params.context?.componentParent;
    if (parent?.onGridToggle) {
      parent.onGridToggle(this.params.data, this.params.colDef?.field, event.checked);
    }
  }
}
// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ICellRendererAngularComp } from 'ag-grid-angular';
// import { ICellRendererParams } from 'ag-grid-community';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';

// @Component({
//   selector: 'app-grid-toggle-renderer',
//   standalone: true,
//   imports: [CommonModule, FormsModule, ToggleSwitchModule],
//   template: `
//     <div class="flex align-center justify-center w-full h-full p-1">
//       <p-toggleswitch 
//         [(ngModel)]="value" 
//         [disabled]="disabled"
//         (onChange)="onToggle($event)"
//         class="direct-grid-toggle">
//       </p-toggleswitch>
//     </div>
//   `,
//   styles: [`
//     :host { 
//         display: block; 
//         height: 100%; 
//         width: 100%; 
//     }
//     .flex { display: flex; }
//     .align-center { align-items: center; }
//     .justify-center { justify-content: center; }
//     .w-full { width: 100%; }
//     .h-full { height: 100%; }
//     .p-1 { padding: 0.25rem; }
    
//     ::ng-deep .direct-grid-toggle.p-toggleswitch {
//         transform: scale(0.85);
//         transition: var(--transition-base, all 0.2s);
        
//         &:hover:not(.p-disabled) {
//             filter: brightness(1.1);
//         }
//     }
//   `]
// })
// export class GridToggleRendererComponent implements ICellRendererAngularComp {
//   params!: ICellRendererParams;
//   value: boolean = false;
//   disabled: boolean = false;

//   agInit(params: ICellRendererParams): void {
//     this.params = params;
//     this.value = params.value;

//     // Check for explicit 'disabled' flag in params or infer from parent permissions
//     const parent = params.context?.componentParent;
//     const p = params as any;
//     if (p.disabled !== undefined) {
//       this.disabled = p.disabled;
//     } else if (parent?.checkPermission) {
//       // Use parent's permission checking if available
//       this.disabled = !parent.checkPermission(parent.PERMISSIONS?.USER?.MANAGE);
//     }
//   }

//   refresh(params: ICellRendererParams): boolean {
//     this.params = params;
//     this.value = params.value;
//     return true;
//   }

//   onToggle(event: any) {
//     const parent = this.params.context?.componentParent;
//     if (parent?.onGridToggle) {
//       parent.onGridToggle(this.params.data, this.params.colDef?.field, event.checked);
//     }
//   }
// }
