const Sequelize = require("sequelize");

const sequelize = new Sequelize("local_library", "root", "replace_with_your_password", {
  host: "localhost",
  dialect: "mysql", // Use the appropriate dialect
  logging: false, // Disable logging SQL queries (optional)
});

module.exports = sequelize;
