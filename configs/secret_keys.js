const dotenv = require("dotenv");
dotenv.config();

const keys = {
  ZOOM: {
    clientID: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET,
    clientRedirectionLink: process.env.ZOOM_CLIENT_REDIRECT,
  },
  ANKIT: {
    clientID: process.env.ANKIT_ZOOM_CLIENT_ID,
    clientSecret: process.env.ANKIT_ZOOM_CLIENT_SECRET,
    // clientRedirectionLink: process.env.ZOOM_CLIENT_REDIRECT,
  },
  UTKARSH: {
    clientID: process.env.UTKARSH_ZOOM_CLIENT_ID,
    clientSecret: process.env.UTKARSH_ZOOM_CLIENT_SECRET,
    clientRedirectionLink: process.env.UTKARSH_ZOOM_CLIENT_REDIRECT,
  },
  RATNAM: {
    clientID: process.env.RATNAM_ZOOM_CLIENT_ID,
    clientSecret: process.env.RATNAM_ZOOM_CLIENT_SECRET,
    clientRedirectionLink: process.env.RATNAM_ZOOM_CLIENT_REDIRECT,
  },
  VISHWAJEET: {
    clientID: process.env.VISHWAJEET_ZOOM_CLIENT_ID,
    clientSecret: process.env.VISHWAJEET_ZOOM_CLIENT_SECRET,
  },
  PRATIMA: {
    clientID: process.env.PRATIMA_ZOOM_CLIENT_ID,
    clientSecret: process.env.PRATIMA_ZOOM_CLIENT_SECRET,
  },
  ANISH: {
    clientID: process.env.ANISH_ZOOM_CLIENT_ID,
    clientSecret: process.env.ANISH_ZOOM_CLIENT_SECRET,
  },
  PUSHKAR: {
    clientID: process.env.PUSHKAR_ZOOM_CLIENT_ID,
    clientSecret: process.env.PUSHKAR_ZOOM_CLIENT_SECRET,
  },
};

module.exports = keys; // Correct export for CommonJS
