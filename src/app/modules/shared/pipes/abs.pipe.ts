// ─────────────────────────────────────────────────────────────
// abs.pipe.ts  →  src/app/shared/pipes/abs.pipe.ts
// ─────────────────────────────────────────────────────────────
// Standalone pipe used in the invoice form template:
//   {{ balanceAmount() | abs | currency:'INR' }}
//
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'abs', standalone: true })
export class AbsPipe implements PipeTransform {
  transform(value: number): number {
    return Math.abs(value ?? 0);
  }
}


// ─────────────────────────────────────────────────────────────
// SETUP NOTES
// ─────────────────────────────────────────────────────────────
//
// 1. ROUTING
//    Add to your invoices feature routes:
//
//    {
//      path: 'invoices/new',
//      component: InvoiceFormComponent
//    },
//    {
//      path: 'invoices/edit/:id',
//      component: InvoiceFormComponent
//    }
//
// 2. FONTS
//    The SCSS imports Google Fonts (Sora, DM Sans, Fira Code).
//    If you need offline fonts, install them via npm and update
//    the @font-face declarations accordingly.
//
// 3. PRIMENG GLOBAL OVERRIDES
//    Add to your global styles.scss or styles.css:
//
//    .table-select .p-select-label,
//    .table-input  .p-inputnumber-input {
//      height: 28px !important;
//      padding: 0 6px !important;
//      font-size: 12px !important;
//    }
//
// 4. INVOICE SERVICE — expected method signatures:
//
//    createInvoice(payload: any): Observable<any>
//    updateInvoice(id: string, payload: any): Observable<any>
//    getInvoiceWithStock(id: string): Observable<any>
//    checkStock(payload: { branchId: string; items: { productId: string; quantity: number }[] }): Observable<StockCheckResponse>
//
// 5. MASTER LIST SERVICE — expected signals:
//
//    customers(): Customer[]    — must have _id, name, billingAddress, shippingAddress, paymentTerms
//    products(): Product[]      — must have _id, name, sellingPrice, taxRate, sku, unit
//    branches(): Branch[]       — must have _id, name
//
// 6. CHECK STOCK RESPONSE SHAPE (matches your API):
//
//    {
//      status: "success",
//      data: {
//        isValid: true,
//        errors: [],
//        warnings: [{ productId, productName, availableAfterSale, reorderLevel, message }],
//        summary: { totalStock, totalRequested },
//        items: [{ productId, name, sku, requestedQuantity, availableStock, price, isAvailable }]
//      }
//    }
//
// 7. AppMessageService — expected methods:
//
//    showSuccess(msg: string): void
//    showWarn(msg: string): void
//    showError(msg: string): void
//    showInfo(msg: string): void
//    handleHttpError(err: any): void
