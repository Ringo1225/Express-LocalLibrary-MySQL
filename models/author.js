const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize"); // Import your Sequelize connection
const { DateTime } = require("luxon");

const Author = sequelize.define("Author", {
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  },
  family_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  },
  date_of_birth: {
    type: DataTypes.DATE,
  },
  date_of_death: {
    type: DataTypes.DATE,
  },
}, {
  // Other model options can be added here
});

// Virtual fields (Getters)
Author.prototype.name = function () {
  if (this.first_name && this.family_name) {
    return `${this.family_name}, ${this.first_name}`;
  }
  return "";
};

Author.prototype.url = function () {
  return `/catalog/author/${this.id}`;
};

Author.prototype.date_of_birth_formatted = function () {
  return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : "";
};

Author.prototype.date_of_death_formatted = function () {
  return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : "";
};

Author.prototype.date_of_birth_yyyy_mm_dd = function () {
  return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toISODate() : "";
};

Author.prototype.date_of_death_yyyy_mm_dd = function () {
  return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toISODate() : "";
};

// Associations and other methods can be defined here

module.exports = Author;
