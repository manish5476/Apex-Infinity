import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ForgotPasswordDto,
  NormalizedStorefrontResponse,
  ResetPasswordDto,
  StorefrontCustomer,
  StorefrontDashboard,
  StorefrontLoginDto,
  StorefrontRegisterDto
} from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';

@Injectable({ providedIn: 'root' })
export class StorefrontAuthApi {
  private readonly api = inject(StorefrontApiClient);

  register(orgSlug: string, dto: StorefrontRegisterDto): Observable<NormalizedStorefrontResponse<StorefrontCustomer>> {
    return this.api.post<StorefrontCustomer, StorefrontRegisterDto>(orgSlug, 'account/register', dto);
  }

  login(orgSlug: string, dto: StorefrontLoginDto): Observable<NormalizedStorefrontResponse<{ readonly customer: StorefrontCustomer }>> {
    return this.api.post<{ readonly customer: StorefrontCustomer }, StorefrontLoginDto>(orgSlug, 'account/login', dto);
  }

  logout(orgSlug: string): Observable<NormalizedStorefrontResponse<{ readonly message?: string }>> {
    return this.api.post<{ readonly message?: string }, Record<string, never>>(orgSlug, 'account/logout', {});
  }

  me(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontDashboard>> {
    return this.api.get<StorefrontDashboard>(orgSlug, 'account/me', undefined, { retryCount: 0 });
  }

  forgotPassword(orgSlug: string, dto: ForgotPasswordDto): Observable<NormalizedStorefrontResponse<{ readonly accepted: boolean }>> {
    return this.api.post<{ readonly accepted: boolean }, ForgotPasswordDto>(orgSlug, 'account/forgot-password', dto);
  }

  resetPassword(orgSlug: string, dto: ResetPasswordDto): Observable<NormalizedStorefrontResponse<StorefrontCustomer>> {
    return this.api.post<StorefrontCustomer, ResetPasswordDto>(orgSlug, 'account/reset-password', dto);
  }
}
