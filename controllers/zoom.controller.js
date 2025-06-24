const axios = require("axios");
const User = require("../models/User.js");

const { getUpcomingAllMeetings } = require("../utils/getUpcomingMeeting.js");
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
      durationHour,
      durationMinute,
      allow_multiple_devices,
      audio,
      waiting_room,
      recurrenceType,
      repeatEvery,
      end_date_time,
      end_times,
      monthly_day,
      monthly_week,
      monthly_week_day,
      repeat_interval,
      type,
      weekly_days,
      endDate,
    } = req.body;
    const duration = Number(durationHour * 60) + Number(durationMinute);
    // console.log("DURANTION-------------->", duration);
    const utcDate = new Date(start_time);

    // Subtract 5 hours and 30 minutes
    utcDate.setHours(utcDate.getHours() - 5);
    utcDate.setMinutes(utcDate.getMinutes() - 30);

    // Format the date in Zoom's required format (ISO string without milliseconds)
    const isoDateTime = utcDate.toISOString().slice(0, 19) + "Z";

    // console.log(isoDateTime); // Output: "2024-03-25T04:30:00Z"

    // console.log("Corrected ISO DateTime for Zoom:", isoDateTime);

    // console.log("ISODATETIME------>", isoDateTime);
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
      recurrenceType,
      repeatEvery,
      end_date_time,
      end_times,
      monthly_day,
      monthly_week,
      monthly_week_day,
      repeat_interval,
      type,
      weekly_days,
      endDate,
      user
    );
    // console.log("isMeetCreated", isMeetCreated);
    // console.log(
    //   "isMeetCreated.selectZoomAccount------>",
    //   isMeetCreated.selectedAccount.toUpperCase()
    // );

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
    // console.log("📌 Inside getUpcomingMeetings");

    // ✅ Extract email & type from query (dynamic usage)
    const { type = "upcoming" } = req.body;

    // ✅ Validate user
    const users = await User.find();
    // console.log("Users--->", users);

    if (!users.length) return res.status(401).json({ error: "No users found" });

    // ✅ Use Promise.all to fetch meetings for all users in parallel
    const meetingsMap = await Promise.all(
      users.map(async (user) => {
        try {
          const meetings = await getUpcomingAllMeetings(user.email, type, user);
          return { userName: user.name, meetings };
        } catch (error) {
          console.error(
            `❌ Error fetching meetings for ${user.email}:`,
            error.message
          );
          return { userName: user.name, error: "Failed to fetch meetings" };
        }
      })
    );

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

exports.deleteMeeting = async (req, res) => {
  try {
    const { id, host_id } = req.body;
    console.log("id", id, "HostID ", host_id);
    const account = await User.findOne({ zoomId: host_id });
    // console.log("account", account._id);
    const accessToken = await refreshAccessToken(account._id);
    // console.log("ACCESSTOKEN", accessToken);
    if (!accessToken) {
      console.warn(`⚠️ accessToken not valid`);
    }

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized: No access token" });
    }

    const options = {
      method: "DELETE",
      url: `https://api.zoom.us/v2/meetings/${id}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };

    await axios.request(options);

    res.status(200).json({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMeeting Controller:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.response?.data || error.message,
    });
  }
};
