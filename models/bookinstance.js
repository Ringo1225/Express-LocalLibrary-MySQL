const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize"); // Import your Sequelize connection
const Book = require("./book"); // Import your Book model

const BookInstance = sequelize.define("BookInstance", {
  imprint: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Maintenance",
    validate: {
      isIn: [["Available", "Maintenance", "Loaned", "Reserved"]],
    },
  },
  due_back: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Associations
BookInstance.belongsTo(Book, { foreignKey: "bookId", allowNull: false });

// Virtual for this book instance object's URL.
BookInstance.prototype.url = function () {
  return "/catalog/bookinstance/" + this.id;
};

BookInstance.prototype.getDueBackFormatted = function () {
  return this.due_back.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

BookInstance.prototype.getDueBack_yyyy_mm_dd = function () {
  return this.due_back.toISOString().split("T")[0];
};

module.exports = BookInstance;
