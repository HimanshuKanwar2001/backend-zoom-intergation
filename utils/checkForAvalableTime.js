const axios = require("axios");
const { getUpcomingAllMeetings } = require("./getUpcomingMeeting");
const { refreshAccessToken } = require("./refreshToken");

exports.CheckIfSlotAvailable = async (meetingDetails, users) => {
  try {
    const meetingDate = new Date(meetingDetails.start_time);
    const meetingEnd = new Date(meetingDate.getTime() + meetingDetails.duration * 60000);

    for (const user of users) {
      const userMeetings = await getUpcomingAllMeetings(user.email, "upcoming", user);
      
      let isSlotAvailable = true;
      
      if (userMeetings?.length) {
        for (const meeting of userMeetings) {
          const existingStart = new Date(meeting.start_time);
          const existingEnd = new Date(existingStart.getTime() + meeting.duration * 60000);
          
          // Check for time overlap
          if (
            (meetingDate >= existingStart && meetingDate < existingEnd) ||
            (meetingEnd > existingStart && meetingEnd <= existingEnd) ||
            (meetingDate <= existingStart && meetingEnd >= existingEnd)
          ) {
            isSlotAvailable = false;
            break;
          }
        }
      }

      if (isSlotAvailable) {
        const accessToken = await refreshAccessToken(user);
        
        // Build recurrence payload only if type is provided
        const recurrencePayload = meetingDetails.recurrence.type ? {
          recurrence: {
            type: meetingDetails.recurrence.type,
            repeat_interval: meetingDetails.recurrence.repeat_interval,
            end_times: meetingDetails.recurrence.end_times,
            ...(meetingDetails.recurrence.type === 2 && { 
              weekly_days: meetingDetails.recurrence.weekly_days 
            }),
            ...(meetingDetails.recurrence.type === 3 && {
              ...(meetingDetails.recurrence.monthly_day 
                ? { monthly_day: meetingDetails.recurrence.monthly_day }
                : {
                    monthly_week: meetingDetails.recurrence.monthly_week,
                    monthly_week_day: meetingDetails.recurrence.monthly_week_day
                  }
              )
            })
          }
        } : {};

        const meetingPayload = {
          topic: meetingDetails.topic,
          type: 8, // Recurring meeting with fixed time
          start_time: meetingDetails.start_time,
          duration: meetingDetails.duration,
          timezone: meetingDetails.timezone,
          agenda: meetingDetails.agenda,
          settings: meetingDetails.settings,
          ...recurrencePayload
        };

        const response = await axios.post(
          `https://api.zoom.us/v2/users/${user.email}/meetings`,
          meetingPayload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        return {
          data: response.data,
          selectedAccount: user.selectedName,
          name: user.name,
        };
      }
    }

    return { error: "All Zoom accounts are busy at the requested time" };
  } catch (error) {
    console.error("Meeting creation error:", error.response?.data || error.message);
    return { 
      error: error.response?.data?.message || "Failed to create meeting",
      details: error.response?.data || error.message
    };
  }
};
