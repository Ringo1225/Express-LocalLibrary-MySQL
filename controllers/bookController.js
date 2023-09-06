const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

exports.index = asyncHandler(async (req, res, next) => {
  // Get details of books, book instances, authors and genre counts (in parallel)
  const [
    numBooks,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
    numGenres,
  ] = await Promise.all([
    Book.count(),
    BookInstance.count(),
    BookInstance.count({ where: { status: 'Available' } }),
    Author.count(),
    Genre.count(),
  ]);

  res.render("index", {
    title: "Local Library Home",
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
});


// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.findAll({
        include: Author,
        order: [['title', 'ASC']],
      });
  
    res.render("book_list", { title: "Book List", book_list: allBooks });
  });
  

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  // Get details of books, book instances for specific book
  const [book, bookInstances] = await Promise.all([
    Book.findByPk(req.params.id, {
      include: [{model: Author}, {model: Genre}]
    }),
    BookInstance.findAll({
      where: { bookId: req.params.id }}),
  ]);

  if (book === null) {
    // No results.
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  res.render("book_detail", {
    title: book.title,
    book: book,
    book_instances: bookInstances,
  });
});


// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  // Get all authors and genres, which we can use for adding to our book.
  const [allAuthors, allGenres] = await Promise.all([
    Author.findAll(),
    Genre.findAll(),
  ]);

  res.render("book_form", {
    title: "Create Book",
    authors: allAuthors,
    genres: allGenres,
  });
});


// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("authorId", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      try {
        const [allAuthors, allGenres] = await Promise.all([
          Author.findAll(),
          Genre.findAll(),
        ]);

        // Mark our selected genres as checked.
        for (const genre of allGenres) {
          if (req.body.genre.includes(genre.id.toString())) {
            genre.checked = "true";
          }
        }

        res.render("book_form", {
          title: "Create Book",
          authors: allAuthors,
          genres: allGenres,
          book: {
            title: req.body.title,
            authorId: req.body.authorId,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
          },
          errors: errors.array(),
        });
      } catch (error) {
        next(error);
      }
    } else {
      // Data from form is valid. Save book.
      try {
        const book = await Book.create({
          title: req.body.title,
          authorId: req.body.authorId,
          summary: req.body.summary,
          isbn: req.body.isbn,
        });

        // Add associations for genres.
        if (req.body.genre && req.body.genre.length > 0) {
          await book.setGenres(req.body.genre);
        }

        res.redirect("/catalog/book/" + book.id);
      } catch (error) {
        next(error);
      }
    }
  }),
];


// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const [book, allCopiesOfBook] = await Promise.all([
    Book.findByPk(req.params.id, {
      include: [{model: Author}, {model: Genre}]
    }),
    BookInstance.findAll({ where: { bookId: req.params.id }}),
  ]);

  if (book === null) {
    res.redirect("/catalog/books");
  }

  res.render("book_delete", {
    title: "Delete Book",
    book: book,
    book_instances: allCopiesOfBook,
  });
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  const [book, allCopiesOfBook] = await Promise.all([
    Book.findByPk(req.params.id, {
      include: [{model: Author}, {model: Genre}]
    }),
    BookInstance.findAll({ where: { bookId: req.params.id }}),
  ]);

  if (allCopiesOfBook.length > 0) {
    res.render("book_delete", {
      title: "Delete Book",
      book: book,
      book_instances: allCopiesOfBook,
    });
    return;
  } else {
    const book = await Book.findOne({where: {id: req.params.id}});
    await book.destroy();
    res.redirect("/catalog/books");
  }
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  // Get book, authors and genres for form.
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findByPk(req.params.id, {
      include: [{model: Author}, {model: Genre}]
    }),
    Author.findAll(),
    Genre.findAll(),
  ]);

  if (book === null) {
    // No results.
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  // Mark our selected genres as checked.
  for (const genre of allGenres) {
    for (const book_g of book.Genres) {
      if (genre.id.toString() === book_g.id.toString()) {
        genre.checked = "true";
      }
    }
  }

  res.render("book_form", {
    title: "Update Book",
    authors: allAuthors,
    genres: allGenres,
    book: book,
  });
});


// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("authorId", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form
      const [allAuthors, allGenres] = await Promise.all([
        Author.findAll(),
        Genre.findAll(),
      ]);

      // Mark our selected genres as checked.
      for (const genre of allGenres) {
        if (req.body.genre.indexOf(genre.id) > -1) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: allAuthors,
        genres: allGenres,
        book: {
          title: req.body.title,
          authorId: req.body.authorId,
          summary: req.body.summary,
          isbn: req.body.isbn,
          genre: req.body.genre,
        },
        errors: errors.array(),
      });
      return;
    } else {

      const book = await Book.findOne({where: {id: req.params.id}});
        book.title = req.body.title;
        book.authorId = req.body.authorId;
        book.summary = req.body.summary;
        book.isbn = req.body.isbn;

      if (req.body.genre && req.body.genre.length > 0) {
        await book.setGenres(req.body.genre);
      }
      
      await book.save();

      res.redirect("/catalog/book/" + book.id);
    }
  }),
];

