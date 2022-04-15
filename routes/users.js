import express from "express";
import Users from "../models/Users.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { authRequest, generateToken } from "../utils/tokenFunctions.js";
import { v2 } from "cloudinary";
import RoomMessage from "../models/RoomMessage.js";
import PrivateMessage from "../models/PrivateMessage.js";
export const router = express.Router();

//Get all users
router.get("/", authRequest, async (req, res) => {
  try {
    const users = await Users.find({});
    const withoutPassword = users.map((user) => {
      const { password, ...rest } = user._doc;
      return rest;
    });

    res.json(withoutPassword);
  } catch (error) {
    res.json(error);
  }
});

router.get("/find/:userId", authRequest, async (req, res) => {
  try {
    const users = await Users.findOne({ _id: req.params.userId });
    const { password, ...rest } = users._doc;
    res.json(rest);
  } catch (error) {
    res.json(error);
  }
});

//Update username
router.put("/username", authRequest, async (req, res) => {
  const { _id } = req.user;
  try {
    const data = await Users.findOneAndUpdate(
      { _id },
      { username: req.body.newName },
      { new: true }
    );
    await PrivateMessage.updateMany(
      { senderId: _id },
      {
        $set: {
          senderName: req.body.newName,
        },
      },
      { new: true }
    );
    await RoomMessage.updateMany(
      { senderId: _id },
      {
        $set: {
          senderName: req.body.newName,
        },
      },
      { new: true }
    );
    const { username, email, image } = data._doc;
    const token = generateToken({
      _id,
      username,
      email,
    });

    res.json({ _id, username, email, image, token });
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Update Email
router.put("/email", authRequest, async (req, res) => {
  const { _id } = req.user;
  try {
    const data = await Users.findOneAndUpdate(
      { _id },
      { email: req.body.newEmail },
      { new: true }
    );
    const { username, email, image } = data._doc;
    const token = generateToken({
      _id,
      username,
      email,
    });

    res.json({ _id, username, email, image, token });
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Update Password
router.put("/password", authRequest, async (req, res) => {
  const { _id } = req.user;
  try {
    // const hashedPassword = await hashPassword(req.body.currentPassword);
    const details = await Users.findById(_id);
    const passwordValid = await verifyPassword(
      req.body.currentPassword,
      details.password
    );
    if (passwordValid) {
      const newHashedPassword = await hashPassword(req.body.newPassword);
      const daa = await Users.findOneAndUpdate(
        { _id },
        { password: newHashedPassword },
        { new: true }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

//Upload profile image
router.put("/imageupload", authRequest, async (req, res) => {
  const { _id } = req.user;
  const cloudinary = v2;
  // cloudinary.config({
  //   cloud_name: process.env.CLOUDINARY_NAME,
  //   api_key: process.env.CLOUDINARY_API_KEY,
  //   api_secret: process.env.CLOUDINARY_API_SECRET,
  // });
  cloudinary.config({
    cloud_name: "dlttvydqt",
    api_key: "638586148977229",
    api_secret: "AbIv8-QQMw8PObU0912FkE4vpHw",
  });
  try {
    const uploadResponse = await cloudinary.uploader.upload(req.body.image);

    const data = await Users.findOneAndUpdate(
      { _id },
      { image: uploadResponse.url },
      { new: true }
    );

    //Update the user's image on all his or her previous messages
    await RoomMessage.updateMany(
      { senderId: _id },
      {
        $set: {
          senderImage: uploadResponse.url,
        },
      },
      { new: true }
    );
    await PrivateMessage.updateMany(
      { senderId: _id },
      {
        $set: {
          senderImage: uploadResponse.url,
        },
      },
      { new: true }
    );

    const { username, email, image } = data._doc;
    const token = generateToken({
      _id,
      username,
      email,
    });

    res.json({ _id, username, email, image, token });
  } catch (error) {
    console.log(error.message);
    res.json({ error: error.message });
  }
});
