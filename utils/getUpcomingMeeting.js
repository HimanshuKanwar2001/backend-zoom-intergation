const axios = require("axios");
// const { refreshAccessToken } = require("./refreshToken");

const { refreshAccessToken } = require("./refreshToken.js");
const User = require("../models/User.js");

// Function to fetch upcoming meetings

exports.getUpcomingAllMeetings = async (
  email,
  meetingType = "upcoming",
  user
) => {
  try {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const accessToken = await refreshAccessToken(user);
    if (!accessToken) {
      throw new Error("Reauthorization required.");
    }

    const { data } = await axios.get(
      `https://api.zoom.us/v2/users/me/meetings?type=${meetingType}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const baseMeetings = data?.meetings || [];

    // Step 1: Get meeting details for recurring meetings (type === 8)
    const enrichedMeetings = await Promise.all(
      baseMeetings.map(async (meeting) => {
        if (meeting.type === 8) {
          try {
            const { data: details } = await axios.get(
              `https://api.zoom.us/v2/meetings/${meeting.id}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            const match = details.occurrences?.find(
              (occ) =>
                new Date(occ.start_time).toISOString() ===
                new Date(meeting.start_time).toISOString()
            );

            return {
              ...meeting,
              occurrence_id: match?.occurrence_id || null,
            };
          } catch (err) {
            console.warn(
              `❌ Could not fetch details for meeting ${meeting.id}`
            );
            return { ...meeting, occurrence_id: null };
          }
        } else {
          return { ...meeting, occurrence_id: null };
        }
      })
    );

    // console.log(enrichedMeetings);
    return enrichedMeetings;
  } catch (error) {
    throw new Error(
      `Error fetching meetings: ${error.response?.data || error.message}`
    );
  }
};

// Express route handler to get upcoming meetings
// exports.getUpcomingMeetingsHandler = async (req, res) => {
//   try {
//     // console.log("📌 Inside getUpcomingMeetingsHandler");

//     // Extract email and type from request body
//     const { email, type = "upcoming" } = req.body;
//     console.log(`📩 Fetching meetings for: ${email}, Type: ${type}`);

//     // Validate user
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ error: "User not authenticated" });
//     }

//     // Fetch upcoming meetings
//     const meetings = await getUpcomingMeetings(email, type, user);
//     res.json(meetings);
//   } catch (error) {
//     console.error("❌ Error fetching meetings:", error.message);
//     res.status(500).json({ error: "Failed to fetch meetings" });
//   }
// };
