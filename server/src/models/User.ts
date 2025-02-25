/**
 * User Model
 * Defines the Mongoose schema and model for user accounts.
 * 
 * Features:
 * - User authentication and authorization
 * - Profile management
 * - Address book functionality
 * - Password encryption
 * - User preferences
 * - Security features (login attempts, lockout)
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, IUserPreferences, AuthProvider } from '../types/models/user.types';
import { IAddress } from '../types/models/common.types';

/**
 * User Document Interface
 * Extends the base user interface with Mongoose document methods
 * Adds password comparison functionality
 */
export interface IUserDocument extends Document, Omit<IUser, '_id'> {
  _id: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Address Schema
 * Defines the structure for user addresses
 * Used for both shipping and billing addresses
 */
const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  label: { type: String },
}, { timestamps: true });

/**
 * User Preferences Schema
 * Defines the structure for user preferences
 */
const UserPreferencesSchema = new Schema<IUserPreferences>({
  language: { type: String, default: 'en' },
  currency: { type: String, default: 'USD' },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  }
});

/**
 * User Schema
 * Defines the structure and behavior of user documents
 * 
 * Fields:
 * - Personal Information (name, email, phone)
 * - Authentication (password, role)
 * - Address Book (shipping/billing addresses)
 * - Account Status (active, verified)
 * - Security (login attempts, lockout)
 * - Preferences (language, notifications)
 */
const UserSchema = new Schema<IUserDocument>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: { 
    type: String, 
    required: true,
    validate: [{
      validator: function(this: IUserDocument, v: string): boolean {
        // Skip validation if this is an existing document and password hasn't changed
        if (!this.isNew && !this.isModified('password')) {
          return true;
        }
        
        // Skip validation if the password is already hashed
        if (v.startsWith('$2')) {
          return true;
        }
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    }]
  },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER },
  authProvider: { type: String, enum: Object.values(AuthProvider), default: AuthProvider.LOCAL },
  addresses: [AddressSchema],
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v: string) {
        return /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  dateOfBirth: Date,
  profilePicture: {
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: Date,
  lastPasswordChange: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: Date,
  refreshToken: String,
  preferences: { type: UserPreferencesSchema, default: () => ({}) }
}, {
  timestamps: true,
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Password Hashing Middleware
 * Hashes password before saving
 * Only runs when password field is modified
 */
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

/**
 * Password Comparison Method
 * Securely compares provided password with stored hash
 * Used for user authentication
 */
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
const User = mongoose.model<IUserDocument>('User', UserSchema);

export default User;