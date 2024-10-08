const express = require("express");
const {
  registerUser,
  loginUser,
  googleOAuthLogin,
  generateGauthUrl,
} = require("../controllers/authController");
const router = express.Router();

// Register Route
router.post("/register", registerUser);

// Login Route
router.post("/login", loginUser);

// Google OAuth Route
router.post("/google-login", googleOAuthLogin);

module.exports = router;
