'use strict';

const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI;

// Schéma pour les livres
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  comments: { type: [String], default: [] } // Tableau de commentaires, par défaut vide
});
const Book = mongoose.model('Book', bookSchema);


module.exports = function (app) {

  mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

  app.route('/api/books')
  .get(async (req, res) => {
    try {
      const books = await Book.find({}); // Récupère tous les livres
      const formattedBooks = books.map(book => ({
        _id: book._id,
        title: book.title,
        commentcount: book.comments ? book.comments.length : 0 // Nombre de commentaires
      }));
      res.json(formattedBooks); // Renvoie un tableau avec tous les livres
    } catch (err) {
      res.status(500).json({ error: 'An error occurred while fetching books' });
    }
  })

  // Ajouter un nouveau livre
  .post(async (req, res) => {
    const title = req.body.title;

    // Vérification si le titre est manquant
    if (!title) {
      return res.send('missing required field title');
    }

    try {
      const newBook = new Book({ title });
      const savedBook = await newBook.save();
      res.json({ _id: savedBook._id, title: savedBook.title });
    } catch (err) {
      res.status(500).json({ error: 'An error occurred while saving the book' });
    }
  })
  
  .delete(async (req, res) => {
    try {
      await Book.deleteMany({});
      res.json('complete delete successful');
    } catch (err) {
      res.status(500).json({ error: 'An error occurred while deleting books' });
    }
  });

  app.route('/api/books/:id')
  .get(async (req, res) => {
    const bookId = req.params.id;

    try {
      const book = await Book.findById(bookId);
      if (!book) {
        return res.json('no book exists');
      }
      res.json({
        _id: book._id,
        title: book.title,
        comments: book.comments || [] // Retourne un tableau vide si aucun commentaire
      });
    } catch (err) {
      res.status(200).json({ error: 'An error occurred while fetching the book' });
    }
  })

  // Ajouter un commentaire à un livre
  .post(async (req, res) => {
    const bookId = req.params.id;
    const comment = req.body.comment;

    // Vérifie si le commentaire est manquant
    if (!comment) {
      return res.send('missing required field comment');
    }

    try {
      const book = await Book.findById(bookId);
      if (!book) {
        return res.send('no book exists');
      }

      // Ajoute le commentaire et enregistre
      book.comments.push(comment);
      const updatedBook = await book.save();
      res.json({
        _id: updatedBook._id,
        title: updatedBook.title,
        comments: updatedBook.comments
      });
    } catch (err) {
      res.status(500).json({ error: 'An error occurred while adding the comment' });
    }
  })

  // Supprimer un livre
  .delete(async (req, res) => {
    const bookId = req.params.id;

    try {
      const deletedBook = await Book.findByIdAndDelete(bookId);
      if (!deletedBook) {
        return res.status(200).send('no book exists');
      }
      res.json('delete successful');
    } catch (err) {
      res.status(500).json({ error: 'An error occurred while deleting the book' });
    }
  });

};
