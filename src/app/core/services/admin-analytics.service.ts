import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService extends BaseApiService {
  
  // --- Admin Routes (/v1/admin) ---
  
  getSummary(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    return this.get('/v1/admin/summary', { startDate, endDate, branchId }, 'getSummary');
  }
// {
//     "status": "success",
//     "data": {
//         "totals": {
//             "totalSales": 15886,
//             "invoiceCount": 2,
//             "totalPurchases": 0,
//             "purchaseCount": 0,
//             "paymentsIn": 100,
//             "paymentsOut": 0,
//             "paymentsCount": 1,
//             "netRevenue": 15886,
//             "outstandingReceivables": 15886,
//             "outstandingPayables": 0,
//             "ledgerTotals": {
//                 "debit": 15886,
//                 "credit": 100
//             }
//         },
//         "period": {
//             "startDate": null,
//             "endDate": null
//         }
//     }
// }


  getMonthlyTrends(months: number = 12): Observable<any> {
    return this.get('/v1/admin/monthly', { months }, 'getMonthlyTrends');
  }
//   {
//     "status": "success",
//     "data": {
//         "series": [
//             {
//                 "month": "2025-11",
//                 "sales": 15886,
//                 "purchases": 0,
//                 "paymentsIn": 100,
//                 "paymentsOut": 0,
//                 "net": 15886
//             },
//             {
//                 "month": {
//                     "month": "2025-11",
//                     "type": "inflow"
//                 },
//                 "sales": 0,
//                 "purchases": 0,
//                 "paymentsIn": 0,
//                 "paymentsOut": 0,
//                 "net": 0
//             }
//         ],
//         "months": [
//             "2025-11",
//             {
//                 "month": "2025-11",
//                 "type": "inflow"
//             }
//         ]
//     }
// }

  getOutstanding(type: 'receivable' | 'payable', limit: number = 20): Observable<any> {
    return this.get('/v1/admin/outstanding', { type, limit }, 'getOutstanding');
  }
// {
//     "status": "success",
//     "data": {
//         "type": "receivable",
//         "list": [
//             {
//                 "partyId": "69108d0d69a354dbbdcf3c5b",
//                 "invoiced": 15886,
//                 "paid": 100,
//                 "outstanding": 15786,
//                 "party": {
//                     "_id": "69108d0d69a354dbbdcf3c5b",
//                     "name": "manish",
//                     "email": "msms5476m@gmail.com",
//                     "phone": "+918160966299"
//                 }
//             }
//         ]
//     }
// }
  // --- Dashboard Controller Route (/v1/dashboard) ---
  
  getDashboardOverview(): Observable<any> {
    return this.get('/v1/dashboard', {}, 'getDashboardOverview');
  }
}
// {
//     "status": "success",
//     "message": "Dashboard data fetched successfully",
//     "data": {
//         "summary": {
//             "totalSales": 15886,
//             "totalPurchases": 0,
//             "totalReceipts": 100,
//             "totalPayments": 0,
//             "totalCustomers": 0,
//             "totalSuppliers": 0,
//             "stockValue": 0,
//             "totalStockQuantity": 0,
//             "income": 100,
//             "expenses": 15886,
//             "netProfit": -15786
//         },
//         "topProducts": [
//             {
//                 "_id": "691cb00d10e8d5c4bdf9714e",
//                 "quantitySold": 13,
//                 "totalRevenue": 0,
//                 "productName": "MANISH SINGH"
//             }
//         ],
//         "topCustomers": [
//             {
//                 "_id": "69108d0d69a354dbbdcf3c5b",
//                 "totalSpent": 15886,
//                 "customerName": "manish"
//             }
//         ]
//     }
// }


