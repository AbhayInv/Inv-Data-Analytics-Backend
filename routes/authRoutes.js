const express = require("express");
const db = require("../config/db");
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

// Route to get Looker link by username
router.get("/user-link/:username", (req, res) => {
  const { username } = req.params;
  const query = "SELECT looker_link FROM looker_links WHERE username = ?";

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Error fetching Looker link");
    }
    if (results.length === 0) {
      return res.status(404).send("No Looker link found for this user");
    }
    res.json({ lookerLink: results[0].looker_link });
  });
});

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: new Date() });
});

module.exports = router;
