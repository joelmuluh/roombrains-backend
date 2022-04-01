import { Router } from "express";
import Conversations from "../models/Conversation.js";
import RoomMessage from "../models/RoomMessage.js";
import PrivateMessage from "../models/PrivateMessage.js";
import { authRequest } from "../utils/tokenFunctions.js";
export const router = Router();

//Get all the chats made with a particular person
router.get("/private/:friendId", authRequest, async (req, res) => {
  const { _id } = req.user;
  const friendId = req.params.friendId;
  try {
    const conversation = await Conversations.findOne({
      members: { $all: [_id, friendId] },
    });
    if (conversation) {
      const messages = await PrivateMessage.find({
        conversationId: conversation._id,
      });
      res.json({ messages, conversationId: conversation._id });
    } else {
      const conversation = await Conversations.create({
        members: [_id, friendId],
      });
      res.json({ messages: [], conversationId: conversation._id });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Send a private message to a particular person(Conversation)
router.post("/private", authRequest, async (req, res) => {
  const { senderId, conversationId, message } = req.body;
  try {
    const myMessage = await PrivateMessage.create({
      senderId,
      conversationId,
      message,
    });
    res.json(myMessage);
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Delete a particular private message
router.delete("/private/:messageId", authRequest, async (req, res) => {
  const messageId = req.params.messageId;
  try {
    await PrivateMessage.findByIdAndDelete(messageId);
    res.send({ success: true });
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Get all the messages of a particular room
router.get("/room/:conversationId", authRequest, async (req, res) => {
  const limit = 30;
  const page = parseInt(req.query.page) || 1;
  const conversationId = req.params.conversationId;
  try {
    const totalDocuments = await RoomMessage.countDocuments({ conversationId });
    const totalPages = Math.ceil(totalDocuments / limit);

    const messages = await RoomMessage.find({
      conversationId,
    })
      .limit(limit)
      .sort({ createdAt: "desc" })
      .skip((page - 1) * limit);
    return res.json({
      messages,
      conversationId,
      lastPage: false,
      backToFirst: false,
      totalPages,
      limit,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Send a message to a particular Room
router.post("/room", authRequest, async (req, res) => {
  const { senderId, conversationId, message, senderName, senderImage } =
    req.body;
  try {
    const myMessage = await RoomMessage.create({
      senderId,
      conversationId,
      message,
      senderName,
      senderImage,
    });
    res.json(myMessage);
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Delete a particular Room message
router.delete("/room/:messageId", authRequest, async (req, res) => {
  const messageId = req.params.messageId;
  try {
    await RoomMessage.findByIdAndDelete(messageId);
    res.send({ success: true });
  } catch (error) {
    res.json({ error: error.message });
  }
});
