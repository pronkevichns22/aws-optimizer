// ============================================================================
// FILE: auth-routes.ts
// LOCATION: server/src/
// PURPOSE: Authentication endpoints - register, login, logout, profile
// ============================================================================

import { Router, Request, Response } from 'express';
import { User, UserSession, AIPreferences } from './models';
import {
  generateToken,
  hashPassword,
  comparePasswords,
  isValidEmail,
  validatePasswordStrength,
  encryptCredentials,
  decryptCredentials,
} from './auth-utils';
import { authMiddleware } from './auth-middleware';

const router = Router();

// ============================================================================
// REGISTER - Create new user account
// ============================================================================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: username, email, password, confirmPassword',
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email or username already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Create default AI preferences
    const defaultPreferences = new AIPreferences({
      userId: newUser._id,
    });
    await defaultPreferences.save();

    // Generate token
    const token = generateToken(newUser._id.toString(), newUser.email);

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const session = new UserSession({
      userId: newUser._id,
      token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt,
    });
    await session.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: newUser._id,
        username: newUser.username,
        email: newUser.email,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// LOGIN - Authenticate user with email and password
// ============================================================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email);

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const session = new UserSession({
      userId: user._id,
      token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt,
    });
    await session.save();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        token,
        awsCredentialsSet: !!user.awsAccessKeyId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// LOGOUT - Invalidate user session
// ============================================================================
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      // Delete session from database
      await UserSession.deleteOne({ token });
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET PROFILE - Get current user profile
// ============================================================================
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        awsRegion: user.awsRegion,
        isLocalStack: user.isLocalStack,
        awsCredentialsSet: !!user.awsAccessKeyId,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// SAVE AWS CREDENTIALS - Encrypt and store AWS credentials
// ============================================================================
router.post('/credentials', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { accessKeyId, secretAccessKey, region, isLocalStack, localStackEndpoint } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      res.status(400).json({
        success: false,
        message: 'AWS Access Key ID and Secret Access Key are required',
      });
      return;
    }

    const user = await User.findById(req.user?.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Encrypt credentials
    const { encrypted, iv } = encryptCredentials(accessKeyId, secretAccessKey);

    // Save to database
    user.awsAccessKeyId = encrypted;
    user.awsSecretAccessKey = iv; // Store IV here (it's needed for decryption)
    user.credentialsIV = iv;
    user.awsRegion = region || 'us-east-1';
    user.isLocalStack = isLocalStack || false;
    if (isLocalStack && localStackEndpoint) {
      user.localStackEndpoint = localStackEndpoint;
    }
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'AWS credentials saved successfully',
    });
  } catch (error) {
    console.error('Credentials save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save credentials',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// UPDATE PASSWORD
// ============================================================================
router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'All password fields are required',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
      return;
    }

    const user = await User.findById(req.user?.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePasswords(currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
