import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { GridApi, GridReadyEvent, CellValueChangedEvent, ICellRendererParams } from 'ag-grid-community';
import { ICellRendererAngularComp } from 'ag-grid-angular';
// import { UserService } from '../../../../core/services/user.service';
import { SharedGridComponent } from '../../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';

// 🔹--- Define a specific type for PrimeNG tag severities ---
type TagSeverity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast";

// 🔹--- Reusable Custom Cell Renderer with Icons ---
@Component({
    selector: 'app-tag-cell-renderer',
    standalone: true,
    imports: [TagModule, CommonModule],
    template: `<p-tag *ngIf="value" [value]="value" [severity]="severity" [icon]="icon" styleClass="px-3 py-1 text-xs font-semibold rounded-md w-full justify-center"></p-tag>`
})
export class TagCellRendererComponent implements ICellRendererAngularComp {
    public value: any;
    public severity: TagSeverity = 'info';
    public icon: string = '';

    agInit(params: ICellRendererParams): void {
        this.updateValues(params);
    }

    refresh(params: ICellRendererParams): boolean {
        this.updateValues(params);
        return true;
    }

    private updateValues(params: ICellRendererParams): void {
        this.value = params.value;
        const tagProps = this.getTagProperties(params.value, params.colDef?.field);
        this.severity = tagProps.severity;
        this.icon = tagProps.icon;
    }

    private getTagProperties(value: string, field?: string): { severity: TagSeverity, icon: string } {
        const lowerCaseValue = String(value).toLowerCase();

        // ✅ Logic for 'role' field from AdminUserComponent
        if (field === 'role') {
            switch (lowerCaseValue) {
                case 'user': return { severity: 'info', icon: 'pi pi-user' };
                case 'staff': return { severity: 'success', icon: 'pi pi-briefcase' };
                case 'admin': return { severity: 'warn', icon: 'pi pi-shield' };
                case 'superadmin': return { severity: 'danger', icon: 'pi pi-crown' };
                default: return { severity: 'secondary', icon: 'pi pi-question-circle' };
            }
        }

        // Logic for other potential fields (e.g., from TransactionsComponent)
        if (field === 'type') {
            switch (lowerCaseValue) {
                case 'sale': return { severity: 'info', icon: 'pi pi-shopping-cart' };
                case 'payment': return { severity: 'success', icon: 'pi pi-money-bill' };
                case 'refund': return { severity: 'warn', icon: 'pi pi-undo' };
                case 'customer': return { severity: 'contrast', icon: 'pi pi-user' };
                case 'product': return { severity: 'secondary', icon: 'pi pi-box' };
                default: return { severity: 'secondary', icon: 'pi pi-info-circle' };
            }
        }

        if (field === 'status') {
            switch (lowerCaseValue) {
                case 'completed':
                case 'active':
                    return { severity: 'success', icon: 'pi pi-check-circle' };
                case 'pending':
                    return { severity: 'warn', icon: 'pi pi-clock' };
                case 'failed':
                case 'unpaid':
                    return { severity: 'danger', icon: 'pi pi-exclamation-triangle' };
                default:
                    return { severity: 'secondary', icon: 'pi pi-question-circle' };
            }
        }
        
        return { severity: 'info', icon: 'pi pi-info-circle' }; // Default
    }
}


// import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { TransactionService } from '../../../../core/services/transaction.service';
// import { SharedGridComponent } from '../../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { SelectModule } from 'primeng/select';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { ICellRendererAngularComp } from 'ag-grid-angular';
// import { ICellRendererParams } from 'ag-grid-community';
// import { TagModule } from 'primeng/tag';

// // 🔹--- Define a specific type for PrimeNG tag severities ---
// type TagSeverity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast";

// // 🔹--- Enhanced Custom Cell Renderer with Icons ---
// @Component({
//     selector: 'app-tag-cell-renderer',
//     standalone: true,
//     imports: [TagModule, CommonModule],
//     // ✅ Add the [icon] property to display icons within the tag
//     template: `<p-tag *ngIf="value" [value]="value" [severity]="severity" [icon]="icon" styleClass="px-2 py-1 text-xs font-semibold rounded-md"></p-tag>`
// })
// export class TagCellRendererComponent implements ICellRendererAngularComp {
//     public value: any;
//     public severity: TagSeverity = 'info';
//     public icon: string = ''; // ✅ New property for the icon

//     agInit(params: ICellRendererParams): void {
//         this.updateValues(params);
//     }

//     refresh(params: ICellRendererParams): boolean {
//         this.updateValues(params);
//         return true;
//     }

//     private updateValues(params: ICellRendererParams): void {
//         this.value = params.value;
//         const tagProps = this.getTagProperties(params.value, params.colDef?.field);
//         this.severity = tagProps.severity;
//         this.icon = tagProps.icon;
//     }

//     // ✅ This new method returns both severity and a matching icon
//     private getTagProperties(value: string, field?: string): { severity: TagSeverity, icon: string } {
//         const lowerCaseValue = String(value).toLowerCase();

//         if (field === 'type') {
//             switch (lowerCaseValue) {
//                 case 'sale': return { severity: 'info', icon: 'pi pi-shopping-cart' };
//                 case 'payment': return { severity: 'success', icon: 'pi pi-money-bill' };
//                 case 'refund': return { severity: 'warn', icon: 'pi pi-undo' };
//                 case 'customer': return { severity: 'contrast', icon: 'pi pi-user' };
//                 case 'product': return { severity: 'secondary', icon: 'pi pi-box' };
//                 default: return { severity: 'secondary', icon: 'pi pi-info-circle' };
//             }
//         }

//         if (field === 'status') {
//             switch (lowerCaseValue) {
//                 case 'completed':
//                 case 'active':
//                     return { severity: 'success', icon: 'pi pi-check-circle' };
//                 case 'pending':
//                     return { severity: 'warn', icon: 'pi pi-clock' };
//                 case 'failed':
//                 case 'unpaid':
//                     return { severity: 'danger', icon: 'pi pi-exclamation-triangle' };
//                 default:
//                     return { severity: 'secondary', icon: 'pi pi-question-circle' };
//             }
//         }
        
//         return { severity: 'info', icon: 'pi pi-info-circle' }; // Default
//     }
// }
