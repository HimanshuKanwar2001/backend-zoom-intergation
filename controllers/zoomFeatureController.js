const UserV2 = require("../models/UserV2");
const { CheckIfSlotAvailable } = require("../utils/checkForAvalableTime");
const keys = require("../configs/secret_keys.js");
const { getUpcomingAllMeetings } = require("../utils/getUpcomingMeeting.js");
const { refreshAccessToken } = require("../utils/refreshToken.js");
const { default: axios } = require("axios");

exports.createMeets = async (req, res) => {
  try {
    const {
      topic,
      agenda,
      start_time,
      timezone,
      duration,
      recurrence,
      settings,
    } = req.body;

    // Validate required fields
    if (!topic || !start_time || !duration) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Convert to proper ISO format (UTC)
    const isoDateTime = new Date(start_time).toISOString();

    const meetingDetails = {
      topic,
      agenda: agenda || "",
      start_time: isoDateTime,
      timezone: timezone || "Asia/Kolkata",
      duration: parseInt(duration),
      recurrence: {
        type: recurrence?.type || 2, // Default to weekly
        repeat_interval: recurrence?.repeat_interval || 1,
        end_times: recurrence?.end_times || 5,
        weekly_days: recurrence?.weekly_days,
        monthly_day: recurrence?.monthly_day,
        monthly_week: recurrence?.monthly_week,
        monthly_week_day: recurrence?.monthly_week_day,
      },
      settings: {
        join_before_host: true,
        approval_type: 1,
        registration_type: 2,
        waiting_room: true,
        ...settings,
      },
    };

    const users = await UserV2.find();
    if (!users.length) {
      return res.status(400).json({ message: "No Zoom accounts available" });
    }

    const meetingResult = await CheckIfSlotAvailable(meetingDetails, users);

    if (meetingResult.error) {
      return res.status(400).json({ message: meetingResult.error });
    }

    const hostKey =
      keys[meetingResult.selectedAccount?.toUpperCase()]?.hostKey || "";
    // console.log("meetingResult.data", meetingResult.data);
    res.json({
      data: meetingResult.data,
      hostKey: hostKey,
      name: meetingResult.name,
    });
  } catch (error) {
    console.error("Error in createMeets controller:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.upcomingMeetings = async (req, res) => {
  try {
    const { type = "upcoming" } = req.body;

    // Fetch users from the new UserV2 model
    const users = await UserV2.find();

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No Zoom accounts available",
      });
    }

    // Fetch meetings for all users in parallel
    const meetingsData = await Promise.all(
      users.map(async (user) => {
        try {
          const meetings = await getUpcomingAllMeetings(user.email, type, user);
          return {
            success: true,
            userName: user.name,
            userEmail: user.email,
            accountType: user.accountType,
            meetings: meetings || [],
          };
        } catch (error) {
          console.error(
            `Error fetching meetings for ${user.email}:`,
            error.message
          );
          return {
            success: false,
            userName: user.name,
            userEmail: user.email,
            error: "Failed to fetch meetings",
            details: error.message,
          };
        }
      })
    );
    console.log("meetingsData", meetingsData[0].meetings);

    res.status(200).json({
      success: true,
      count: meetingsData.length,
      data: meetingsData,
    });
  } catch (error) {
    console.error("Error in upcomingMeetings controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.searchMeeting = async (req, res) => {
  try {
  } catch (error) {
    console.log("Error in searchMeeting controller");
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { id, host_id, occurrence_id } = req.body;
    // Include occurrence_id in Zoom DELETE URL if present

    if (!id || !host_id) {
      return res.status(400).json({ message: "Missing meeting ID or host ID" });
    }

    console.log("🗑 Deleting meeting ID:", id, "for host:", host_id);

    const account = await UserV2.findOne({ zoomId: host_id });
    // console.log("account", account);
    if (!account) {
      return res
        .status(404)
        .json({ message: "Zoom account not found for given host_id" });
    }

    const accessToken = await refreshAccessToken(account);

    // console.log("accessToken", accessToken);
    if (!accessToken) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Unable to refresh access token" });
    }

    await axios.delete(
      `https://api.zoom.us/v2/meetings/${id}${
        occurrence_id ? `?occurrence_id=${occurrence_id}` : ""
      }`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Zoom meeting deleted successfully");
    res.status(200).json({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("❌ Error in deleteMeeting Controller:", error.message);

    res.status(500).json({
      message: "Internal Server Error",
      error: error.response?.data || error.message,
    });
  }
};
