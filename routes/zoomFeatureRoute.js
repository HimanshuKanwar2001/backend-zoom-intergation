const express = require("express");
const { createMeets, upcomingMeetings, searchMeeting, deleteMeeting } = require("../controllers/zoomFeatureController");
const router = express.Router();


router.post("/create",createMeets);
router.get("/upcoming",upcomingMeetings);
router.post("/search",searchMeeting);
router.delete("/delete",deleteMeeting);

module.exports = router;
