const axios = require("axios");
const {
  getUpcomingMeetinggg,
  getUpcomingMeeting,
} = require("./getUpcomingMeeting");
const { refreshAccessToken } = require("./refreshToken");

exports.CheckIfSlotAvailable = async (
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
  users
) => {
  try {
    console.log("INSIDE CHECKIF SLOT AVAILABLE", isoDateTime);

    if (!users || users.length === 0) {
      return { error: "Users are not present" };
    }

    let availableAccount = null;

    // Loop through all linked Zoom accounts
    for (const user of users) {
      const type = "upcoming";
      const userUpcomingMeetings = await getUpcomingMeeting(
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
        duration: duration,
        timezone: "Asia/Kolkata",
        password: "123456",
        allow_multiple_devices: allow_multiple_devices,
        audio: "both",
        waiting_room: waiting_room,
        host_video: true,
        recurrence: {
          end_date_time: recurr_end_date_time,
          end_times: recurr_end_times,
          monthly_day: recurr_monthly_day,
          monthly_week: recurr_monthly_week,
          monthly_week_day: recurr_monthly_week_day,
          repeat_interval: recurr_repeat_interval,
          type: 1,
          weekly_days: recurr_weekly_days,
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
    console.log("Start URL:", meetingResponse.data.start_url);
    console.log("Join URL:", meetingResponse.data.join_url);
    console.log("Registration URL:", meetingResponse.data.registration_url);

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
