const express = require("express");
const route = express.Router();
const zoomController = require("../controllers/zoom.controller.js");
const passport = require("../configs/passport-config.js");
// Auth Routes
// route.get("/:account", zoomController.getRefreshTokenAndAccessToken);
// router.get("/meetings", zoomController.getUpComingMeetings);

// route.get("/auth/zoom", passport.authenticate("zoom"));
route.post("/create/meeting", zoomController.createMeeting);
route.get("/upcoming/meeting", zoomController.getUpcomingMeetings);
route.post("/search", zoomController.searchMeetings);
route.delete("/delete/meeting",zoomController.deleteMeeting);
module.exports = route;
