export interface MenuItem {
  label: string;
  url: string;
  type?: string;
  id?: string;
}

export interface HeaderConfig {
  logoPosition: string;
  menuItems: MenuItem[];
}

export interface HeaderBlock {
  id: string;
  type: string;
  config: HeaderConfig;
  isActive: boolean;
}

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductPrice {
  original: number;
  discounted: number | null;
  currency: string;
  hasDiscount: boolean;
}

export interface ProductStock {
  available: boolean;
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  images: string[];
  brand: string | null;
  category: string | null;
  price: ProductPrice;
  tags: string[];
  sku: string;
  stock: ProductStock;
  url: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CategoryData {
  _id: string;
  count: number;
}

export interface FilterState {
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  search: string;
  sort: string;
  inStock: boolean;
  tags: string | null;
  page: number;
  limit: number;
}
