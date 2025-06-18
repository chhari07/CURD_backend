const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const Post = require("./models/Post");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection failed:", err));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// CREATE
app.post(
  "/api/posts",
  upload.fields([{ name: "image" }, { name: "video" }]),
  async (req, res) => {
    try {
      const { description } = req.body;
      const image = req.files.image?.[0]?.path || "";
      const video = req.files.video?.[0]?.path || "";

      const post = new Post({ description, image, video });
      await post.save();
      res.status(201).json(post);
    } catch (err) {
      res.status(500).json({ error: "Failed to create post" });
    }
  }
);

// READ
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// UPDATE
app.put(
  "/api/posts/:id",
  upload.fields([{ name: "image" }, { name: "video" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { description } = req.body;

      const updateData = { description };
      if (req.files.image) updateData.image = req.files.image[0].path;
      if (req.files.video) updateData.video = req.files.video[0].path;

      const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      res.json(updatedPost);
    } catch (err) {
      res.status(500).json({ error: "Failed to update post" });
    }
  }
);

// DELETE
app.delete("/api/posts/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
