const express = require("express");
const router = express.Router();

router.post("/create");
router.get("/upcoming");
router.post("/search");
router.post("/delete");

module.exports = router;
