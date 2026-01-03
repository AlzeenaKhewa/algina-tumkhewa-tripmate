import prisma from "../lib/prisma.js";
import {
  hashPassword,
  comparePassword,
  hashToken,
  generateOTP,
  verifyOTP,
} from "../lib/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "../lib/email.js";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { AUDIT_ACTIONS } from "../utils/constants.js";

const OTP_EXPIRE_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 15);

const userService = {
  // ========== REGISTRATION ==========
  
  async registerUser({ email, password, firstName, lastName }) {
    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      if (existingUser.isVerified) {
        throw new ValidationError("Email already registered and verified.");
      }
    }

    // 2. Fetch Default Role (TRAVELLER)
    const travellerRole = await prisma.role.findUnique({
      where: { name: "TRAVELLER" },
    });
    if (!travellerRole) throw new NotFoundError("System Role 'TRAVELLER' not found.");

    // 3. Hash password and generate OTP
    const hashedPassword = await hashPassword(password);
    const otp = generateOTP(6);
    const otpHash = hashToken(otp);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    // 4. Create or update user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        password: hashedPassword,
        otpCode: otpHash,
        otpExpiresAt: otpExpiresAt,
        isVerified: false,
      },
      create: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        roleId: travellerRole.id,
        otpCode: otpHash,
        otpExpiresAt: otpExpiresAt,
        isVerified: false,
        isActive: true,
        tokenVersion: 0,
        language: "ENGLISH",
      },
    });

    // 5. Send verification email
    await sendVerificationEmail(email, otp, OTP_EXPIRE_MINUTES);

    // 6. Log action
    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.REGISTER,
        entity: "User",
        entityId: user.id,
        details: "User registered and awaiting email verification.",
      },
    });

    logger.info(`User registered: ${email}`);
    return { message: "OTP sent to email. Please verify to complete registration." };
  },

  // ========== EMAIL VERIFICATION ==========
  
  async verifyEmailOTP({ email, otp }) {
    // 1. Fetch user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("User not found.");

    // 2. Validate OTP
    if (!user.otpCode || !user.otpExpiresAt) {
      throw new ValidationError("No OTP request found. Please request a new one.");
    }

    if (new Date() > user.otpExpiresAt) {
      throw new ValidationError("OTP expired. Please register again or resend OTP.");
    }

    // 3. Compare OTP (hash the user input and compare with stored hash)
    const hashedInputOTP = hashToken(String(otp).trim());
    const isValid = hashedInputOTP === user.otpCode;
    
    if (!isValid) throw new ValidationError("Invalid OTP.");

    // 4. Update user - mark as verified
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
        isActive: true,
      },
      include: { role: true },
    });

    // 5. Create user profile
    await prisma.userProfile.upsert({
      where: { userId: updatedUser.id },
      update: {},
      create: { userId: updatedUser.id },
    });

    // 6. Log action
    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.VERIFY_EMAIL,
        entity: "User",
        entityId: updatedUser.id,
        details: "User successfully verified email via OTP.",
      },
    });

    logger.info(`Email verified for user: ${email}`);
    return { user: updatedUser };
  },

  // ========== OTP MANAGEMENT ==========
  
  async createAndSendOTP(email, type = "PASSWORD_RESET") {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("User not found.");

    // 1. Generate OTP
    const otp = generateOTP(6);
    const otpHash = hashToken(otp);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    // 2. Update user with OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otpHash,
        otpExpiresAt: otpExpiresAt,
      },
    });

    // 3. Send email based on type
    if (type === "PASSWORD_RESET") {
      await sendPasswordResetEmail(email, otp, OTP_EXPIRE_MINUTES);
    } else {
      await sendVerificationEmail(email, otp, OTP_EXPIRE_MINUTES);
    }

    // 4. Log action
    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.RESEND_OTP,
        entity: "User",
        entityId: user.id,
        details: `OTP resent for ${type}`,
      },
    });

    logger.info(`OTP sent to ${email} for ${type}`);
    return { message: `OTP sent to ${user.email}` };
  },

  // ========== AUTHENTICATION ==========
  
  async authenticateUser(email, password) {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { role: true } 
    });

    if (!user) throw new ValidationError("Invalid credentials.");

    // 1. Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new ValidationError("Invalid credentials.");

    // 2. Check email verification
    if (!user.isVerified) {
      throw new ValidationError("Email not verified. Please verify your account.");
    }

    // 3. Check account status
    if (!user.isActive) {
      throw new ForbiddenError("Your account has been blocked by an administrator.");
    }

    // 4. Log action
    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.LOGIN,
        entity: "User",
        entityId: user.id,
        details: "User successfully logged in.",
      },
    });

    logger.info(`User logged in: ${email}`);
    return user;
  },

  // ========== REFRESH TOKEN MANAGEMENT ==========
  
  async saveRefreshToken(userId, refreshToken) {
    const hashedToken = hashToken(refreshToken);
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { refreshToken: hashedToken },
    });
  },

  async getUserWithRefreshToken(userId, refreshToken) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { role: true },
    });

    if (!user) throw new NotFoundError("User not found.");
    if (!user.refreshToken) throw new ValidationError("No valid session.");

    const isMatch = hashToken(refreshToken) === user.refreshToken;
    if (!isMatch) throw new ValidationError("Invalid refresh token.");

    return user;
  },

  async clearRefreshToken(userId) {
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { refreshToken: null },
    });

    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.LOGOUT,
        entity: "User",
        entityId: userId,
        details: "User logged out.",
      },
    });

    logger.info(`User logged out: ${userId}`);
  },

  // ========== PASSWORD RESET ==========
  
  async resetPassword({ email, otp, newPassword }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("User not found.");

    // 1. Validate OTP
    if (!user.otpCode || !user.otpExpiresAt) {
      throw new ValidationError("No OTP request found.");
    }

    if (new Date() > user.otpExpiresAt) {
      throw new ValidationError("OTP has expired.");
    }

    if (!verifyOTP(otp, user.otpCode)) {
      throw new ValidationError("Invalid OTP.");
    }

    // 2. Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // 3. Update password, clear OTP, force logout
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiresAt: null,
        refreshToken: null,
        tokenVersion: { increment: 1 },
      },
    });

    // 4. Log action
    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.RESET_PASSWORD,
        entity: "User",
        entityId: user.id,
        details: "User successfully reset their password.",
      },
    });

    logger.info(`Password reset for user: ${email}`);
    return { message: "Password reset successful." };
  },

  // ========== SESSION MANAGEMENT ==========
  
  async revokeAllUserSessions(userId) {
    await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        refreshToken: null,
        tokenVersion: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.LOGOUT,
        entity: "User",
        entityId: userId,
        details: "All user sessions revoked.",
      },
    });

    logger.info(`All sessions revoked for user: ${userId}`);
  },

  // ========== USER RETRIEVAL ==========
  
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { role: true, profile: true },
    });
    if (!user) throw new NotFoundError("User not found.");
    return user;
  },

  async getUserByEmail(email) {
    return prisma.user.findUnique({ 
      where: { email },
      include: { role: true, profile: true }
    });
  },

  // ========== USER MANAGEMENT ==========
  
  async getAllUsers(skip = 0, take = 10) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        include: { role: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);
    return { users, total };
  },

  async blockUser(userId) {
    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: { isActive: false },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "BLOCK_USER",
        entity: "User",
        entityId: userId,
        details: "User account blocked by admin.",
      },
    });

    logger.info(`User blocked: ${user.email}`);
    return user;
  },

  async unblockUser(userId) {
    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: { isActive: true },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "UNBLOCK_USER",
        entity: "User",
        entityId: userId,
        details: "User account unblocked by admin.",
      },
    });

    logger.info(`User unblocked: ${user.email}`);
    return user;
  },

  async updateUserProfile(userId, data) {
    const profile = await prisma.userProfile.update({
      where: { userId: Number(userId) },
      data,
    });

    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.UPDATE_PROFILE,
        entity: "User",
        entityId: userId,
        details: "User profile updated.",
      },
    });

    logger.info(`User profile updated: ${userId}`);
    return profile;
  },

  async deleteUserAccount(userId) {
    await prisma.user.delete({
      where: { id: Number(userId) },
    });

    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.DELETE_ACCOUNT,
        entity: "User",
        entityId: userId,
        details: "User account deleted.",
      },
    });

    logger.info(`User account deleted: ${userId}`);
  },
};

export default userService;