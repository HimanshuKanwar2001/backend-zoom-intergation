const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  zoomId: { type: String, unique: true, required: true },
  name: String,
  selectedName: String,
  email: { type: String, unique: true },
  accessToken: String,
  refreshToken: String,
  tokenExpiresAt: Date,
  zoomClientID: String, // Stores the clientID of the Zoom app used
  zoomClientSecret: String, // Stores the clientSecret
});

module.exports = mongoose.model("User", UserSchema);
