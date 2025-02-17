const express = require("express");
const router = express.Router();

const groupRoutes = require("./groupRoutes");
const tokenRoutes = require("./tokenRoutes");
const transactionRoutes = require("./transactionRoutes");
const userRoutes = require("./userRoutes");

router.use("/groups", groupRoutes);
router.use("/tokens", tokenRoutes);
router.use("/transactions", transactionRoutes);
router.use("/users", userRoutes);

module.exports = router;
