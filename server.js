const express = require("express");
const cors = require("cors");
const passport = require("./configs/passport-config.js");
const session = require("express-session");
const mongoose = require("mongoose");
const axios = require("axios");
// const refreshAccessToken = require("./utils/refreshToken.js");
const User = require("./models/User.js");
const cron = require("node-cron");
const db = require("./configs/db.js");
const MongoStore = require("connect-mongo");
const sendMeetingEmail = require("./utils/sendEmail.js");
const authRoutes = require("./routes/router.js");
const zoomRoutes = require("./routes/zoom.routes.js");
const authRoute = require("./routes/authRoute.js");
const zoomFeatureRoute = require("./routes/zoomFeatureRoute.js");
const keys = require("./configs/secret_keys.js");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }
  ),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: false, // true if using HTTPS
    },
  })
);

// app.use(
//   session({
//     secret: "your_secret_key",
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: true }, // Set `true` if using HTTPS
//   })
// );

app.use(cors());

app.use("/auth/zoom", authRoutes);
app.use("/api/zoom", zoomRoutes);

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/feature", zoomFeatureRoute);

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

// Start Server
app.listen(5000, async () => {
  await db.connectToDB();
  console.log("Server running on http://localhost:5000");
});
