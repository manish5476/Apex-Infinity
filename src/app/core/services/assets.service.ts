import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AssetsService extends BaseApiService {
  private endpoint = '/v1/assets';

  getAllAssets(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllAssets');
  }

  getMyAssetsStat(): Observable<any> {
    return this.get(`${this.endpoint}/stats`, {}, 'getMyAssetsStat');
  }

  deleteAssetsId(assetsId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${assetsId}`,null, 'deleteAssetsId');
  }
}
