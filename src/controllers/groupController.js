const Group = require("../models/Group");

const createGroup = async (req, res) => {
  try {
    const { groupId, title, owner } = req.body;

    const existingGroup = await Group.findOne({ groupId });
    if (existingGroup) {
      return res.status(400).json({ message: "Group already exists." });
    }

    const group = new Group({ groupId, title, owner });
    await group.save();

    res.status(201).json({ message: "Group created successfully", group });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const addAdmin = async (req, res) => {
  try {
    const { groupId, adminId } = req.body;

    const group = await Group.findOne({ groupId });
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.admins.includes(adminId)) {
      group.admins.push(adminId);
      await group.save();
    }

    res.status(200).json({ message: "Admin added successfully", group });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const addTokenToGroup = async (req, res) => {
  try {
    const { groupId, tokenId, settings } = req.body;

    const group = await Group.findOne({ groupId });
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.tokens.push({ token: tokenId, settings });
    await group.save();

    res.status(200).json({ message: "Token added successfully", group });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { createGroup, addAdmin, addTokenToGroup };
