const express = require("express");
const router = express.Router();
const {
  createGroup,
  addAdmin,
  addTokenToGroup,
} = require("../controllers/groupController");

router.post("/create", createGroup);
router.put("/add-admin", addAdmin);
router.put("/add-token", addTokenToGroup);

module.exports = router;
