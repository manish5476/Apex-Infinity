import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AutomationFeedTransactionService extends BaseApiService {

  // ==========================
  // AUTOMATION ENDPOINTS
  // ==========================

  private automation = '/v1/automation';

  /** List all automations / workflows */
  getAutomations(filter?: any): Observable<any> {
    return this.get(this.automation, filter, 'getAutomations');
  }

  /** Create a new workflow / automation */
  createAutomation(data: any): Observable<any> {
    return this.post(this.automation, data, 'createAutomation');
  }

  /** Retrieve specific automation */
  getAutomationById(id: string): Observable<any> {
    return this.get(`${this.automation}/${id}`, {}, 'getAutomationById');
  }

  /** Update an automation */
  updateAutomation(id: string, data: any): Observable<any> {
    return this.patch(`${this.automation}/${id}`, data, 'updateAutomation');
  }

  /** Delete automation */
  deleteAutomation(id: string): Observable<any> {
    return this.delete(`${this.automation}/${id}`, 'deleteAutomation');
  }

  /** Webhook registration */
  registerWebhook(data: any): Observable<any> {
    return this.post(`${this.automation}/webhooks`, data, 'registerWebhook');
  }

  /** Test/Trigger automation manually */
  triggerAutomation(id: string, payload: any = {}): Observable<any> {
    return this.post(`${this.automation}/${id}/trigger`, payload, 'triggerAutomation');
  }


  // ==========================
  // FEED ENDPOINTS
  // ==========================

  private feed = '/v1/feed';

  /** List feed posts */
  getFeed(filter?: any): Observable<any> {
    return this.get(this.feed, filter, 'getFeed');
  }

  /** Create feed post */
  createFeedPost(data: any): Observable<any> {
    return this.post(this.feed, data, 'createFeedPost');
  }

  /** Delete feed post */
  deleteFeedPost(id: string): Observable<any> {
    return this.delete(`${this.feed}/${id}`, 'deleteFeedPost');
  }

  /** React / comment */
  reactToPost(id: string, reaction: string): Observable<any> {
    return this.post(`${this.feed}/${id}/react`, { reaction }, 'reactToPost');
  }


  // ==========================
  // PARTY TRANSACTIONS
  // ==========================

  private transactions = '/v1/party-transactions';

  /** List all */
  getTransactions(filter?: any): Observable<any> {
    return this.get(this.transactions, filter, 'getTransactions');
  }

  /** New transaction */
  createTransaction(data: any): Observable<any> {
    return this.post(this.transactions, data, 'createTransaction');
  }

  /** Single transaction */
  getTransactionById(id: string): Observable<any> {
    return this.get(`${this.transactions}/${id}`, {}, 'getTransactionById');
  }

  /** Update */
  updateTransaction(id: string, data: any): Observable<any> {
    return this.patch(`${this.transactions}/${id}`, data, 'updateTransaction');
  }

  /** Delete */
  deleteTransaction(id: string): Observable<any> {
    return this.delete(`${this.transactions}/${id}`, 'deleteTransaction');
  }

  /** Settlement / reconciliation */
  settleTransaction(id: string, data: any): Observable<any> {
    return this.post(`${this.transactions}/${id}/settle`, data, 'settleTransaction');
  }
}
