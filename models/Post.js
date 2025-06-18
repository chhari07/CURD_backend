const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  description: { type: String, required: true },
  image: { type: String },
  video: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
