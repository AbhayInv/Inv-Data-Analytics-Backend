// backend/models/User.js
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  googleId: {
    type: DataTypes.STRING,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensure unique emails
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for Google login
  },
});

module.exports = User;
