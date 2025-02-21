// src/types/models/common.types.ts

/**
 * Shared address interface used across multiple schemas
 * Used for both user addresses and shipping addresses
 */
export interface IAddress {
  street: string;       // Street address
  city: string;         // City
  state: string;        // State/Province
  zipCode: string;      // Postal/ZIP code
  country: string;      // Country
  isDefault: boolean;   // Whether this is the default address
  label?: string;       // Optional label (e.g., "Home", "Work")
  createdAt?: Date;     // When the address was added
  updatedAt?: Date;     // When the address was last updated
}