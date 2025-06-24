const UserV2 = require("../models/UserV2");
const { CheckIfSlotAvailable } = require("../utils/checkForAvalableTime");
const keys=require("../configs/secret_keys.js");

exports.createMeets = async (req, res) => {
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
    const utcDate = new Date(start_time);
    utcDate.setHours(utcDate.getHours() - 5);
    utcDate.setMinutes(utcDate.getMinutes() - 30);

    const isoDateTime = utcDate.toISOString().slice(0, 19) + "Z";

    const meetingDetails = {
      topic,
      isoDateTime,
      start_time: isoDateTime,
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
    };
    const users = await UserV2.find();

    const isMeetCreated = await CheckIfSlotAvailable(meetingDetails, users);
    console.log("isMeetCreated", isMeetCreated);
    const hostKey = keys[isMeetCreated.selectedAccount.toUpperCase()];
    console.log("HOST KEY--------------->", hostKey.hostKey);

    res.json({
      data: isMeetCreated.data,
      hostKey: hostKey.hostKey,
      name: isMeetCreated.name,
    });
  } catch (error) {
    console.log("Error in craeteMeets controller");
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.upcomingMeetings = async (req, res) => {
  try {
  } catch (error) {
    console.log("Error in upcomingMeetings controller");
    res.status(500).json({ message: "Internal server error" });
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
  } catch (error) {
    console.log("Error in deleteMeeting controller");
    res.status(500).json({ message: "Internal server error" });
  }
};
