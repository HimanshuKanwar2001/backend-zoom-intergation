const express = require("express");
const passport = require("../configs/passport-config.js").passport;
const authController = require("../controllers/authController.js");

const route = express.Router();

// Select Zoom Account before authentication
route.get("/account/:account", authController.selectZoomAccount);

route.post("/", authController.authZoom);
route.post("/refresh/zoom/token", authController.refreshZoomToken);

route.get(
  "/callback",
  passport.authenticate("zoom", { failureRedirect: "/auth/zoom/failure" }),
  authController.authZoomCallback
);

route.get("/failure", (req, res) => {
  res.status(401).json({ message: "Zoom Authentication Failed. Try Again." });
});

// Retry authentication with the stored account
route.get("/retry", (req, res) => {
  const account = req.session.account;
  if (!account) {
    return res
      .status(400)
      .json({ message: "No account found in session for retry" });
  }
  res.redirect(`/auth/zoom/${account}`);
});

module.exports = route;
