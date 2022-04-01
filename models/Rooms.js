import mongoose from "mongoose";
const RoomSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      // unique: true,
    },
    creator: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    limit: {
      type: Number,
      required: false,
      default: 50,
    },
    type: {
      type: String,
      default: "private",
      required: false,
    },
    meetingId: {
      type: String,
      required: true,
    },
    blocked: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", RoomSchema);

export default Room;
