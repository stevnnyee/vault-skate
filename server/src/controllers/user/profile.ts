/**
 * User Profile Controller
 * Handles all user profile-related operations
 * 
 * Contains methods for:
 * - Getting user profile
 * - Updating user profile
 * - Managing addresses
 * - Changing password
 * 
 * All methods require authentication
 */
import { Response } from 'express';
import { authService } from '../../services/auth.service';
import { 
  AuthenticatedRequest,
  ProfileUpdateRequest,
  AddressRequest,
  RemoveAddressRequest
} from '../../types/controllers/auth.controller.types';
import User from '../../models/user';

/**
 * Get User Profile
 * Retrieves the complete profile for authenticated user
 * 
 * @param req - Authenticated request object containing user ID
 * @param res - Express response object
 * @returns User profile data or error response
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const profile = await authService.getProfile(req.user.id);
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve profile'
    });
  }
};

/**
 * Update User Profile
 * Updates profile information for authenticated user
 * 
 * @param req - Authenticated request with update data
 * @param res - Express response object
 * @returns Updated profile data or error response
 */
export const updateProfile = async (req: ProfileUpdateRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const profile = await authService.updateProfile(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile'
    });
  }
};

/**
 * Add Address
 * Adds a new address to user's address book
 * 
 * @param req - Authenticated request with address data
 * @param res - Express response object
 * @returns Updated profile with new address or error response
 */
export const addAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await authService.addAddress(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add address'
    });
  }
};

/**
 * Remove Address
 * Removes an address from user's address book
 * 
 * @param req - Authenticated request with address ID in params
 * @param res - Express response object
 * @returns Updated profile without removed address or error response
 */
export const removeAddress = async (req: RemoveAddressRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const addressIndex = parseInt(req.params.addressId, 10);
    if (isNaN(addressIndex)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address index'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.addresses || addressIndex >= user.addresses.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address index'
      });
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove address'
    });
  }
};

/**
 * Change Password
 * Updates user's password after validating current password
 * 
 * @param req - Authenticated request with old and new passwords
 * @param res - Express response object
 * @returns Success message or error response
 */
export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      data: { message: 'Password updated successfully' }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update password'
    });
  }
};