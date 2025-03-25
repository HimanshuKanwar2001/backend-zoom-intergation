const axios = require("axios");
// const { refreshAccessToken } = require("./refreshToken");

const { refreshAccessToken } = require("./refreshToken.js");
const User = require("../models/User.js");

// Function to fetch upcoming meetings
exports.getUpcomingMeeting = async (email, type = "upcoming", user) => {
  try {
    console.log("📌 Inside getUpcomingMeetings FUNCTION");

    // Validate user
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Generate a new access token
    console.log("user._id--->", user._id);
    const accessToken = await refreshAccessToken(user._id);
    console.log("🔑 Using access token:", accessToken.slice(0, 15), "...");

    if (!accessToken) {
      throw new Error(
        "Reauthorization required. Please reconnect your Zoom account."
      );
    }

    // Fetch upcoming meetings from Zoom API
    const response = await axios.get(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { type },
      }
    );
    console.log(`📅 Fetched ${response.data.meetings.length} meetings`);
    return response?.data.meetings || [];
  } catch (error) {
    console.error(
      "❌ Error fetching meetings:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch meetings");
  }
};

// Express route handler to get upcoming meetings
exports.getUpcomingMeetingsHandler = async (req, res) => {
  try {
    console.log("📌 Inside getUpcomingMeetingsHandler");

    // Extract email and type from request body
    const { email, type = "upcoming" } = req.body;
    console.log(`📩 Fetching meetings for: ${email}, Type: ${type}`);

    // Validate user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Fetch upcoming meetings
    const meetings = await getUpcomingMeetings(email, type, user);
    res.json(meetings);
  } catch (error) {
    console.error("❌ Error fetching meetings:", error.message);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
};
