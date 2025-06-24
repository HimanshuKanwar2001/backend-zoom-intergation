const axios = require("axios");
const { getUpcomingAllMeetings } = require("./getUpcomingMeeting");
const { refreshAccessToken } = require("./refreshToken");

exports.CheckIfSlotAvailable = async (meetingDetails, users) => {
  try {
    // console.log("INSIDE CHECKIF SLOT AVAILABLE", isoDateTime);

    if (!users || users.length === 0) {
      return { error: "Users are not present" };
    }

    let availableAccount = null;

    // Loop through all linked Zoom accounts
    for (const user of users) {
      const type = "upcoming";
      const userUpcomingMeetings = await getUpcomingAllMeetings(
        user.email,
        type,
        user
      );

      // console.log("Checking user:", user.name);
      // console.log("User's Upcoming Meetings:", userUpcomingMeetings);

      // Check if the requested time slot is already booked
      const isSlotTaken = await userUpcomingMeetings?.some((meeting) => {
        console.log(
          "meeting.start_time-----",
          meeting.start_time,
          "isoDateTime------",
          meetingDetails.start_time
        );
        return meeting.start_time === meetingDetails.isoDateTime;
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
    const accessToken = await refreshAccessToken(availableAccount);

    // Create the Zoom meeting with the available account
    const meetingResponse = await axios.post(
      `https://api.zoom.us/v2/users/${availableAccount.email}/meetings`,
      {
        topic: meetingDetails.topic || "New Meeting",
        type: 2, // Scheduled Meeting
        start_time: meetingDetails.start_time,
        duration: meetingDetails.duration,
        timezone: "Asia/Kolkata",
        password: "123456",
        allow_multiple_devices: meetingDetails.allow_multiple_devices,
        audio: "both",
        waiting_room: meetingDetails.waiting_room,
        host_video: true,
        recurrence: {
          end_date_time: meetingDetails.end_date_time,
          end_times: meetingDetails.end_times,
          monthly_day: meetingDetails.monthly_day,
          monthly_week: meetingDetails.monthly_week,
          monthly_week_day: meetingDetails.monthly_week_day,
          repeat_interval: meetingDetails.repeat_interval,
          type: meetingDetails.type ? meetingDetails.type : 1,
          weekly_days: meetingDetails.weekly_days,
          endDate: meetingDetails.endDate,
          settings: {
            approval_type: 1,
            registration_type: 2,
            join_before_host: true,
            waiting_room: true,
            allow_multiple_devices: false,
            registrant_fields: ["email", "first_name", "last_name", "phone"],
            registration_questions: [{ field_name: "phone", required: true }],
          },
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
    // console.log("Start URL:", meetingResponse.data.start_url);
    console.log("Join URL:", meetingResponse.data.join_url);
    // console.log("Registration URL:", meetingResponse.data.registration_url);

    return {
      data: meetingResponse.data,
      selectedAccount: availableAccount.selectedName,
      name: availableAccount.name,
    };
  } catch (error) {
    console.error(
      "Error creating meeting:",
      error.response?.data || error.message
    );
    return { error: "Failed to create meeting" };
  }
};
