const axios = require("axios");
const User = require("../models/User.js");
// const { refreshAccessToken } = require("../utils/refreshToken.js");
const { refreshAccessToken } = require("../utils/refreshToken.js");
const { getUpcomingMeetinggg } = require("../utils/getUpcomingMeeting.js");
const keys = require("../configs/secret_keys.js");
const { refreshZoomToken } = require("./authController.js");
const { CheckIfSlotAvailable } = require("../utils/checkForAvalableTime.js");
const moment = require("moment-timezone");

exports.createMeeting = async (req, res) => {
  try {
    const { topic, start_time, duration } = req.body;

    

    // Convert local time to UTC correctly (SUBTRACT the offset)
    // const utcDate = new Date(localDate.getTime() - IST_OFFSET);
    const utcDate = new Date(start_time);

    // Format the date in Zoom's required format (ISO string without milliseconds)
    const isoDateTime = utcDate.toISOString().slice(0, 19) + "Z";

    console.log("Corrected ISO DateTime for Zoom:", isoDateTime);

    console.log("ISODATETIME------>", isoDateTime);
    // Validate user
    const user = await User.find();
    if (!user) return res.status(401).json({ error: "User not authenticated" });

    // Refresh access token
    // const accessToken = await refreshAccessToken(user._id);

    // Create Zoom meeting
    const isMeetCreated = await CheckIfSlotAvailable(
      
      topic,
      isoDateTime,
      duration,
      user
    );

    // // Fetch host key
    // const { host_id } = meetingResponse.data;
    // const userResponse = await axios.get(
    //   `https://api.zoom.us/v2/users/${host_id}`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${accessToken}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

    // {
    //   start_time:meetingResponse?.data.start_time||[],
    //   registrant_link: meetingResponse?.data.registration_url || [],
    //   start_link: meetingResponse?.data.start_url || [],
    //   join_link: meetingResponse?.data.join_url || [],
    // }

    res.json({
      isMeetCreated,

      // start_time: isMeetCreated?.data.start_time || [],
      // registrant_link: isMeetCreated?.registration_url || [],
      // contact_name: isMeetCreated?.settings.contact_name || [],
      // contact_email: isMeetCreated?.settings.contact_email || [],
      // start_link: isMeetCreated?.start_url || [],
      // join_link: isMeetCreated?.join_url || [],
    });
    // res.json({
    //   meeting: meetingResponse.data,
    //   hostKey: userResponse.data.host_key,
    // });
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
    const {  type = "upcoming" } = req.body;
    // console.log(`📩 Fetching meetings for: ${email}, Type: ${type}`);

    // ✅ Validate user
    const user = await User.find();
    if (!user) return res.status(401).json({ error: "User not authenticated" });

    // ✅ Get a fresh access token
    // const accessToken = await refreshZoomToken(user._id);
    // const accessToken = await refreshAccessToken(user._id);

    // if (!accessToken) {
    //   return res.status(401).json({
    //     error: "Reauthorization required. Please reconnect your Zoom account.",
    //   });
    // }

    // console.log(
    //   "🔑 Using access token kadkajsdkaj:",
    //   accessToken.slice(0, 15),
    //   "..."
    // );

    // ✅ Fetch upcoming meetings from Zoom API
    // let newResponse = getUpcomingMeetingggg(email, (type = "upcoming"), user);
    // ✅ Fetch upcoming meetings using the helper function
    const meetings = await getUpcomingMeetinggg(email, type, user);
    // const response = await axios.get(
    //   "https://api.zoom.us/v2/users/me/meetings",
    //   {
    //     headers: { Authorization: `Bearer ${accessToken}` },
    //     params: { type },
    //   }
    // );

    // console.log(`📅 Fetched ${newResponse.length} meetings`);
    // res.json(newResponse);

    console.log(`📅 Fetched ${meetings.length} meetings`);
    res.json(meetings);
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
