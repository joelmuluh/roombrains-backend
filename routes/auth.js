import express from "express";
import Users from "../models/Users.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { generateToken } from "../utils/tokenFunctions.js";

export const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const userExists = await Users.findOne({ email: req.body.email });
    if (userExists) {
      return res.json({ exists: true });
    } else {
      const hashedPassword = await hashPassword(req.body.password);
      const userData = await Users.create({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
      });
      const { _id, username, email } = userData;
      const token = generateToken({
        _id,
        username,
        email,
      });
      res.json({ _id, username, email, token });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const userExists = await Users.findOne({
      email: req.body.email,
    });
    if (userExists) {
      const passwordValid = await verifyPassword(
        req.body.password,
        userExists.password
      );
      if (passwordValid) {
        const { _id, username, email, image } = userExists;
        const token = generateToken({
          _id,
          username,
          email,
        });
        res.json({
          _id,
          username,
          email,
          token,
          image,
        });
      } else {
        res.json({ exists: true, validPassword: false });
      }
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ error: error.message });
  }
});
