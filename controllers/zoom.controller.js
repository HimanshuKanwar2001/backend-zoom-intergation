const axios = require("axios");
const User = require("../models/User.js");

const { getUpcomingMeeting } = require("../utils/getUpcomingMeeting.js");
const keys = require("../configs/secret_keys.js");
const { refreshZoomToken } = require("./authController.js");
const { CheckIfSlotAvailable } = require("../utils/checkForAvalableTime.js");
const moment = require("moment-timezone");

exports.createMeeting = async (req, res) => {
  try {
    const { topic, start_time, duration,allow_multiple_devices,audio,waiting_room, recurr_end_date_time,recurr_end_times,recurr_monthly_day,recurr_monthly_week,recurr_monthly_week_day,recurr_repeat_interval,recurr_weekly_days} = req.body;

    const utcDate = new Date(start_time);

    // Format the date in Zoom's required format (ISO string without milliseconds)
    const isoDateTime = utcDate.toISOString().slice(0, 19) + "Z";

    console.log("Corrected ISO DateTime for Zoom:", isoDateTime);

    console.log("ISODATETIME------>", isoDateTime);
    // Validate user
    const user = await User.find();
    if (!user) return res.status(401).json({ error: "User not authenticated" });

    // Create Zoom meeting
    const isMeetCreated = await CheckIfSlotAvailable(
      topic,
      isoDateTime,
      duration,
      allow_multiple_devices,audio,waiting_room, recurr_end_date_time,recurr_end_times,recurr_monthly_day,recurr_monthly_week,recurr_monthly_week_day,recurr_repeat_interval,recurr_weekly_days,
      user
    );

    res.json({
      isMeetCreated,
    });
  } catch (error) {
    console.error(
      "Error creating meeting:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to create meeting" });
  }
};

exports.getUpcomingMeetings = async (req, res) => {
  try {
    console.log("📌 Inside getUpcomingMeetings");

    // ✅ Extract email & type from query (dynamic usage)
    const { type = "upcoming" } = req.query;

    // ✅ Validate user
    const users = await User.find();
    if (!users.length) return res.status(401).json({ error: "No users found" });

    const meetingsMap = [];

    for (const user of users) {
      const meetings = await getUpcomingMeeting(user.email, type, user); // ✅ Fixed function name
      meetingsMap.push({ userName: user.name, meetings });
    }

    console.log("📅 Fetched meetings:", meetingsMap);
    res.json(meetingsMap);
  } catch (error) {
    console.error("❌ Error fetching meetings:", error.message);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
};

// exports.getRefreshTokenAndAccessToken = (req, res) => {
//   try {
//     const account = req.params.account
//       ? req.params.account.toUpperCase()
//       : null;
//     if (!account)
//       return res.status(400).json({ message: "Account parameter missing" });

//     const selectedAccount = keys[account];
//     console.log("selectedAccount", selectedAccount);
//     if (!selectedAccount) {
//       return res
//         .status(400)
//         .json({ message: "Invalid Zoom account selection" });
//     }

//     // Store selected account credentials in session
//     req.session.zoomClient = {
//       clientID: selectedAccount.clientID,
//       clientSecret: selectedAccount.clientSecret,
//     };
//     const redirectUri = encodeURIComponent(
//       "http://localhost:5000/auth/zoom/callback"
//     );
//     res.redirect(
//       `https://zoom.us/oauth/authorize?client_id=${selectedAccount.clientID}&response_type=code&redirect_uri=${redirectUri}`
//     );

//     // res.json({ message: "Zoom account selected successfully!" });
//   } catch (error) {
//     console.log("Error:", error);
//     res.status(500).json({ message: "Error selecting Zoom account", error });
//   }
// };
