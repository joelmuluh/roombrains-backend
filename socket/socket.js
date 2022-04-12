import { Server } from "socket.io";

let users = [];

const getUser = (socketId) => {
  return users.find((user) => user.socketId === socketId);
};

const addUser = (socketId, conversationId, _id, username, peerId, image) => {
  const userExists = users.some((user) => user._id === _id);
  if (!userExists || (userExists && userExists.peerId === null)) {
    const validUsers = users.filter((user) => user.socketId !== socketId);
    // users.push({ socketId, conversationId, _id, username, peerId, image });
    users = [
      ...validUsers,
      { socketId, conversationId, _id, username, peerId, image },
    ];
  }
};
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
  return users;
};

export default function socketConnection(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  io.on("connection", (socket) => {
    //when user connects and needs to be added to the list on online users
    socket.on("new-connection", (data) => {
      const { conversationId, _id, username, peerId, image } = data;
      addUser(socket.id, conversationId, _id, username, peerId, image);
      socket.to(data.conversationId).emit("new-connection", data);
      const myusers = users.filter(
        (user) => user.conversationId === conversationId
      );
      io.to(conversationId).emit("get-participants", myusers);
    });

    socket.on("send_participants", (data) => {
      const { conversationId, _id, username, image } = data;
      addUser(socket.id, conversationId, _id, username, null, image);
      const myusers = users.filter(
        (user) => user.conversationId === conversationId
      );
      io.to(conversationId).emit("get-participants", myusers);
    });

    //Remove the user from online list after a disconnection is noticed
    socket.on("disconnect", () => {
      const user = getUser(socket.id);
      if (user) {
        const conversationId = user.conversationId;

        const onliners = removeUser(socket.id);
        const myusers = onliners.filter(
          (x) => x.conversationId === conversationId
        );
        socket.to(conversationId).emit("user-disconnected", user);
        io.to(conversationId).emit("get-participants", myusers);
      }
    });

    socket.on("block-me", (data) => {
      const user = getUser(socket.id);
      if (user) {
        const conversationId = user.conversationId;

        const onliners = removeUser(socket.id);
        const myusers = onliners.filter(
          (x) => x.conversationId === conversationId
        );

        io.to(conversationId).emit("get-participants", myusers);
        socket.leave(data.conversationId);
      }
    });
    socket.on("block-user", (data) => {
      socket.to(data.conversationId).emit("block-user", data);
    });

    //Since we are handling both room and private chat, we are going to use the concept of rooms for both chat kinds. So a private chat is simply a room of two people

    socket.on("join-conversation", ({ conversationId, userId, username }) => {
      if (!socket.rooms.has(conversationId)) {
        socket.join(conversationId);
        socket.to(conversationId).emit("new-user", userId);
      }
    });
    socket.on(
      "chatMessage",
      ({ senderId, conversationId, message, senderImage, senderName }) => {
        const data = {
          senderId,
          conversationId,
          message,
          senderImage,
          senderName,
        };

        socket.to(conversationId).emit("chatMessage", data);
      }
    );

    //VIDEO STREAMING EVENTS
    socket.on("stream-invitation", (data) => {
      socket.to(data.conversationId).emit("invitation-from-admin", data);
    });
    socket.on("invitation-accepted", (data) => {
      socket.to(data.conversationId).emit("invitation-accepted", data);
    });
    socket.on("invitation_declined", (data) => {
      socket.to(data.conversationId).emit("invitation_declined", data);
    });
    socket.on("stream-call", (data) => {
      socket.to(data.conversationId).emit("stream-call", data);
    });
    socket.on("admin-calling", (data) => {
      socket.to(data.conversationId).emit("admin-calling", data);
    });
    socket.on("admin_getting_peerId", (data) => {
      socket.to(data.conversationId).emit("admin_getting_peerId", data);
    });
    socket.on("admin-stopped-call", (data) => {
      socket.to(data.conversationId).emit("admin-stopped-call", data);
    });
    socket.on("peerId_to_invitee", (data) => {
      socket.to(data.conversationId).emit("peerId_to_invitee", data);
    });
    socket.on("user_left_stream", (data) => {
      socket.to(data.conversationId).emit("user_left_stream", data);
    });
    socket.on("mute_user_by_admin", (data) => {
      socket.to(data.conversationId).emit("mute_user_by_admin", data);
    });
    socket.on("unmute_user_by_admin", (data) => {
      socket.to(data.conversationId).emit("unmute_user_by_admin", data);
    });
    socket.on("remove_user_by_admin", (data) => {
      socket.to(data.conversationId).emit("remove_user_by_admin", data);
    });

    //SMART BOARD EVENTS

    socket.on("canvasData", (data) => {
      socket.to(data.conversationId).emit("canvasData", data);
    });

    socket.on("begin-new-mouse-path", (data) => {
      socket.to(data.conversationId).emit("begin-new-mouse-path", data);
    });

    socket.on("clear-canvas", (data) => {
      socket.to(data.conversationId).emit("clear-canvas", data);
    });
    socket.on("Get_canvas_image_data", (data) => {
      console.log("Got sent event");
      socket.to(data.conversationId).emit("Get_canvas_image_data", data);
    });
    socket.on("ask_canvas_image_data", (data) => {
      socket.to(data.conversationId).emit("ask_canvas_image_data", data);
    });
    socket.on("give_access_to_whiteboard", (data) => {
      socket.to(data.conversationId).emit("give_access_to_whiteboard", data);
    });
    socket.on("restrict_access_to_whiteboard", (data) => {
      socket
        .to(data.conversationId)
        .emit("restrict_access_to_whiteboard", data);
    });

    //Code Editor Events

    socket.on("give_access_to_editor", (data) => {
      socket.to(data.conversationId).emit("give_access_to_editor", data);
    });
    socket.on("restrict_access_to_editor", (data) => {
      socket.to(data.conversationId).emit("restrict_access_to_editor", data);
    });
    socket.on("code_from_editor", (data) => {
      socket.to(data.conversationId).emit("code_from_editor", data);
    });
    socket.on("change_programming_language", (data) => {
      socket.to(data.conversationId).emit("change_programming_language", data);
    });
  });
}
