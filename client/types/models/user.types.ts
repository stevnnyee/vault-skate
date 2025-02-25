export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
} 