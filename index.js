import http from "http";
import cors from "cors";
import express from "express";
import dotenv from "dotenv";

import socketConnection from "./socket/socket.js";
import { connectDB } from "./db/connectDB.js";
import { router as roomRoute } from "./routes/room.js";
import { router as userRoute } from "./routes/users.js";
import { router as authRoute } from "./routes/auth.js";
import { router as messageRouter } from "./routes/message.js";

import { ExpressPeerServer } from "peer";
import { v4 } from "uuid";

dotenv.config();
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/room", roomRoute);
app.use("/users", userRoute);
app.use("/auth", authRoute);
app.use("/message", messageRouter);

app.get("/", (req, res) => {
  res.send("Welcome to Roombrains");
});

socketConnection(server);
connectDB();

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/",
  generateClientId: v4,
});
app.use("/peer", peerServer);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running"));
