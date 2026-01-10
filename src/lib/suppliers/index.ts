// Frontend suppliers index - AliExpress only
export * from './types';
export * from './base';
export * from './aliexpress';
export * from './manager';

// Utility functions for supplier management
import { SupplierManager, SupplierManagerConfig } from './manager';
import { SupplierType } from '../types';

// Create supplier manager instance
export function createSupplierManager(config: SupplierManagerConfig): SupplierManager {
  return new SupplierManager(config);
}

// Get supplier type from string
export function getSupplierType(type: string): SupplierType {
  if (type.toLowerCase() === 'aliexpress') {
    return 'aliexpress';
  }
  throw new Error(`Unknown supplier type: ${type}`);
}

// Get supplier name from type
export function getSupplierName(type: SupplierType): string {
  return 'AliExpress';
}

// Get supplier description
export function getSupplierDescription(type: SupplierType): string {
  return 'Global retail marketplace offering products at factory prices';
}

// Get supplier features
export function getSupplierFeatures(type: SupplierType): string[] {
  return [
    'Global Shipping',
    'Buyer Protection',
    'Wide Variety',
    'Competitive Prices'
  ];
}

// Get supported countries for supplier
export function getSupplierCountries(type: SupplierType): string[] {
  return ['Global'];
}

// Get supplier configuration schema
export function getSupplierConfigSchema(type: SupplierType): Record<string, unknown> {
  return {
    appKey: { type: 'string', required: true, description: 'App Key from AliExpress' },
    appSecret: { type: 'string', required: true, description: 'App Secret from AliExpress' },
    trackingId: { type: 'string', required: false, description: 'Tracking ID (optional)' },
  };
}
