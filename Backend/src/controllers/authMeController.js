// src/controllers/authMeController.js
// This file is deprecated. Use getCurrentUser from auth.controller.js instead

import { AuthenticationError } from "../utils/errors.js";
import { sanitizeUser } from "../utils/helpers.js";

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      throw new AuthenticationError("Not authenticated");
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};
