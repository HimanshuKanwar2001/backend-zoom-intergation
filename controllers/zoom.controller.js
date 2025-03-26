const axios = require("axios");
const User = require("../models/User.js");

const { getUpcomingMeeting } = require("../utils/getUpcomingMeeting.js");
const keys = require("../configs/secret_keys.js");
const { refreshZoomToken, selectZoomAccount } = require("./authController.js");
const { CheckIfSlotAvailable } = require("../utils/checkForAvalableTime.js");
const moment = require("moment-timezone");
const { refreshAccessToken } = require("../utils/refreshToken.js");

exports.createMeeting = async (req, res) => {
  try {
    const {
      topic,
      start_time,
      duration,
      allow_multiple_devices,
      audio,
      waiting_room,
      recurr_end_date_time,
      recurr_end_times,
      recurr_monthly_day,
      recurr_monthly_week,
      recurr_monthly_week_day,
      recurr_repeat_interval,
      recurr_weekly_days,
    } = req.body;

    const utcDate = new Date(start_time);

    // Subtract 5 hours and 30 minutes
    utcDate.setHours(utcDate.getHours() - 5);
    utcDate.setMinutes(utcDate.getMinutes() - 30);

    // Format the date in Zoom's required format (ISO string without milliseconds)
    const isoDateTime = utcDate.toISOString().slice(0, 19) + "Z";

    console.log(isoDateTime); // Output: "2024-03-25T04:30:00Z"

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
      allow_multiple_devices,
      audio,
      waiting_room,
      recurr_end_date_time,
      recurr_end_times,
      recurr_monthly_day,
      recurr_monthly_week,
      recurr_monthly_week_day,
      recurr_repeat_interval,
      recurr_weekly_days,
      user
    );
    console.log("isMeetCreated", isMeetCreated);
    console.log(
      "isMeetCreated.selectZoomAccount------>",
      isMeetCreated.selectedAccount.toUpperCase()
    );

    const hostKey = keys[isMeetCreated.selectedAccount.toUpperCase()];
    console.log("HOST KEY--------------->", hostKey.hostKey);
    res.json({
      data: isMeetCreated.data,
      hostKey: hostKey.hostKey,
      name: isMeetCreated.name,
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
    const { type = "upcoming" } = req.body;

    // ✅ Validate user
    const users = await User.find();
    // console.log("Users--->", users);

    if (!users.length) return res.status(401).json({ error: "No users found" });

    const meetingsMap = [];

    for (const user of users) {
      const meetings = await getUpcomingMeeting(user.email, type, user); // ✅ Fixed function name
      // console.log("Users--->", meetings);
      meetingsMap.push({ userName: user.name, meetings });
    }

    // console.log("📅 Fetched meetings:", meetingsMap);
    res.json(meetingsMap);
  } catch (error) {
    console.error("❌ Error fetching meetings:", error.message);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
};

// Function to search meetings across multiple accounts
exports.searchMeetings = async (req, res) => {
  try {
    const { searchQuery } = req.body;
    if (!searchQuery) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Fetch all stored Zoom accounts
    const accounts = await User.find();
    if (!accounts.length) {
      return res.status(404).json({ message: "No Zoom accounts found" });
    }

    let results = [];

    // Iterate through each account and fetch meetings
    for (const account of accounts) {
      const accessToken = await refreshAccessToken(account._id);
      if (!accessToken) {
        console.warn(
          `⚠️ Skipping account ${account.email}, reauthorization needed.`
        );
        continue;
      }

      const response = await axios.get(
        "https://api.zoom.us/v2/users/me/meetings",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { type: "upcoming" },
        }
      );

      const filteredMeetings = response.data.meetings.filter((meeting) =>
        meeting.topic.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Add account info to results
      filteredMeetings.forEach((meeting) => {
        results.push({
          meetingId: meeting.id,
          topic: meeting.topic,
          startTime: meeting.start_time,
          accountEmail: account.email,
        });
      });
    }

    res.json({ results });
  } catch (error) {
    console.error(
      "❌ Error searching meetings:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Failed to search meetings" });
  }
};
