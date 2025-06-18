const express = require("express");
const { authZoomAccountV2, authZoomCallbackV2 } = require("../controllers/authZoom");
const router = express.Router();

router.get("/zoom/login", authZoomAccountV2); // ?account=RATNAM&email=abc@gmail.com
router.get("/zoom/callback", authZoomCallbackV2);

module.exports = router;
