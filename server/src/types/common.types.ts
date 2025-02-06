// src/types/common.types.ts

/**
 * Shared address interface used across multiple schemas
 * @interface IAddress
 */
export interface IAddress {
  street: string;       // Street address
  city: string;         // City
  state: string;        // State/Province
  zipCode: string;      // Postal/ZIP code
  country: string;      // Country
}