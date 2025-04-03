// const passport = require("passport");

const keys = require("../configs/secret_keys.js");
const {
  passport,
  configureZoomStrategy,
} = require("../configs/passport-config.js");
const axios = require("axios");
const User = require("../models/User");

// ✅ Function to refresh Zoom Access Token
exports.refreshZoomToken = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.refreshToken) {
      return res.status(400).json({ error: "No refresh token found" });
    }

    // console.log(`Refreshing token for user: ${user.email}`);
    const accKey = keys[user.selectedName];
    // console.log("ACCOUNTKEY", accKey);
    // console.log("USER------------>", user);

    // Ensure no concurrent refresh attempts for the same user
    if (user.isRefreshing) {
      return res.status(429).json({ error: "Token refresh in progress" });
    }
    user.isRefreshing = true;
    await user.save();

    try {
      const tokenResponse = await axios.post(
        "https://zoom.us/oauth/token",
        null,
        {
          params: {
            grant_type: "refresh_token",
            refresh_token: user.refreshToken,
          },
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${accKey.clientID}:${accKey.clientSecret}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Save new tokens in DB
      user.accessToken = tokenResponse.data.access_token;
      user.refreshToken = tokenResponse.data.refresh_token;
      user.isRefreshing = false;
      await user.save();

      console.log("Token refreshed successfully");
      res.json({
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
      });
    } catch (error) {
      user.isRefreshing = false;
      await user.save();

      if (error.response && error.response.data) {
        const { reason, error: errorMsg } = error.response.data;
        if (errorMsg === "invalid_grant") {
          console.error("Refresh token invalid or expired");
          return res.status(401).json({
            error:
              "Refresh token invalid or expired. Please reauthorize the application.",
          });
        }
        console.error("Error refreshing Zoom token:", reason || errorMsg);
        return res
          .status(500)
          .json({ error: reason || "Failed to refresh Zoom token" });
      } else {
        console.error("Error refreshing Zoom token:", error.message);
        return res.status(500).json({ error: "Failed to refresh Zoom token" });
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error.message);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};


exports.selectZoomAccount = async (req, res, next) => {
  try {
    const { account } = req.params;
    if (!account)
      return res.status(400).json({ message: "Account parameter missing" });

    const selectedAccount = keys[account.toUpperCase()];
    if (!selectedAccount)
      return res
        .status(400)
        .json({ message: "Invalid Zoom account selection" });

    // console.log(
    //   "selectedAccount.clientID, selectedAccount.clientSecret-------->",
    //   selectedAccount.clientID,
    //   selectedAccount.clientSecret
    // );
    // Apply the strategy dynamically before authentication
    configureZoomStrategy(
      selectedAccount.clientID,
      selectedAccount.clientSecret,
      account
    );

    req.session.zoomClient = {
      clientID: selectedAccount.clientID,
      clientSecret: selectedAccount.clientSecret,
    };

    const redirectUri = encodeURIComponent(
      "http://localhost:5000/auth/zoom/callback"
    );

    return res.redirect(
      `https://zoom.us/oauth/authorize?client_id=${selectedAccount.clientID}&response_type=code&redirect_uri=${redirectUri}`
    );
  } catch (error) {
    console.error("Error selecting Zoom account:", error);
    return res
      .status(500)
      .json({ message: "Error selecting Zoom account", error: error.message });
  }
};

exports.authZoom = async (req, res, next) => {
  try {
    const { account } = req.body; // Expecting { "account": "RATNAM" }

    if (!keys[account]) {
      console.error("❌ Invalid Zoom Account:", account);
      return res
        .status(400)
        .json({ message: "Invalid Zoom account selection" });
    }

    const { clientID, clientSecret } = keys[account];
    configureZoomStrategy(clientID, clientSecret);

    // console.log(`🚀 Initiating Zoom OAuth for ${account}`);
    passport.authenticate("zoom")(req, res, next);
  } catch (error) {
    // console.error("❌ Authentication Setup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Callback Route
exports.authZoomCallback = (req, res) => {
  passport.authenticate("zoom", {
    failureRedirect: "/auth/zoom/retry",
  })(req, res, () => {
    // console.log("✅ User authenticated, redirecting...", req.user.name);
    res.json({
      message: `user got authneticated ${JSON.stringify(
        req.user.zoomClientID,
        req.user.zoomClientSecret
      )}`,
    });
    // res.redirect("/");
  });
};

// exports.zoomAuthCallback = (req, res, next) => {
//   passport.authenticate("zoom", { failureRedirect: "/" }, (err, user) => {
//     if (err || !user) {
//       return res.redirect("/"); // Redirect to home page on failure
//     }

//     req.login(user, (loginErr) => {
//       if (loginErr) {
//         return next(loginErr);
//       }
//       res.send(`Welcome, ${user.name}! Authentication successful.`);
//     });
//   })(req, res, next);
// };

// app.get(
//   "/auth/zoom/callback",
//   passport.authenticate("zoom", { failureRedirect: "/" }),
//   (req, res) => {
//     res.send(`Welcome, ${req.user.name}! Authentication successful.`);
//   }
// );
