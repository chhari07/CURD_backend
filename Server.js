const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Mongoose Schema and Model
const contentSchema = new mongoose.Schema({
  description: String,
  image: String,
  video: String,
});

const Content = mongoose.model("Content", contentSchema);

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ------------------- ROUTES -------------------

// POST: Create a post
app.post(
  "/api/posts",
  upload.fields([{ name: "image" }, { name: "video" }]),
  async (req, res) => {
    try {
      const { description } = req.body;
      const image = req.files.image?.[0]?.filename || null;
      const video = req.files.video?.[0]?.filename || null;

      const newPost = new Content({ description, image, video });
      await newPost.save();
      res.status(201).json(newPost);
    } catch (err) {
      console.error("❌ Error creating post:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET: Fetch all posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Content.find().sort({ _id: -1 });
    res.json(posts);
  } catch (err) {
    console.error("❌ Error in GET /api/posts:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove post by ID
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const post = await Content.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.image) fs.unlinkSync(path.join(uploadDir, post.image));
    if (post.video) fs.unlinkSync(path.join(uploadDir, post.video));

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("❌ Error deleting post:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------- START SERVER -------------------
app.listen(PORT, () => {
  console.log(`🚀 [Server Running] http://localhost:${PORT}`);
});
