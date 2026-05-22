import { Type } from '@angular/core';

export interface LayoutSectionRenderEntry {
  load: () => Promise<Type<unknown>>;
  inputs: (section: any, context: LayoutRenderContext) => Record<string, unknown>;
}

export interface LayoutRenderContext {
  organization: any;
  orgSlug: string;
}

const navInputs = (section: any, context: LayoutRenderContext) => ({
  config: section.config,
  organization: context.organization,
  logo: context.organization?.logo ?? undefined,
  orgSlug: context.orgSlug
});

const footerInputs = (section: any, context: LayoutRenderContext) => ({
  config: section.config,
  organization: context.organization
});

export const LAYOUT_SECTION_COMPONENT_REGISTRY: Record<string, LayoutSectionRenderEntry> = {
  navbar_simple: {
    load: () => import('../components/navbar-simple/navbar-simple.component').then(m => m.NavbarSimpleComponent),
    inputs: navInputs
  },
  navbar_sticky: {
    load: () => import('../components/navbar-simple/navbar-simple.component').then(m => m.NavbarSimpleComponent),
    inputs: (section, context) => navInputs({ ...section, config: { ...section.config, sticky: true } }, context)
  },
  navbar_transparent: {
    load: () => import('../components/navbar-simple/navbar-simple.component').then(m => m.NavbarSimpleComponent),
    inputs: (section, context) => navInputs({ ...section, config: { ...section.config, transparent: true } }, context)
  },
  navbar_mega: {
    load: () => import('../components/navbar-simple/navbar-simple.component').then(m => m.NavbarSimpleComponent),
    inputs: (section, context) => navInputs({ ...section, config: { ...section.config, megaMenu: true } }, context)
  },
  announcement_bar: {
    load: () => import('../components/layout-announcement-bar/layout-announcement-bar.component').then(m => m.LayoutAnnouncementBarComponent),
    inputs: footerInputs
  },
  promo_bar: {
    load: () => import('../components/layout-announcement-bar/layout-announcement-bar.component').then(m => m.LayoutAnnouncementBarComponent),
    inputs: (section, context) => footerInputs({ ...section, config: { ...section.config, tone: 'promo' } }, context)
  },
  footer_simple: {
    load: () => import('../components/footer-simple/footer-simple.component').then(m => m.FooterSimpleComponent),
    inputs: footerInputs
  },
  footer_complex: {
    load: () => import('../components/footer-complex/footer-complex.component').then(m => m.FooterComplexComponent),
    inputs: footerInputs
  },
  footer_commerce: {
    load: () => import('../components/footer-commerce/footer-commerce.component').then(m => m.FooterCommerceComponent),
    inputs: footerInputs
  },
  footer_minimal: {
    load: () => import('../components/footer-minimal/footer-minimal.component').then(m => m.FooterMinimalComponent),
    inputs: footerInputs
  }
};
