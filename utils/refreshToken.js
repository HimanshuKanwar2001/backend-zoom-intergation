const { default: axios } = require("axios");
const User = require("../models/User");

exports.refreshAccessToken = async (user) => {
  try {
    if (!user) throw new Error("❌ User not found in database");

    const { refreshToken, zoomClientID, zoomClientSecret } = user;

    if (!refreshToken)
      throw new Error("❌ No refresh token available for user");

    if (!zoomClientID || !zoomClientSecret) {
      throw new Error("❌ Missing Zoom Client ID or Secret in database");
    }

    console.log(`🔄 Refreshing Zoom token for user: ${user._id}`);

    const response = await axios.post(
      "https://zoom.us/oauth/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${zoomClientID}:${zoomClientSecret}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // console.log("✅ Zoom token refreshed successfully:", response.data);

    user.set({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenExpiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    });
    await user.save({ validateBeforeSave: false });

    return user.accessToken;
  } catch (error) {
    console.error(
      "❌ Error refreshing Zoom token:",
      error.response?.data || error.message
    );

    if (error.response?.data?.reason === "invalid_grant") {
      console.warn(
        "⚠️ Refresh token is invalid or expired. User needs to reauthorize."
      );
      return null;
    }

    throw error;
  }
};
