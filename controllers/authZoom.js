const { default: axios } = require("axios");
const keys = require("../configs/secret_keys");
const dotenv = require("dotenv");
const UserV2 = require("../models/UserV2");
dotenv.config();

exports.authZoomAccountV2 = (req, res) => {
  const { account } = req.query;

  if (!account) {
    return res.status(400).json({ message: "Missing Zoom account " });
  }

  const creds = keys[account.toUpperCase()];
  console.log(creds);
  if (!creds) {
    return res.status(400).json({ message: "Invalid Zoom account" });
  }

  const redirectUri = encodeURIComponent(process.env.REDIRECT_URL);

  //   http://localhost:5000/api/v1/auth/zoom/callback

  //   const redirectUri = encodeURIComponent(
  //     "http://localhost:5000/api/v1/auth/zoom/callback"
  //   );
  //   const state = encodeURIComponent(`${account}`);

  const zoomAuthURL = `https://zoom.us/oauth/authorize?response_type=code&client_id=${
    creds.clientID
  }&redirect_uri=${redirectUri}&state=${encodeURIComponent(account)}`;

  //https://zoom.us/oauth/authorize?response_type=code&client_id=Dh5FclhmRgqjrQWvXypcA&redirect_uri=http://localhost:5000/auth/zoom/callback

  //   https://zoom.us/oauth/authorize?response_type=code&client_id=Dh5FclhmRgqjrQWvXypcA&redirect_uri=http://localhost:5000/auth/zoom/callback

  res.redirect(zoomAuthURL);
};

exports.authZoomCallbackV2 = async (req, res) => {
  const { code, state } = req.query;

  //   console.log("code", code);
  console.log("state", req.query);
  if (!code || !state) {
    return res
      .status(400)
      .json({ message: "Missing authorization code and state" });
  }

  const urldata = decodeURIComponent(code);
  //   console.log("urldata", urldata);
  //   console.log("account", account, email);
  const creds = keys[state.toUpperCase()];
  //   console.log("creds", creds);

  if (!creds) {
    return res.status(400).json({ message: "Invalid account in callback" });
  }

  try {
    // 1. Exchange code for tokens
    const authHeader = Buffer.from(
      `${creds.clientID}:${creds.clientSecret}`
    ).toString("base64");

    const redirectURI = process.env.REDIRECT_URL;

    const tokenResponse = await axios.post(
      "https://zoom.us/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectURI,
      }),
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    // console.log("tokenResponse.data", tokenResponse.data);
    const { access_token, refresh_token } = tokenResponse.data;
    console.log("ACCESS OTKEN  ", access_token);
    console.log("REFESH TOKEN", refresh_token);
    // 2. Get Zoom user info
    const zoomUser = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("zoomUser", zoomUser);
    const { id, email: zoomEmail, first_name, last_name } = zoomUser.data;
    // 3. Store or update user in DB
    let user = await UserV2.findOne({ zoomId: id });
    if (!user) {
      user = await UserV2.create({
        zoomId: id,
        selectedName: state.toUpperCase(),
        name: `${first_name} ${last_name}`,
        email: zoomEmail || email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        zoomClientID: creds.clientID,
        zoomClientSecret: creds.clientSecret,
      });
    } else {
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
      user.tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
      user.zoomClientID = creds.clientID;
      user.zoomClientSecret = creds.clientSecret;
      user.selectedName = account.toUpperCase();
      await user.save();
    }
    return res.status(200).json({
      message: "Zoom account linked successfully",
      data: tokenResponse.data,
      newData: zoomUser.data,
    });
  } catch (error) {
    console.error("Zoom Callback Error:", error.message); // clean error message
    // console.error("Zoom Callback Response:", error.response?.data); // API response body

    return res.status(500).json({ message: "Zoom authentication failed" });
  }
};
