import mongoose from "mongoose";
const RoomMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderImage: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const RoomMessage = mongoose.model("RoomMessage", RoomMessageSchema);

export default RoomMessage;
