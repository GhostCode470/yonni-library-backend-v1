const Book = require('../models/book'); // Assurez-vous que le chemin est correct

const resolvers = {
  Query: {
    books: async () => {
      return await Book.find();
    },
  },
  Mutation: {
    addBook: async (_, args) => {
      const newBook = new Book(args);
      await newBook.save();
      return newBook;
    },
    // Ajoutez d'autres résolveurs nécessaires
  },
};

module.exports = resolvers;
