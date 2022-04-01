import mongoose from "mongoose";
const PrivateMessageSchema = new mongoose.Schema(
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

const PrivateMessage = mongoose.model("PrivateMessage", PrivateMessageSchema);

export default PrivateMessage;
