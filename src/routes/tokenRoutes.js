const express = require("express");
const router = express.Router();
const { createToken, getTokens } = require("../controllers/tokenController");

router.post("/create", createToken);
router.get("/list", getTokens);

module.exports = router;
