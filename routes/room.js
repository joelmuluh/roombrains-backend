import axios from "axios";
import { Router } from "express";
import { v4 } from "uuid";
import Conversations from "../models/Conversation.js";
import RoomMessage from "../models/RoomMessage.js";
import Room from "../models/Rooms.js";
import Users from "../models/Users.js";
import { authRequest } from "../utils/tokenFunctions.js";
export const router = Router();
//Get all Public rooms
router.get("/all", async (req, res) => {
  try {
    const rooms = await Room.find({ type: "public" }).sort({ createdAt: -1 });
    const conversations = await Promise.all(
      rooms.map(async (room) => {
        return Conversations.findById(room.conversationId);
      })
    );

    const roomAndMembers = rooms.map((room, index) => {
      return {
        ...room._doc,
        members: conversations[index].members,
        user: req.user,
      };
    });
    res.json(roomAndMembers);
  } catch (err) {
    res.json({ error: error.message });
  }
});
//get Room by Id
router.get("/get/:roomId", authRequest, async (req, res) => {
  const roomId = req.params.roomId;

  try {
    const room = await Room.findById(roomId);
    if (room) {
      const conversation = await Conversations.findById(room.conversationId);
      res.json({ ...room._doc, members: conversation.members });
    } else {
      res.json({ error: "room does not exist" });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

//create new room
router.post("/create", authRequest, async (req, res) => {
  const { _id } = req.user;
  const { name, description, type, limit } = req.body;

  try {
    const exists = await Room.findOne({ creator: _id, name });
    if (exists) {
      res.json({ exists: true });
    } else {
      const conversation = await Conversations.create({
        members: [_id],
      });
      const newRoom = await Room.create({
        name,
        creator: _id,
        description,
        type,
        limit,
        conversationId: conversation._id,
        meetingId: v4(),
      });

      res.json({ ...newRoom._doc, members: conversation.members });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ error: error.message });
  }
});

//Get Rooms of a single User
router.get("/myrooms", authRequest, async (req, res) => {
  const { _id } = req.user;

  try {
    const rooms = await Room.find({ creator: _id }).sort({ createdAt: -1 });
    if (rooms.length > 0) {
      const conversations = await Promise.all(
        rooms.map(async (room) => {
          return Conversations.findById(room.conversationId);
        })
      );

      const roomAndMembers = rooms.map((room, index) => {
        return { ...room._doc, members: conversations[index].members };
      });
      res.json(roomAndMembers);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.log(error.message);
    res.json({ error: error.message });
  }
});

//Delete a particular Room
router.delete("/:roomId", authRequest, async (req, res) => {
  const { _id } = req.user;
  const roomId = req.params.roomId;

  try {
    const isValid = await Room.findOne({ _id: roomId, creator: _id });
    if (isValid) {
      await RoomMessage.deleteMany({ conversationId: isValid.conversationId });
      await Conversations.findByIdAndDelete(isValid.conversationId);
      await Room.findByIdAndDelete(roomId);
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Delete a member from a particular Room
router.delete("/member/:roomId/:memberId", authRequest, async (req, res) => {
  const { _id } = req.user;
  const roomId = req.params.roomId;
  const memberId = req.params.memberId;

  try {
    const isValid = await Room.findOne({ _id: roomId, creator: _id });
    if (isValid) {
      const room = isValid;
      await Conversations.findByIdAndUpdate(room.conversationId, {
        $pull: {
          members: memberId,
        },
      });
      const conversationState = await Conversations.findById(
        room.conversationId
      );
      const remaining = { ...room._doc, members: conversationState.members };
      res.json(remaining);
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Get room by MeetingId
router.get("/:meetingId", authRequest, async (req, res) => {
  try {
    const room = await Room.findOne({ meetingId: req.params.meetingId });

    if (room) {
      const creator = await Users.findOne({ _id: room.creator });
      const roomData = {
        ...room._doc,
        creatorName: creator.username,
        creatorImage: creator.image,
      };
      res.json({ roomData, exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.put("/update/:roomId/", authRequest, async (req, res) => {
  const { _id } = req.user;
  const { roomName, description, generateNewId } = req.body;
  try {
    const isValid = await Room.findOne({
      creator: _id,
      _id: req.params.roomId,
    });
    if (isValid) {
      if (generateNewId === true) {
        const updatedRoom = await Room.findOneAndUpdate(
          { creator: _id, _id: req.params.roomId },
          {
            name: roomName,
            description,
            meetingId: v4(),
          },
          { new: true }
        );
        res.json({ updatedRoom, success: true, newId: true });
      } else {
        const updatedRoom = await Room.findOneAndUpdate(
          { creator: _id, _id: req.params.roomId },
          {
            name: roomName,
            description,
          },
          { new: true }
        );
        res.json({ updatedRoom, success: true, newId: false });
      }
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});
router.delete("/block/:roomId/:memberId", authRequest, async (req, res) => {
  const { _id } = req.user;
  const { roomId, memberId } = req.params;
  try {
    const isValid = await Room.findOne({
      creator: _id,
      _id: roomId,
    });
    if (isValid) {
      if (!isValid.blocked.includes(memberId)) {
        await Room.findOneAndUpdate(
          {
            creator: _id,
            _id: roomId,
          },
          {
            $push: {
              blocked: memberId,
            },
          }
        );
        res.json({ success: true });
      } else {
        res.json({ alreadyBlocked: true });
      }
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});
router.delete("/unblock/:roomId/:memberId", authRequest, async (req, res) => {
  const { _id } = req.user;
  const { roomId, memberId } = req.params;
  try {
    const isValid = await Room.findOne({
      creator: _id,
      _id: roomId,
    });
    if (isValid) {
      await Room.findOneAndUpdate(
        {
          creator: _id,
          _id: roomId,
        },
        {
          $pull: {
            blocked: memberId,
          },
        }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.post("/code/compile", async (req, res) => {
  const { code, language, input } = req.body;
  var data = JSON.stringify({
    code,
    language,
    input,
  });

  try {
    const response = await axios.post(
      "https://codexweb.netlify.app/.netlify/functions/enforceCode",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.log(error.message);
    res.json({ error: error.message });
  }
});
