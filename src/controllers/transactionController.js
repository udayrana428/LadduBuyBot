const Transaction = require("../models/Transaction");

const recordTransaction = async (req, res) => {
  try {
    const { token, group, txHash, buyer, amount, value, type } = req.body;

    const existingTx = await Transaction.findOne({ txHash });
    if (existingTx) {
      return res.status(400).json({ message: "Transaction already recorded." });
    }

    const transaction = new Transaction({
      token,
      group,
      txHash,
      buyer,
      amount,
      value,
      type,
    });
    await transaction.save();

    res
      .status(201)
      .json({ message: "Transaction recorded successfully", transaction });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate("token group");
    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { recordTransaction, getTransactions };
