// src/app/tab-workspace/tab-identity.util.ts

import { AppTabId, RouteTabConfig } from './tab-workspace.types';

/**
 * Normalizes a URL by:
 * - Trimming leading/trailing whitespace
 * - Ensuring a leading slash
 * - Removing trailing slashes (except for '/')
 * - Sorting query parameters alphabetically for consistent equality checks
 * - Normalizing fragments
 */
export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl.trim() === '') return '/';

  const clean = rawUrl.trim();
  const [pathAndQuery, fragment] = clean.split('#');
  const [pathPart, queryPart] = pathAndQuery.split('?');

  // Normalize path
  let normalizedPath = '/' + pathPart.replace(/^\/+/, '').replace(/\/+$/, '');
  if (normalizedPath === '') normalizedPath = '/';

  // Normalize query parameters
  let normalizedQuery = '';
  if (queryPart && queryPart.trim() !== '') {
    const searchParams = new URLSearchParams(queryPart);
    const sortedEntries = Array.from(searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
    if (sortedEntries.length > 0) {
      const sortedParams = new URLSearchParams();
      for (const [k, v] of sortedEntries) {
        sortedParams.append(k, v);
      }
      normalizedQuery = '?' + sortedParams.toString();
    }
  }

  // Fragment
  const normalizedFragment = fragment ? `#${fragment}` : '';

  return `${normalizedPath}${normalizedQuery}${normalizedFragment}`;
}

/**
 * Extracts clean base path from URL without query params or fragment
 */
export function extractBasePath(url: string): string {
  const [pathAndQuery] = url.split('#');
  const [pathPart] = pathAndQuery.split('?');
  const normalized = '/' + pathPart.replace(/^\/+/, '').replace(/\/+$/, '');
  return normalized === '' ? '/' : normalized;
}

/**
 * Stringifies Record<string, unknown> safely
 */
export function stringifyRecord(record: Record<string, unknown> | null | undefined): Record<string, string> {
  if (!record) return {};
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(record)) {
    if (val !== null && val !== undefined) {
      result[key] = String(val);
    }
  }
  return result;
}

/**
 * Generates a canonical tab identity according to route configuration
 */
export function computeTabId(
  config: RouteTabConfig,
  basePath: string,
  normalizedUrl: string,
  routePattern: string,
  params: Record<string, string>,
  queryParams: Record<string, string>
): AppTabId {
  const reuseMode = config.reuseMode ?? 'resource';

  if (reuseMode === 'alwaysNew') {
    return `${basePath}__new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  if (reuseMode === 'exactUrl') {
    return normalizedUrl;
  }

  if (reuseMode === 'collection') {
    // For collections (e.g. /customers, /orders), tab ID is strictly the base path pattern
    return routePattern || basePath;
  }

  // Default: 'resource'
  // Check if route has an explicit resource identifier param or dynamic parameter
  const resourceKey = config.resourceParam || 'id';
  if (params[resourceKey]) {
    return `${routePattern || basePath}::${params[resourceKey]}`;
  }

  // Check any other dynamic param (e.g. :slug, :code, :branchId)
  const paramKeys = Object.keys(params);
  if (paramKeys.length > 0) {
    const firstKey = paramKeys[0];
    return `${routePattern || basePath}::${params[firstKey]}`;
  }

  // If query policy is discriminate, include query params in ID
  if (config.queryPolicy === 'discriminate' && Object.keys(queryParams).length > 0) {
    return normalizedUrl;
  }

  // Otherwise, collection fallback
  return routePattern || basePath;
}

/**
 * Derives a human-friendly fallback title from a route path
 */
export function titleFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const last = segments.at(-1)?.split(/[?#;]/)[0] ?? 'Workspace';
  
  // Clean up IDs or UUIDs from being the sole title
  const isLikelyId = /^[0-9a-fA-F-]{8,}$/.test(last) || /^\d+$/.test(last);
  if (isLikelyId && segments.length > 1) {
    const parent = segments[segments.length - 2];
    return `${formatWords(parent)} #${last.substring(0, 6)}`;
  }

  return formatWords(last);
}

function formatWords(str: string): string {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}
