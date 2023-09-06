const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize"); // Import your Sequelize connection

const Genre = sequelize.define("Genre", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100],
    },
  },
});

// Virtual for this genre instance URL.
Genre.prototype.url = function () {
  return "/catalog/genre/" + this.id;
};

module.exports = Genre;
