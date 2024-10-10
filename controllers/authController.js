const { OAuth2Client } = require("google-auth-library");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");
require("dotenv").config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { username: user.username, email: user.email },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );
};

// Register User (Manual Registration)
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Hash password and save user to DB
    const hashedPassword = await bcrypt.hash(password, 10);
    const query =
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";

    db.query(query, [username, email, hashedPassword], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Error registering user");
      }
      res.status(201).send("User registered successfully");
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

// Login User (Manual Login)
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Database error");
    }

    if (results.length === 0) {
      return res.status(401).send("Invalid email or password");
    }

    const user = results[0];
    const isAdmin = user.username === "admin";

    try {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).send("Invalid email or password");
      }

      let lookerQuery =
        "SELECT looker_link FROM looker_links WHERE username = ?";
      if (isAdmin) {
        // Get both links for admin
        lookerQuery =
          "SELECT looker_link, additional_looker_link FROM looker_links WHERE username = 'admin'";
      }

      db.query(lookerQuery, [user.username], (lookerErr, lookerResults) => {
        if (lookerErr || lookerResults.length === 0) {
          return res.status(500).send("Error fetching Looker link");
        }

        const lookerLink = lookerResults[0].looker_link;
        const additionalLookerLink = isAdmin
          ? lookerResults[0].additional_looker_link
          : null;
        const token = generateToken(user);

        res.json({
          token,
          username: user.username,
          email: user.email,
          lookerLink,
          additionalLookerLink, // Send additional link if admin
        });
      });
    } catch (compareError) {
      console.error("Bcrypt comparison error:", compareError);
      return res
        .status(500)
        .send("Internal server error during password comparison");
    }
  });
};

// Google OAuth Login
const googleOAuthLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    // Handle case where email might be undefined
    if (!email) {
      console.error("Email is missing from Google payload");
      return res.status(400).send("Email is required from Google account");
    }

    const username = name || email.split("@")[0];
    console.log("Username determined:", username);

    const query = "SELECT * FROM users WHERE google_id = ?";
    db.query(query, [sub], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send(err);
      }

      let user;

      if (results.length === 0) {
        // User doesn't exist, create a new user
        const insertQuery =
          "INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)";

        db.query(
          insertQuery,
          [username, email, sub],
          (insertErr, insertResults) => {
            if (insertErr) {
              console.error("Error creating user:", insertErr);
              return res.status(500).send("Error creating user");
            }

            user = { username, email, google_id: sub };
            const token = generateToken(user);
            return res.json({
              token,
              username: user.username,
              email: user.email,
            });
          }
        );
      } else {
        // User exists
        user = results[0];
        const token = generateToken(user);
        return res.json({ token, username: user.username, email: user.email });
      }
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).send("Invalid Google token");
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleOAuthLogin,
};
