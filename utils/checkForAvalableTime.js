// const { getUpcomingMeetinggg } = require("./getUpcomingMeeting");

// exports.CheckIfSlotAvailable = async (
//   email,
//   topic,
//   isoDateTime,
//   duration,
//   users
// ) => {
//   try {
//     if (!users) return res.status(400).json({ error: "Users are not present" });

//     users.map(async (user) => {
//       const type = "upcoming";
//       const email = user.email;

//       const userUpcomingmeetings = await getUpcomingMeetinggg(
//         email,
//         type,
//         user
//       );

//       userUpcomingmeetings?.map((meeting) => {
//         if(meeting.start_time==isoDateTime){
//           return ;
//         }
//       });

//     });

//     const meetingResponse = await axios.post(
//       "https://api.zoom.us/v2/users/me/meetings",
//       {
//         topic: topic || "New Meeting",
//         type: 2, // Scheduled Meeting
//         isoDateTime: isoDateTime || new Date().toISOString(),
//         duration: duration || 30,
//         timezone: "Asia/Kolkata",
//         settings: {
//           approval_type: 0, // No manual approval required
//           registration_type: 2, // Require registration
//           allow_multiple_devices: false, // Restrict users to a single device
//           registrant_fields: ["email", "first_name", "last_name", "phone"],
//           registration_questions: [
//             {
//               field_name: "phone",
//               required: true, // Make phone number required
//             },
//           ],
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return meetingResponse.data;
//   } catch (error) {}
// };

// const axios = require("axios");
// const { getUpcomingMeetinggg } = require("./getUpcomingMeeting");
// const { refreshAccessToken } = require("./refreshToken");

// exports.CheckIfSlotAvailable = async (
//   email,
//   topic,
//   isoDateTime,
//   duration,
//   users
// ) => {
//   try {
//     console.log("INSIDE CEHCKIF SLOT AVAILBLE");
//     console.log("INSIDE CEHCKIF SLOT AVAILBLE", isoDateTime);
//     if (!users || users.length === 0) {
//       return { error: "Users are not present" };
//     }

//     let availableAccount = null;

//     // Loop through all linked Zoom accounts
//     for (const user of users) {
//       const type = "upcoming";
//       const userUpcomingMeetings = await getUpcomingMeetinggg(
//         user.email,
//         type,
//         user
//       );

//       // Check if any existing meeting has the same start_time
//       console.log("user :", user.name);
//       console.log("userUpcomingMeetings :", userUpcomingMeetings);
//       const isSlotTaken = await userUpcomingMeetings?.some(
//         (meeting) => meeting.start_time === isoDateTime
//       );
//       console.log("isSlotTaken------>", isSlotTaken);
//       if (!isSlotTaken) {
//         availableAccount = user;
//         console.log("availableAccount", availableAccount);
//         break; // Stop checking once we find an available account
//       }
//     }

//     if (!availableAccount) {
//       return { error: "No available slots in any account" };
//     }

//     // Refresh access token
//     const accessToken = await refreshAccessToken(availableAccount._id);
//     // console.log("ACCESSTOKEN----------->", accessToken);
//     // Create the Zoom meeting with the available account
//     const meetingResponse = await axios.post(
//       `https://api.zoom.us/v2/users/${availableAccount.email}/meetings`, // Using specific user email
//       {
//         topic: topic || "New Meeting",
//         type: 2, // Scheduled Meeting
//         start_time: isoDateTime,
//         duration: duration || 30,
//         timezone: "Asia/Kolkata",
//         settings: {
//           approval_type: 0, // No manual approval required
//           registration_type: 2, // Require registration
//           allow_multiple_devices: false, // Restrict users to a single device
//           registrant_fields: ["email", "first_name", "last_name", "phone"],
//           registration_questions: [{ field_name: "phone", required: true }],
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`, // Using the correct token from the available user
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     console.log("startURL----->", meetingResponse.data.start_url);
//     console.log("JOIN URL----->", meetingResponse.data.join_url);
//     console.log(
//       "REGISTRATION URL----->",
//       meetingResponse.data.registration_url
//     );
//     return meetingResponse.data;
//   } catch (error) {
//     console.error(
//       "Error creating meeting:",
//       error.response?.data || error.message
//     );
//     return { error: "Failed to create meeting" };
//   }
// };

const axios = require("axios");
const { getUpcomingMeetinggg } = require("./getUpcomingMeeting");
const { refreshAccessToken } = require("./refreshToken");

exports.CheckIfSlotAvailable = async (topic, isoDateTime, duration, users) => {
  try {
    console.log("INSIDE CHECKIF SLOT AVAILABLE", isoDateTime);

    if (!users || users.length === 0) {
      return { error: "Users are not present" };
    }

    let availableAccount = null;

    // Loop through all linked Zoom accounts
    for (const user of users) {
      const type = "upcoming";
      const userUpcomingMeetings = await getUpcomingMeetinggg(
        user.email,
        type,
        user
      );

      console.log("Checking user:", user.name);
      console.log("User's Upcoming Meetings:", userUpcomingMeetings);

      // Check if the requested time slot is already booked
      const isSlotTaken = await userUpcomingMeetings?.some((meeting) => {
        console.log(
          "meeting.start_time-----",
          meeting.start_time,
          "isoDateTime------",
          isoDateTime
        );
        return meeting.start_time === isoDateTime;
      });

      console.log(`isSlotTaken for ${user.email} --->`, isSlotTaken);

      if (!isSlotTaken) {
        availableAccount = user;
        console.log("Selected available account:", availableAccount.name);
        break; // Stop checking once we find an available account
      }
    }

    if (!availableAccount) {
      return { error: "No available slots in any account" };
    }

    // Refresh access token for the available account
    const accessToken = await refreshAccessToken(availableAccount._id);

    // Create the Zoom meeting with the available account
    const meetingResponse = await axios.post(
      `https://api.zoom.us/v2/users/${availableAccount.email}/meetings`,
      {
        topic: topic || "New Meeting",
        type: 2, // Scheduled Meeting
        start_time: isoDateTime,
        duration: duration || 30,
        timezone: "Asia/Kolkata",
        password: "123456",
        settings: {
          approval_type: 0,
          registration_type: 2,
          allow_multiple_devices: false,
          registrant_fields: ["email", "first_name", "last_name", "phone"],
          registration_questions: [{ field_name: "phone", required: true }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Meeting Created:");
    console.log("Start URL:", meetingResponse.data.start_url);
    console.log("Join URL:", meetingResponse.data.join_url);
    console.log("Registration URL:", meetingResponse.data.registration_url);

    return meetingResponse.data;
  } catch (error) {
    console.error(
      "Error creating meeting:",
      error.response?.data || error.message
    );
    return { error: "Failed to create meeting" };
  }
};
