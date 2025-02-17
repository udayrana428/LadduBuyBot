const express = require("express");
const router = express.Router();
const {
  recordTransaction,
  getTransactions,
} = require("../controllers/transactionController");

router.post("/record", recordTransaction);
router.get("/list", getTransactions);

module.exports = router;
