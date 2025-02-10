import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, IUser } from '../types/user.types';
import { IAddress } from '../types/common.types';

// Interface for User model with mongoose methods
interface IUserDocument extends Omit<IUser, '_id'>, mongoose.Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Add interface for static methods
interface UserModel extends mongoose.Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

// User Schema
const UserSchema = new mongoose.Schema<IUserDocument>({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      validator: function(v: string) {
        // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
      },
      message: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character'
    }
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER
  },
  addresses: [{
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  }],
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v: string) {
        // Allows international format, spaces, dashes, and parentheses
        return /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  dateOfBirth: Date,
  profilePicture: {
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with our new salt
    const hash = await bcrypt.hash(this.password, salt);
    // Override the cleartext password with the hashed one
    this.password = hash;
    next();
  } catch (error) {
    next(error as mongoose.CallbackError);
  }
});

// Method to check password validity
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Add index for email lookups
UserSchema.index({ email: 1 });

// Add index for role-based queries
UserSchema.index({ role: 1 });

// Create and export the User model with proper typing
const User = mongoose.model<IUserDocument, UserModel>('User', UserSchema);

export default User;