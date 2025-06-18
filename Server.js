
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// Mongoose Schema
const contentSchema = new mongoose.Schema({
  text: String,
  image: String,
  video: String,
});

const Content = mongoose.model("Content", contentSchema);

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Routes
app.post("/api/create", upload.fields([{ name: "image" }, { name: "video" }]), async (req, res) => {
  const { text } = req.body;
  const image = req.files.image ? req.files.image[0].filename : null;
  const video = req.files.video ? req.files.video[0].filename : null;
  try {
    const newItem = new Content({ text, image, video });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/items", async (req, res) => {
  const items = await Content.find();
  res.json(items);
});

app.delete("/api/delete/:id", async (req, res) => {
  try {
    const item = await Content.findByIdAndDelete(req.params.id);
    if (item.image) fs.unlinkSync(path.join(__dirname, "uploads", item.image));
    if (item.video) fs.unlinkSync(path.join(__dirname, "uploads", item.video));
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));