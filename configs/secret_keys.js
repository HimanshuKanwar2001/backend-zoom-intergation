const dotenv = require("dotenv");
dotenv.config();

const keys = {
  ZOOM: {
    clientID: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET,
    hostKey: process.env.ZOOM_HOST_KEY,
  },
  ANKIT: {
    clientID: process.env.ANKIT_ZOOM_CLIENT_ID,
    clientSecret: process.env.ANKIT_ZOOM_CLIENT_SECRET,
    hostKey: process.env.ANKIT_HOST_KEY,
  },
  UTKARSH: {
    clientID: process.env.UTKARSH_ZOOM_CLIENT_ID,
    clientSecret: process.env.UTKARSH_ZOOM_CLIENT_SECRET,
    hostKey: process.env.UTKARSH_HOST_KEY,
  },
  RATNAM: {
    clientID: process.env.RATNAM_ZOOM_CLIENT_ID,
    clientSecret: process.env.RATNAM_ZOOM_CLIENT_SECRET,
    hostKey: process.env.RATNAM_HOST_KEY,
  },
  VISHWAJEET: {
    clientID: process.env.VISHWAJEET_ZOOM_CLIENT_ID,
    clientSecret: process.env.VISHWAJEET_ZOOM_CLIENT_SECRET,
    hostKey: process.env.VISHWAJEET_HOST_KEY,
  },
  PRATIMA: {
    clientID: process.env.PRATIMA_ZOOM_CLIENT_ID,
    clientSecret: process.env.PRATIMA_ZOOM_CLIENT_SECRET,
    hostKey: process.env.PRATIMA_HOST_KEY,
  },
  ANISH: {
    clientID: process.env.ANISH_ZOOM_CLIENT_ID,
    clientSecret: process.env.ANISH_ZOOM_CLIENT_SECRET,
    hostKey: process.env.ANISH_HOST_KEY,
  },
  PUSHKAR: {
    clientID: process.env.PUSHKAR_ZOOM_CLIENT_ID,
    clientSecret: process.env.PUSHKAR_ZOOM_CLIENT_SECRET,
    hostKey: process.env.PUSHKAR_HOST_KEY,
  },
  KUSH: {
    clientID: process.env.KUSH_ZOOM_CLIENT_ID,
    clientSecret: process.env.KUSH_ZOOM_CLIENT_SECRET,
    hostKey: process.env.KUSH_HOST_KEY,
  },
};

module.exports = keys; // Correct export for CommonJS
