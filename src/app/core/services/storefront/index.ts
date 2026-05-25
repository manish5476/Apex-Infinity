// src/app/core/services/storefront/index.ts
// Central barrel — re-export all storefront service APIs and facades.
export * from '../storefront-admin.service';
export * from '../storefront-public.service';
export * from '../storefront.cart.service';
export * from '../storefront-state.service';
export * from '../smart-rule.service';
// New typed facade layer (storefront/core)
export * from '../../../storefront/core/api/storefront-form.api';
export * from '../../../storefront/core/facades/storefront-public.facade';
export * from '../../../storefront/core/facades/storefront-form.facade';
