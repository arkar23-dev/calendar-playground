const mongoose = require('mongoose');

const googleCalendarTokenSchema = new mongoose.Schema({
  googleUserId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  scope: { type: String },
  tokenType: { type: String },
  expiryDate: { type: Date }
}, { timestamps: true });

const googleCalendarToken = mongoose.model('googleCalendarToken', googleCalendarTokenSchema);

module.exports = googleCalendarToken;
