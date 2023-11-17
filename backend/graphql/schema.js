type Book {
    _id: ID!
    title: String
    author: String
    rating: Float
    // # Ajoutez d'autres propriétés nécessaires
  }
  
  type Query {
    books: [Book]
  }
  
  type Mutation {
    addBook(title: String, author: String, rating: Float): Book
    // # Ajoutez d'autres mutations nécessaires
  }
  