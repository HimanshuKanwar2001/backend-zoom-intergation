const passport = require("passport");
const ZoomStrategy = require("@giorgosavgeris/passport-zoom-oauth2").Strategy;
const User = require("../models/User.js"); // Import user model if needed

// Function to dynamically configure Zoom strategy
const configureZoomStrategy = (clientID, clientSecret, selectedAccount) => {
  console.log("Configuring Zoom Strategy with:", { clientID, clientSecret });

  if (!clientID || !clientSecret) {
    console.error("❌ Missing Zoom credentials!");
    throw new Error("Invalid Zoom account selection");
  }

  // Remove existing Zoom strategy before adding a new one
  if (passport._strategy("zoom")) {
    passport.unuse("zoom");
  }

  passport.use(
    "zoom",
    new ZoomStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: "http://localhost:5000/auth/zoom/callback",
        passReqToCallback: true, // Pass req to callback
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log("✅ Zoom Authentication Success:", profile);

          // Simulate user retrieval or creation in DB
          let user = await User.findOne({ zoomId: profile.id });
          if (!user) {
            user = await User.create({
              zoomId: profile.id,
              selectedName: selectedAccount,
              name: profile.displayName,
              email: profile.emails?.[0]?.value || "",
              accessToken,
              refreshToken,
              tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
              zoomClientID: clientID,
              zoomClientSecret: clientSecret,
            });
          }

          return done(null, user);
        } catch (error) {
          console.error("❌ Error in Zoom Strategy:", error);
          return done(error, null);
        }
      }
    )
  );
};

// Serialize user (save only user ID in session)
passport.serializeUser((user, done) => {
  console.log("🔐 Serializing user:", user.id);
  done(null, user.id);
});

// Deserialize user (retrieve full user from DB using stored ID)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log("🔓 Deserializing user:", user);
    done(null, user);
  } catch (error) {
    console.error("❌ Error in deserialization:", error);
    done(error, null);
  }
});

module.exports = { passport, configureZoomStrategy };
