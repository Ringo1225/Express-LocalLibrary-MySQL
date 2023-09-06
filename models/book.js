const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize"); // Import your Sequelize connection
const Author = require("./author"); // Import your Author model
const Genre = require("./genre"); // Import your Genre model

const Book = sequelize.define("Book", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isbn: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Associations
Book.belongsTo(Author, { foreignKey: "authorId", allowNull: false });
Book.belongsToMany(Genre, {
  through: "BookGenre", // Create a join table named BookGenre
  foreignKey: "bookId",
});

// Virtual for this book instance URL.
Book.prototype.url = function () {
  return "/catalog/book/" + this.getDataValue("id");
};

module.exports = Book;
