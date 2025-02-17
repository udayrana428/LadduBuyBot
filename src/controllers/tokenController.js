const Token = require("../models/Token");

const createToken = async (req, res) => {
  try {
    const { address, name, symbol, chain } = req.body;

    const existingToken = await Token.findOne({ address });
    if (existingToken) {
      return res.status(400).json({ message: "Token already exists." });
    }

    const token = new Token({ address, name, symbol, chain });
    await token.save();

    res.status(201).json({ message: "Token created successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getTokens = async (req, res) => {
  try {
    const tokens = await Token.find();
    res.status(200).json({ tokens });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { createToken, getTokens };
