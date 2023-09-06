const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.findAll({
    include: Book,
    order: [['imprint', 'ASC']],
  });

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});


// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findByPk(req.params.id, {
    include: Book
  });

  if (bookInstance === null) {
    // No results.
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});


// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.findAll();

  res.render("bookinstance_form", {
    title: "Create BookInstance",
    selected_bookId: null,
    book_list: allBooks,
  });
});


// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("bookId", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.findAll();

      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_bookId: req.body.bookId,
        errors: errors.array(),
        bookinstance: {
          bookId: req.body.bookId,
          imprint: req.body.imprint,
          status: req.body.status,
          due_back: req.body.due_back||null,
        },
      });
      return;
    } else {
        const bookInstance = await BookInstance.create({
          bookId: req.body.bookId,
          imprint: req.body.imprint,
          status: req.body.status,
          due_back: req.body.due_back||null,
        })
      res.redirect("/catalog/bookinstance/" + bookInstance.id);
    }
  }),
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findByPk(req.params.id);

  if (bookInstance == null) {
    res.redirect("/catalog/bookinstances");
  }

  res.render("bookinstance_delete", {
    title: "Delete Book",
    bookInstance: bookInstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findByPk(req.params.id);

  const bookinstance = await BookInstance.findOne({ where: {id: req.body.bookInstanceid}});
  await bookInstance.destroy();
  res.redirect("/catalog/bookinstances");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findByPk(req.params.id),
    Book.findAll(),
  ]);

  if (bookInstance === null) {
    const err = new Error("Book Instance not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_form", {
    title: "Update Book Instance",
    selected_bookId: bookInstance.bookId,
    bookinstance: bookInstance,
    book_list: allBooks,
  });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("bookId", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const allBooks = await Book.findAll();

      res.render("bookinstance_form", {
        title: "Update Book Instance",
        bookinstance: {
          bookId: req.body.bookId,
          imprint: req.body.imprint,
          status: req.body.status,
          due_back: req.body.due_back,
        },
        book_list: allBooks,
      });
      return;
    } else {
      const bookInstance = await BookInstance.findOne({where: {id: req.params.id}});
      bookInstance.bookId = req.body.bookId;
      bookInstance.imprint = req.body.imprint;
      bookInstance.status = req.body.status;
      bookInstance.due_back = req.body.due_back;

      await bookInstance.save();
      res.redirect("/catalog/bookInstance/" + bookInstance.id);
    }
})
];
