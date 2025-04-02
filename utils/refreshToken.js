const { default: axios } = require("axios");
const User = require("../models/User");

exports.refreshAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log(" refresh Token  user", user);
    // console.log("USER------->", user.name);
    if (!user) throw new Error("❌ User not found in database");

    const {
      refreshToken,
      tokenExpiresAt,
      zoomId,
      zoomClientID,
      zoomClientSecret,
    } = user;
    // console.log(`refreshToken ${refreshToken},
    //   tokenExpiresAt ${tokenExpiresAt},
    //   zoomId ${zoomId},
    //   zoomClientID ${zoomClientID},
    //   zoomClientSecret ${zoomClientSecret},
    //     `);
    if (!refreshToken)
      throw new Error("❌ No refresh token available for user");

    if (new Date() < tokenExpiresAt) {
      // console.log("✅ Access token is still valid. No refresh needed.");
      return user.accessToken;
    }

    if (!zoomClientID || !zoomClientSecret) {
      throw new Error("❌ Missing Zoom Client ID or Secret in database");
    }

    console.log(
      `🔄 Refreshing Zoom token for user: ${userId} (Zoom ID: ${zoomId})`
    );

    // console.log("refreshToken--->", refreshToken);
    console.log("refreshToken--->", zoomClientID, zoomClientSecret);
    // ✅ Make request to Zoom OAuth API for refreshing token
    // Make request to Zoom OAuth API for refreshing token
    const response = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${zoomClientID}:${zoomClientSecret}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("✅ Zoom token refreshed successfully:", response.data);

    // ✅ Update user with new tokens BEFORE returning access token
    user.accessToken = response.data.access_token;
    user.refreshToken = response.data.refresh_token; // 🚀 SAVE NEW REFRESH TOKEN
    user.tokenExpiresAt = new Date(
      Date.now() + response.data.expires_in * 1000
    );
    await user.save(); // 🛑 Ensure token is saved before using

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
      return null; // User must reauthorize
    }

    throw error;
  }
};
