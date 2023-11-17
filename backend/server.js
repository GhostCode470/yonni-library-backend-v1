const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configurations du middleware express-session
app.use(
  session({
    secret: "your_secret_key", // A remplacer par une clé secrète
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

const PORT = process.env.PORT || 3002;

app.get("/", (req, res) => {
  res.send("Le serveur Express fonctionne !");
});

app.listen(PORT, () => {
  console.log(`Le serveur écoute sur le port ${PORT}`);
});

const mongoURI = "mongodb://localhost:27017/yonni-library-v1";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Erreur de connexion à MongoDB :"));
db.once("open", () => {
  console.log("Connexion à MongoDB établie");
});

const secretKey = "your_secret_key"; // A remplacer par une clé secrète ici aussi

const Book = require("./models/book"); // Ajout du modèle de données pour les livres
const User = require("./models/user"); // Ajout du modèle utilisateur

// Route pour l'ajout de livres
app.post("/add-book", async (req, res) => {
  try {
    const newBook = new Book(req.body);

    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'ajout du livre");
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: "Nom d'utilisateur déjà utilisé" });
    }

    // Hash du mot de passe avant de le stocker dans la base de données
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création d'un nouvel utilisateur
    const newUser = new User({ username, password: hashedPassword });

    // Enregistrement dans la base de données
    await newUser.save();

    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l'utilisateur" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Recherche de l'utilisateur dans la base de données
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Nom d'utilisateur incorrect" });
    }

    // Vérification du mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Génération d' un jeton JWT
    const token = jwt.sign({ username: user.username }, secretKey, {
      expiresIn: "5m",
    });

    // Envoi du  jeton au client
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});
// Route pour la déconnexion
app.post("/logout", (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Erreur lors de la déconnexion", err);
        res.status(500).send("Erreur lors de la déconnexion");
      } else {
        res.clearCookie("connect.sid"); // Suppression du cookie de session
        res.status(200).send("Déconnexion réussie");
      }
    });
  } catch (error) {
    console.error("Erreur lors de la déconnexion", error);
    res.status(500).send("Erreur lors de la déconnexion");
  }
});

// Route pour vérifier la validité du jeton
app.post("/verify-token", async (req, res) => {
  const { token } = req.body;

  try {
    jwt.verify(token, secretKey);
    res.sendStatus(200);
  } catch (error) {
    console.error("Erreur lors de la vérification du jeton:", error);
    res.sendStatus(401);
  }
});

app.post("/refresh-token", (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, secretKey);
    const newToken = jwt.sign({ username: decoded.username }, secretKey, {
      expiresIn: "5m",
    });
    res.json({ token: newToken });
  } catch (error) {
    console.error("Erreur lors du renouvellement du jeton:", error);
    res.sendStatus(401);
  }
});

// Route pour mettre à jour un livre
app.put("/update-book/:id", async (req, res) => {
  try {
    const bookId = req.params.id;

    const book = await Book.findById(bookId);

    book.set({ ...req.body, updatedAt: Date.now() });

    await book.save();

    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la mise à jour du livre");
  }
});

// Route pour supprimer un livre
app.delete("/delete-book/:id", async (req, res) => {
  try {
    console.log("Deleting book with ID:", req.params.id);

    const bookId = req.params.id;

    await Book.findByIdAndDelete(bookId);

    res.status(200).send("Livre supprimé avec succès");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la suppression du livre");
  }
});
// Route pour récupérer la liste des livres
app.get("/get-books", async (req, res) => {
  try {
    const books = await Book.find();

    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des livres");
  }
});
