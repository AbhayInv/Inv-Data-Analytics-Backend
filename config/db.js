const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, // Change this to your DB username
  password: process.env.DB_PASS, // Change this to your DB password
  database: process.env.DB_NAME, // Change this to your DB name
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database");
});

module.exports = db;
